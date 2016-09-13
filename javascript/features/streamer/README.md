# Streamers

## Global EntityStreamer
Some entities, such as vehicles and pickups, can't be created on a per-player basis by SA-MP, and
instead exist for all players connected to the server. These also often have a high processing cost
on the server, which attempts to do its own streaming radius-based streaming.

We [implement an algorithm](entity_streamer_global.js) that is a lot smarter than this. The entities
are stored in a 3D space in an [R* tree](https://en.wikipedia.org/wiki/R*_tree) to enable very fast
and accurate [kNN searches](https://en.wikipedia.org/wiki/K-nearest_neighbors_algorithm).

A _streaming cycle_ starts by finding the `N` closest entities to a player and comparing them with
the entities previously closed to the player to determine the entities that went either in or out
of range. These entities then have their _reference count_ adjusted accordingly.

When an entity's _reference count_ increases from zero to one, it means that it's in range for at
least one player and hasn't been created on the server yet. This is when we create the entity.

When an entity's _reference count_ decreases to zero, it means that the entity no longer is in range
for any player. This is where the entity can be deleted.

However, creating and deleting entities eagerly causes a lot of churn on the server, and potentially
a lot of traffic to players that could otherwise be avoided. Because of this, we use [LRU caching]
(https://en.wikipedia.org/wiki/Cache_algorithms#LRU) together with an _entity saturation ratio_ to
cache unreferenced entities. This cache is prioritized by the total number of references an entity
has ever received: this will favor less churn in more populated areas.

In the future, a half time will be applied to the total number of references received by entities to
reduce bias in area population, which may become an issue when the server has been running for a
very long time.
