function Paddle(yPos){
	/*=========
	  Variables
	  =========*/
	var that;	// pointer to "this" [Private]
	this.x;		// x-coordinate of paddle's position [Public]
	this.y;		// y-coordinate of paddle's position [Public]

	/*===========
	  Constructor
	  ===========*/
	that = this; // Unused in Paddle
	this.x = Pong.WIDTH/2;
	this.y = yPos - Paddle.HEIGHT/2;
}

/*================
  Static Variables
  ================*/
Paddle.WIDTH = 60;
Paddle.HEIGHT = 16;
Paddle.R1 = 5;
Paddle.R2 = 10;
Paddle.R3 = 25;

/*=============
  move [Public]
  =============*/
Paddle.prototype.move = function(newx) {
	if (newx < Paddle.WIDTH/2)
		this.x = Paddle.WIDTH/2;
	else if (newx > Pong.WIDTH - Paddle.WIDTH/2)
		this.x = Pong.WIDTH - Paddle.WIDTH/2;
	else
		this.x = newx;
}

// For node.js require
if(typeof global !== 'undefined') { global.Paddle = Paddle; }