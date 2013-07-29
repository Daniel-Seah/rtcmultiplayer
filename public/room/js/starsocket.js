function _StarSocket(id, isServer) {
	var self = this;
	
	var _prefix		= 'roomjs/';
	var _socket		= new Peer(id, _prefix);
	var _listener	= {};
	var _isServer	= isServer || false;
	var _state		= 'connecting'; // connecting, established(client), handshaking(server), connected
	
	this.__defineGetter__('id', function() { return _socket.id; });
	this.__defineGetter__('label', function() { return _socket.label; });
	this.__defineGetter__('latency', function() { return _socket.latency; });
	this.__defineGetter__('state', function() { return _socket.state; });
	
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
	};
	
	this.on = function(event, cb) {
		if(typeof event !== 'string') {
			console.log('Usage: on(event, callback(...))');
			return;
		}
		if(typeof cb !== 'function') {
			console.log('Usage: on(event, callback(...))');
			return;
		}
		/*if(_isServer) {
			/*if(event === 'connection' || event === 'connect') {
				console.log('Warning: Server endpoint does not emit connection/connect events');
			}
		} else if(event === 'connection') {
			console.log('Warning: Client endpoint does not emit connection event. Use connect instead');
		} else if(event === 'connect') {
			if(typeof _listener[event] === 'undefined') {
				_listener[event] = [];
			}
			_listener[event].push(cb);
			if(_state === 'connected') {
				_triggerEvent('connect');
			}
			return;
		}*/
		var args = Array.prototype.slice.call(arguments);
		_socket.on.apply(_socket, args);
	};

	this.emit = function(event) {
		var args = Array.prototype.slice.call(arguments);
		_socket.emit.apply(_socket, args);
	};
	
	this.removeAllListeners = function(event) {
		_socket.removeAllListeners(event);
	};
	
	this.disconnect = function() {
		_socket.disconnect();
	};
	
	this.connect = function() {
		_socket.connect();
	};
	
	// broadcast.emit defined in room server
	this.broadcast = {};
}

