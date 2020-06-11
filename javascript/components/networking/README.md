# Networking
Provides Las Venturas Playground with networking capabilities. In principle, we prefer to follow the
WHATWG Fetch standard where appropriate:

https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
https://fetch.spec.whatwg.org/#fetch-api

The entry point for all these APIs is the `fetch` function, defined in [fetch.js](fetch.js), which
can be used as follows:

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

  * [Body](body.js) ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Body))
  * [FormData](form_data.js) ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/FormData))
  * [Headers](headers.js) ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Headers))
  * [Request](request.js) ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Request))
  * [Response](response.js) ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Response))
  * [URLSearchParams](url_search_params.js)
    ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams))
  * [URL](url.js) ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/URL))

Further, [utf-8.js](utf-8.js) contains encoders and decoders between strings and UTF-8 array buffers
gratefully using the [utf.js](https://github.com/DesWurstes/utf.js) library.

Non-compliance with any part of the standard is considered a bug, although we may decide to not
implement certain pieces of functionality that aren't applicable for our usage.

## Examples

### 1. Download a JSON file from the internet
```javascript
const response = await fetch('https://sa-mp.nl/data.json');
if (response.ok)
    return await response.json();
```

### 2. Submit a form, e.g. to register an account
```javascript
const formData = new FormData();
formData.append('nickname', player.name);
formData.append('password', '1player1');

const response = await fetch('https://sa-mp.nl/api/register.php', {
    method: 'POST',
    body: formData,
});

if (response.ok)
    console.log('Registration succeeded!');
```

### 3. Upload a file, e.g. tracing information
```javascript
const filename = 'data/trace.json';

const formData = new FormData();
formData.appendFile('upload', 'trace.json', readFile(filename), 'text/json');

const response = await fetch('https://sa-mp.nl/api/upload-trace.php', {
    method: 'POST',
    body: formData,
});

if (response.ok)
    console.log('File uploaded!');
```