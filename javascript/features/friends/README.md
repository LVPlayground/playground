# Feature: Friends
Players have the ability to maintain a list of their friends on Las Venturas Playground. These
indicate one-directional relations, as there are no approval processes or notifications.

Adding a player to your friend list enables a number of things:

  * You will hear a notification sound when they connect to Las Venturas Playground.

## Command: /friends
The `/friends` command is available for all registered players on Las Venturas Playground. It can be
used to list, add and remove friends. Administrators can also list friends of other players.

When not passing any arguments, a list of friends will be displayed ordered by the time they last
connected to the server.

### /friends add [player]
Adds `player` as a friend, who must be connected to the server. This will persist between playing
sessions.

### /friends remove [name]
Removes `name` as a friend. This only has to be part of their name (as long as it's unambiguous) and
they do not have to be connected to the server.

### /friends [player]
Lists the friends of `player`. This command is only available to administrators.
