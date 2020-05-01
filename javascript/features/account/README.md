# Account Management
Account management has always been a manual operation for administrators on Las Venturas Playground,
but with the introduction of our JavaScript code-base it's been easier to introduce new
functionality and reconsider old choices.

This feature provides the ability for players to log in to their account, manage their settings,
name, player data and other related topics. It exposes this functionality to both players on SA-MP,
as well as to administrators on IRC.

## In-game commands
_None yet._

## Nuwani commands
The following Nuwani commands are implemented in this feature. Their documentation has been
centralized [in the `nuwani_commands` feature](../nuwani_commands/).

  * `!addalias [nickname] [alias]`: adds the given alias as one that can be used by the player.
  * `!aliases [nickname]`: lists the aliases associated with the given player.
  * `!changename [nickname] [newNickname]`: changes the nickname of the given player.
  * `!changepass [nickname]`: changes the password of the given player to a temporary one.
  * `!history [nickname]`: displays the nickname history of the given player.
  * `!removealias [nickname] [alias]`: removes the given alias from the player.
