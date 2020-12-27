# Derbies
Derbies are an exciting way to dispose of anger: repeatedly slam your vehicle in those driven by
other participants until they explode. The last participant standing will be declared victor.

At core, the feature extends the [Games Vehicles API](../games_vehicles/) with a countdown prior to
starting. At this time we're not storing any persistent information surrounding derbies.

## Structure of derbies
All derbies are specified as JSON files in the [//data/derbies/](../../../data/derbies) directory.
They follow the syntax for [structured game descriptions][1], extended through various options that
are specific to derbies.

The available configuration is:
  * [Checkpoint configuration](https://github.com/LVPlayground/playground/tree/master/javascript/components/games#game-checkpoints-kgamecheckpoints)
  * [Environment configuration](https://github.com/LVPlayground/playground/tree/master/javascript/components/games#game-environment-kgameenvironment)
  * [Custom object configuration](https://github.com/LVPlayground/playground/tree/master/javascript/components/games#game-objects-kgameobjects)
  * [Pickup configuration](https://github.com/LVPlayground/playground/tree/master/javascript/components/games#game-pickups-kgamepickups)
  * [Spawn position configuration](https://github.com/LVPlayground/playground/tree/master/javascript/components/games#game-spawn-positions-kgamespawnpositions)

On top of that, the following `settings` are available for individual games:

Property               | Default  | Description
-----------------------|----------|-------------
`invisible`            | `false`  | Whether participants can see each other on the minimap.
`lowerAltitudeLimit  ` | `-100`   | The lowest z-coordinate players can have before dropping out of the game.
`timeLimit`            | `600`    | The maximum time players can spend trying to win the derby, in seconds.

[1]: https://github.com/LVPlayground/playground/tree/master/javascript/components/games#structuredgamedescription
