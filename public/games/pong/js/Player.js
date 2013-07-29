function Player(sid, pid, yPos) {
    /*=========
	  Variables
	  =========*/
	this.sid;		// Socket id. Used to uniquely identify players via the socket they are connected from [Public]
    this.pid;		// Player id. In this case, 1 or 2 [Public]
    this.paddle;	// player's paddle object [Public]
    var delay;		// player's delay [Private]

    /*===========
	  Constructor
	  ===========*/
    this.sid = sid;
    this.pid = pid;
    this.paddle = new Paddle(yPos);
    var delay = 0;

    this.setDelay = function(newDelay) {
    	delay = newDelay;
    }

    /*
    	Return 0 if no delay
    	Else, return a value between:
    	delay * (1 - errorPercentage%) to delay * (1 + errorPercentage%)
    	Note: Math.random() returns a value between 0 to 1
    */
    this.getDelay = function() {
		var errorPercentage = 20;
	    var lowerbound = delay * (1 - errorPercentage/100);
	    var range = delay * (2 * errorPercentage/100);
		if (delay != 0) {
				return lowerbound + Math.floor(Math.random() * range);
		}
		else 
				return 0
	}
}

// For node.js require
if(typeof global !== 'undefined') { global.Player = Player; }
