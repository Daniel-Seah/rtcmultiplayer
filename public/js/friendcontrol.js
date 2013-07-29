/*
 * Controller for friends list
 * 
 * @author Daniel Seah
 */
function FriendControl(socket) {
	var self = this;
	
	var _friendList	= {};
	var _cellList	= {};
	var _socket		= socket;
	var _view		= $('#'+RTCMULTIPLAYER.Element.FRIEND_LIST_ID);
	var _games		= null;
	
	// New friend has logged in
	_socket.on('friend online', function(data) {
		if(typeof _friendList[data.id] === 'undefined') {
			_addFriend(data);
		}
	});
	
	 // Friend has logged out
	_socket.on('friend offline', function(id) {
		if(typeof _friendList[id] !== 'undefined') {
			_removeFriend(id);
		}
	});
	
	// Friend has entered a new room
	_socket.on('friend enter', function(userID, roomID) {
		_changeRoom(userID, roomID);
	});
	
	// Friend has left a room
	_socket.on('friend leave', function(userID, roomID) {
		var friend = _friendList[userID];
		if(typeof friend === 'undefined') {
			return;
		}
		// Attempting to leave a room that user is not in
		if(friend.room.id !== roomID) {
			return;
		}
		_changeRoom(userID);
	});
	
	/*
	 * Retrieve the list of games
	 */
	this.init = function() {
		$.ajax({
			url : 'games.json'
		}).done(function(data) {
			_games = data;
			for(var id in _cellList) {
				_cellList[id].games = _games;
				_cellList[id].updateUI();
			}
		});
		_refreshAllFriends();
	};
	
	/*
	 * Process movement of friends from one room to another
	 *   userID: identity of user that is changing room
	 *   roomID: new room that the user is moving to
	 */
	var _changeRoom = function(userID, roomID) {
		var friend = _friendList[userID];
		var cell = _cellList[userID];
		if(typeof friend === 'undefined') {
			return;
		}
		if(typeof cell === 'undefined') {
			return;
		}
		if(friend.room) {
			friend.room.removeListener('state change', cell.updateUI);
			friend.room = null;
		}
		if(typeof roomID !== 'undefined' && roomID !== null) {
			friend.room = rs.subscribe(roomID);
			friend.room.on('state change', cell.updateUI);
		}
		cell.updateUI();
	};
	
	/*
	 * Retrieve a complete list of friends
	 */
	var _refreshAllFriends = function() {
		_socket.emit('refresh friends', function(data) {
			// Clear offline friends
			_friendList = {};
			_cellList = {};
			_view.empty();
			
			for(var id in data) {
				_addFriend(data[id]);
			}
		});
	};
	
	var _addFriend = function(data) {
		// Create friend
		var friend = new User();
		friend.deserialise(data);
		_friendList[friend.id] = friend;
		
		// Create friend view
		var view = new FriendCellView(friend);
		view.games = _games;
		FB.api('/' + friend.id, function(res) {
			friend.name = res.name;
			view.updateUI();
		});
		_cellList[friend.id] = view;
		view.attachTo(_view);
		
		// Subscribe to friend's room
		if(data.room) {
			 friend.room = rs.subscribe(data.room);
		}
	};
	
	var _removeFriend = function(id) {
		_cellList[id].remove();
		delete _cellList[id];
		delete _friendList[id];
	};
	
	var _updateFriend = function(data) {
		_friendList[data.id].deserialise(data);
		_cellList[data.id].updateUI();
	};
}
