# Feature: Communication
The communication feature is the foundation for most communicative features available on
Las Venturas Playground. It is responsible for managing the different chat environments, as well
as filtering and various communication-related commands.

## Commands
There are no commands available per this feature yet.

## Delegate
Features can register a delegate with this feature whose `onPlayerText` method will be called for
each message that any player sends to the main chat. The method can then return `TRUE` to indicate
that it handled the message, thus blocking it from further processing, or `FALSE` to pass through.

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

_An exception will be thrown when you don't return a boolean from `onPlayerText`._
