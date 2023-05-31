// initialize the canvas where simulation will take place
const canvas = document.getElementById('dino-c');
const ctx = canvas.getContext('2d');

// sets the image directory for the image components
const IMAGE_DIRECTORY = '/assets/statics/';
var gameHandler;
// imports the NEAT library
const { NEAT, activation, crossover, mutate } = require('neat_net-js');

// sets the in-game time
const time = {
  inGameNow: 0,
  now: performance.now(), //ms
  then: performance.now(), //ms
  delta: 0 //s
}

// sets up the canvas screen for the simulation
const screen = {
  aspectRatio: 16 / 9,
  canvas: { //width and height that will be used in canvas rendering (the canvas is 64m wide)
    w: 64,
    h: undefined,
  },

  // resizes the screen based off a specific aspect ratio
  resize: function() {
    let w = window.innerWidth;
    let h = window.innerHeight;

    if (w / h > this.aspectRatio) {
      this.offsetX = (w - this.aspectRatio * h) / 2;
      w = this.aspectRatio * h;
      this.offsetY = 0;
    } else {
      this.offsetX = 0;
      this.offsetY = (h - w / this.aspectRatio) / 2;
      h = w / this.aspectRatio;
    }
    
    // aligns/resizes the canvas
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    canvas.style.left = this.offsetX + "px";
    canvas.style.top = this.offsetY + "px";

    this.canvas.h = this.canvas.w / this.aspectRatio;

    this.scale = w / this.canvas.w;

    ctx.transform(1, 0, 0, 1, 0, 0);
    ctx.scale(this.scale, this.scale);
  },
  offsetX: 0,
  offsetY: 0,
};

// initializing more variables
// assets = nothing for now; initialized in window.load() so simulation will start after all images are loaded in
var assets;

// sets up the default configurations
var config = {
  model: [
    { nodeCount: 5, type: "input" }, // 5 inputs into the program
    { nodeCount: 2, type: "output", // 2 outputs as binary (jump or no jump)
    activationfunc: activation.SOFTMAX }
  ],
  mutationRate: 0.15, //default mutation rate when moving to nextGeneration of simulator
  crossoverMethod: crossover.RANDOM,
  mutationMethod: mutate.RANDOM, // sets the mutation/crossover methods to randomized
  populationSize: 80, // num of dinos
};

// initializes the brain of the AI
var brain = new NEAT(config);

//function to resize the screen when necessary
function resize() {
  screen.resize();
}

function createImage(src) {
  let ret = new Image();
  ret.src = IMAGE_DIRECTORY + src;
  ret.style.visibility = 'hidden';
  document.body.append(ret);
  return ret;
}

