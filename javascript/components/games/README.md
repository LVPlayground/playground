# Games component
This component contains utility classes that are useful for features dealing with games. Each of the
components is standalone, and does not have any dependencies.

## StructuredGameDescription
Most games configured through JSON files follow a very similar structure, which is enabled by and
implemented through the [StructuredGameDescription](structured_game_description.js) class.

It takes a `type` (e.g. `Derby`), a `filename` from which to load the configuration as a JSON file,
and `structure` declaratively describing the expected structure of the JSON configuration file,
its types, default values and validator functions.

An object will be constructed following this structure, on which all of the declared properties will
exist and be defined, either with their configured value, or with the default value.

This object also has a `toString()` method, to aid debugging of game configuration data.

### Arrays
Arrays may be defined in the game description. They are per definition optional, which maps to an
empty array, but a validator can be used to instill a minimum number of elements after the fact.

Each array property must have a `elementType` property, which maps to a property definition that all
elements must adhere too. Arrays must only contain a single type of property.

```javascript
{
    name: 'numberArray',
    type: StructuredGameDescription.kTypeArray,
    elementType: {
        type: StructuredGameDescription.kTypeNumber,
    },
}
```

### Objects
Objects may be used for more complicated, structured data types. Objects may be nested at any depth,
and contain any other type of data structure.

Each object must define a `structure` of its own, which is equal in format to the top-level
`structure` that was passed to the `StructuredGameDescription` constructor. Like arrays, objects are
optional by default, although their properties may be required.

```javascript
{
    name: 'minMaxObject',
    type: StructuredGameDescription.kTypeObject,
    structure: [
        {
            name: 'min',
            type: StructuredGameDescription.kTypeNumber,
        },
        {
            name: 'max',
            type: StructuredGameDescription.kTypeNumber,
        },
    ]
}
```

### Enumerations
It's possible to define lists of accepted values using enumerations. Each of the entries must be a
string. A `defaultValue` may be given, but it must be included in the enumeration values as well.

```javascript
{
    name: 'gravity',
    type: StructuredGameDescription.kTypeEnumeration,
    options: [ 'Low', 'Normal', 'High' ],
    defaultValue: 'Normal',
}
```

### Scalar types
Three scalar types are available: numbers, booleans and strings. They can have a `defaultValue` set,
which marks them as optional. An example declaration looks like:

```javascript
{
    name: 'numberProperty',
    type: StructuredGameDescription.kTypeNumber,
    defaultValue: 42,
}
```

### Validators
Each property may have a validator defined, which will be passed the `value` before it'll be added
to the object. Failures in validation should be indicated by throwing an exception.

```javascript
{
    name: 'position',
    type: StructuredGameDescription.kTypeArray,
    validator: (position) => {
        if (position.length !== 3)
            throw new Error('Positions must be indicated as [x, y, z] arrays.');
        
        for (const coordinate of position) {
            if (coordinate < -3000 || coordinate > 3000)
                throw new Error('Coordinates must be in range of [-3000, 3000].');
        }
    },
}
```

## StructuredGameDescriptionTemplates
Various templates for use with the `## StructuredGameDescription` are available in the
[structured_game_descriptions_templates.js](structured_game_descriptions_templates.js) file. They
are canonical, tested, and, should be preferred over individual games defining their own structures
where possible.

### Game checkpoints (`kGameCheckpoints`)
The `kGameCheckpoints` template can be used to describe the checkpoints that should be created as
part of a game, for instance the route to drive when participating in a race. Properties are:

Property   | Description
-----------|-------------
`position` | Position of the object, as a `[ x, y, z ]` array. Will be stored as a `Vector`.
`size`     | Diameter of the checkpoint, in in-game units. Defaults to ten units.

### Game Environment (`kGameEnvironment`)
The `kGameEnvironment` template can be used to configure a game's environment settings. All of the
properties are optional, as is definition of an environment by itself. Properties are:

Property     | Default     | Description
-------------|-------------|-------------
`boundaries` | `null`      | World boundaries to apply to the game. Optional.
`gravity`    | `Normal`    | The gravity to apply during this game. Optional.
`interiorId` | `0`         | Interior Id in which the game will be taking place.
`time`       | `Afternoon` | Time to apply in the game. Defaults to noon.
`weather`    | `Sunny`     | Weather to apply in the game. Defaults to Sunny.

#### Possible `gravity` values
  * `Low`: gravity value of 0.0035
  * `Normal`: gravity value of 0.08
  * `High`: gravity value of 0.012

#### Possible `time` values
  * `Morning`: 8am
  * `Afternoon`: 3pm
  * `Evening`: 8pm
  * `Night`: 2am

#### Possible `weather` values
  * `Cloudy`: weather ID 7
  * `Foggy`: weather ID 9
  * `Heatwave`: weather ID 11
  * `Rainy`: weather ID 8
  * `Sandstorm`: weather ID 19
  * `Sunny`: weather ID 10

Weather IDs are documented on the SA-MP forums: https://wiki.sa-mp.com/wiki/WeatherID

### Game objects (`kGameObjects`)
The `kGameObjects` template can be used to accept a list of objects as part of the game's config,
which is commonly used across a variety of games. **This is an array**, where each element is a
structure following this configuration -- nothing is optional:

Property   | Description
-----------|-------------
`modelId`  | GTA: San Andreas Model ID for the object to create.
`position` | Position of the object, as a `[ x, y, z ]` array. Will be stored as a `Vector`.
`rotation` | Rotation of the object, as a `[ rx, ry, rz ]` array. Will be stored as a `Vector`.

### Game pickups (`kGamePickups`)
The `kGamePickups` template can be used to accept a list of pickups as part of the game's config.
Each pickup is represented by a model, type and position.

Property      | Description
--------------|-------------
`modelId`     | GTA: San Andreas Model ID for the pickup to create.
`type`        | [SA-MP Pickup Type](https://wiki.sa-mp.com/wiki/PickupTypes) for this pickup.
`respawnTime` | Respawn time of the pickup. Optional, defaults to `-1` (thus depending on type).
`position`    | Position of the pickup, as a `[ x, y, z ]` array. Will be stored as a `Vector`.

### Game spawn positions (`kGameSpawnPositions`)
Each game needs one or more spawn positions, which are defined following the `kGameSpawnPositions`
template. This is an array, where each element has the following options available:

Property         | Description
-----------------|-------------
`facingAngle`    | Direction in which the participant will be facing.
`position`       | Actual spawn position, as a `[ x, y, z ]` array. Will be stored as a `Vector`.
`vehicleModelId` | Model Id of the vehicle they should spawn in. Optional, defaults to `null`.

### Individual property types

  * `kPositionProperty` for validation of a `[ x, y, z ]` position array, where the boundaries much
    be within [-4500, 4500] on the `x` and `y` axis, and within [-100, 1850] for the `z` axis. Each
    position will be stored as a [Vector](../../base/vector.js) instance instead.
  * `kRotationAngleProperty` for validating a rotation angle in range of [0, 360].
  * `kRotationVectorProperty` for validation of a `[ rx, ry, rz ]` rotation array, where each of the
    rotations must be within [0, 360]. The rotation will be stored as a
    [Vector](../../base/vector.js) instance.
