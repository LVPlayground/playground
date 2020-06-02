# PlaygroundJS
Our server is driven by [PlaygroundJS](https://github.com/LVPlayground/playgroundjs-plugin), Las
Venturas Playground's proprietary SA-MP plugin that enables (parts of) the gamemode to be written in
JavaScript. It includes a copy of the [V8 JavaScript engine](https://v8.dev/), and provides modules
for support ranging from accessing MySQL databases to creating raw sockets.

## Concepts

### Deferred callbacks
The [callbacks.txt](/data/server/callbacks.txt) file contains the callbacks that will be delivered
as events to JavaScript. Each of them supports _annotations_, which influences how the event will
be dispatched. One of such annotations is **Deferred**.

When a callback has been _deferred_, the event handler will not be invoked automatically. Instead,
it will be stored internally, in a list that can be obtained by calling `getDeferredEvents()`. This
allows the JavaScript code to dispatch the events at a lower rate (e.g. at 10Hz rather than 200Hz),
or apply scheduling techniques to balance out load at times of peak usage.

The [DeferredEventManager](/javascript/entities/deferred_event_manager.js) is responsible for
reading the deferred events at a configured interval, and dispatching the events to other parts of
the code instead. This allows the full execution path to be completely optimised.
