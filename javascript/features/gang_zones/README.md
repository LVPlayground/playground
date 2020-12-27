# Gang zones
Las Venturas Playground supports [Gangs](../gangs/), groups of players working together towards
dominance on the server. Each gang member is able to have one or multiple [Houses](../houses/),
which often are located together to form a feeling of coherency.

We now support _gang zones_, which indicates such areas on the map based on the gang's identity
color. This marks the area as being distinctively theirs, and grants them access to ownership of
the area, and thus the ability to manage and change its aesthetics well beyond individual houses.

## Determination of _zone dominance_
Gang zones are created for areas in which a gang has assured _zone dominance_. This is determined
in the following mechanism, which gangs can directly influence:

  1. **Identification of active gang members**. This is done by considering all players on Las
     Venturas Playground who are part of a gang, and have recently been in-game. _Recency_ here
     is influenced by the player's total online time.

  1. **Identification of active gangs**. Each gang which has at least five active gang members
     will be considered active, and is eligible to receive a gang zone.

  1. **Identification of gang area(s)**. A tally will be made of all houses owned by the active
     gang members. Any area where more than five active members have a house will be considered
     a gang area. This means that gangs can occupy multiple areas, for example one in each city,
     as long as all enough members participate in this.

The gang zone feature will continue to evaluate these requirements while the server is running,
so players joining a gang and building a house in the gang area(s) will have an immediate effect.

## Appendix

### What constitutes an active gang member?
Gang members are considered to be recently active when:

  1. They have been in-game in the past 6 months, or,
  1. They have been in-game in the past 12 months and have >200 hours of in-game time, or,
  1. They have been in-game in the past 24 months and have >500 hours of in-game time, or,
  1. They have >1000 hours of in-game time.

There are no exceptions for VIP members or administrators. Although they naturally tend to have
spent more time on Las Venturas Playground, this isn't per se recently.

### How exactly are gang areas determined?
We apply a [mean shift](https://en.wikipedia.org/wiki/Mean_shift) algorithm to determine where the
gang has located their houses, which has been implemented in [mean_shift.js](mean_shift.js). This
algorithm doesn't have a set upper limit for the number of clusters returned.

For each of those clusters, we make sure that at least five members are represented within them. If
so, the area will be considered a _gang area_. The area is subject a series of calculations to shape
and size them appropriately, which is done by the [ZoneCalculator](zone_calculator.js).

There are certain _area size bonuses_ available as well:

  1. `medium-gang`, a bonus applied to areas where at least eight members are represented.
  1. `large-gang`, a bonus applied to areas where at least 15 members are represented.
  1. `vip-member`, a bonus applied to areas for each member who's a VIP on the server.
