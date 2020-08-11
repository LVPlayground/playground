# Interface elements
Various parts of the _user interface_ on Las Venturas Playground are shared among several features,
which if why they've been aggregated and documented in this component. Each is generic, safe to use,
and comprehensively tested.

## Component: Banner
The `Banner` component, defined in [banner.js](banner.js), can be used to show something of great
importance to the player. They overlay their entire screen, and are thus rather disruptive. Banners
have a number of configuration options available to them:

  * `title`: Title of the banner. Should be limited to 5-6 words at most.
  * `message`: Message of the banner. Should be limited to ~10 words at most.
  * `time`: Display time for the banner, in milliseconds. Only needed when changing the default.

```javascript
await Banner.displayForPlayer(player, {
    title: 'Time for a break?',
    message: 'You have been playing for 12 hours!',
});
```

When writing tests, you'll want to import the `kDefaultDisplayTimeMs` constant from `banner.js` in
order to know how long to wait for completion of the banner:.
