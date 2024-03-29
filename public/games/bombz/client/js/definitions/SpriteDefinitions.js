/*
 * SpriteDefinitions.js
 * @author: Leon Ho
 * @author: Natalie
 * define as such
 * 'spritename': {
 * 		'file': 'filename',
 * 		'tile': tileWidth,
 * 		'tileh': tileHeight // if undefined, 'tile' tileWidth will be used for tileHeight i.e. tile width and height is equal
 * 		'elements': {
 * 			element1: [0, 0],
 * 		}
 * 	}
 * 
 * NOTE: currently just use fixed 'tile'x'tile' sprite sheets
 */

var SpriteDefinitions = {
	
	TILE_WIDTH: 40,
	TILE_HEIGHT: 40,

	BUTTON_WIDTH: 80,
	BUTTON_HEIGHT: 80,

	CONTROLS_WIDTH: 150,
	CONTROLS_HEIGHT: 150,
	
	BLUE: 0,
	GREEN: 1,
	RED: 2,
	PINK: 3,
	BURNT: 4,

	DRAGONS: ['bluedragon', 'greendragon', 'reddragon', 'pinkdragon', 'burntdragon'],
	BUTTONS: ['bluebutton', 'greenbutton', 'redbutton', 'pinkbutton'],
	//COLORS: ['blue', 'green', 'red', 'pink'], // follows order on the spritesheet
	COLORS: [0, 1, 2, 3], // follows order on the spritesheet

	PLAYERS: [0, 1, 2, 3],
	
	MAP_1: 'map1',
	
	GUI: 'gui',
};

for (var i = 0; i < SpriteDefinitions.COLORS.length; i++)
{
	var color = SpriteDefinitions.COLORS[i];
	SpriteDefinitions[color] = {
		'file': 'img/sprite40x40.png',
		'tile': SpriteDefinitions.TILE_WIDTH,
		'elements':(function() {
			var elements = {};
			elements[color + 'dragon'] = [5, i];
			elements[color + 'egg'] = [10, i];
			elements[color + 'icon'] = [i +1 , 9]
			return elements;
		})(),
		'anim_walk_up':[[0, i], [1, i]],
		'anim_walk_right':[[2, i], [3, i], [4, i]],
		'anim_walk_down':[[5, i], [6, i]],
		'anim_walk_left':[[9, i], [8, i], [7, i]],
		
		'anim_wing_up':[[0, 7], [1, 7]],
		'anim_wing_right':[[2, 7], [3, 7], [4, 7]],
		'anim_wing_down':[[5, 7], [6, 7]],
		'anim_wing_left':[[9, 7], [8, 7], [7, 7]],
	};
}

SpriteDefinitions['effects'] = {
	'file': 'img/sprite40x40.png',
	'tile': SpriteDefinitions.TILE_WIDTH,
	'elements': {
		fire: [2, 8],
		wings: [5, 7],
		cloud: [1, 8],
	},
	'anim_fire':[[6,5], [7,5], [8,5], [9,5], [10,5], [11,5]],
	'anim_fireball':[[2,8], [3,8], [4,8], [3,8], [2,8]],
};

SpriteDefinitions['map1'] = {
	'file': 'img/sprite40x40.png',
	'tile': SpriteDefinitions.TILE_WIDTH,
	'elements': {
		floor: [0, 5],
		tileD: [1, 5],
		tileI: [2, 5],
		tileB: [3, 5],
		tileDB: [0, 8],
	},
	'anim_tile_burn':[[3,5], [4,5], [5,5]],
};

SpriteDefinitions['gui'] = {
	'file': 'img/gamecontrols150x150.png',
	'tile': SpriteDefinitions.CONTROLS_WIDTH,
	'elements': {
		dpad_none: [0, 0],
		dpad_up: [1, 0],
		dpad_down: [2, 0],
		dpad_left: [3, 0],
		dpad_right: [4, 0],
		eggButton: [5, 0],
		eggButton_down: [6, 0],
		fireballButton_none: [7, 0],
		fireballButton: [8, 0],
		fireballButton_down: [9, 0],
	}
};


SpriteDefinitions['sidebar'] = {
	'file': 'img/sidebar.png',
	'tile': 132,
	'tileh': 600,
	'elements': {
		sidebar: [0, 0],
	}
};

SpriteDefinitions['victory'] = {
	'file': 'img/victory300x100.png',
	'tile': 300,
	'tileh': 100,
	'elements': {
		victory1: [0, 0],
	},
	'anim_blink': [[0,0], [1,0]],
};

for (var i = 0; i < SpriteDefinitions.COLORS.length; i++)
{
	var color = SpriteDefinitions.COLORS[i];
	SpriteDefinitions['button'+color] = {
		'file': 'img/button80x80.png',
		'tile': SpriteDefinitions.BUTTON_WIDTH,
		'elements':(function() {
			var elements = {};
			elements[color + 'button'] = [18, i];
			return elements;
		}) (), //35
		'anim_spin':[[18, i], [19, i],[20, i], [21, i], [22,i], [23,i], [24,i], [25,i], [26,i], [27,i], [28,i], [29,i], [30,i], [31,i], [32,i], [33,i], [34,i], [35,i], [0,i], [1,i], [2,i], [3,i], [4,i], [5,i], [6,i], [7,i], [8,i], [9,i], [10,i], [11,i], [12,i], [13,i], [14,i], [15,i], [16,i], [17,i]], //and many more
	};
}

for (var i = 0; i < SpriteDefinitions.PLAYERS.length; i++)
{
	var player = SpriteDefinitions.PLAYERS[i];
	SpriteDefinitions['player'+i] = {
		'file': 'img/playernumber80x40.png',
		'tile': SpriteDefinitions.BUTTON_WIDTH,
		'tileh': SpriteDefinitions.BUTTON_HEIGHT/2,
		'elements': (function(){
			var elements = {};
			elements['p'+i] = [i, 0];
			return elements;
		})(),
	};
}

SpriteDefinitions['powerup'] = {
	'file': 'img/sprite40x40.png',
	'tile': SpriteDefinitions.TILE_WIDTH,
	'elements': {
		kick: [0,6],
		blast: [1,6],
		egg_limit: [2,6],
		speed: [3,6],
		fireball: [4,6],
	}
};
