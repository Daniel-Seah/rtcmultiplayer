/*
 * Controller for app program
 * 
 * @author Daniel Seah
 */
function ClientControl() {
	var self = this;

	var _isInit		= false;
	var _friendList	= [];
	var socket		= null;
	var friendController	= null;
	
	this.init = function() {
		if(_isInit || session.userID === null) {
			return;
		}
		
		socket = io.connect(RTCMULTIPLAYER.Properties.APP_DOMAIN, { query: "sr=" + session.signed });
		rs.connect(RTCMULTIPLAYER.Properties.APP_DOMAIN, session.signed);
		
		friendController = new FriendControl(socket);
		friendController.init();
		
		hostController = new HostControl();
		hostController.init();
		
		_isInit = true;
	};
}
