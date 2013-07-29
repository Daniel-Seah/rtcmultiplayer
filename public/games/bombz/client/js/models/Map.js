//// IMPORTS
//var Bomb = require( './Bomb' );
//var Powerup = require( './Powerup' );


function HostMap( width, height, grid_width, grid_height )
{
//// PRIVATE VARIABLES
  this._tiles = [];                   // Map.Tile[] - array of tiles
  this._width = width;                // int - number of grids horizontally
  this._height = height;              // int - number of grids vertically
  this._grid_width = grid_width;      // int - size of grids horizontally
  this._grid_height = grid_height;    // int - size of grids vertically

  this._cells = [];                   // 
  this._bombs = [];                   // Bomb[] - list of bombs currently on map
  this._powerups = [];                // Powerup[] - list of powerups currently on map
}


//// CONSTANTS
HostMap.WIDTH = 760;
HostMap.HEIGHT = 600;

HostMap.Tile =
{
  EMPTY: 0,
  DESTRUCTIBLE: 1,
  INDESTRUCTIBLE: 2,
};

HostMap.DIRECTIONS = [{ x: -1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }];
HostMap.SPAWN_POSITIONS = [ { x: 0, y: 0 }, { x: 14, y: 0 }, { x: 0, y: 10 }, { x: 14, y: 10 } ];

HostMap.Default =
{
  POWERUPS: [
    Powerup.Type.BUFF_SPEED, Powerup.Type.BUFF_SPEED,// Powerup.Type.BUFF_SPEED,
    Powerup.Type.BUFF_RANGE, Powerup.Type.BUFF_RANGE,// Powerup.Type.BUFF_RANGE,
    Powerup.Type.BUFF_CAPACITY, Powerup.Type.BUFF_CAPACITY,// Powerup.Type.BUFF_CAPACITY,
  ],
};

//// PUBLIC FUNCTIONS
// converts pixel co-ordinate to grid co-ordinate
HostMap.prototype.ConvertPointToGrid = function( x, y )
{
  return {
    x: parseInt( x / this._grid_width ),
    y: parseInt( y / this._grid_height ),
  };
}

HostMap.prototype.GetTile = function( x, y )
{
  return this._tiles[ ( this._width * y ) + x ];
}

HostMap.prototype.SetTile = function( x, y, type )
{
  this._tiles[ ( this._width * y ) + x ] = type;
}

HostMap.prototype.GetPowerup = function( x, y )
{
  for ( var i in this._powerups )
  {
    var powerup = this._powerups[ i ];
    if ( powerup.GetX() === x && powerup.GetY() === y )
      return powerup;
  }
  return undefined;
}

// add a bomb to the map
HostMap.prototype.AddBomb = function( bomb )
{
  var map = this;

  //var tile = GetTile( bomb.GetX(), bomb.GetY() );
  this._bombs.push( bomb );

  setTimeout( function()
  {
    map.HandleBomb( bomb );

  }, Bomb.DURATION );
}

HostMap.prototype.HandleBomb = function( bomb )
{

  this.BombExplode( bomb );
  this.RemoveBomb( bomb );
}

// removes a bomb from the map
HostMap.prototype.RemoveBomb = function( bomb )
{
  this._bombs.splice( this._bombs.indexOf( bomb ), 1 );
}

HostMap.prototype.GetPowerupCount = function()
{
  return this._powerups.length;
}

HostMap.prototype.GetFireballPowerupCount = function()
{
  var count = 0;

  for ( var i in this._powerups )
    if ( this._powerups[ i ].GetType() === Powerup.Type.ABILITY_FIREBALL )
      count++;

  return count;
}

HostMap.prototype.GetNonFireballPowerupCount = function()
{
  var count = 0;
  
  for ( var i in this._powerups )
    if ( this._powerups[ i ].GetType() !== Powerup.Type.ABILITY_FIREBALL )
      count++;

  return count;
}

// add a powerup to the map if it is a valid grid for a powerup
HostMap.prototype.SpawnPowerup = function()
{
  var x;
  var y;
  var reroll;
  do 
  {
    // roll unique position
    var pos = Math.floor( Math.random() * 116 );
    x = pos % 13 + 1;
    y = parseInt( pos / 13 ) + 1;
    reroll = false;

    for ( var i in this._powerups )
    {
      var powerup = this._powerups[ i ];
      if ( powerup.GetX() === x && powerup.GetY() === y )
      {
        reroll = true;
        break;
      }
    }
  }
  while ( reroll === true || ( ( x % 2 !== 0 ) && ( y % 2 !== 0 ) ) )

  var powerup = new Powerup( Math.floor( Math.random() * 3 ), x, y )
  this._powerups.push( powerup );
  return powerup;
}

HostMap.prototype.SpawnFireballPowerup = function()
{
  var x;
  var y;
  var reroll;
  do 
  {
    reroll = false;

    // roll unique position
    // 
    switch ( Math.floor( Math.random() * 4 ) )
    {
      case 0: // UP
        x = Math.floor( Math.random() * this._width );
        y = 0;
        break;

      case 1: // LEFT
        x = 0;
        y = Math.floor( Math.random() * this._height );
        break;

      case 2: // DOWN
        x = Math.floor( Math.random() * this._width );
        y = this._height - 1;
        break;

      case 3: // RIGHT
        x = this._width - 1;
        y = Math.floor( Math.random() * this._height );
        break;
    }    

    if ( this.GetPowerup( x, y ) !== undefined )
      reroll = true;
  }
  while ( reroll === true );

  var powerup = new Powerup( Powerup.Type.ABILITY_FIREBALL, x, y )
  this._powerups.push( powerup );
  return powerup;
}


