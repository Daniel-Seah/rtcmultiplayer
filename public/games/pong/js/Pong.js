/*=====================================================
  Declared as literal object (All variables are static)	  
  =====================================================*/
var Pong = {
	HEIGHT : 500,				// height of Pong game window
	WIDTH : 500,				// width of Pong game window
	PORT : 8000,				// port of Pong game
	FRAME_RATE : 25,			// frame rate of Pong game
	SERVER_NAME : "localhost"	// server name of Pong game
}

// For node.js require
if(typeof global !== 'undefined') { global.Pong = Pong; }

// vim:ts=4
