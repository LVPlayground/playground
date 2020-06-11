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

### Vehicle cache
Imagine that there are 25 players in-game, each of which are evenly spread out over the map. Given
our default limit of 1,000 vehicles, this means fourty unique vehicles can be created for each of
them. Given a streaming radius of 300 units, this means that we can create 17,160 vehicles on the
server without any being in range for multiple players.

In practice, this will never happen: players are near each other, whether it be fighting in Las
Venturas, or driving around in a cruise. This means that _less_ than 1,000 vehicles are required.
Creating a vehicle from scratch is expensive, however, which is why we _cache_ them.

Instead of deleting a vehicle straight away when it's out of range, it will be added to the vehicle
cache. When it becomes in-range again, it'll be re-activated from the cache, rather than be created
from scratch. When there are too many vehicles instead, the least recently used vehicle will be
deleted from the cache.

