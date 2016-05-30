# Economy
It's difficult to define a functional economy for a freeroam community like Las Venturas Playground.
This feature provides an interface that contains primitives necessary to figure out just _how much_
something should cost or award.

## API: calculateHousePrice(position, interiorValue)
Calculates the price for a house positioned at the `position`, which must be a [Vector]
(../../base/vector.js), with an interior value of `interiorValue`, which must be a number in range
of [0, 9]. A variance will be applied to the price as well.

The returned price will be a value between $1,000,000 and $25,000,000.
