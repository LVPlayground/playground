# Feature: Location
This feature encapsulates functionality that's related to a player's position in San Andreas. For
example, it provides the interior entrances and exits, commands enabling players to teleport to
one another and informational commands such as `/locate`.

## Interior Markers
There are hundreds of interior markers spread out throughout San Andreas that enable you to enter or
exit a particular interior, for example Ammunation or a 7/11. The default markers have a few
important downsides to them:

  - Players can enter an interior as a way to avoid death.
  - Players entering certain interiors, for example most Ammunations, will end up in exactly the
    same location, enabling other players to fight them indoors.
  - The location of certain markers is not ideal for a housing system.

In order to provide the best possible experience, we've therefore implemented our own interior
marker system. The initial set of locations was based on Talidan's excellent [interiors resource]
(https://community.multitheftauto.com/index.php?p=resources&s=details&id=436) made for MTA.
