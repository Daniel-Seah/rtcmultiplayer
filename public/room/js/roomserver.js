/*
 * A server object that contains a list of connections to
 * clients.
 * 
 * The server can be run on any peer that is participating
 * in the game room. There should only be 1 server at any
 * time.
 *  
 * Clients may be remote or running in the same browser.
 * 
 * @author Daniel Seah
 */
function _RoomServer(connections) {
	var self = this;
	
	var _listener = {};
	this.sockets = {};	// Client connections
	
	this._addConnection = function(id) {
		var conn = new _ClientServerSocket(id);
		
		// Extend socket with broadcast functionality
		conn.broadcast.emit = _broadcast;
		conn.broadcast._sender = conn;
		
		// Add to list of connections in server
		// used for broadcasting
		self.sockets[id] = conn;
		
		// Inform master server if client disconnects
		conn.on('disconnect', function() {
			rs._removeUser(id);
		});
		
		conn.on('connect', function() {
			_triggerEvent('connection', conn);
		});
		conn.connect();
	}
	
	this._removeConnection = function(id) {
		self.sockets[id].disconnect();
		delete self.sockets[id];
	};
	
	var _broadcast = function() {
		var args = Array.prototype.slice.call(arguments);
		for(var id in self.sockets) {
			var conn = self.sockets[id];
			if(conn === this._sender) {
				continue;
			}
			conn.emit.apply(conn, args);
		}
	};
	
	this.disconnect = function() {
		for(var id in this.sockets) {
			self.sockets[id].disconnect();
		}
		self.sockets = {};
	};
	
	/*
	 * Events:
	 *   connection: new peer socket has connected
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
		
		// For late binding of connection event
		if(event === 'connection') {
			for(var id in self.sockets) {
				var conn = self.sockets[id];
				if(conn.state === 'connected' || conn.state === 'handshaking') {
					cb(conn);
				}
			}
		}
		// Begin server endpoint connection after connection handler is registered
		/*if(event === 'connection') {
			for(var id in self.sockets) {
				self.sockets[id].connect();
			}
		}*/
	};
	
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
	
	if(connections) {
		for(var i = 0; i < connections.length; i++) {
			this._addConnection(connections[i]);
		}
	}
}
