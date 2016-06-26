# Feature: Friends
Players have the ability to maintain a list of their friends on Las Venturas Playground. Adding
another player as a friend does not require approval from them, in fact, they will likely never
find out unless you decide to tell them.

## Commands
The following commands are available as part of the feature:

  - **/friends add [player]**: Adds the `player` to your list of friends. They must be online.
  - **/friends remove [player]**: Removes the `player` from your list of friends. They don't have
    to be online for you to use this command.
  - **/friends**: Lists the friends you have on Las Venturas Playground.

## Features
The following features are enabled for those maintaining a list of friends:

  - **Connection beep**: A sound will be played when they connect to the server.

## FAQ: I'm an admin, can I see somebody's friends?
Yes, you can. Simple append the player whose friends you want to see to the `/friends` command:

```
/friends [player]
```
