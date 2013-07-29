function ClientControl() {
	var self = this;

	var _isInit		= false;
	var _friendList	= [];
	var socket		= null;
	var friendController	= null;
	
	var _setupCall = function(peer) {
		var testCall = new Call(peer);
		//testCall.on('voice begin', function() { console.log('' + peer + ' voice begin'); });
		//testCall.on('voice end', function() { console.log('' + peer + ' voice end'); });
		testCall.on('error', function(e) { console.log(e); });
		testCall.connect();
		$('#' + RTCMULTIPLAYER.Element.HOST_PASS_FIELD_ID).keydown(function(event) {
			if(event.which !== 16) {
				return;
			}
			testCall.micBegin();
		});
		$('#' + RTCMULTIPLAYER.Element.HOST_PASS_FIELD_ID).keyup(function(event) {
			if(event.which !== 16) {
				return;
			}
			testCall.micEnd();
		});
		$('#' + RTCMULTIPLAYER.Element.HOST_PASS_FIELD_ID).keyup(function(event) {
			if(event.which !== 77) {
				return;
			}
			console.log('toggled mute on peer');
			testCall.mute();
		});
	};
	
	this.init = function() {
		if(_isInit || session.userID === null) {
			return;
		}
		
		socket = io.connect(RTCMULTIPLAYER.Properties.APP_DOMAIN, { query: "sr=" + session.signed });
		friendController = new FriendControl(socket);
		friendController.init();
		
		var other;
		if(session.userID == 100005906473576) {
			other = 100002286446034;
		} else {
			other = 100005906473576;
		}
		
		
		Peer.master.connect(RTCMULTIPLAYER.Properties.APP_DOMAIN, session.signed);
		
		// Test voice chat
		var peers = ['100002286446034', '100005906473576', '100006302167260'];
		/*for(var i = 0; i < peers.length; i++) {
			_setupCall(peers[i]);
		}*/
		
		// Test add new label
		var delay = function() {
			var p2 = new Peer(other, 'another');
			p2.on('connect', function() {
				setInterval(function() { p2.emit('tock'); }, 5000);
				console.log('p2 latency ' + p2.latency);
			});
			p2.on('tock', function() {
				console.log('tock ' + p2.latency);
			});
			p2.connect();
		}
		
		// Test repeated adding of peer labels
		var replace = function() {
			var p3 = new Peer(other, 'some');
			p3.on('connect', function() {
				p3.emit('ok');
			});
			p3.on('ok', function() {
				console.log('original replaced, no more ticks');
			});
			p3.connect();
		};
		
		// Test basic functionality
		var p = new Peer(other, 'some');
		var boom;
		
		p.on('connect', function() {
			p.emit('news', 1, 'kek');
			boom = setInterval(function() {
				p.emit('tick'); 
			}, 2000);
			//setTimeout(delay, 1000);
			//setTimeout(replace, 7000);
			console.log('p1 latency ' + p.latency);
		});
		p.on('tick', function() {
			console.log('tick');
		});
		p.on('news', function(num, word) {
			console.log(word+(num+3));
		});
		p.on('disconnect', function() {
			clearInterval(boom);
			console.log('bye');
		});
		p.on('news', function(num, word) {
			console.log('me too');
		});
		p.connect();
		
		// Test loopback service
		/*var me1 = new Peer(session.userID);
		me1.on('connect', function() {
			me1.emit('loop');
		});
		me1.on('loop', function() {
			console.log('me1');
		})
		me1.connect();
		var me2 = new Peer(session.userID);
		me2.on('connect', function() {
			me2.emit('loop');
		});
		me2.on('loop', function() {
			console.log('me2');
		});
		me2.connect();*/
		
		// Test multiple labels
		/*var l, r;
		var left = new Peer(other, 'left');
		left.on('connect', function() {
			var i = 0;
			l = setInterval(function() {
				left.emit('left', i++);
			}, 2000);
		});
		left.on('left', function(num) {
			console.log('left ' + num);
		});
		left.on('disconnect', function() {
			clearInterval(l);
		});
		left.connect();
		var right = new Peer(other, 'right');
		right.on('connect', function() {
			var i = 0;
			r = setInterval(function() {
				right.emit('right', i++);
			}, 2000);
		});
		right.on('right', function(num) {
			console.log('right ' + num);
		});
		right.on('disconnect', function() {
			clearInterval(r);
		});
		right.connect();*/
		
		/*rs.connect(RTCMULTIPLAYER.Properties.APP_DOMAIN, session.signed);
		var room;
		if(session.userID == 100005906473576) {
			room = rs.create();
		} else {
			room = rs.join(0);
		}
		room.on('server start', function(server, state) {
			console.log('server started');
			server.on('connection', function(socket) {
				console.log('client ' + socket.id + ' connected');
				socket.on('something', function() {
					console.log('server received something from client ' + socket.id);
					socket.emit('reply');
					console.log('server ok');
				});
			});
		});
		room.on('client start', function(socket) {
			console.log('client started');
			socket.on('connect', function() {
				console.log('connected to server');
				socket.emit('something');
			});
			socket.on('reply', function() {
				console.log('client ok');
			});
		});*/
		
		setInterval(function() {
			var debug = 1;
		}, 1000);
		
		window.onunload = function() {
			console.log('onunload');
		}
		
		_isInit = true;
	};
}
