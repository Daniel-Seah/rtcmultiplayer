/*
 * User model
 * 
 * @author Daniel Seah
 */
var User = function(id) {
	var self = this;
	
	this.observers	= {};
	this.socket		= null;
	this.id			= id || null;
	this.name		= null;
	this.room		= null;
	this.state		= 'online';
	
	this.serialise = function() {
		return {
			id		: this.id,
			room	: this.room,
			state	: this.state
		};
	};
	
	this.deserialise = function(data) {
		this.id		= data.id;
		this.state	= data.state;
	};
}

if(typeof global !== 'undefined') { global.User = User; }