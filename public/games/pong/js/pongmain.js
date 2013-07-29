function gameInit(room) {
	room.on('server start', function(server, state) {
		var gameServer = new PongServer();
		gameServer.start(server);
	});
	room.on('client start', function(socket) {
		var client = new PongClient();
		client.start(socket);
	});
}