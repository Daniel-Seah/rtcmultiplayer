/*
 * Peer manager maintains a list of connected peers.
 * 
 * This object also connects to the master server
 * to authenticate users and facilitate peer to peer
 * connections.
 * 
 * @author Daniel Seah
 */
function _Manager() {
	var self = this;
	
	var _id				= null;
	this._connected		= false;
	var _socket			= null;
	var _auth			= null;
	var _events			= [];
	var _connections	= {};
	var _loopback		= new _Loopback();
	
	this._queueEvent = function() {
		var args = Array.prototype.slice.call(arguments);
		if(this._connected) {
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
		if(domain.search(/\/pjs$/g) >= 0) {
			return domain;
		} else if(domain.search(/\/pjs\/$/g) >= 0) {
			return domain.substr(0, domain.length - 1);
		} else if(domain.search(/\/$/g) >= 0) {
			return domain + 'pjs';
		} else {
			return domain + '/pjs';
		}
	};
	
	var _setupLoopback = function() {
		if(_connections[_id]) {
			_loopback._setLoopLabels(_connections[_id]._allLabels());
			delete _connections[_id];
		}
	};
	
	/*
	 * Connect to the peer master server
	 *   host: URL of master server
	 *   auth: identity/credentials of the user
	 */
	this.connect = function(host, auth) {
		if(arguments.length != 2) {
			console.log('Usage: Peer.master.connect(host, credentials)');
		}
		if(_socket) {
			console.log('Peer.IO already connected');
			return;
		}
		
		_socket = io.connect(_addNamespace(host), { query: 'sr=' + auth });
		_auth = auth;
		
		/*
		 * On connect to master server
		 *   id: Identity of the user as received by the master server
		 */
		_socket.on('register', function(id) {
			_id = id;
			self._connected = true;
			_setupLoopback();
			for(var pid in _connections) {
				_connections[pid]._masterConnect();
			}
			_sendEvents();
		});
		
		_socket.on('offer', function(pid, label) {
			_connections[pid]._offer(label);
		});
		
		_socket.on('remote sdp', function(pid, remoteDesc, toAns) {
			_connections[pid]._sdp(remoteDesc, toAns);
		});
		
		_socket.on('remote candidate', function(pid, candidate) {
			_connections[pid]._candidate(candidate);
		});
	};
	
	/*
	 * Send a message to the local end point
	 */
	this._localLoopback = function(sender, msg) {
		if(_id && sender.id === _id) {
			_loopback._localLoopback(sender, msg);
		}
	};
	
	this._sendSDP = function(pid, sdp) {
		this._queueEvent('sdp', pid, sdp);
	};
	
	this._sendCandidate = function(pid, candidate) {
		this._queueEvent('candidate', pid, candidate);
	};
	
	/*
	 * Inform master server that the connection has been
	 * set up correctly
	 */
	this._finishConnection = function(pid, label) {
		// Avoid sending 'connected' events for loopbacks
		if(_id && pid === _id) {
			return;
		}
		this._queueEvent('connected', pid, label);
	};
	
	this._addPeerLabel = function(peer) {
		// Loopback
		if(peer.id === _id) {
			_loopback._addLabel(peer);
			return;
		}
		
		var isNew = false;
		if(typeof _connections[peer.id] === 'undefined') {
			_connections[peer.id] = new _Connection(peer.id);
			isNew = true;
		}
		_connections[peer.id]._addLabel(peer);
		if(this._connected && isNew) {
			_connections[peer.id]._masterConnect();
		}
	};
	
	this._removePeerLabel = function(peer) {
		// Remove loopback connection
		if(peer.id === _id) {
			_loopback._removeLabel(peer);
		} else {
			// Remove label from connection
			_connections[peer.id]._removeLabel(peer);
			if(_connections[peer.id].state === 'closed') {
				delete _connections[peer.id];
			}
		}
	};
	
	this._addCall = function(call) {		
		_connections[call.id]._addCall(call);
	};
	
	this._removeCall = function(call) {
		// Remove label from connection
		_connections[call.id]._removeCall(call);
		if(_connections[call.id].state === 'closed') {
			delete _connections[call.id];
		}
	};
}
