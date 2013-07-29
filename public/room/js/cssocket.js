/*
 * Wrapper object for Peer IO socket
 * 
 * ClientServerSocket functions either as a server or
 * client end point. Message broadcast is available
 * only on server end points.
 * 
 * @author Daniel Seah
 */
function _ClientServerSocket(id) {
	var self = this;
	
	var _prefix		= 'clientserver/';
	var _socket		= new Peer(id, _prefix);
	var _listener	= {};
	
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
	
	/*
	 * broadcast.emit defined in room server
	 * Broadcast is only available on server end points
	 */
	this.broadcast = {};
}

