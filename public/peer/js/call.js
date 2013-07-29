/*
 * Voice communication end point
 * 
 * Loopback calls are not allowed. Only 1 call can be opened
 * per remote peer.
 * 
 * @author Daniel Seah
 */
function Call(id) {
	var self			= this;
	
	var _listener		= {};
	var _control		= new Peer(id, '/call');
	
	this.audio			= new Audio();
	this.stream			= null;
	var _remoteSpeaking	= false;
	
	this._mic			= null;
	var _isSpeaking		= false;
	
	this.__defineGetter__('id', function() { return _control.id; });
	this.__defineGetter__('muted', function() { return self.audio.muted; });
	
	var _triggerEvent = function(event) {
		var listeners = _listener[event];
		var args = Array.prototype.slice.call(arguments).slice(1);
		if(typeof listeners === 'undefined') {
			return;
		}
		for(var i = 0; i < listeners.length; i++) {
			var cb = listeners[i];
			cb.apply(cb, args);
		}
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
	
	/*
	 * Events
	 *   voice begin: remote peer has pressed PTT button and mic
	 * 		is transmitting
	 *   voice end: remote peer has depressed PTT button and mic
	 * 		is off
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
		if(event === 'voice begin' && _remoteSpeaking) {
			cb();
		}
	};
	
	/*
	 * Mutes remote peer voice
	 * 
	 * flag(optional): Boolean. Toggles mute if omitted 
	 */
	this.mute = function(flag) {
		if(typeof flag === 'undefined') {
			this.audio.muted = !this.audio.muted;
		} else if(this.audio.muted === flag) {
			return;
		} else {
			this.audio.muted = flag;
		}
		
		// Restore remote speaking state on unmute
		if(!this.audio.muted && _remoteSpeaking) {
			_triggerEvent('voice begin');
		}
	};
	
	this.volume = function(value) {
		this.audio.volume = value;
	};
	
	this.disconnect = function() {
		if(this.stream) {
			this.stream.stop();
		}
		if(this._mic) {
			this._mic.stop();
		}
		_control.disconnect();
		Peer.master._removeCall(this);
	};
	
	this.connect = function() {
		_control.on('connect', function() {
			if(_control.isLocal) {
				_triggerEvent('error', 'Cannot create calls to self');
				return;
			}
			Peer.master._addCall(self);
		});
		_control.on('disconnect', function() {
			self.disconnect();
		});
		_control.on('begin', function() {
			_remoteSpeaking = true;
			if(!self.audio.muted) {
				_triggerEvent('voice begin');
			}
		});
		_control.on('end', function() {
			_remoteSpeaking = false;
			if(!self.audio.muted) {
				_triggerEvent('voice end');
			}
		});
		
		_control.connect();
		this.audio.play();
	};
	
	/*
	 * Unmute local microphone and begin transmitting voice
	 */
	this.micBegin = function() {
		if(_isSpeaking) {
			return;
		}
		_isSpeaking = true;
		if(this._mic) {
			_control.emit('begin');
			this._mic.getAudioTracks()[0].enabled = true;
		}
	};
	
	/*
	 * Mute local microphone and stop voice transmission
	 */
	this.micEnd = function() {
		if(!_isSpeaking) {
			return;
		}
		_isSpeaking = false;
		if(this._mic) {
			_control.emit('end');
			this._mic.getAudioTracks()[0].enabled = false;
		}
	};
	
	this._setMic = function(stream) {
		this._mic = stream;
		this._mic.getAudioTracks()[0].enabled = _isSpeaking;
	};
	
	this._gotRemote = function(stream) {
		this.stream = stream;
		this.audio.src = URL.createObjectURL(stream);
	};
}
