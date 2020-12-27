# Games API
Las Venturas Playground has always had a large variety of games (or _minigames_), from races, to
derbies, to deathmatch events and climbing haystacks. The **Games** infrastructure provides the
foundations for a layered system that backs all of them.

## What does the Games API provide?
The functionality in this feature provides the lowest level runtime necessary to implement a game.
Given an implementation of the [Game class](game.js), and a declarative description of _what_ the
game does, it's able to:

  - Expose the necessary commands for players to start or join the game,
  - Enable players to challenge each other to the game in 1-on-1 matches,
  - Host multiple instances of the game simultaneously, each one in its own world.

Few games will be built directly on top of the Games API. Instead, they will use intermediate
infrastructure that adds functionality specific to the category of game, for example deathmatch,
derby and racing games.

## Options when registering a game
When registering a game with the `Games.registerGame()` function, you pass in a class that extends
the [GameBase class](game_base.js) ([interface](game.js)) and an options dictionary.

### Required configuration

Option              | Description
--------------------|--------------
`name`              | Name of the game, as either a string or a function. **Required**.
`goal`              | What do participants have to do to win this game? **Required**.

### Optional configuration: countdown

_This will result in a `countdown` argument to be passed to the game's `onPlayerSpawned` function_
_the first time a player spawns, which is an async function that games should call themselves._

Option              | Description
--------------------|--------------
`countdown`         | Time, in seconds, for which a countdown screen should be displayed.
`countdownCamera`   | Position of the camera during the countdown, array of two Vector objects.
`countdownView`     | Target of the camera during the countdown, array of two Vector objects.

### Optional configuration: environment

_Settings are able to set the default environment that should be applied for this game, through_
_the `environment` object. A default customisation option is available for players to change this._

Option              | Description
--------------------|--------------
`environment`       | The environment that should be applied to the game.

```javascript
environment: {
    time: 'Afternoon',  // one of { Morning, Afternoon, Evening, Night }
    weather: 'Rainy',  // see table below
    gravity: 'Normal',  // one of { Low, Normal, High }
}
```

The available weather IDs are as follows:

Name         | [Weather ID](https://wiki.sa-mp.com/wiki/WeatherID)
-------------|----------------
Cloudy       | 7
Foggy        | 9
Heatwave     | 11
Rainy        | 8
Sandstorm    | 19
Sunny        | 10

### Optional configuration: settings

_Settings may be used to allow players to configure the game to their liking, either through the_
_`/challenge` command, or by providing the `custom` argument to the game's own command._

Option              | Description
--------------------|--------------
`settings`          | Array of [Setting](../../entities/setting.js) instances for this game.
`settingsValidator` | Function to be called when one of the non-fixed-value settings is changed.
`settingsFrozen`    | Array of setting identifiers that cannot be modified by players.

### Optional configuration: misc

Option              | Description
--------------------|--------------
`command`           | Name of the command through which the game can be started. Optional.
`commandFn`         | Function that can be called to determine what the public command should be.
`continuous`        | Whether this is a continuous game rather than one requiring sign-up. (Default is `false`.)
`minimumPlayers`    | The minimum amount of players that should join the game. (Default is 2.)
`maximumPlayers`    | The maximum amount of players that should join the game. (Default is 4.)
`preferCustom`      | Whether customised games are preferred when there are no active sign-ups. (Default is `false`.)
`price`             | The price players have to pay in order to participate. (Default is $250.) May be set to `0`.
`scoreType`         | Type of data the score contains. ({`number`, `time`})
`tick`              | Frequency at which the `onTick()` event should be called. (Default is 1000ms.)

## Implementation details
![Image of architecture](https://github.com/LVPlayground/playground/blob/master/docs/games-api.png?raw=true)

  - [Games](games.js) is the entry point of the feature, which exposes the public API. The key
    methods to look at are `registerGame()` and `removeGame()`.
  - [GameRegistry](game_registry.js) keeps track of all the games that have been registered.
  - [GameCommands](game_commands.js) provides both the canonical commands (e.g. `/leave`), as well
    as the commands for games that requested one when they registered.
  - [GameManager](game_manager.js) keeps track of games which are accepting registrations, as well
    as games that are currently running.

When a game is accepting registrations, the [GameRegistration](game_registration.js) keeps track of
all the related information. When the game is ready to start, a [GameRuntime](game_runtime.js)
instance will be created to host the actual game.
