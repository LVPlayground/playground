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
the [Game class](game.js) and an options dictionary.

### Required configuration

Option            | Description
------------------|--------------
`name`            | Name of the game, as a string. **Required**.
`goal`            | What do participants have to do to win this game? **Required**.

### Optional configuration: countdown

Option            | Description
------------------|--------------
`countdown`       | Time, in seconds, for which a countdown screen should be displayed.
`countdownCamera` | Position of the camera during the countdown, array of two Vector objects.
`countdownView`   | Target of the camera during the countdown, array of two Vector objects.

### Optional configuration: misc

Option            | Description
------------------|--------------
`command`         | Name of the command through which the game can be started. Optional.
`minimumPlayers`  | The minimum amount of players that should join the game. (Default is 2.)
`maximumPlayers`  | The maximum amount of players that should join the game. (Default is 4.)
`price`           | The price players have to pay in order to participate. (Default is $250.)
`tick`            | Frequency at which the `onTick()` event should be called. (Default is 1000ms.)

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
