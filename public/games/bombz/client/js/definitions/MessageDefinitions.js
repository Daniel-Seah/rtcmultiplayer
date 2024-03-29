// MessageDefinitions.js
// @author: Leon Ho
// This file contains the definitions for the messages we send or receive over the network

var MessageDefinitions = 
{
	// Game Lobby messages
	// outgoing
	// GET_ROOMS: "rooms", // request room list
	// CREATE_ROOM: "create", // player requests to create a new room
	JOIN_ROOM: "room", // player requests to join a room in room list
	// incoming
	ENTER_ROOM: "room", // server tells player he is clear to enter the requested room
	

	// Waiting Room messages
	// incoming
	UPDATE: "update", // update status of the room
	// outgoing
	START: "start", // player requests game to start
	SEAT: "seat", // player seats/unseats from color, data is { color: Player.Colour } Player.Colour.NONE to unseat

	// Game messages
	WIN: "win",	  // game ends with a winner
	TIME: "time", // time sync
	MOVE: "move", // player changes direction 
	BOMB: "bomb", // player plants a bomb
	FIREBALL: "fireball", // player shoots fireball
	DEATH: "death", // player kicks a bomb
	POWERUP: "powerup", // powerup drops in the map
	LEAVE: "leave", // player leaves / disconnects
	SUDDEN_DEATH: "suddendeath" // activate sudden death mode
};

//// EXPORTS
module.exports = MessageDefinitions;