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
