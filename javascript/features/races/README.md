# Races
Races have always been among the most popular features on Las Venturas Playground. We've got dozens,
each on its own unique track with different vehicles and checkpoints. This is the fourth version
of the Race system available on the server.

At core, the feature extends the [Games Vehicles API](../games_vehicles/) with a countdown prior to
starting, checkpoints and various victory conditions that enable players to participate in a race.
Player high scores, including break times at individual checkpoints, will be stored in the database
to enable players to race not just against others, but also against themselves.

## Structure of races
All races are specified as JSON files in the [//data/races/](../../../data/races) directory. They
follow the syntax for [structured game descriptions][1], extended through various options that are
specific to races.

The available configuration is:
  * [Checkpoint configuration](https://github.com/LVPlayground/playground/tree/master/javascript/components/games#game-checkpoints-kgamecheckpoints)
  * [Environment configuration](https://github.com/LVPlayground/playground/tree/master/javascript/components/games#game-environment-kgameenvironment)
  * [Custom object configuration](https://github.com/LVPlayground/playground/tree/master/javascript/components/games#game-objects-kgameobjects)
  * [Pickup configuration](https://github.com/LVPlayground/playground/tree/master/javascript/components/games#game-pickups-kgamepickups)
  * [Spawn position configuration](https://github.com/LVPlayground/playground/tree/master/javascript/components/games#game-spawn-positions-kgamespawnpositions)

On top of that, the following `settings` are available for individual games:

Property               | Default  | Description
-----------------------|----------|-------------
`allowLeaveVehicle`    | `false`  | Whether the player is allowed to leave their vehicle during the race.
`disableVehicleDamage` | `false`  | Whether vehicles should continuously be repaired to avoid destruction.
`laps`                 | `1`      | The number of laps players are expected to complete before winning.
`nos`                  | `0`      | Whether to apply nitrous injection to the vehicles. One of `[0, 1, 5, 10]`.
`timeLimit`            | `600`    | The maximum time players can spend trying to complete the race, in seconds.
`unlimitedNos`         | `false`  | Whether to apply infinite nitrous injection to the vehicles.

[1]: https://github.com/LVPlayground/playground/tree/master/javascript/components/games#structuredgamedescription
