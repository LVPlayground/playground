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

## Component: Countdown
The `Countdown` component, defined in [countdown.js](countdown.js), can be used to tell players that
there is a time limit on whatever activity they're engaged in. It's positioned between their money
counter and the death board, and changes in colour and urgency as time gets closer.

The component has an instance that can be used by multiple players, as it's based on global text
draws. This optimises for the common use-case, where it's visible to multiple game participants.

  * `seconds`: Number of seconds the countdown should be visible for.
  * `sounds`: A boolean indicating whether urgency sounds should be made. Enabled by default.

```javascript
const countdown = new Countdown({ seconds: 180 });
countdown.displayForPlayer(player);

// ...

countdown.finished.then(() => {
    countdown.hideForPlayer(player);
    countdown.dispose();
});
```
