# Feature: Location
This feature encapsulates functionality that's related to a player's position in San Andreas. For
example, it provides the interior entrances and exits, commands enabling players to teleport to
one another and informational commands such as `/locate`.

## Interior Portals
There are hundreds of interior portals spread out throughout San Andreas that enable you to enter or
exit a particular interior, for example Ammunation or a 7/11. The default portals have a few
important downsides to them:

  - Players can enter an interior as a way to avoid death.
  - Players entering certain interiors, for example most Ammunations, will end up in exactly the
    same location, enabling other players to fight them indoors.
  - The location of certain portals is not ideal for a housing system.

In order to provide the best possible experience, we've therefore implemented our own interior
marker system. The teleportation portals [are all defined in a convenient JSON format]
(https://github.com/LVPlayground/playground/tree/master/data/portals) and can be reloaded without
having to restart the server.

Various interiors will continue to share a virtual world for gameplay reasons. See the
[Virtual World Registry](../../../VIRTUAL_WORLDS.md) for an overview.
