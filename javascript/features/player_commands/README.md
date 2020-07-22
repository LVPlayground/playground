# Player Commands Feature
Players have a lot of different commands to their disposal. For example they can choose what color
they have, whether people can teleport to them or what spawn weapons they have. Administrators can
use the same commands for the players to change those options for a player where needed.

This feature implements the commands a player can use on themselves and if the functionality for 
administrators overrides is required implement those too.

## Registering new commands.
Every single player command has it's own file. Those are found the the `commands` folder.
Every command should have it's own file and test and extend `player_command.js`. Every file 
with the `.js` (`.test.js` excluded) will be loaded dynamically if found in the `commands` folder.

## Supported commands
Supported `/p` commands:

  * `/p [player] armor [0-100]`: Sets the armour of a particular player to the given value.
  * `/p [player] color [#rrggbb]?`: Changes the custom colour of the given player.
  * `/p [player] freeze`: Freezes the given _player_, making them unable to move.
  * `/p [player] health [0-100]`: Sets the health of a particular player to the given value.
  * `/p [player] hide [on/off]`: Changes visibility of the map markers of the given player.
  * `/p [player] spawnweapons [weapon] [multiplier=1]`: Purchases a spawn weapon for a given player.

Supported `/my` commands:

  * `/my armor [0-100]`: Enables administrators to change their own armour value.
  * `/my color [#rrggbb]?`: Changes your custom colour, with the colour picker if needed.
  * `/my freeze`: Freezes yourself, making you unable to move.
  * `/my health [0-100]`: Enables administrators to change their own health.
  * `/my hide [on/off]`: Changes the visibility of your map marker.
  * `/my spawnweapons [weapon] [multiplier=1]`: Purchases a spawn weapon for yourself.

## TODO:
There's still a big amount of player commands in the Pawn code. We call them by PawnInvoking the
`OnPlayerCommandText` if the specific command is not registered in JavaScript. Those commands should
move towards the JS code base.
