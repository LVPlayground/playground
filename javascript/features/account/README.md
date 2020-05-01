# Account Management
Account management has always been a manual operation for administrators on Las Venturas Playground,
but with the introduction of our JavaScript code-base it's been easier to introduce new
functionality and reconsider old choices.

This feature provides the ability for players to log in to their account, manage their settings,
name, player data and other related topics. It exposes this functionality to both players on SA-MP,
as well as to administrators on IRC.

## In-game commands
The following in-game commands are provided by this feature.

  * `/account`: enables players to manage and change settings about their own account.
  * `/account [player]`: enables administrators to manage player accounts.

Functionality has been implemented that enables players to change their own nickname and password,
and to view their player record and recent playing sessions. VIPs further have the ability to
manage the aliases associated with their account.

Not all functionality may be seen in-game, as the `/lvp settings` command can be used by
Management members to change this at their own discretion.

## Nuwani commands
The following Nuwani commands are implemented in this feature. Their documentation has been
centralized [in the `nuwani_commands` feature](../nuwani_commands/).

  * `!addalias [nickname] [alias]`: adds the given alias as one that can be used by the player.
  * `!aliases [nickname]`: lists the aliases associated with the given player.
  * `!changename [nickname] [newNickname]`: changes the nickname of the given player.
  * `!changepass [nickname]`: changes the password of the given player to a temporary one.
  * `!getvalue [nickname] [field]`: displays a particular field in the player's account.
  * `!history [nickname]`: displays the nickname history of the given player.
  * `!players`: displays an overview of all players currently in-game.
  * `!players [nickname]`: displays a summary about the given player's statistics.
  * `!removealias [nickname] [alias]`: removes the given alias from the player.
  * `!setvalue [nickname] [field] [value]`: updates a particular field in the player's account.
  * `!supported`: displays a list of the supported fields for altering player data.
