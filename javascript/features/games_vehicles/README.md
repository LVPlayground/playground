# Games Vehicles API
This feature contains extended functionality on top of the [Games API](../games/) that makes it
easier to build vehicles-based games for Las Venturas Playground, by providing well considered
options and implementations that apply to most sort of vehicle-based games.

## How to use the Games Vehicles API?
Where you would normally register a game with the `Games.registerGame()` function, you will be using
the `GamesVehicles.registerGame()` function instead. Pass in a class that extends
[VehicleGame](vehicle_game.js), and you'll be able to use all of the extra functionality and
[options][1] provided by this feature.

Your feature must depend on the `games_vehicles` instead of the `games` feature.

## Provided functionality
The _Games Vehicle API_ is able to provide vehicle-based games with the following capabilities:

  * Application of all environment settings (`kGameEnvironment`).
  * Application of all object settings (`kGameObjects`).
  * Application of all pickup settings (`kGamePickups`).
  * Safe spawning of players in their vehicles, in randomized positions.

## Interface elements

### Countdown
Defined in [interface/countdown.js](interface/countdown.js), this object enables you to display a
quick and consistent countdown for our vehicle-based minigames. It's an asynchronous mechanism that
takes three parameters:

```javascript
async Countdown.displayForPlayer(player, seconds, validFn) { /* ... */ }
```

  * `player`: the Player instance for whom to display the countdown,
  * `seconds`: number of seconds the countdown should be displayed for,
  * `validFn`: function, to return a boolean, indicating if the countdown should continue.

Example usage is as follows:

```javascript
async displayCountdown(player, seconds = 3) {
    await Countdown.displayForPlayer(player, seconds, () => {
        return player.isConnected();
    });
}
```

For testing purposes, a helper method is available that can fast forward past the countdown, based
on the microtask invocations created by the system.

```javascript
await Countdown.advanceCountdownForTesting(/* seconds= */ 3);
```
