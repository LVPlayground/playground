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

Furthermore, administrators are able to use the following commands:

  * **/v [player]? respawn**: Respawns either your own vehicle, or that of `player`.


## Limits
The [Vehicle Streamer](../streamer/vehicle_streamer.js) is used to remove limits on the number of
vehicles that may be created. Keep the number of vehicles in a close range to each other in order,
but don't worry about the total amount of vehicles spread over San Andreas.


## TODO
- Implement `/v`
- Implement `/lock` and `/unlock`
- Implement `/fixvehicles`
