/*
 * Connection represents a connection to the remote peer.
 * 
 * This object maintains the connection and ensures it
 * remains alive by sending a heartbeat
 * 
 * @author Daniel Seah
 */
function _Connection(id) {
	id = '' + id;
	var _heartbeatTime = 3000; // in milliseconds
	var _rtc_config = {
		"iceServers" : [{
			"url" : "stun:stun.l.google.com:19302"
		}]
	};
	// TODO removed until renegotiation is fixed
	/*var _rtc_constraints = {
		"optional" : [{
			DtlsSrtpKeyAgreement : true
		}, {
			RtpDataChannels : true
		}]
	};*/
	var _rtc_constraints = {
		"optional" : [{
			RtpDataChannels : true
		}]
	};
	var _prefix = '/';
	
	var self = this;
	var _channels = {};
	var _labels = {};
	var _oldLabels = {};
	var _pc = null;
	var _pjsChannel = null;
	
	var _pingCount = 0;
	var _lastPingID = 0;
	var _pingPrevious = null;
	var _latency = _heartbeatTime;
	var _hbInterval = null;
	
	var _call = null;
	var _bufferedMic = null; // To defer adding of stream until we need to create offer
	
	this.state = 'active';
	
	var _init = function() {
		if(_hbInterval) {
			clearInterval(_hbInterval);
			_hbInterval = null;
		}
		this.latency = _heartbeatTime;
		_pingPrevious = null;
		_lastPingID = 0;
		_pingCount = 0;
		
		_pc = new RTCPeerConnection(_rtc_config, _rtc_constraints);

		// Send ice candidate to master server
		_pc.onicecandidate = function(evt) {
			if(evt.candidate) {
				Peer.master._sendCandidate(id, evt.candidate);
			}
		};
		
		// Setup data channel handler
		_pc.ondatachannel = function(evt) {
			_channels[evt.channel.label] = evt.channel;
			if(evt.channel.label === _prefix) {
				_pjsChannel = evt.channel;
				_pjsChannelInit();
			}
			if(_labels[evt.channel.label]) {
				_labels[evt.channel.label]._setChannel(evt.channel);
			}
		};
		
		_pc.onaddstream = function(evt) {
			_call._gotRemote(evt.stream);
		};
	};
	
	var _gotDescription = function(desc) {
		_pc.setLocalDescription(desc);
		Peer.master._sendSDP(id, desc);
	};
	
	/*
	 * Adds a peer data channel to the connection
	 * 
	 * Labels in loopback connections are kept here temporarily
	 * until the user's identity is verified from the server. 
	 */
	this._addLabel = function(peer) {
		if(Peer.master._connected) {
			peer._masterConnect();
		}

		if(_labels[peer._label]){
			// Save old labels if we don't know if this is not a loopback yet
			if(_oldLabels) {
				if(typeof _oldLabels[peer._label] === 'undefined') {
					_oldLabels[peer._label] = [];
				}
				_oldLabels[peer._label].push(_labels[peer._label]);
			} else {
				_labels[peer._label]._disconnect();
				console.log('Warning: Peer object "' + peer.label + '" already exists to "' + peer.id
				+ '". Old object removed. Use different labels to multiplex connection');
			}
		}
		
		// Add new label
		_labels[peer._label] = peer;
		
		// Channel already exists so we reuse it
		if(_channels[peer._label]) {
			peer._setChannel(_channels[peer._label]);
			peer._peering();
		} else if(_oldLabels === null) {
			Peer.master._queueEvent('request', peer.id, peer._label);
		}
	};
	
	this._removeLabel = function(peer, isClient) {
		isClient = isClient || true;
		if(typeof _labels[peer._label] === 'undefined') {
			return;
		}
		if(_pjsChannel && isClient && _pjsChannel.readyState === 'open') {
			_pjsChannel.send('teardown ' + peer._label);
		}
		_labels[peer._label]._disconnect();
		delete _labels[peer._label];
		
		if(Object.keys(_labels).length <= 0 && _call === null) {
			_connectionClose();
		}
	};
	
	/*
	 * Retrieve all labels stored in this connection
	 * 
	 * Used by the loopback service after the user's identity
	 * is verified
	 */
	this._allLabels = function() {
		for(var l in _labels) {
			var lbl = _labels[l];
			if(typeof _oldLabels[lbl._label] === 'undefined') {
				_oldLabels[lbl._label] = [];
			}
			_oldLabels[lbl._label].push(lbl);
		}
		return _oldLabels;
	};
	
	this._masterConnect = function() {
		for(var l in _oldLabels) {
			for(var i = 0; i < _oldLabels[l]; i++) {
				var lbl = _oldLabels[l][i];
				lbl._disconnect();
				console.log('Warning: Peer object "' + lbl.label + '" already exists to "' + lbl.id
				+ '". Old object removed. Use different labels to multiplex connection');
			}
		}
		_oldLabels = null;
		
		// Request connections once we are authenticated
		for(var l in _labels) {
			_labels[l]._masterConnect();
			Peer.master._queueEvent('request', _labels[l].id, _labels[l]._label);
		}
	};
	
	this._offer = function(label) {
		// TODO change to reliable channel
		for(var l in _labels) {
			_labels[l]._peering();
		}
		var chan;
		if(!_pjsChannel) {
			_pjsChannel = _pc.createDataChannel(_prefix, {reliable: false});
			//_channelInit(_pjsChannel);
			_channels[_prefix] = _pjsChannel;
			_pjsChannelInit();
		}
		if(label) {
			if(label === _prefix) {
				chan = _pjsChannel;
			} else {
				chan = _pc.createDataChannel(label, {reliable: false});
				//_channelInit(chan);
				_channels[label] = chan;
			}
			_labels[label]._setChannel(chan);
		}
		
		// Add mic stream now if any
		if(_bufferedMic) {
			_pc.addStream(_bufferedMic);
			_bufferedMic = null;
		}
		
		_pc.createOffer(_gotDescription);
	};
	
	this._sdp = function(remoteDesc, toAns) {
		for(var l in _labels) {
			_labels[l]._peering();
		}
		_pc.setRemoteDescription(new RTCSessionDescription(remoteDesc));

		// This is the callee
		if(toAns) {
			_pc.createAnswer(_gotDescription);
		}
	};
	
	this._candidate = function(candidate) {
		for(var l in _labels) {
			_labels[l]._peering();
		}
		_pc.addIceCandidate(new RTCIceCandidate(candidate));
	};
	
	var _channelOpen = function() {
		_hbInterval = setInterval(_heartbeat, _heartbeatTime);
	};
	
	var _connectionClose = function() {
		if(_hbInterval) {
			clearInterval(_hbInterval);
		}
		for(var l in _labels) {
			_labels[l]._disconnect();
		}
		_pc.close();
		self.state = 'closed';
	};
	
	var _pjsChannelInit = function() {
		_pjsChannel.addEventListener('open', _channelOpen);
		_pjsChannel.addEventListener('message', _pjsEvent);
	};
	
	/*
	 * Handle heartbeat and remote teardown messages
	 */
	var _pjsEvent = function(msg) {
		// Ignore user event messages
		if(msg.data.charAt(0) === '[') {
			return;
		}
		
		var token = msg.data.split(' ');
		switch(token[0]) {
			case 'ping':
				_pjsChannel.send('pong ' + token[1]);
				break;
			case 'pong':
				var pingID = parseInt(token[1]);
				if(pingID === _pingCount - 1) {
					var now = new Date();
					_lastPingID = pingID;
					for(var l in _labels) {
						_labels[l]._setLatency(now.getTime() - _pingPrevious.getTime());
					}
				}
				break;
			case 'teardown':
				if(token[1]) {
					if(_labels[token[1]]) {
						self._removeLabel(_labels[token[1]], false);
					}
				} else {
					_connectionClose();
				}
				break;
			default:
		}
	};
	
	var _heartbeat = function() {
		// Heartbeat timeout
		if(_lastPingID < _pingCount - 4) {
			_connectionClose();
			return;
		}
		
		_pjsChannel.send('ping ' + _pingCount);
		_pingCount++;
		_pingPrevious = new Date();
	};
	
	this._addCall = function(call) {
		if(_call) {
			return;
		}
		
		_call = call;
		getUserMedia({ 'audio' : true }, _gotMic);
	};
	
	this._removeCall = function() {
		if(_call === null) {
			return;
		}
		_pc.removeStream(_call.stream);
		if(_call._mic) {
			_pc.removeStream(_call._mic);
		}
		_call = null;
		
		if(Object.keys(_labels).length <= 0 && _call === null) {
			_connectionClose();
		}
	};
	
	var _gotMic = function(stream) {
		_call._setMic(stream);
		_bufferedMic = stream;
		Peer.master._queueEvent('call request', id);
	};
	
	/*
	 * Teardown all remote connections when user navigates away
	 */
	window.addEventListener('unload', function () {
		if(!_pjsChannel || _pjsChannel.readyState !== 'connected') {
			return;
		}
		_pjsChannel.send('teardown');
	});
	
	_init();
}
