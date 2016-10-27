# Feature: Playground
Las Venturas Playground is a server with a strong identity, and with that a series of features that
form an important part of this. These features can be separately enabled and disabled in order to
provide the best user-experience ingame.

## Control commands
The following control commands are available as part of this feature, enabling control over both the
server and the commands offered on the server.

  - **/lvp access**: Changes access rights for one of the commands in this feature.
  - **/lvp party [on/off]**: Toggles the Party Mode on or off. Only available to Management.
  - **/lvp profile [milliseconds]**: Enables Management to create a CPU profile of the gamemode.
  - **/lvp settings**: Enables Management to change various run-time settings on the server.

## Commands
The following commands are available as part of the feature:

  - **/autohello [player]**: Enables or disables automated welcomes to joining players.
  - **/boost [player] [factor]**: Boosts the `player`'s velocity by `factor`. Only available to
    management.
  - **/slow [player]**: Makes the `player` slow down. Only available to management.
  - **/fly**: Makes the player who executes the command fly. Only available to management.
  - **/fly [player]**: Makes the `player` fly. Only available to management.
  - **/jetpack**: Gives you a jetpack. Must have been enabled by an administrator.
  - **/jetpack [player]**: Gives the `player` a jetpack. Only available to administrators.
  - **/jetpack [player] remove**: Removes a jetpack from `player`. Only available to administrators.
  - **/slow [player] [factor]**: Continuously slows down `player` by the given `factor`. Only
    available to management.
  - **/spm [player] [message]**: Sends a private message to `player` that will not be logged. Only
    available to management.
