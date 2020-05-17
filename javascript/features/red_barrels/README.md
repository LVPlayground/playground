# Red Barrels
Red Barrels have appeared all around San Andreas, and we need _your_ help in removing them to
avoid any incidents. This is a minigame where players have to find all the explosive barrels
scattered throughout the world, and shoot them once to get rid of them.

As of right now, we have placed 100 red barrels on the Las Venturas islands. In the future we plan
to place another 100 in the San Fierro region, and 100 more in the Los Santos region, with different
colours of barrels to distinguish them as separate games.

This game was originally proposed by [Jay](https://forum.sa-mp.nl/user-180.html).

## Implementation
A player object will be created for each of the barrels that the player has not yet shot. We listen
for shots on these objects using the `OnPlayerShootDynamicObject` callback, and, when received,
it will be marked as _found_, and stored as such in the database.

_TODO: Detail how players will be able to collect all the barrels again._

_TODO: Detail how this ties in to achievements._

_TODO: Detail how we're going to change the colour of the barrels._
