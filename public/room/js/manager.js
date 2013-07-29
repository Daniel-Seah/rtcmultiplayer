/*
 * @author Daniel Seah
 */
var rs = (function() {
/*
 * Game room model
 * 
 * Subscribing to a room will reveal the state of the room. Users
 * can see the size of the room and the participants.
 * 
 * Users can join or leave a game room to participate in the session.
 * Upon joining, users will receive a list of peer connections.
 * Participants will receive messages to run the game client. In
 * addition, users may be asked to act as the server. Joining a room
 * automatically subscribes you.
 * 
 * Rooms mirror the server representation and do not contain any
 * useful data until after the server response
 */
function _Room(rid) {
	var self = this;
	
	this.id			= null;
	this.game		= null;
	this.maxUsers	= 2;
	this.isOpen		= true;
	
	var _users		= [];
	var _listener	= {};
	
	var _isServer	= false;
	var _prevState	= null;
	var _serverSock	= null;
	
	var _isClient	= false;
	var _hostSock	= null;
	
	this.peers		= null;
	var _isParticipant = false;
	
	this.__defineGetter__('nUsers', function() { return _users.length; });
	
	if(typeof rid !== 'undefined') {
		this.id = '' + rid;
	}
	
	/*
	 * Initial update of the local view of the room
	 * state from the server
	 */
	this._register = function(id, game, size, users, err) {
		if(err) {
			_triggerEvent('error', err);
			return;
		}
		this.id = id;
		this.game = game;
		this.maxUsers = size;
		_users = users;
		_triggerEvent('state change');
	};
	
	this._runClient = function(hostID) {
		_isClient = true;
		_isParticipant = true;
		_hostSock = new _ClientServerSocket(hostID);
		_triggerEvent('client start', _hostSock);
	};
	
	this._host = function(state) {
		_isServer = true;
		_isParticipant = true;
		_serverSock = new _RoomServer(_users);
		_prevState = state
		_triggerEvent('server start', _serverSock, _prevState);
	};
	
	/*
	 * New user has entered the room
	 */
	this._userEnter = function(user) {
		var i = _users.indexOf(user);
		if(i >= 0) {
			return;
		}
		
		_users.push(user);
		if(_isServer) {
			_serverSock._addConnection(user);
		}
		_addPeerSocket(user);
		_triggerEvent('state change');
	};
	
	/*
	 * User has left the room
	 */
	this._userExit = function(user) {
		var i = _users.indexOf(user);
		if(i < 0) {
			return;
		}
		
		_users.splice(i, 1);
		if(_isServer) {
			_serverSock._removeConnection(user);
		}
		_removePeerSocket(user);
		_triggerEvent('state change');
	};
	
	this.isInside = function() {
		return rs.currentRoom === this;
	};
	
	this.leave = function() {
		if(!_isParticipant) {
			return;
		}
		// Disconnect p2p sockets
		for(var id in self.peers) {
			self.peers[id].disconnect();
		}
		
		// Disconnect host endpoint
		if(_hostSock) {
			_hostSock.disconnect();
		}
		_hostSock = null;
		_isClient = false;
		
		// Disconnect client endpoint
		if(_serverSock) {
			_serverSock.disconnect();
		}
		_serverSock	= null;
		_isServer = false;
		_listener = {};
		_isParticipant = false;
		rs._leave(this);
	};
	
	var _addPeerSocket = function(peerID) {
		// Do not add socket if user is not participating
		// in the room
		if(!_isParticipant) {
			return;
		}
		if(self.peers[peerID]) {
			return;
		}
		
		var p = new _PeerSocket(peerID);
		p.on('ready', function() {
			self.peers[peerID] = p;
			_triggerEvent('peer enter', p);
		});
	};
	
	var _removePeerSocket = function(peerID) {
		if(self.peers === null) {
			return;
		}
		if(typeof self.peers[peerID] === 'undefined') {
			return;
		}
		
		self.peers[peerID].disconnect();
		delete self.peers[peerID];
		_triggerEvent('peer leave', peerID);
	};
	
	this._join = function() {
		_isParticipant = true;
		self.peers = {};
		for(var i = 0; i < _users.length; i++) {
			_addPeerSocket(_users[i]);
		}
	};
	
	/*
	 * Events:
	 *   client start: Game should run client code with the socket provided
	 *   server start: Game should run server code with the server object
	 * 		provided
	 *   peer enter: A new peer has entered the room
	 *   peer leave: An existing peer has left the room
	 *   error: An error has occurred while creating, joining or subscribing
	 * 		to the room
	 */
	this.on = function(event, cb) {
		if(typeof cb !== 'function') {
			console.log('Callback function required');
			return;
		}
		if(typeof _listener[event] === 'undefined') {
			_listener[event] = [];
		}
		_listener[event].push(cb);
		if(event === 'server start' && _isServer) {
			_triggerEvent('server start', _serverSock, _prevState);
		}
		if(event === 'client start' && _isClient) {
			_triggerEvent('client start', _hostSock);
		}
	};
	
	this.removeListener = function(event, cb) {
		if(typeof _listener[event] === 'undefined') {
			return;
		}
		var i = _listener[event].indexOf(cb);
		if(i < 0) {
			return;
		}
		_listener[event].splice(cb, 1);
		if(_listener[event].length <= 0) {
			delete _listener[event];
		}
	}

	var _triggerEvent = function(event) {
		var listeners = _listener[event];
		var args = Array.prototype.slice.call(arguments).slice(1);
		if(typeof listeners === 'undefined') {
			return;
		}
		for(var i = 0; i < listeners.length; i++) {
			var cb = listeners[i];
			if(cb.length !== args.length) {
				console.log('Event callback arity mismatch');
				continue;
			}
			
			cb.apply(cb, args);
		}
	}
}

/*
 * The room manager connects to the master server and manages
 * a list of rooms that the user has subscribed or joined.
 */
function _RoomManager() {
	var self = this;
	
	var _connected		= false;
	var _socket			= null;
	var _events			= [];
	var _rooms			= {};
	this.currentRoom	= null;
	
	var _queueEvent = function() {
		var args = Array.prototype.slice.call(arguments);
		if(_connected) {
			_socket.emit.apply(_socket, args);
		} else {
			_events.push(args);
		}
	};
	
	var _sendEvents = function() {
		for(var i = 0; i < _events.length; i++) {
			_socket.emit.apply(_socket, _events[i]);
		}
		_events.length = 0;
	};
	
	var _addNamespace = function(domain) {
		if(domain.search(/\/room$/g) >= 0) {
			return domain;
		} else if(domain.search(/\/room\/$/g) >= 0) {
			return domain.substr(0, domain.length - 1);
		} else if(domain.search(/\/$/g) >= 0) {
			return domain + 'room';
		} else {
			return domain + '/room';
		}
	};
	
	var _getRoom = function(id) {
		var room;
		if(_rooms[id]) {
			room = _rooms[id];
		} else {
			room = new _Room(id);
			_rooms[id] = room;
		}
		return room;
	};
	
	var _changeRoom = function(room) {
		if(self.currentRoom) {
			self.currentRoom.leave();
		}
		self.currentRoom = room;
		if(room) {
			room._join();
		}
	};
	
	this.connect = function(host, auth) {
		if(arguments.length != 2) {
			console.log('Usage: rs.connect(host, credentials)');
		}

		if(_socket) {
			console.log('RoomService.JS already connected');
			return;
		}
		Peer.master.connect(host, auth);
		_socket = io.connect(_addNamespace(host), { query: 'sr=' + auth });
		
		_socket.on('connect', function() {
			_connected = true;
			_sendEvents();
		});
		
		_socket.on('user enter', function(roomID, user) {
			if(_rooms[roomID]) {
				_rooms[roomID]._userEnter(user);
			}
		});
		
		_socket.on('user exit', function(roomID, user) {
			if(_rooms[roomID]) {
				_rooms[roomID]._userExit(user);
			}
		});
		
		_socket.on('host', function(id, state) {
			_rooms[id]._host(state);
		});
		
		_socket.on('run client', function(id, hostID) {
			_rooms[id]._runClient(hostID);
		});
	};
	
	this.create = function(gameID, password) {
		var room = new _Room();
		_queueEvent('create', gameID, password, function(id, game, size, users, err) {
			_rooms[id] = room;
			room._register(id, game, size, users, err);
		});
		_changeRoom(room);
		return room;
	};
	
	this.join = function(id, referrer, password) {
		var room = _getRoom(id);
		var pw = password || '';
		_queueEvent('join', room.id, referrer, pw, function(id, game, size, users, err) {
			if(err) {
				delete _rooms[id];
			}
			room._register(id, game, size, users, err);
		});
		_changeRoom(room);
		return room;
	};
	
	this.subscribe = function(id) {
		var room = _getRoom(id);
		_queueEvent('subscribe', room.id, function(id, game, size, users, err) {
			if(err) {
				delete _rooms[id];
			}
			room._register(id, game, size, users, err);
		});
		return room;
	};
	
	this._leave = function(room) {
		_queueEvent('leave', room.id);
		self.currentRoom = null;
	};
	
	this._removeUser = function(user) {
		_queueEvent('remove user', this.currentRoom.id, user);
	};
	
	window.addEventListener('unload', function () {
		if(self.currentRoom) {
			self._leave(self.currentRoom);
		}
	});
}
return new _RoomManager();
})();