var config = require('./config');
var games = require('./games');

var site = {};
module.exports = site;

site.index = function(req, res) {
	res.sendfile(__dirname + '/public/index.html');
};

site.define = function(req, res) {
	res.set('Content-Type', 'text/javascript');
	res.render('define.ejs', {
		id : config.FACEBOOK_APP_ID,
		domain : config.APP_DOMAIN,
	});
};

site.games = function(req, res) {
	res.set('Content-Type', 'application/json');
	res.json(games.describe);
};

site.peertest = function(req, res) {
	res.sendfile(__dirname + '/public/peertest.html');
};
