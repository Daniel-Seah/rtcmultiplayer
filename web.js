// Import environment variables
var config = require('./config');

// Import module dependencies
var express = require('express'); 
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var graph = require('fbgraph');
var sr = require('./signedrequest');
var decoder = new sr(config.FACEBOOK_APP_SECRET);
var PeerServer = require('peer.io');
var peer = new PeerServer(io);
var RoomServer = require('room');
var rooms = new RoomServer(io);
require('./public/js/user');

// Import request handlers
var site = require('./site');

// Config
app.configure(function() {
	//app.use(express.logger());
	app.use(express.compress());
	app.use(express.static(__dirname + '/public', { maxAge: 604800 })); // 1 week
	app.use(express.bodyParser());
	app.use(express.cookieParser());
});

// Socket io config
io.set('log level', 1);
io.configure(function () { 
	io.set("transports", ["xhr-polling"]); 
	io.set("polling duration", 10); 
});
io.set('authorization', function(handshakeData, cb) {
	if(typeof handshakeData.query.sr !== 'string') {
		cb('Error: No signed request provided', false);
	}
	// Parse signed token
	var fb = decoder.decode(handshakeData.query.sr);
	if(fb === null) {
		cb('Error: Invalid signed request', false);
	}
	
	// User already logged in so we disconnect the old socket
	if(users[fb.user_id]) {
		users[fb.user_id].socket.disconnect();
	}
	
	// Get FB access token
	graph.get('oauth/access_token?client_id=' + config.FACEBOOK_APP_ID + '&redirect_uri=&client_secret=' + config.FACEBOOK_APP_SECRET + '&code=' + fb.code, function(err, res) {
		if(err) {
			cb(err.message, false);
			return;
		}
		handshakeData.fbid = fb.user_id;
		handshakeData.fbtoken = res.access_token;
		graph.setAccessToken(handshakeData.fbtoken);
			
		// Get friends
		graph.get('me/friends', function(err2, res2) {
			if(err2) {
				cb(err2.message, false);
				return;
			}
			var friendlist = handshakeData.friends = {};
			for(var i = 0; i < res2.data.length; i++) {
				var friend = res2.data[i];
				friendlist[friend.id] = true;
			}
			cb(null, true);
		});
	});
});

// General
app.get('/', site.index);
app.post('/', site.index);
app.get('/js/define.js', site.define);
app.post('/js/define.js', site.define);
app.get('/games.json', site.games);
app.post('/games.json', site.games);

//app.get('/', site.peertest);
//app.post('/', site.peertest);

var users = {};

// Socket events
io.sockets.on('connection', function(socket) {
	var user = new User(socket.handshake.fbid);
	user.socket = socket;
	users[user.id] = user;
	user.token = socket.handshake.fbtoken;
	
	var initOnlineFriends = function() {
		var small, large;
		if(Object.keys(socket.handshake.friends).length < Object.keys(users).length) {
			small = socket.handshake.friends;
			large = users;
		} else {
			small = users;
			large = socket.handshake.friends;
		}
		for(var id in small) {
			if(large[id]) {
				user.observers[id] = users[id];
				users[id].observers[user.id] = user;
				users[id].socket.emit('friend online', user.serialise());
			}
		}
	};
	initOnlineFriends();
	
	socket.on('refresh friends', function(cb) {
		// return user's online friends
		var list = {};
		for(var id in user.observers) {
			var friend = user.observers[id].serialise();
			list[friend.id] = friend;
		}
		cb(list);
	});
	
	socket.on('disconnect', function() {
		user.state = 'offline';
		
		// Broadcast disconnect state
		for(var id in user.observers) {
			var friend = user.observers[id];
			friend.socket.emit('friend offline', user.id);
			delete friend.observers[user.id];
		}
		
		// Remove user from online list
		delete users[user.id];
	});
});

// Listen on user entering/exiting rooms
rooms.on('user joins', function(userID, roomID) {
	var user = users[userID];
	if(typeof user === 'undefined') {
		console.log('Error: Room/friend server user mismatch');
		return;
	}
	user.room = roomID;
	
	// Broadcast user entering room
	for(var id in user.observers) {
		var friend = user.observers[id];
		friend.socket.emit('friend enter', userID, roomID);
	}
});

rooms.on('user leaves', function(userID, roomID) {
	console.log('user leaves');
	var user = users[userID];
	if(typeof user === 'undefined') {
		console.log('Error: Room/friend server user mismatch');
		return;
	}
	user.room = null;
	
	// Broadcast user exiting room
	for(var id in user.observers) {
		var friend = user.observers[id];
		friend.socket.emit('friend leave', userID, roomID);
	}
});

server.listen(config.PORT);
console.log("Listening on " + config.PORT);
