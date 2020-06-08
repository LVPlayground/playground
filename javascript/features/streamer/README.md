# Vehicle Streamer
San Andreas: Multiplayer is limited to 2,000 vehicles, whereas we'd like to offer an experience on
Las Venturas Playground where it feels lik there are vehicles _everywhere_. To that end, we have
implemented a vehicle streamer to support an arbitrary number of vehicles.

Part of the logic has been implemented as part of the
[Streamer module](/LVPlayground/playgroundjs-plugin/blob/master/src/playground/bindings/modules/streamer_module.h)
in PlaygroundJS, which employs an [R-tree](https://en.wikipedia.org/wiki/R-tree) running on a
background thread to represent all the vehicles, using the
[k-nearest neighbors](https://en.wikipedia.org/wiki/K-nearest_neighbors_algorithm) algorithm to
identify the vehicles closest to each player. We then, iteratively, determine a balanced set of
vehicles which should exist on the server, to make sure each player has their fair share available.

## Concepts

### Ephemeral and persistent vehicles
Vehicles that have no `respawnDelay` set will be considered _ephemeral vehicles_. They will be
deleted from the server three minutes after their most recent use. Vehicles that are given a
`respawnDelay` are considered _persistent vehicles_. They will respawn after the configured delay
following most recent use, and be reverted back to their initial configuration.
