# Feature: Communication
The communication feature is the foundation for most communicative features available on
Las Venturas Playground. It is responsible for managing the different chat environments, as well
as filtering and various communication-related commands.

The feature exists of a variety of different components, which together control whether, and how,
players can communicate on the server.

## MessageFilter
The [MessageFilter](message_filter.js) is responsible for amending or rejecting messages based on
the server's bad word and text subsitution lists, which it owns.

The object further has the ability to rewrite messages in case of truly appaling grammer, which
includes messages written in all capitals. We call this _message recapitalization_, which employs
a series of clever tricks to change garbage in messages that some might call posh.

## MessageVisibilityManager
The [MessageVisibilityManager](message_visibility_manager.js) is responsible for deciding who should
be receiving a particular message. Las Venturas Playground is a maze of virtual worlds, many of
which form the main world. This object also tracks which players someone is ignoring.

## MuteManager
The [MuteManager](mute_manager.js) is responsible for keeping track of mutes. This includes server-
wide bans on communication, which administrators can impose with the `/lvp settings` command, but
also mutes applied to individual players by means of punishment.

## SpamTracker
The [SpamTracker](spam_tracker.js) is responsible for detecting when a message has to be blocked
because a player is spamming. Three categories of messages are considered spam:

  1. Messages longer than 255 characters are considered spam. (SA-MP does not allow this.)
  1. Sending more than five messages in ten seconds.
  1. Repeating the same message more than twice in ten seconds.

These rules apply across all communication mechanisms on Las Venturas Playground.

## Delegate
Features can register a delegate with this feature whose `onPlayerText` method will be called for
each message that any player sends to the main chat. The method can then return `TRUE` to indicate
that it handled the message, thus blocking it from further processing, or `FALSE` to pass through.

Delegates take precedence over all other processing, giving individual features (such as reaction
tests) the ability to block messages from reaching chat.

Registering a delegate is very straight-forward. Be sure to remove it as well.

```javascript
class MyFeature extends Feature {
    constructor() {
        this.communication_ = this.defineDependency('communication');
        this.communication_.addDelegate(this);
    }

    // All messages that start with "log:" will be logged to the server's
    // console instead of being distributed to all online players.
    onPlayerText(player, message) {
        if (!message.startsWith('log:'))
            return false;  // the message is not meant for this feature

        console.log(player.name + ' logs: ' + message.substr(4));
        return true;
    }

    dispose() {
        this.communication_.removeDelegate(this);
    }
}
```
