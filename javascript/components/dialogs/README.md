# Component: Dialogs
The dialogs component provides access to SA-MP's [dialog feature](
http://wiki.sa-mp.com/wiki/ShowPlayerDialog). It features both mid-level and high-level abstractions
for the common types of dialogs.

## Interface: Message
The `Message` class (defined in [message.js](message.js)) enables to to display a simple message in
a centered dialog on the player's screen. Keep in mind that this will completely obstruct their
in-game experience, so use it sparsely.

Example:
```javascript
let message = new Message('You have been playing for 6 hours!');
message.displayForPlayer(player).then(() => {
  // the player has dismissed the message 
});
```

## Appendix: Dialog interface
The `Dialog` class defined in [dialog.js](dialog.js) is not meant to be used by feature code. Please
use one of the more specific dialog-related classes instead, since that allows us to provide a
consistent experience to our players.

Not sure what you need? Consider this mapping of SA-MP dialog types:

  - **DIALOG_STYLE_MSGBOX**: Use a [Message](message.js) for simple dialogs. Yes/no prompts are not
    supported yet.
  - **DIALOG_STYLE_INPUT**: Not supported.
  - **DIALOG_STYLE_PASSWORD**: Not supported.
  - **DIALOG_STYLE_LIST**: Use the [Menu](/javascript/components/menu/) component.
  - **DIALOG_STYLE_TABLIST_HEADERS**: Use the [Menu](/javascript/components/menu/) component.
  - **DIALOG_STYLE_TABLIST**: Forbidden in Las Venturas Playground.
