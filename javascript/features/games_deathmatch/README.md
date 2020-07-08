# Games Deathmatch API
This feature contains extended functionality on top of the [Games API](../games/) that makes it
easier to build deathmatch games for Las Venturas Playground, by providing well considered options
that apply to most sort of contests.

## How to use the Games Deathmatch API?
Where you would normally register a game with the `Games.registerGame()` function, you will be using
the `GamesDeathmatch.registerGame()` function instead. Pass in a class that extends
[DeathmatchGame](deathmatch_game.js), and you'll be able to use all of the extra functionality and
[options][1] provided by this feature.

Your feature must depend on the `games_deathmatch` instead of the `games` feature.

## Options when registering a game
The following options will be made available in addition to the [default ones][1].

Option              | Description
--------------------|--------------
`lagCompensation`   | Whether lag compensation should be enabled. Defaults to `true`.
`mapMarkers`        | Whether map markers should be enabled for participants. One of `Enabled` (default), `Team only` or `Disabled`.
`objective`         | Objective of the game. See the separate section on this value.
`skin`              | ID of the [player skin](https://wiki.sa-mp.com/wiki/Skins:All) that should be forced on participants.
`spawnArmour`       | Whether players should spawn with full armour.
`spawnWeapons`      | The weapons that players should be issued upon spawning. See the separate section on this value.
`teams`             | Whether teams should be created, and if so, how they should be balanced. See the separate section on this value.
`teamDamage`        | Whether players in the same team can issue damage to each other. Defaults to `true`.

## Settings when starting a game
The following settings will be made available to all deathmatch games, and can be customized by
players as they see fit. Specialized interfaces will be offered where appropriate.

Setting             | Description
--------------------|--------------
`Lag compensation`  | Whether lag compensation should be enabled.
`Map markers`       | Whether map markers should be enabled for participants.
`Objective`         | What the objective of the game is, which defines the winning conditions.
`Spawn armour`      | Whether players should spawn with full armour.
`Spawn weapons`     | The set of weapons that players should be issued on spawning.
`Teams`             | Whether teams should be created, and if so, how they should be balanced.
`Team damage`       | Whether players in the same team can issue damage to each other.

## Advanced option: `objective`
The objective of a game defines its winning conditions. We support a variety of different options,
which are configurable by the player and can also be set in game configuration. These options are
objects, because certain specialization is needed.

Objective              | Description                                | Example
-----------------------|--------------------------------------------|---------------------
**Last man standing**  | Last player to die wins.                   | `{ type: 'Last man standing' }`
**Best of...**         | Best of _X_ rounds. Respawn after a kill.  | `{ type: 'Best of...', kills: 5 }`
**First to...**        | First to get _X_ kills.                    | `{ type: 'First to...', kills: 3 }`
**Time limit...**      | Most kills within the time limit.          | `{ type: 'Time limit...', seconds: 180 }`
**Continuous**         | No winners, players will have to `/leave`  | `{ type: 'Continuous' }`

The default objective is configurable through `/lvp settings` in the `Games` category. The values
there must match one of the aforementioned values.

## Advanced option: `spawnWeapons`
Players can be issued any number of spawn weapons in the game, which can be set with the game's
description and can be modified by the player through a user interface. The value of `spawnWeapons`
is an array, each of which has two entries.

Key       | Value
----------|----------------
`weapon`  | The [weapon ID](https://wiki.sa-mp.com/wiki/Weapons) of the weapon that should be granted.
`ammo`    | The amount of ammunition players should receive for this weapon.

As of right now, all weapons are available with the exception of satchels. Be careful when granting
a knife or a Katana sword, as they may desync the player which cannot be fixed during the game.

## Advanced option: `teams`
Defines how teams should be balanced in the game. Every location supports team-based spawns, so this
is entirely in the player's control. We support creating teams in a variety of ways:

Value                 | Description
----------------------|----------------------
**Balanced teams**    | Create balanced teams, based on the skill levels of the participants.
**Free for all**      | No teams, each player fights for their own gain.
**Randomized teams**  | Create randomized teams, without caring about individual skill levels.

In the future, more advanced teams configuration will be supported to enable creating specific,
multi-player deathmatch fights, for example gang wars.

## TODO
The following items are still to do for the Games Deathmatch API to be complete.

  * Implement the **Best of...** objective.
  * Implement the **First to...** objective.
  * Implement the **Time limit...** objective.
  * Implement the **Continuous** objective.

[1]: ../games#options-when-registering-a-game
