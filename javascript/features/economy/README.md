# Economy
It's difficult to define a functional economy for a freeroam community like Las Venturas Playground.
This feature provides an interface that contains primitives necessary to figure out just _how much_
something should cost or award.

## API: calculateHousePrice(position, parkingLotCount, interiorValue)
Calculates the price for a house positioned at the `position`, which must be a [Vector]
(../../base/vector.js), with an interior value of `interiorValue`, which must be a number in range
of `[0, 9]`. A variance will be applied to the price as well.

The returned price will be a value between $1,000,000 and $25,000,000, plus a fixed amount for each
available parking lot depending on the house's position.


## API: calculateHouseFeaturePrice(position, feature)
Calculates the price for adding the `feature` to a house at the given `position`. The returned price
will be a value between $185,000 and $125,000,000, plus the variable part of the price.


## API: calculateHouseVehiclePrice(position, modelId)
Calculates the price for placing a vehicle with `modelId` at the `position` near someone's house.
A variance will be applied to the price as well.

The returned price will be a value between $100,000 and $1,500,000.


## API: isResidentialExclusionZone(position)
Returns whether |position| exists in a residential exclusion zone. These are the red areas on the
[residential value map](https://sa-mp.nl/tools/visualize-map/) that are considered to be of high
strategic value.
