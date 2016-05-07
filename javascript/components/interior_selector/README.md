# Component: Interior Selector
The selector enables players to pick one from a predefined list of interiors by browing through
them using a different camera view. It returns a promise that will be resolved with the chosen
interior when one has been chosen, or NULL when none has been chosen.

## Usage example
The following example illustrates how you might use the selector.

```javascript
const myInteriorList = [ /* ... */ ];

InteriorSelector.select(player, myInteriorList).then(interior => {
    if (interior)
        console.log(player.name + ' has selected an interior!');
    else
        console.log(player.name + ' did not select an interior.');
});
```

The list of interiors (`myInteriorList`) must be set to an array of objects, each of which contains
the definition of an interior. It must accord to the following syntax:

```javascript
{
    name: 'Name of my interior',
    interior: 7,
    positions: {
        entrance: [0, 0, 0],
        exit: [0, 0, 0]
    },
    preview: {
        position: [[ 219.15, 1287.01, 1083.33 ], [ 227.16, 1286.63, 1083.56 ]],
        rotation: [[ 223.22, 1289.70, 1082.20 ], [ 224.31, 1290.69, 1082.48 ]],
        duration: 2000
    }
},
```

A default list of interiors is included in [default_interior_list.js](default_interior_list.js).
