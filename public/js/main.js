/*
 * Main entry point for RTCMultiplayer app
 * 
 * @author Daniel Seah
 */
var clientController = null;

window.onload = function() {
	clientController = new ClientControl();
	clientController.init();
}

function loadGame() {
	if(rs.currentRoom === null) {
		return;
	}
	var x = $('#' + RTCMULTIPLAYER.Element.CLIENT_AREA)[0];
	doc = x.contentWindow || x.contentDocument;
	doc.gameInit(rs.currentRoom);
};
