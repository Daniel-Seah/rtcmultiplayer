/*
 * Loopback service contains the list of peer socket end points
 * that connects back to the user. Events emitted on 1 end 
 * point is received on the other end. The service bypasses
 * WebRTC and calls events directly from one end point to
 * another.
 * 
 * End points are connected only after more than 1 Peer object
 * has been added to this service. Adding more than 2
 * end points with the same label is undefined.
 * 
 * @author Daniel Seah
 */

function _Loopback() {
	var _prefix = '/';
	var self = this;
	
	var _labels = {};
	
	this._addLabel = function(peer) {
		if(typeof _labels[peer._label] === 'undefined') {
			_labels[peer._label] = [];
		}
		_labels[peer._label].push(peer);
		peer.isLocal = true;
		peer._masterConnect();
		peer._peering();
		peer._setLatency(0);
		
		var list = _labels[peer._label];
		if(list.length >= 2) {
			for(var i = 0; i < list.length; i++) {
				list[i]._goConnect();
			}
		}
	};
	
	this._removeLabel = function(peer) {
		if(typeof _labels[peer._label] === 'undefined') {
			return;
		}
		var i = _labels[peer._label].indexOf(peer);
		if(i < 0) {
			return;
		}
		_labels[peer._label][i]._disconnect();
		_labels[peer._label].splice(i, 1);
		if(_labels[peer._label].length <= 0) {
			delete _labels[peer._label];
		}
	};
	
	/*
	 * Trigger an event on local end points
	 */
	this._localLoopback = function(sender, msg) {
		var list = _labels[sender._label];
		if(typeof list === 'undefined') {
			return;
		}
		for(var i = 0; i < list.length; i++) {
			if(sender === list[i]) {
				continue;
			}
			list[i]._triggerEvent.apply(list[i], msg);
		}
	};
	
	
	/*
	 * Sets up the service with an initial list of local
	 * end points. This function is called after the
	 * identity of the user is known from the master server.
	 */
	this._setLoopLabels = function(labels) {
		/*if(_labels) {
			return;
		}*/
		//_labels = labels;
		for(var l in labels) {
			for(var i = 0; i < labels[l].length; i++) {
				self._addLabel(labels[l][i]);
			}
		}
	};
}
