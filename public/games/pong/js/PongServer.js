/*
Uses node.js
-> Run via "node PongServer.js" in Terminal
-> Run "sudo node PongServer.js" for restricted ports
*/

/*===============
  Library Imports
  ===============*/
/*var lib_path = "./js/";
require(lib_path + "Pong.js");
require(lib_path + "Ball.js");
require(lib_path + "Paddle.js");
require(lib_path + "Player.js");*/
  
function PongServer() {
	/*=========
	  Variables
	  =========*/
	var io;
	var count;						// Keeps track how many people are connected to server [Private]
	var nextPID;					// PID to assign to next connected player (i.e. which player slot is open) [Private]
	var gameInterval = undefined;	// Interval variable used for gameLoop [Private]
	var ball;						// the game ball [Private]
	var players;					// Associative array for players, indexed via sid [Private]
									// To get a Player object, do "players[sid]"
									// Can extend to more players if needed
									
	/*===================
	  getPlayer [Private]
	  ===================*/
	var getPlayer = function(pid) {
		// Returns the player in the players object, based on given PID
		for (p in players) {
			if (players[p].pid === pid)
				return players[p];
		}
	}

	/*===================
	  resetGame [Private]
	  ===================*/
	var resetGame = function() {
		// Clears gameInterval and set it to undefined
		clearInterval(gameInterval);
		gameInterval = undefined;
	}

	/*===================
	  gameLoop [Private]
	  ===================*/
	var gameLoop = function() {
		// Check if ball is moving
		if (ball.isMoving()) {
			// Grab players
			var p1 = getPlayer(1);
			var p2 = getPlayer(2);

			// Move ball
			ball.moveOneStep(p1.paddle, p2.paddle);

			// Temporarily hold the current game state
			var tempBallx = ball.x;
			var tempBally = ball.y;
			var tempp1Paddlex = p1.paddle.x;
			var tempp1Paddley = p1.paddle.y;
			var tempp2Paddlex = p2.paddle.x;
			var tempp2Paddley = p2.paddle.y;

			// Update on player side
			setTimeout(function() {
				io.sockets[p1.sid].emit('update', {
					ballX: tempBallx,
					ballY: tempBally,
					myPaddleX: tempp1Paddlex,
					myPaddleY: tempp1Paddley,
					opponentPaddleX: tempp2Paddlex,
					opponentPaddleY: tempp2Paddley});
					},
					p1.getDelay());
			setTimeout(function() {
				io.sockets[p2.sid].emit('update', {
					ballX: tempBallx,
					ballY: tempBally,
					myPaddleX: tempp2Paddlex,
					myPaddleY: tempp2Paddley,
					opponentPaddleX: tempp1Paddlex,
					opponentPaddleY: tempp1Paddley});
					},
					p2.getDelay());
		} else {
			// Reset
			resetGame();
		}
	}

	/*==================
	  start [Privileged]
	  ==================*/
	this.start = function(server) {
		// Initialization
		io = server;
		
		// change log level to 3 for debugging messages
		/*io = require('socket.io').listen(port, {
				'log level':2 
		});*/

		count = 0;
		nextPID = 1;
		gameInterval = undefined;
		ball = new Ball();
		players = new Object;
		
		/*----------------------
		  Socket Event Listeners
		  ----------------------*/
		// Upon connection established from a client socket
		io.on('connection', function (socket) {
			count++;

			// Sends to client
			socket.emit('serverMsg', {msg: "There is now " + count + " players."});

			if (count > 2) {
				// Send back message that game is full
				socket.emit('serverMsg', {msg: "Sorry, game full. Come back another time!"});

				// Force a disconnect
				socket.disconnect();
				count--;
			} else {
				// Sends to everyone connected to server except the client
				socket.broadcast.emit('serverMsg', {msg: "There is now " + count + " players."});
				
				// 1st player is always top, 2nd player is always bottom
				var watchPaddle = (nextPID === 1) ? "top" : "bottom";
				var startPos = (nextPID === 1) ? Paddle.HEIGHT : Pong.HEIGHT;

				// Send message to new player (the current client)
				socket.emit('serverMsg', {msg: "You are Player " + nextPID + ". Your paddle is at the " + watchPaddle});					

				// Create player object and insert into players with key = socket.id
				players[socket.id] = new Player(socket.id, nextPID, startPos);

				// Updates the nextPID to issue (flip-flop between 1 and 2)
				nextPID = ((nextPID + 1) % 2 === 0) ? 2 : 1;
			}

			// When the client closes the connection to the server/closes the window
			socket.on('disconnect',
				function() {
					// Stop game if it's playing
					if (gameInterval !== undefined) {
						resetGame();
					}

					// Decrease count
					count--;

					// Set nextPID to quitting player's PID
					nextPID = players[socket.id].pid;

					// Remove player who wants to quit/closed the window
					delete players[socket.id];

					// Sends to everyone connected to server except the client
					socket.broadcast.emit('serverMsg', {msg: "There is now " + count + " players."});
				});

			// Upon receiving a message tagged with "start", along with an obj "data" (the "data" sent is {}. Refer to PongClient.js)
			socket.on('start',
				function(data) {
					if (gameInterval !== undefined) {
						console.log("Already playing!");
					} else if (Object.keys(players).length < 2) {
						console.log("Not enough players!");
						socket.emit('serverMsg', {msg: "Not enough players!"});
					} else {
						console.log("Let the games begin!");
						ball.startMoving();
						gameInterval = setInterval(function() {gameLoop();}, 1000/Pong.FRAME_RATE);
					}
				});

			// Upon receiving a message tagged with "move", along with an obj "data"
			socket.on('move',
				function(data) {
					setTimeout(function() {
						players[socket.id].paddle.move(data.x);
					},
					players[socket.id].getDelay());
				});

			// Upon receiving a message tagged with "delay", along with an obj "data"
			socket.on('delay',
				function(data) {
					players[socket.id].setDelay(data.delay);
				});
		});
	}
}

// "public static void main(String[] args)"
// This will auto run after this script is loaded
/*var gameServer = new PongServer();
gameServer.start();*/

// vim:ts=4
