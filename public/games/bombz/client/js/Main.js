// main.js
// @author Leon Ho

window.onload = function()
{
	Crafty.init(Properties.DEVICE_WIDTH, Properties.DEVICE_HEIGHT);
	Crafty.canvas.init();
	
	Crafty.background("#FFFFFF");
	
	//SceneManager.RunWithScene(SceneDefinitions.WaitingRoomScene);
	//SceneManager.RunWithScene(SceneDefinitions.GameScene);
	SceneManager.RunWithScene(SceneDefinitions.SplashScene);
};

function gameInit(room) {
	room.on('server start', function(sockets, state) {
		var server = new Server();
		server.Start(sockets);
	});
	room.on('client start', function(s) {
		socket = s;
		//SceneManager.ChangeScene(SceneDefinitions.WaitingRoomScene);
	});
	
	var chatWindow = new Chat(room);
}
