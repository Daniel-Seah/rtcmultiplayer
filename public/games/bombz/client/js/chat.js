var Chat = (function() {

function Chat(room) {
	var self = this;
	var _view = $('#chatArea');
	var _cells = {};
	
	var _addUser = function(peer) {
		var c = _cells[peer.id] = new PlayerCellView(peer);
		_view.append(c.view);
		peer.voice.connect();
	};
	
	var _micBegin = function() {
		for(var id in room.peers) {
			room.peers[id].voice.micBegin();
		}
	};
	
	var _micEnd = function() {
		for(var id in room.peers) {
			room.peers[id].voice.micEnd();
		}
	};
	
	room.on('peer enter', function(peer) {
		_addUser(peer);
	});
	
	room.on('peer leave', function(pid) {
		_cells[pid].view.remove();
		delete _cells[pid];
	});
	
	for(var id in room.peers) {
		_addUser(room.peers[id]);
	}
	
	$(document).keydown(function(event) {
		if(event.which !== 16) {
			return;
		}
		_micBegin();
	});
	$(document).keyup(function(event) {
		if(event.which !== 16) {
			return;
		}
		_micEnd();
	});
}

function PlayerCellView(_model) {
	var self = this;
	
	this.view = $('<div>');
	
	self.view.css({borderBottom : '1px solid #d2d2d2'});
	self.view.addClass('row-fluid');
	
	var thumbnail = new Image();
	thumbnail.src = _model.thumbnail;
	self.view.append($('<div>').addClass('span4').append(thumbnail));
	
	var rightPane = $('<div>').addClass('span8');
	self.view.append(rightPane);
	
	var friendName = $('<p>');
	friendName.html(_model.name);
	friendName.addClass('span12');
	rightPane.append(friendName);
	
	var chatControl = $('<div>');
	chatControl.addClass('row span12');
	rightPane.append(chatControl);
	
	var on = $('<i class="icon-volume-up"></i>');
	_model.voice.on('voice begin', function() {
		on.addClass('highlight');
	});
	_model.voice.on('voice end', function() {
		on.removeClass('highlight');
	});
	var off = $('<i class="icon-volume-off"></i>');
	var muteBtn = $('<a>');
	muteBtn.addClass('span2');
	muteBtn.attr('href', '#');
	muteBtn.html(on);
	chatControl.append(muteBtn);
	var mute = function(flag) {
		on.removeClass('highlight');
		_model.voice.mute(flag);
		if(_model.voice.muted) {
			muteBtn.html(off);
		} else {
			if(slider.val() <= 0) {
				slider.val(100);
			}
			muteBtn.html(on);
		}
	};
	muteBtn.click(function() {
		mute();
	});
	
	// TODO add slider controls
	var slider = $('<input>');
	slider.attr({
		type: 'number',
		min: 0,
		max: 100,
		step: 1,
		value: 100
	});
	slider.addClass('span10');
	chatControl.append(slider);
	slider.change(function() {
		var value = slider.val() / 100;
		_model.voice.volume(value);
		if(value <= 0) {
			mute(true);
		} else {
			mute(false);
		}
	});
}

return Chat;
})();
