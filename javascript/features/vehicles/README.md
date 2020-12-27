# Feature: Vehicles
The vehicles feature is responsible for managing the vehicles on Las Venturas Playground. For
administrators this means their ability to create, modify and remove vehicles, for players this
means making sure that there always are vehicles available around them.

## Commands
This feature provides a number of commands related with vehicles. Access to these commands is
regulated by the `/lvp access` command provided by the [playground](../playground) feature.

  * **/v**: Displays a dialog with available vehicles when not driving one, otherwise displays
    usage information for this command.
  * **/v [vehicle]**: Creates the `vehicle` and teleports the player to its driver seat.
  * **/v help**: Displays useful information about the `/v` command.
  * **/lock**: Locks the vehicle you're currently driving in.
  * **/unlock**: Unlocks the vehicle you're currently driving in.

Players having collected all spray tags are able to use the following commands:

  * **/ele**: Spawns an Elegy.
  * **/inf**: Spawns an Infernus.
  * **/nrg**: Spawns a NRG-500.
  * **/sul**: Spawns a Sultan.
  * **/tur**: Spawns a Turismo.
  * **/vor**: Spawns a Vortex.

Furthermore, administrators are able to use the following commands:

  * **/v density**: Displays the density of vehicles within streaming radius around you.
  * **/v enter [seat?]**: Enters the vehicle closest to you, optionally in `seat` (0-8).
  * **/v reset**: Resets the server to its original vehicle layout.
  * **/v [player]? access [players/vips/administrators/management]?**: Restricts the vehicle to a
    particular `level`.
  * **/v [player]? color [0-255]? [0-255]?**: Displays or updates the colors of either your own vehicle, or
    that of `player`.
  * **/v [player]? delete**: Deletes either your own vehicle, or that of `player`.
  * **/v [player]? health [0-1000]?**: Displays or updates the health of either your own vehicle, or
    that of `player`.
  * **/v [player]? respawn**: Respawns either your own vehicle, or that of `player`.
  * **/v [player]? save**: Saves the vehicle that you're currently driving in the database.

_Note that temporary administrators are not allowed to use either `/v save` or `/v delete`._

Finally, Management is able to use the following commands:

  * **/v optimise**: Optimises the vehicle streamer. Should be used sparsely.
  * **/v [player]? pin**: Prevents the vehicle from being deleted by the streamer.
  * **/v [player]? unpin**: Puts the vehicle's lifetime under control of the streamer again.


## Limits
The [Vehicle Streamer](../streamer/vehicle_streamer.js) is used to remove limits on the number of
vehicles that may be created. Keep the number of vehicles in a close range to each other in order,
but don't worry about the total amount of vehicles spread over San Andreas.


## FAQ: Why limit /lock and /unlock to registered players?
In order to minimise duplication of code, the ephemeral locks (such as `/lock`) and permanent locks
are both based on the ID of a registered player. We encourage players to register on [sa-mp.nl]
(https://sa-mp.nl/) to maximise their in-game experience.


## FAQ: Why did we remove `/v create`?
Because the word `create` adds little value. Get used to the new command! :-)
