# Player Commands Feature
Players have a lot of different commands to their disposal. For example they can choose what color
they have, whether people can teleport to them or what spawn weapons they have.
Administrators can use the same commands for the players to change those options for a player 
where needed.

This feature implements the commands a player can use on himself and if the functionality for 
administrators overrides is required implement those too.

## Registering new commands.
Every single player command has it's own file. Those are found the the `commands` folder.
Every command should have it's own file and test and extend `player_command.js`. Every file 
with the `.js` (`.test.js` excluded) will be loaded dynamically if found in the `commands` folder.

## TODO:
There's still a big amount of player commands in the PAWN code. We call them by PawnInvoking the
`OnPlayerCommandText` if the specific command is not registered in JavaScript. Those commands should
move towards the JS code base.