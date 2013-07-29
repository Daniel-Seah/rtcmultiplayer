/*
 * Room model
 * 
 * @author Daniel Seah
 */
var Room = function(id) {
	var self = this;
	
	this.id			= id || 0;
	this.game		= '';
	this.password	= '';
	this.size		= 0;
	this.maxUsers	= 2;
	this.isOpen		= true;
	this.users		= {};
	
	this.add = function(user) {
		this.users[user.id] = user;
		this.size++;
	};
	
	this.remove = function(id) {
		delete this.users[id];
		this.size--;
	};
	
	/*this.serialiseUsers = function() {
		var list = [];
		for(var id in users) {
			list.push(users[id].serialise());
		}
		return list;
	}
	
	this.deserialiseUsers = function(data) {
		for(var i = 0; i < data.length; i++) {
			var u = new User();
			u.deserialise(data[i]);
			this.users[u.id] = u;
		}
	};*/
	
	this.serialise = function() {
		return {
			id		: this.id,
			game	: this.game,
			size	: this.size,
			max		: this.maxUsers,
			state	: this.isOpen
		};
	};
	
	this.deserialise = function(data) {
		this.id			= data.id;
		this.game		= data.game;
		this.size		= data.size;
		this.maxUsers	= data.max;
		this.state		= data.state;
	};
};

if(typeof global !== 'undefined') { global.Room = Room; }