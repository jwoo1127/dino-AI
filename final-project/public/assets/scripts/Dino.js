class Dino {
    constructor() {
      this.x = 10;
      this.y = gameHandler.floorHeight-gameHandler.dinoHeight;
  
      this.yVel = 0;
      this.dead = false;
  
      this.fitness = 0;

      this.dist = 0;
    }
  
  
    // sets the dino's velocity to the jump velocity
    jump() {
        if (this.y >= gameHandler.floorHeight-gameHandler.dinoHeight)
            this.yVel = -gameHandler.jumpVel;
    }
  
    // sets status to dead
    die() {
      this.dead = true;
    }
  
    // returns the inputs for the AI at this current instance in time
    getInputs() {
        let i = 0;
        let distanceToObstacle = this.x - gameHandler.obstacles[i].x;
        while (distanceToObstacle >= 0) {
            i++
            distanceToObstacle = this.x - gameHandler.obstacles[i].x;
        }

        return [
        this.y,
        distanceToObstacle,
        gameHandler.xVel,
        gameHandler.obstacles[i].width,
        gameHandler.obstacles[i].y];
    }
  
  }