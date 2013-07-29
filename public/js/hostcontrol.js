/*
 * Controller for create game dialog
 * 
 * @author Daniel Seah
 */
function HostControl() {
	var self = this;
	
	var _gamesPath		= 'games/';
	
	var _modal			= $('#' + RTCMULTIPLAYER.Element.HOST_MODAL_ID);
	var _modalTitle		= $('#' + RTCMULTIPLAYER.Element.HOST_TITLE_ID);
	var _modalWarning	= $('#' + RTCMULTIPLAYER.Element.HOST_WARNING_ID);
	var _modalCreateBtn	= $('#' + RTCMULTIPLAYER.Element.HOST_ROOM_BTN_ID);
	var _modalPassField	= $('#' + RTCMULTIPLAYER.Element.HOST_PASS_FIELD_ID);
	
	var _btnGroup		= $('#' + RTCMULTIPLAYER.Element.HOST_BTN_GRP_ID);
	var _gameArea		= $('#' + RTCMULTIPLAYER.Element.CLIENT_AREA);
	
	/*
	 * Add button to list of games
	 */
	var _initGame = function(game) {
		var createGameButton = $('<a>');
		createGameButton.attr('href', '#' + RTCMULTIPLAYER.Element.HOST_MODAL_ID);
		createGameButton.addClass('btn');
		createGameButton.html(game.name);
		createGameButton.click(_openModal.bind(self, game));
		
		_btnGroup.append(createGameButton);
	};
	
	/*
	 * Retrieve list of playable games
	 */
	this.init = function() {
		$.ajax({
			url : 'games.json'
		}).done(function(data) {
			for(var id in data) {
				_initGame(data[id]);
			}
		});
	};
	
	var _createRoom = function(game) {
		var password = _modalPassField.text;
		
		var room = rs.create(game.id, password);
		_gameArea.attr('src', _gamesPath + game.directory + game.main);
		
		_modal.modal('hide');
	};
	
	var _openModal = function(game) {
		_modalTitle.html('Create ' + game.name + ' Room');
		_modalPassField.text = '';
		if(rs.currentRoom) {
			_modalWarning.show();
		} else {
			_modalWarning.hide();
		}
		_modalCreateBtn.click(_createRoom.bind(self, game));
		_modal.modal('show');
	};
}