// creates the game handler, which contains all details about the simulation
function createHandler() {
  return {
      dinos: [], //list of dinos
      x: 0, //x position
      xVel: 25, //x velocity 
      dinoWidth: 5.5/1.3,
      dinoHeight: (47/8)/1.3, 
      jumpVel: 52.5, //change in y-velocity upon jump

      gravity: -120, //gravity acceleration | m/s^2
      floorHeight: 33,
      
      counterDistance: 0, 
      obsDist: 40, //distance between obstacles
      standardDeviation: 8,
      obstacles: [],

      camX: 10, //x position of where to put the dinos on the screen
      speed: 50, //game movement speed
      numDinos: 80, //number of dinos
      mutationRate: 0.1, //probability of a gene being randomly changed

      leftRight: false,
      upDown: false,
      frameCount: 0,

      init: function() {
        // initilizes the array of dinos
        this.dinos = new Array(this.numDinos);
        for (let i = 0; i < this.numDinos; i++) {
          this.dinos[i] = new Dino();
        } 

        // sets the initial position of the dinos
        this.x = 0;

        this.counterDistance = this.obsDist;
      },

      simulate: function() {
        // Calculate new x value
        this.x += this.xVel * time.delta;

        if (this.obstacles.length == 0) {
          this.counterDistance = 0;
          this.obstacles.push(new Obstacle(this.gaussianRandom(this.obsDist, this.standardDeviation)))
          console.log(this.obstacles[this.obstacles.length-1].obsDist)
        } else if (this.counterDistance >= this.obstacles[this.obstacles.length-1].obsDist) {
          this.counterDistance = 0;
          this.obstacles.push(new Obstacle(this.gaussianRandom(this.obsDist, this.standardDeviation)))
          console.log(this.obstacles[this.obstacles.length-1].obsDist)
        } else {
          this.counterDistance += this.xVel * time.delta;
        }

        // finds the bounds of the screen 
        for (let i = 0; i < this.obstacles.length; i++) {
          let obstacle = this.obstacles[i];
          obstacle.x -= this.xVel * time.delta;

          if (obstacle.type >= 3) {
            let index = 3;
            if (this.upDown) {
              index++;
            }

            // draw birdie
            ctx.drawImage(assets.obstacles[index], obstacle.x, obstacle.y, obstacle.width*1.2, obstacle.height*1.2);
          } else {
            // draw cacti
            ctx.drawImage(assets.obstacles[obstacle.type], obstacle.x, obstacle.y, obstacle.width*1.2, obstacle.height*1.2);
          }

          if (obstacle.x+obstacle.width*1.02 < 0) {
            this.obstacles.splice(i, 1)
            i--;

            if (this.xVel < 60) {
              this.xVel += 0.075;
              this.obsDist += 0.075;
            }
          }
        }

        disp = -(this.x)%screen.canvas.w;
        for (let i = 0; i < 3; i++) {
          ctx.drawImage(assets.ground, disp + i * screen.canvas.w, this.floorHeight-1.5, screen.canvas.w, 2);
        }


        // loops through all the dinos
        for (let i = 0; i < this.numDinos; i++) {
          let d = this.dinos[i];
          
          // if the dino is not dead
          if (!d.dead) {
            
            // collision detection
            for (let i = 0; i < this.obstacles.length; i++) {
              let obstacle = this.obstacles[i];
              
              if (d.x > obstacle.x+obstacle.width) {
                continue;
              }

              if (
                d.x < obstacle.x + obstacle.width &&
                d.x + this.dinoWidth > obstacle.x &&
                d.y <= obstacle.y + obstacle.height &&
                d.y + this.dinoHeight >= obstacle.y 
              ) {
                d.die();
              }
            }

            // sets the distance the dino traveled to the current x position
            d.dist = this.x;

            // increments fitness as it survived 
            d.fitness += 0.01;
            
            // sets the fitness of the dino into the neural network
            brain.setFitness(d.fitness, i);
            
            // applies the gravity acceleration 
            d.yVel -= this.gravity * time.delta;

            // displaces the dino based on current velocity in the time duration
            d.y = Math.min(this.floorHeight-this.dinoHeight, d.y + d.yVel * time.delta);

            let index = 0;
            if (this.leftRight) {
              index++;
            } 
            if (d.y < this.floorHeight-this.dinoHeight) {
              index = 2;
            }
            ctx.drawImage(assets.dinoSprites[index], this.camX, d.y, this.dinoWidth*1.21, this.dinoHeight*1.21);

            // sets inputs into the neural network
            brain.setInputs(d.getInputs(), i);

            // pass dino input data through the nodes of the neural network
            brain.feedForward();
            
            // get the decision of the specific dino and jumps if the dino decides to
            let choices = brain.getDesicions(i);
            if (choices[i] == 1) {
              d.jump();
            }

          } else { // if the dino is dead
          // y-vel is 0 so the dino should not move when dead
            d.yVel = 0;

          // set the opacity of any subsequent canvas drawing back to its default, which is 1
            ctx.globalAlpha = 1;
          }
        }

        if (this.frameCount >= 10) {
          this.frameCount = 0;
          this.upDown = !this.upDown;
          this.leftRight = !this.leftRight
        } else {
          this.frameCount++;
        }
      },
      
      // checks to see if all the dinos are dead
      isExtinct: function() {
        for (let i = 0; i < this.numDinos; i++) {
          if (!this.dinos[i].dead) 
            return false;
        }

        return true;
      },

      gaussianRandom: function(mean=0, stdev=1) {
        const u = 1 - Math.random(); 
        const v = Math.random();
        const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );

        return z * stdev + mean;
    }
    }
}

function mainloop() {
  // recursive call to continue animation
  window.requestAnimationFrame(mainloop);

  // if the generation has all died, create the new generation of dinos and apply user changes
  if (gameHandler.isExtinct()) {

    // start the next generation since all current dinos are dead
    brain.doGen();

    // recreates the default handler to have fresh set of dinos
    gameHandler = createHandler();

    // starts the simulation again
    gameHandler.init();
  }
  
  // set the current time to performance.now(), which represents the number of milliseconds since the webpage was started
  time.now = performance.now();

  // the min function prevents the time step, time.delta from being a very large value
  // at frame rates lower than 20fps, the simulation will start to lag
  time.delta = Math.min((time.now - time.then) / 1000, .05); 

  time.then = time.now;
  
  // scale the time by user-speed input
  time.delta *= gameHandler.speed/50;

  // update the in-game timer
  time.inGameNow += time.delta * 1000;

  // clear the canvas before rendering anything to it
  ctx.clearRect(0, 0, screen.canvas.w, screen.canvas.h);

  // ensures that any pixelated images will not be blurry when rendered
  ctx.imageSmoothingEnabled = false;

  gameHandler.simulate();
}

// resizes the screen, when window size changes
window.addEventListener('resize', resize);

// when the window finishes loading
window.onload = new function() {
  // double check that window is sized properly
  resize();
  
  // initializes images here, so it will definitely load before simulation starts
  assets = {
    dinoSprites : [createImage('dino_run1.png'), createImage('dino_run2.png'), createImage('standing_still.png')],
    ground : createImage('ground.png'),
    obstacles : [createImage('cactus_1.png'), createImage('Cactus_Small_Single.png'), createImage('Cactus_Large_Triple.png'), createImage('Bird_01.png'), createImage('Bird_02.png')]
  };
  
  // creates the default handler
  gameHandler = createHandler(); 
  gameHandler.init();

  console.log(gameHandler.dinos);

  // start the simulation
  window.requestAnimationFrame(mainloop);
}
// single player debugging
// canvas.addEventListener("click", (event) => {
//   gameHandler.dinos[0].jump();
// });

