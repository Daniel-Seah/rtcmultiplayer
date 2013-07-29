/*
 * Wrapper object for Peer IO socket
 * 
 * PeerSocket represents a connection to a peer in the
 * room. The connection comprises of a socket for data,
 * a voice communication channel.
 * 
 * PeerSocket contains additional meta data about the 
 * peer such as user name, photo and friendship status.
 * These information are retrieved from Facebook.
 * 
 * @author Daniel Seah
 */
function _PeerSocket(id) {
	var self = this;
	
	var _prefix		= 'peer/';
	var _listener	= {};
	var _ready		= false;
	this.socket		= new Peer(id, _prefix);
	this.voice		= new Call(id);
	this.thumbnail	= '//graph.facebook.com/' + id + '/picture?type=square';
	this.photo		= '//graph.facebook.com/' + id + '/picture?type=large';
	this.name		= null;
	this.isFriend	= null;
	
	this.__defineGetter__('id', function() { return self.socket.id; });
	
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
	
	/*
	 * Events:
	 *   ready: PeerSocket has retrieved data from Facebook
	 */
	this.on = function(event, cb) {
		if(typeof event !== 'string') {
			console.log('Usage: on(event, callback(...))');
			return;
		}
		if(typeof cb !== 'function') {
			console.log('Usage: on(event, callback(...))');
			return;
		}
		if(typeof _listener[event] === 'undefined') {
			_listener[event] = [];
		}
		_listener[event].push(cb);
		if(event === 'ready' && _ready) {
			cb();
		}
	};
	
	var _gotFBData = function() {
		if(self.isFriend !== null && self.name !== null) {
			if(!_ready) {
				_ready = true;
				_triggerEvent('ready');
			}
		}
	};
	
	FB.api('/' + self.id, function(res) {
		self.name = res.name;
		_gotFBData();
	});
	
	FB.api('/me/friends/' + self.id, function(res) {
		if(res.data && res.data.length >= 1) {
			self.isFriend = true;
		} else {
			self.isFriend = false;
		}
		_gotFBData();
	});
	
	this.disconnect = function() {
		self.voice.disconnect();
		self.socket.disconnect();
	};
}

