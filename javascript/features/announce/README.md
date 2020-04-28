# Feature: Announce
This is a non-triggerable feature that provides a number of APIs for other features to announce
events to players, administrators and those watching on IRC. All settings, audience checks and
formatting will be done as part of this module.

## API: announceToPlayers(message)
Announces |message| to all in-game players. This will _not_ generate an IRC message by default.

## API: announceToAdministrators(message)
Announces |message| to all in-game administrators. This will automatically generate an IRC message
only visible to administrators there as well.
