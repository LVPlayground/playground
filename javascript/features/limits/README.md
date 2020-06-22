# Limits
Determines the limits on various abilities within Las Venturas Playground based on player state,
level and activity. Each limit is defined as a composition of _requirements_ and _throttles_.

  * **Requirements** indicate which properties of player activity should be checked.
  * **Throttles** indicate limitations on how frequently something is allowed to happen.

Most of the actual requirements can be configured using the `limits` section exposed through the
`/lvp settings` command for Management members.

## Requirements
The following requirements are supported. They are defined in [requirements.js](requirements.js).

Requirement                | Description
---------------------------|-------------
`kNoDeathmatchRequirement` | Requires that the player hasn't recently inflicted or taken damage, or fired their weapon.
`kNoMinigameRequirement`   | Requires that the player isn't engaged in a minigame.

## Throttles
The following throttles are supported. They are defined in [throttles.js](throttles.js).

Limiter                  | Description
-------------------------|-------------
`kTeleportationThrottle` | Throttle on how frequently teleportation capabilities can be used.
