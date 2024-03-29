/*
 * Entities.js
 * @author: Leon Ho
 * @coauther: Nat
 */

var Entities = {};

/*
 * @entity Map
 */
Entities.Map = function(map_name)
{
	var map = Crafty.e("2D");
	
	var def = SpriteDefinitions[map_name];
	
	Crafty.sprite(def['tile'], def['file'], def['elements']);
	
	return map;
};

Entities.DestructibleBlock = function()
{
	return Crafty.e(Properties.RENDERER + ", 2D, Destructible, Burnable, solid, tileD")
				 .bind('burn', function(){
				 	this.removeComponent('Burnable', false);
					this.destroy();
					Entities.BurningBlock().attr({ x: this.x, y: this.y, z: Map.Z_BURNING });
				 });
};

Entities.BurningBlock = function()
{
	var def = SpriteDefinitions['map1']; //hard coded
	Crafty.sprite(def['tile'], def['file'], def['elements']);
	return Crafty.e(Properties.RENDERER + ", 2D, SpriteAnimation, tileB")
				 .animate("tile_burn", def['anim_tile_burn'])
				 .attr({ played: false })
				 .bind('EnterFrame', function(data){
					if (!this.played)
					{
						this.played = true;
						this.stop().animate("tile_burn", 12, 0);
						this.timeout(function(){ this.destroy(); }, 500)
					}
				 });
};

Entities.SolidBlock = function()
{
	return Crafty.e(Properties.RENDERER + ", 2D, solid, tileDB");
};

Entities.DodgeBallBlock = function()
{
	return Crafty.e(Properties.RENDERER + ", 2D, floor");
};

Entities.FloorTile = function()
{
	return Crafty.e(Properties.RENDERER + ", 2D, floor");
};

Entities.Sidebar = function()
{
	var def = SpriteDefinitions['sidebar'];
	Crafty.sprite(def['tile'], def['tileh'], def['file'], def['elements']);
	return Crafty.e(Properties.RENDERER + ", 2D, solid, extents, sidebar");
};

Entities.SDBlock = function()
{
	var block = Crafty.e(Properties.RENDERER + ", 2D, solid, tileDB");
	block.moved = 0;
	block.addComponent("Collision")
		.bind("Move", function(){
			this.moved += 1;
	       	var hitDragon = this.hit('Dragon');
			if (hitDragon)
			{
				for (var i = 0; i < hitDragon.length; i++)
					hitDragon[i].obj.trigger('burn');
			}
			if (this.moved == 2)
				this.collision([-10, -10], [50, -10], [50, 50], [-10, 50]);
	    });;
	return block;
}

Entities.Extents = function()
{
	return Crafty.e(Properties.RENDERER + ", 2D, Color, solid, extents").attr({z: GUIDefinitions.Z_GUI });
}

/*
 * @entity Dragon
 * 
 */
Entities.Dragon = function(color)
{
	// load all sprites related to this colored dragon (includes animation cycles, egg, fireball)
	var def = SpriteDefinitions[color];
	Crafty.sprite(def['tile'], def['file'], def['elements']);
	
	// create dragon entity
	var dragon = Crafty.e(Properties.RENDERER + ", 2D, Burnable, Killable, Dragon, " + color + 'dragon')
						.setName(color + 'dragon')
						.bind('burn', function(){ 
							this.unbind('burn'); 
							this.removeComponent('Burnable', false); 
							this.die(); })
						.dragon(color);

	// add animation and collision logic
	dragon.addComponent("SpriteAnimation, Collision")
				.collision([10, 10], [30, 10], [30, 30], [10, 30]) // smaller hit box based on 40x40 sprites
				.animate("walk_up", def['anim_walk_up'])
				.animate("walk_right", def['anim_walk_right'])
				.animate("walk_down", def['anim_walk_down'])
				.animate("walk_left", def['anim_walk_left'])
				.bind("ChangeDirection", function (direction) {
                    switch ( direction )
                    {
                    	case Player.Direction.UP:
                    		if (!this.isPlaying("walk_up")) this.stop().animate("walk_up", 4, -1);
                    		break;
                    	case Player.Direction.DOWN:
                    		if (!this.isPlaying("walk_down")) this.stop().animate("walk_down", 4, -1);
                    		break;
                    	case Player.Direction.LEFT:
                    		if (!this.isPlaying("walk_left")) this.stop().animate("walk_left", 6, -1);
                    		break;
                    	case Player.Direction.RIGHT:
                    		if (!this.isPlaying("walk_right")) this.stop().animate("walk_right", 6, -1);
                    		break;
                    	case Player.Direction.NONE:
                    		this.stop();
                    		break;
                    }
                })
                .onHit('Egg', function(){ this.onEgg = true; }, function(){ this.onEgg = false; })
                
	return dragon;
};

/*
 * @entity Egg
 */
Entities.Egg = function(dragon, fuseTime)
{
	var time = fuseTime || EntityDefinitions.REMOTE_FUSETIME;
	var egg = Crafty.e(Properties.RENDERER + ", 2D, Burnable, Egg," + dragon.color + 'egg')
						.setName(color + 'egg')
						.bind('burn', function(){ this.trigger('explode'); })
						.egg(dragon.blastRadius, time);
	egg.addComponent('Collision').collision([-10, -10], [50, -10], [50, 50], [-10, 50]);
	egg.owner = dragon;
	return egg;
};

/*
 * @entity Powerup
 */
Entities.Powerup = function(type)
{
	var def = SpriteDefinitions['powerup'];
	Crafty.sprite(def['tile'], def['file'], def['elements']);

	var powerup = Crafty.e(Properties.RENDERER + ", 2D, Powerup, Destructible, Burnable, " + type)
							.powerup(type)
							.bind('burn', function(){
								this.destroy();
								Entities.BurningBlock().attr({ x: this.x, y: this.y, z: Map.Z_BURNING });
							});
	powerup.addComponent("Collision");
	return powerup;
}

/*
 * @entity Fireball
 */
Entities.Fireball = function()
{
	var def = SpriteDefinitions['effects'];
	var fireball = Crafty.e(Properties.RENDERER + ', 2D, Fireball, fire');
	fireball.addComponent("SpriteAnimation, Collision")
				.animate('fireball', def['anim_fireball']);
	fireball.z = Map.Z_FIRE;
	return fireball;
}

Entities.Wings = function()
{
	var def = SpriteDefinitions['effects'];
	Crafty.sprite(def['tile'], def['file'], def['elements']);
	
	var wings = Crafty.e(Properties.RENDERER + ', 2D, wings, Tween')
	wings.z = Map.Z_DRAGON - 1;
	return wings;
}

Entities.Cloud = function()
{
	var def = SpriteDefinitions['effects'];
	Crafty.sprite(def['tile'], def['file'], def['elements']);
	
	var cloud = Crafty.e(Properties.RENDERER + ', 2D, cloud, Tween');
	cloud.z = Map.Z_CLOUD;
	return cloud;
}
