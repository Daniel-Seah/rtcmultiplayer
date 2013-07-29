var fs = require('fs');

var gamePath = "./public/games/";

var games = {};
module.exports = games;
games.describe = {};

var enumFolders = function() {
	games.describe = {};
	var folders = fs.readdirSync(gamePath);
	for(var i = 0; i < folders.length; i++) {
		if(!fs.existsSync(gamePath + folders[i] + '/package.json')) {
			continue;
		}
		var game = require(gamePath + folders[i] + '/package.json');
		game.directory = folders[i] + '/';
		games.describe[game.id] = game;
	}
};
enumFolders();
setInterval(enumFolders, 5 * 60 * 1000); // Refresh games every 5 minutes
