# Internationalization (i18n)
Las Venturas Playground started off in Dutch, then moved to English, then grew a highly distributed
player base across many languages. This component provides the primitives that enable such an
environment, keep messages consistent

## Registering and using messages
You define your messages in a regular JavaScript file, which we recommend you name `*.messages.js`
to indicate its purpose. In such a file, you're expected to register the messages that are relevant
to your component or feature. You do this by defining them as an object:

```javascript
import { globalMessages } from 'components/i18n/messages.js';

export const messages = globalMessages.extend({
    feature_message_name: 'Hi %{name}s, how are you doing?',
});
```

These messages are then immediately available for use in the rest of your code, and are accessible
as JavaScript properties that you (re)export. For example, in your feature you would use:

```javascript
import { messages } from 'features/feature/feature.messages.js';

player.sendMessage(messages.feature_message_name, {
    name: 'Frank',
});
```

The syntax and options of the message is identical do that of the `format` function, which is well
documented in [format.js](../../base/format.js).

## Message placeholders
Various types of text are quite repetitive across our code, for which we've enabled placeholders.
They start with an `@` followed by their identifier. The following placeholders are available:

  * `@error`: Prefix to give to messages which indicate success.
  * `@success`: Prefix to give to messages which indicate an error.
  * `@usage`: Prefix to give to messages which indicate usage.

These placeholders can be substituted differently depending on context, as in-game messages will
want to provide different formatting from IRC and Discord-bound messages.
