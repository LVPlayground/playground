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
`kMainWorldRequirement`    | Requires that the player is in one of the virtual worlds making up the Main World.
`kNoDeathmatchRequirement` | Requires that the player hasn't recently inflicted or taken damage, or fired their weapon.
`kNoMinigameRequirement`   | Requires that the player isn't engaged in a minigame.
`kOutsideRequirement`      | Requires that the player is currently outside, i.e. not in any interior.

## Throttles
The following throttles are supported. They are defined in [throttles.js](throttles.js).

Limiter                  | Description
-------------------------|-------------
`kSpawnVehicleThrottle`  | Throttle on how frequently players are allowed to spawn vehicles.
`kTeleportationThrottle` | Throttle on how frequently teleportation capabilities can be used.
