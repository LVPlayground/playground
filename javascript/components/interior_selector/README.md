# Component: Interior Selector
The selector enables players to pick one from a predefined list of interiors by browing through
them using a different camera view. It returns a promise that will be resolved with the chosen
interior when one has been chosen, or NULL when none has been chosen.

## Usage example
The following example illustrates how you might use the selector.

```javascript
InteriorSelector.select(player).then(interior => {
    if (interior)
        console.log(player.name + ' has selected an interior!');
    else
        console.log(player.name + ' did not select an interior.');
});
```
