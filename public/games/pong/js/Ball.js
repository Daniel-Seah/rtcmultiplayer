function Ball() {
	/*=========
	  Variables
	  =========*/
	var that;	// pointer to "this" [Private]
	var moving;	// boolean of whether ball is moving [Private]
	var vx;		// x-component of ball's velocity [Private]
	var vy;		// y-component of ball's velocity [Private]
	this.x;		// x-coordinate of ball's position [Public]
	this.y;		// y-coordinate of ball's position [Public]

	/*===========
	  Constructor
	  ===========*/
	that = this;
	moving = false;
	vx = 0;
	vy = 0;
	this.x = Pong.WIDTH/2;
	this.y = Pong.HEIGHT/2;

	/*========================
	  startMoving [Privileged]
	  ========================*/
	this.startMoving = function(){
		vx = 0;
		vy = Ball.VERTICAL_VELOCITY;
		moving = true;
	}

	/*=====================
	  isMoving [Privileged]
	  =====================*/
	this.isMoving = function() {
		return moving;
	}

	/*========================
	  moveOneStep [Privileged]
	  ========================*/
	this.moveOneStep = function(topPaddle, bottomPaddle) {
		// New position
		that.x += vx;
		that.y += vy;

		// Check for bouncing
		if (that.x <= Ball.WIDTH/2 || that.x >= Pong.WIDTH - Ball.WIDTH/2) {
			// Bounds off horizontally
			vx = -vx;
		} else if (that.y + Ball.HEIGHT/2 > Pong.HEIGHT || that.y - Ball.HEIGHT/2 < 0) {
			// Goes out of bound! Lose point and restart.
			that.x = Pong.WIDTH/2;
			that.y = Pong.HEIGHT/2;
			vx = 0;
			vy = 0;
			moving = false;
		} else if (that.y - Ball.HEIGHT/2 < Paddle.HEIGHT) {
			// Chance for ball to collide with top paddle.
			updateVelocity(topPaddle.x);
		} else if (that.y + Ball.HEIGHT/2 > Pong.HEIGHT - Paddle.HEIGHT) {
			// Chance for ball to collide with bottom paddle.
			updateVelocity(bottomPaddle.x);
		}
	}

	/*========================
	  updateVelocity [Private]
	  =======================*/
	var updateVelocity = function(px) {
		// Change direction (vx) depending on collision point between ball and paddle
		if (that.x >= px - Paddle.R1 && that.x <= px + Paddle.R1) {
            vy = -vy;
        } else if (that.x >= px - Paddle.R2 && that.x <= px + Paddle.R2) {
            vx += (that.x > px? 1 : -1);
            vy = -vy;
        } else if (that.x >= px - Paddle.R3 && that.x <= px + Paddle.R3) {
            vx += (that.x > px? 2 : -2);
            vy = -vy;
        } else if (that.x + Ball.WIDTH/2 >= px - Paddle.WIDTH/2 && that.x - Ball.WIDTH/2 <= px + Paddle.WIDTH/2) {
            vx += (that.x > px? 3 : -3);
            vy = -vy;
        }
        // else = ball didn't collide with paddle
	}
}

/*================
  Static Variables
  ================*/
Ball.WIDTH = 10;
Ball.HEIGHT = 10;
Ball.VERTICAL_VELOCITY = 7;

// For node.js require
if(typeof global !== 'undefined') { global.Ball = Ball; }