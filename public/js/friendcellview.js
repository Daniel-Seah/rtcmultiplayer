/*
 * Dynamically generated view for each user in friend's
 * list
 */
function FriendCellView(model) {
	var self = this;
	
	var _model = model;
	var _view = $('<li>');
	var _friendName;
	var _nowPlaying;
	var _roomState;
	var _joinBtn;
	this.games = null;
	
	var _initUI = function() {
		var content = $('<a>');
		content.css({borderBottom : '1px solid #d2d2d2'});
		content.addClass('row-fluid');
		content.css({ 'line-height' : '30px' })
		_view.append(content);
		
		var thumbnail = new Image();
		thumbnail.src = RTCMULTIPLAYER.Properties.GRAPH_PATH + _model.id + '/picture?type=square';
		content.append($('<div>').addClass('span1').append(thumbnail));
		
		_friendName = $('<a>');
		_friendName.attr('href', '#');
		content.append($('<div>').addClass('span4').append(_friendName));
		
		_nowPlaying = $('<div>').addClass('span3');
		content.append(_nowPlaying);
		
		_roomState = $('<div>').addClass('span2');
		content.append(_roomState);
		
		_joinBtn = $('<a>');
		_joinBtn.attr('href', '#');
		_joinBtn.addClass("btn btn-primary");
		_joinBtn.html('Join');
		_joinBtn.click(_joinGame);
		content.append($('<div>').addClass('span2').append(_joinBtn));

		self.updateUI();
	};
	
	var _updateJoinBtn = function() {
		if(_model.room === null || typeof _model.room === 'undefined') {
			return;
		}
		
		_joinBtn.show();
		
		if(_model.room.isInside()) {
			_joinBtn.tooltip({ title : 'You are already in this room' });
			return;
		}
		if(_model.room.nUsers >= _model.room.maxUsers) {
			_joinBtn.tooltip({ title : 'Room is full' });
			return;
		}
		if(!_model.room.isOpen && !_model.room.isInside()) {
			_joinBtn.tooltip({ title : 'Game has already started' });
			return;
		}
		
		_joinBtn.removeClass('disabled');
		_joinBtn.tooltip({ title : 'Join game' });
	};
	
	this.updateUI = function() {
		// Update default values
		_friendName.html(_model.name);
		_nowPlaying.html('-');
		_roomState.html('-');
		_joinBtn.hide();
		_joinBtn.addClass('disabled');
		_joinBtn.tooltip('destroy');
		
		_updateJoinBtn();
		
		if(self.games === null) {
			return;
		}
		
		// Update now playing
		if(_model.room && _model.room.game) {
			_nowPlaying.html(self.games[_model.room.game].name);
		}
		
		// Update room state
		if(_model.room && _model.room.maxUsers) {
			_roomState.html(_model.room.nUsers + ' / ' + _model.room.maxUsers);
		}
	};
	
	this.remove = function() {
		_view.remove();
	};
	
	this.attachTo = function(parent) {
		parent.append(_view);
	};
	
	/*
	 * Click handler for join button
	 */
	var _joinGame = function() {
		if(_model.room === null || _model.room.nUsers >= _model.room.maxUsers || !_model.room.isOpen || _model.room.isInside()) {
			return;
		}
		var room = rs.join(_model.room.id, _model.id);
		var game = self.games[_model.room.game];
		$('#' + RTCMULTIPLAYER.Element.CLIENT_AREA).attr('src', 'games/' + game.directory + game.main);
		
		$('#' + RTCMULTIPLAYER.Element.FRIEND_MODAL_ID).modal('hide');
	};
	
	_initUI();
}
