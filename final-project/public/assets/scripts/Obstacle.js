class Obstacle {
    constructor(obsDist) {
        this.obsDist = obsDist;
        this.x = screen.canvas.w;

        this.type = Math.floor(gameHandler.gaussianRandom(2, 1.5));
        if (this.type > 5) {
            this.type = 5;
        } else if (this.type < 0) {
            this.type = 0;
        }
        
        this.birdWidth = 92/22; // 92px
        this.birdHeight = 96/22; // 96px

        //TODO: Change Y and Height and Width based on type of obstacle
        switch (this.type) {
            // 0 - normal cactus
            case 0:
                this.height = 100/18; // 100px
                this.width = 48/18; // 48px
                this.y = gameHandler.floorHeight-this.height*1.1;
                break;
            // 1 - small cactus
            case 1:
                this.height = 96/18; // 96px
                this.width = 34/18; // 34px
                this.y = gameHandler.floorHeight-this.height*1.2;
                break;
            // 2 - big cactus            
            case 2:
                this.height = 96/21; // 96 px
                this.width = 150/21; // 150 px
                this.y = gameHandler.floorHeight-this.height*1.1;
                break;

            // 3 - high flying bird 
            case 3:
                this.height = this.birdHeight;
                this.width = this.birdWidth;
                this.y = gameHandler.floorHeight-this.height*3;
                break;

            // 3 - low flying bird 
            case 4:
                this.height = this.birdHeight;
                this.width = this.birdWidth;
                this.y = gameHandler.floorHeight-this.height*1.2;
                break;

            // 5 - middle flying bird 
            case 5:
                this.height = this.birdHeight;
                this.width = this.birdWidth;
                this.y = gameHandler.floorHeight-this.height*1.6;
                break;

            default:
                // normal cactus
                this.height = 3;
                this.width = 2.2;
                this.y = gameHandler.floorHeight-this.height;
                break;
        }
    }

}