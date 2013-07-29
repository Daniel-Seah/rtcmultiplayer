/*
 * Peer is an end point used for data communication.
 * 
 * Events emitted are buffered until both end points
 * are in the connected state.
 * 
 * @author Daniel Seah
 */
function Peer(id, label) {
	var self = this;
	
	this.id = '' + id;
	this.label = label || '';
	this.label = '' + this.label;
	this._label = '/' + this.label;
	this.latency = 5000;
	this.isLocal = false;		// Valid only after connnecting state
	
	var _channel = null;
	var _listener = {};
	var _eventBuffer = [];
	this.state = 'connecting';	// connecting, waiting, peering, handshaking, connected, closed
	
	/*
	 * Send an event if socket is connected. Event is buffered
	 * if the socket is not ready.
	 */
	var _queueEvent = function(args) {
		if(self.state === 'connected') {
			if(_channel) {
				var serial = JSON.stringify(args);
				_channel.send(serial);
			} else {
				Peer.master._localLoopback(self, args);
			}
		} else {
			_eventBuffer.push(args);
		}
	};
	
	/*
	 * Transmit ordered list of buffered events
	 */
	var _sendEvents = function() {
		for(var i = 0; i < _eventBuffer.length; i++) {
			self.emit.apply(self, _eventBuffer[i]);
		}
		_eventBuffer.length = 0;
	};
	
	/*
	 * Trigger an event on the end point. This method is used by
	 * the channel and the local loopback service to call on
	 * event listeners.
	 */
	this._triggerEvent = function(event) {
		var listeners = _listener[event];
		var args = Array.prototype.slice.call(arguments).slice(1);
		if(typeof listeners === 'undefined') {
			return;
		}
		for(var i = 0; i < listeners.length; i++) {
			var cb = listeners[i];			
			cb.apply(cb, args);
		}
	}
	
	/*
	 * Go to the handshake state
	 */
	var _goHandshake = function() {
		if(self.state !== 'peering') {
			return;
		}
		// Do not send registration message on loopback end points
		if(self.isLocal) {
			self.state = 'handshaking';
			self._triggerEvent('connect');
		} else if(_channel && _channel.readyState === 'open') {
			self.state = 'handshaking';
			self._triggerEvent('connect');
			_channel.send('registered');
		}
	};
	
	/*
	 * Go to the connected state
	 */
	this._goConnect = function() {
		if(self.state === 'handshaking') {
			self.state = 'connected';
			Peer.master._finishConnection(self.id, self._label);
			_sendEvents();
		}
	};
	
	/*
	 * Parse channel messages
	 */
	var _channelMsg = function(data) {
		var msg = data.data;
		
		_goHandshake();
		
		// Listen for handshake message
		if(msg === 'registered') {
			self._goConnect();
			return;
		} else if(msg.charAt(0) !== '[') {
			// Ignore library messages
			return;
		}
		
		var args = JSON.parse(msg);
		self._triggerEvent.apply(self, args);
	};
	
	this._setLatency = function(latency) {
		this.latency = latency;
		_goHandshake();
	};
	
	this._setChannel = function(channel) {
		if(_channel) {
			return;
		}
		_channel = channel;
		_channel.addEventListener('message', _channelMsg);
	};
	
	/*
	 * Disconnect end point. Used by internal library only
	 */
	this._disconnect = function() {
		if(_channel) {
			_channel.removeEventListener('message', _channelMsg);
			_channel = null;
		}
		if(this.state == 'connected') {
			self._triggerEvent('disconnect');
		}
		this.state = 'closed';
	};
	
	this._masterConnect = function() {
		if(this.state == 'connecting') {
			this.state = 'waiting';
		}
	};
	
	this._peering = function() {
		if(this.state == 'waiting') {
			this.state = 'peering';
		}
	};
	
	this._reset = function() {
		if(this.state == 'peering') {
			this.state = 'waiting';
		}
	};
	
	/*
	 * Adds event listeners to the socket. Events emitted before
	 * the listener is added will be lost.
	 * 
	 * The connection event will always be fired even if added
	 * after the end point is connected.
	 * 
	 * Events
	 *   connect: Socket connected to remote peer
	 *   disconnect: Socket disconnected from remote peer
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
		if(event === 'connect' && this.state === 'connected') {
			cb();
		}
	};

	/*
	 * Emits an event to the remote end point.
	 * 
	 * Events are buffered until both end points have
	 * handshaken and are in the connected state. Once
	 * connected, events emitted will be lost if the
	 * remote listener has not been added.
	 */
	this.emit = function(event) {
		var args = Array.prototype.slice.call(arguments);
		if(this.state === 'closed') {
			console.log('Channel closed');
			return;
		}
		if(typeof event !== 'string') {
			console.log('Usage: emit(event, ...)');
			return;
		}
		_queueEvent(args);
	};
	
	this.removeAllListeners = function(event) {
		if(typeof event !== 'string') {
			console.log('Event name must be a string');
			return;
		}
		if(typeof _listener[event] === 'undefined') {
			return;
		}
		delete _listener[event];
	};
	
	this.disconnect = function() {
		Peer.master._removePeerLabel(this);
	};
	
	this.connect = function() {
		if(self.state === 'connecting') {
			Peer.master._addPeerLabel(this);
		}
	};
}

Peer.master = new _Manager();
