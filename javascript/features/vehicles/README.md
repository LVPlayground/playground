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
  * **/lock**: Locks the vehicle you're currently driving in.
  * **/unlock**: Unlocks the vehicle you're currently driving in.

Furthermore, administrators are able to use the following commands:

  * **/v density**: Displays the density of vehicles within streaming radius around you.
  * **/v [player]? delete**: Deletes either your own vehicle, or that of `player`.
  * **/v [player]? health [0-1000]?**: Displays or updates the health of either your own vehicle, or
  that of `player`.
  * **/v [player]? respawn**: Respawns either your own vehicle, or that of `player`.
  * **/v [player]? save**: Saves either your own vehicle, or that of `player`, in the database.

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


## TODO
- Implement `/v`
- Implement `/fixvehicles`
