# Features
This directory contains the _features_ of Las Venturas Playground that have been implemented in
JavaScript. Let's begin with defining some of the terminology we use here.

  - A **feature** is _a grouped set of capabilities_. This could be a category of commands, for
    example teleportation or communication, a concept, for example friends or gangs, or something
    that isn't immediately available to the player, for example ways to make an announcement.

  - Every feature is **encapsulated**. It cannot talk to other features unless it **declares a
    dependency**. Circular dependencies are not allowed between features, that means that if
    _FeatureA_ depends on _FeatureB_, _FeatureB_ cannot depend on _FeatureA_.

  - Features should be **automatically tested**. The JavaScript code has been designed to enable
    easy and effective integration testing, which makes sure we can minimize the amount of bugs.

There is no limit to how small or large a feature can be, but try to think of features in layers:
perhaps you can split up your _feature_ in several smaller features, which will make it much easier
to implement and test accordingly.

## Code Health standards
Our Code Health standards are group by year, and are iterative: meeting the requirements for a given
year means that requirements for all previous years must be met as well.

### Code Health 2020
  - At least 75% test coverage, by rough estimation. Majority tested through classes obtained by loading the feature.
  - Four space indentation, no brackets for one-line statements, `kConstantName` constant naming.
  - Exclusively uses [Named Exports](https://developer.mozilla.org/en-US/docs/web/javascript/reference/statements/export).
  - Has a `README.md` file in the feature directory.

## 1. Foundational features
These features provide critical functionality. They may not depend on other features except for the
other foundational features, without circular dependencies.

Feature                              | Code Health | Description
-------------------------------------|-------------|------------------------------------------------------------------
[AccountProvider](account_provider/) | ✔ 2020     | Provides the `Player.account` supplement, loads and saves account data.
[Communication](communication/)      | ✔ 2020     | Provides communication abilities, chat, spam and message filters.
[Finance](finance/)                  | ✔ 2020     | Manages player's cash, bank account balances, tax and loans.
[Limits](limits/)                    | ✔ 2020     | Centrally decides on limitations for various features, e.g. teleportation.
[Nuwani](nuwani/)                    | ✔ 2020     | Provides our ability to interact with IRC and Discord.
[PlayerStats](player_stats/)         | ✔ 2020     | Provides the `Player.stats` supplement, tracks player metrics.
[Settings](settings/)                | ✔ 2020     | Manages persistent settings on the server.

## 2. Low-level features
May only depend on each other and foundational features, and are expected to be depended on by
various other features because of the functionality they provide.

Feature                       | Code Health | Description
------------------------------|-------------|------------------------------------------------------------------
[Collectables](collectables/) | ✔ 2020    | Provides achievements, benefits thereof and the actual collectables.
[Streamer](streamer/)         | ✔ 2020    | Provides the ability to intelligently stream vehicles on the map.

## 3. Features
May depend on any other feature as long as there are no circular dependencies.

Feature                                          | Code Health | Description
-------------------------------------------------|-------------|------------------------------------------------------------------
[Abuse](abuse/)                                  | ❓ 2020     | -
[Account](account/)                              | ✔ 2020     | Provides account-related commands to in-game players
[CommunicationCommands](communication_commands/) | ✔ 2020     | Provides commands related to communication, e.g. `/pm`, `/mute` etc.
[Cruise](cruise/)                                | ❓ 2020     | -
[DeathFeed](death_feed/)                         | ❓ 2020     | -
[DeathMatch](death_match/)                       | ❓ 2020     | -
[Decorations](decorations/)                      | ❓ 2020     | Powers JSON-based decorations on the server.
[Derbies](derbies/)                              | ❓ 2020     | -
[Economy](economy/)                              | ❓ 2020     | -
[Fights](fights/)                                | ❓ 2020     | -
[Friends](friends/)                              | ✔ 2020     | -
[Games](games/)                                  | ❓ 2020     | Driver for all sorts of interactive games on the server.
[Gangs](gangs/)                                  | ❓ 2020     | -
[GangChat](gang_chat/)                           | ❓ 2020     | Extends [Gangs](gangs/) with a private communication channel.
[GangZones](gang_zones/)                         | ❓ 2020     | Extends [Gangs](gangs/) with visual and interactive gang zones.
[Haystack](haystack/)                            | ❓ 2020     | The Haystack minigame, where players climb to the top of a hay stack.
[Houses](houses/)                                | ❓ 2020     | -
[Killtime](killtime/)                            | ❓ 2020     | -
[Leaderboard](leaderboard/)                      | ❓ 2020     | The `/leaderboard` command, and database routines to calculate it.
[Location](location/)                            | ❓ 2020     | -
[NuwaniCommands](nuwani_commands/)               | ❓ 2020     | The `/nuwani` command, enabling Management to control the bot system.
[PlayerCommands](player_commands/)               | ✅ 2020    | Provides commands for the player also useable for admins. E.g. to buy weapons.
[PlayerFavours](player_favours/)                 | ❓ 2020     | -
[PlayerSettings](player_settings/)               | ❓ 2020     | -
[Playground](playground/)                        | ❓ 2020     | -
[Punishments](punishments/)                      | ❓ 2020     | Provides the ability to kick, ban and jail naughty players.
[Races](races/)                                  | ❓ 2020     | -
[Radio](radio/)                                  | ❓ 2020     | -
[ReactionTests](reaction_tests/)                 | ❓ 2020     | Minigame where players repeat text or solve calculations in chat.
[Teleportation](teleportation/)                  | ❓ 2020     | -
[Vehicles](vehicles/)                            | ❓ 2020     | Provides all vehicles on the server, and commands to interact with them.

## 4. Deprecated features
These are expected to be factored in to other features. While fine to use, expect to see them
disappear in the future. May depend on any feature as long as there are no circular dependencies.

Feature                      | Code Health | Description
-----------------------------|-------------|------------------------------------------------------------------
[ActivityLog](activity_log/) | ❓ 2020     | -
[Announce](announce/)        | ❓ 2020     | -
[Commands](commands/)        | ❓ 2020     | -
[Debug](debug/)              | ❓ 2020     | -
[Minigames](minigames/)      | ❓ 2020     | Deprecated minigame driver, superseded by the [Games](games/) feature.
[Report](report/)            | ❓ 2020     | -
