# Event Listener
San Andreas: Multiplayer emits events with primitive data— entity Ids, unverified input coming
directly from the player, and so on. This leads to code having to repeatedly validate the input and
translate it to the higher-level instances we use in Las Venturas Playground.

The code in this module aims to unify this behaviour. Features are encouraged to use an event
listener (obtainable through `Feature.createEventListener()`) for the events they need rather than
using the globally available functionality.

```javascript
class MyFeature extends Feature {
  constructor(playground) {
    super(playground);

    const eventListener = this.createEventListener();
    eventListener.addEventListener('playerconnect', this.__proto__.onPlayerConnect.bind(this));
  }

  onPlayerConnect(player) {
    console.log(player.name);
  }
}
```

Components can also use the EventListener, but are expected to keep track of event lifetime
themselves (i.e. by calling `dispose()` at an appropriate time.)

The following events are supported on the `EventListener` class.

  * **playerconnect**: `onPlayerConnect(player : Player)`
  * **playerdisconnect**: `onPlayerDisconnect(player : Player, reason : Number)`
  * **playerlogin**: `onPlayerLogin(player : Player, userId : Number)`
