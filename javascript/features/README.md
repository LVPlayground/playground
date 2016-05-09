# Features
This directory contains the _features_ of Las Venturas Playground that have been implemented in
JavaScript. Let's begin with defining some of the terminology we use here.

  - A **feature** is _a grouped set of capabilities_. This could be a category of commands, for
    example teleporatation or communication, a concept, for example friends or gangs, or something
    that isn't immediately available to the player, for example ways to make an announcement.

  - Every feature is **encapsulated**. It cannot talk to other features unless it **declares a
    dependency**. Circular dependencies are not allowed between features, that means that if
    _FeatureA_ depends on _FeatureB_, _FeatureB_ cannot depend on _FeatureA_.

  - Features should be **automatically tested**. The JavaScript code has been designed to enable
    easy and effective integration testing, which makes sure we can minimize the amount of bugs.

There is no limit to how small or large a feature can be, but try to think of features in layers:
perhaps you can split up your _feature_ in several smaller features, which will make it much easier
to implement and test accordingly.

## List of features
The following features have been implemented in JavaScript.

  - **[Announce](announce/)**: Provides the ability to announce events to players, administrators
    and IRC.
  - **[Communication](communication/)**: Provides the lower-level player communication capabilities.
  - **[Friends](friends/)**: Gives players the ability to list who their friends are, as well as
    the `/friends` command.
  - **[Gang chat](gang_chat/)**: Provides a private-ish group chat for online gangs.
  - **[Gangs](gangs/)**: Provides the persistent gangs feature, as well as the `/gang` command.
  - **[Player favours](player_favours/)**: Various smaller features implemented specifically for
    the benefit of certain players.
  - **[Vehicles](vehicles/)**: Manages all vehicles around Las Venturas Playground.

_There are several other features that have to be updated and documented before being listed here._

## TODO
The following features need to be cleaned up and properly documented>

  - **[ActivityLog](activity_log/)**: Logs several in-game events in the database.
  - **[Commands](commands/)**: Provides generic commands to the player that don't belong elsewhere.
  - **[DeathFeed](death_feed/)**: Controls whether the _death feed_ should be visible to the player.
  - **[Debug](debug/)**: Provides generic commands related to debugging the server.
  - **[Races](races/)**: Gives players the ability to participate in races.
