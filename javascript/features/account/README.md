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

## Account data supplement
This feature provides the `Player.account` supplement, which makes all account data associated with
a particular player available to all other code on the server. The account data will be loaded when
a player identifies to their account. When available, all data will be synchronously available for
both reading and updating as follows:

```javascript
function getBankAccountBalance(player) {
    if (!player.account || !player.account.hasIdentified())
        return 0;  // they either aren't registered, or haven't logged in yet
    
    return player.account.bankAccountBalance;
}

function setBankAccountBalance(player, balance) {
    if (!player.account || !player.account.hasIdentified())
        throw new Error('You cannot update bank account for unidentified players!');
    
    player.account.bankAccountBalance = balance;
}
```

You don't have to worry about writing the data back to the database, this will be done automatically
by this feature, both periodically during the session and on player disconnection.

### Adding a data type to be synchronised
There are a few steps involved in making a new account property available. In summary:

  1. Add the field to the appropriate queries in [account_database.js](account_database.js).
  1. Add the field, getter and optionally the setter in [account_data.js](account_data.js).
  1. Add the necessary properties in [player_account_supplement.js](player_account_supplement.js).
  1. Declare victory.

If your field importance justified periodic saving rather than just at player disconnection time,
add a call to `this.requestStore()` in the setter you wrote in [account_data.js](account_data.js).
