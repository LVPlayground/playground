# Networking
Provides Las Venturas Playground with networking capabilities. In principle, we prefer to follow the
WHATWG Fetch standard where appropriate:

https://fetch.spec.whatwg.org/#fetch-api

The entry point for all these APIs is the `fetch` function, which can be used as follows:

```javascript
fetch('https://sa-mp.nl/', {
    method: 'POST',
    headers: [
        [ 'Content-Type', 'text/plain' ],
        [ 'Content-Length', 1224 ]
    ],
    body: 'Hello, world!',
});
```

This component provides implementations for the following parts of the standard:

  * [Headers](headers.js)

Non-compliance with any part of the standard is considered a bug, although we may decide to not
implement certain pieces of functionality that aren't applicable for our usage.
