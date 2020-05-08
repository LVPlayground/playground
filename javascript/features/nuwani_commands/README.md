# Nuwani Commands
This feature provides a series of commands, both in-game and for people on IRC, to communicate
among themselves. This is in addition to the functionality provided internally in Nuwani.

If you're interested in _how_ to use Nuwani as an administrator, please see our
[Administrator Guide](ADMINISTRATORS.md) instead.

## Commands provided to Management members on IRC
  * `!changepass [nickname]`: changes the password of the given player to a temporary one.
  * `!getvalue [nickname] [field]`: displays a particular field in the player's account.
  * `!lvp reload`: low-level server feature management to live reload particular functionality.
  * `!setvalue [nickname] [field] [value]`: updates a particular field in the player's account.
  * `!supported`: displays a list of the supported fields for altering player data.

## Commands provided to administrators on IRC
  * `!addalias [nickname] [alias]`: adds the given alias as one that can be used by the player.
  * `!addnote [nickname] [note]`: adds the given note to a player's record.
  * `!admin [message]`: sends the given message to in-game administrators.
  * `!aliases [nickname]`: lists the aliases associated with the given player.
  * `!announce [message]`: displays a clear, visual announcement to all players.
  * `!ban [player] [days] [reason]`: bans an in-game player for a given reason.
  * `!ban ip [ip] [nickname] [days] [reason]`: bans a particular player by their IP address.
  * `!ban range [ip range] [nickname] [days] [reason]`: bans a player by their IP address range.
  * `!ban serial [serial] [nickname] [days] [reason]`: bans a player by their serial number.
  * `!changename [nickname] [newNickname]`: changes the nickname of the given player.
  * `!history [nickname]`: displays the nickname history of the given player.
  * `!isbanned [nickname | ip | ip range | serial]`: checks whether a particular ban exists.
  * `!kick [player] [reason]`: kicks an in-game player from the game for a given reason.
  * `!lastbans`: displays the most recent bans created on the server.
  * `!ipinfo [nickname | ip | ip range] [maxAge = 1095]`: displays IP info for the nickname.
  * `!removealias [nickname] [alias]`: removes the given alias from the player.
  * `!say [message]`: clearly highlights the given message to all players.
  * `!serialinfo [nickname | serial]  [maxAge = 1095]`: displays serial info for the nickname.
  * `!why [nickname] [maxAge = 365]`: displays the most recent entries in a player's record.
  * `!unban [ip | ip range | serial] [reason]`: lifts the ban for the given reason.

## Commands available to VIPs on IRC
  * `!vip [message]`: sends the given message to all in-game VIP players.

## Commands available to everyone on IRC
  * `!getid [nickname]`: finds a player with the given nickname, displays their Id.
  * `!getname [id]`: finds a player with the given player Id, displays their nickname.
  * `!msg [message]`: send the given message to all in-game players in the main world.
  * `!players`: displays an overview of all players currently in-game.
  * `!players [nickname]`: displays a summary about the given player's statistics.
  * `!pm [player] [message]`: sends the given message privately to the chosen player.

## The in-game `/nuwani` command
In-game staff is able to inspect and manage the IRC bots through the `/nuwani` command. Access to
this command is restricted to Management members by default, but that can be configured through
the `/lvp access` command.

The command will show a menu with a variety of options available to choose from.

## Inspect bot status
Displays a list of the configured bots, each with their connectivity status and recent command
rates. Command rates are not available for bots not currently connected to the network.

## Reload the message format
The IRC message format can be amended without having to restart the server. Make sure that the
latest version is available on the server, and select this command to apply the new formatting.

## Request an increase in bots...
Requests one of the available bots to connect to the network and start assuming some of the message
load. Useful when in-game staff is aware of an upcoming change in player volume. Selecting this
option will display a confirmation dialog before committing the action.

## Request a decrease in bots...
Requests one of the optional connected bots to disconnect from the network. This should only be
rarely necessary as the system can load balance itself, but for symmetry we've included it.
Selecting this option will display a confirmation dialog before committing the action.