// add a powerup to the map if it is a valid grid for a powerup
HostMap.prototype.AddPowerup = function( powerup )
{
  var tile = GetTile( powerup.GetX(), powerup.GetY() );
}

// removes a powerup from the map if it is a valid grid for a powerup
HostMap.prototype.RemovePowerup = function( powerup )
{
  this._powerups.splice( this._powerups.indexOf( powerup ), 1 );
}

// update map according to a bomb explosion if it is a valid grid for a powerup
HostMap.prototype.BombExplode = function( bomb )
{
  var bomb_owner = bomb.GetOwner();

  // directions left, down, right, up
  var affected = [];

  // need to deal with bomb box?

  // for each direction, expand outwards and evaluate
  for ( var index in HostMap.DIRECTIONS )
  {
    var x = bomb.GetX();
    var y = bomb.GetY();
    var range = bomb.GetRange();
    var direction = HostMap.DIRECTIONS[ index ];

    for ( var r = 1; r < range; r++ )
    {
      x += direction.x;
      y += direction.y;

      if ( x < 0 || x >= this._width || y < 0 || y >= this._height )
        break;

      var tile = this.GetTile( x, y );

      if ( tile == HostMap.Tile.EMPTY )
      {
        // check if explosion hits any powerups
        for ( var i in this._powerups )
        {
          var powerup = this._powerups[ i ];
          if ( ( powerup.GetX() + 2 ) === x && ( powerup.GetY() + 2 ) === y )
          {
            console.log("powerup");
            this.RemovePowerup( powerup );
            break;
          }
        }
        console.log("nothing");
      }
      else if ( tile == HostMap.Tile.DESTRUCTIBLE )
      {
        console.log("block/stop");
        this.SetTile( x, y, HostMap.Tile.EMPTY );
        break;
      }
      else if ( tile == HostMap.Tile.INDESTRUCTIBLE )
      {
        console.log("hard/stop")
        // stop exploding in this direction
        break;
      }
    }
  }

  return affected;
}


HostMap.prototype.Generate = function()
{ 
  this._tiles = [];
  
  for ( var y = 0; y < this._height; y++ )
  {
    for ( var x = 0; x < this._width; x++ )
    {
      // outermost border for dodge ballers
      if ( x % ( this._width - 1 ) === 0 || y % ( this._height - 1 ) === 0 )
      {
        this._tiles.push( HostMap.Tile.EMPTY );
      }
      // surrounding wall to separate dodge ballers
      else if ( x === 1 || x === ( this._width - 2 ) || y === 1 || y === ( this._height - 2 ) )
      {
        this._tiles.push( HostMap.Tile.INDESTRUCTIBLE );
      }
      // indestructible blocks in every other tile
      else if ( ( x % 2 !== 0 ) && ( y % 2 !== 0 ) )
      {
        this._tiles.push( HostMap.Tile.INDESTRUCTIBLE );
      }
      // everything else is floor with chance of spawning destructable tile
      else
      {
        this._tiles.push( ( Math.random() < 0.9 ) ? HostMap.Tile.DESTRUCTIBLE : HostMap.Tile.EMPTY );
      }
    }
  }

  // remove blocks that are near spawn positions
  for ( var i in HostMap.SPAWN_POSITIONS )
  {
    var spawn = HostMap.SPAWN_POSITIONS[ i ];
    spawnX = spawn.x + 2;
    spawnY = spawn.y + 2;
    this.SetTile( spawnX, spawnY, HostMap.Tile.EMPTY );

    for ( var d in HostMap.DIRECTIONS )
    {
      var direction = HostMap.DIRECTIONS[ d ];
      var x = spawnX + direction.x;
      var y = spawnY + direction.y;

      if ( this.GetTile( x, y ) === HostMap.Tile.DESTRUCTIBLE )
        this.SetTile( x, y, HostMap.Tile.EMPTY );
    }
  }

  // spawn powerups
  var powerup_positions = [];
  var powerups = HostMap.Default.POWERUPS.slice();
  
  for ( var i = 0; i < powerups.length; i++ )
  {
    var pos, x, y;
    do 
    {
      // roll unique position
      pos = Math.floor( Math.random() * 116 );
      x = pos % 13 + 1;
      y = parseInt( pos / 13 ) + 1;
      
    } while ( powerup_positions.indexOf( pos ) > 0 || ( ( x % 2 !== 0 ) && ( y % 2 !== 0 ) ) )
    
    powerup_positions.push( pos );

    this._powerups.push( new Powerup( powerups[ i ], x, y ) );
  }
};

HostMap.prototype.RandomDodgeballSpawnPosition = function()
{
  var position = {};
  if ( Math.random() > 0.5 )
  {
    position.x = ( Math.random() > 0.5 ) ? 0 : this._width - 1; // left or right
    position.y = Math.floor( Math.random() * ( this._height - 1 ) ); 
  }
  else
  {
    position.x = Math.floor( Math.random() * ( this._width - 1 ) );
    position.y = ( Math.random() > 0.5 ) ? 0 : this._height - 1; // top or bottom
  }
  return position;
}

// representation
// used when map is just generated at start of game
// non-visible power ups (within blocks) are not included here otherwide players can cheat
HostMap.prototype.Serialize = function()
{
  var powerups = [];
  for ( var i in this._powerups )
    powerups.push( this._powerups[ i ].Serialize() );

  return {
    name: 'map1',
    tiles: this._tiles,
    width: this._width,
    height: this._height,
    powerups: powerups,
  };
}

//// EXPORTS
//module.exports = HostMap;