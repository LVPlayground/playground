# Component: Menu
The menu component provides the ability to a menu that can be visually presented to a player. The
menu can either be a list (a single unnamed column), or between one and four named columns in which
the data will be presented in an organized manner.

Menus are implemented using SA-MP's [dialog feature](http://wiki.sa-mp.com/wiki/ShowPlayerDialog),
but remove many of the limitations and complexity by doing this for you.

## Interface: Menu
The `Menu` interface is defined in [menu.js](menu.js) and provides the sole entry point.

You must construct a menu with at least a title, and optionally an array of column names.

Once constructed, you can add any number of items to the menu by calling `addItem()` on the Menu
instance. You pass one argument per column, and optionally a JavaScript function that will be called
when a user has selected that item.

In order to display the menu to a player, you can call the `displayForPlayer()` method. This returns
a Promise that will be resolved when the player has either made a choice, or has dismissed the menu.

## Example: Picking your favorite animal
The following example will present a list of animals to the player, and will output a message to the
console once they've selected their favorite.

```javascript
let menu = new Menu('What is your favorite animal?');
menu.addItem('Cats');
menu.addItem('Dogs');
menu.addItem('Pigeons');

menu.displayForPlayer(player).then(result => {
  console.log(player.name + ' prefers ' + result.item[0]);
});
```

## Example: Determining how greedy the player is
The following example will present a list of choices to the player, having a column for their
greedyness and a column for the reward associated with that greedyness.

```javascript
let menu = new Menu('How greedy are you?', [ 'Greedyness', 'Reward' ]);
menu.addItem('Not very...', '$100');
menu.addItem('Quite greedy!', '$500');
menu.addItem('Very greedy!', '$1000');

menu.displayForPlayer(player).then(result => {
  console.log(player.name + ' is ' + result.item[0] + ' and wants ' + result.item[1]);
});
```

Note that up to four columns are supported for the Menu class.

## Example: List of other menus that should be opened
The following example will display a list of options to the player, each of which will open a
different menu relevant to the selected menu item.

```javascript
let menu = new Menu('How can we help you?');
menu.addItem('How do I get money?', player => {
  moneyMenu.displayForPlayer(player);
});

menu.addItem('How do I get a vehicle?', player => {
  vehicleMenu.displayForPlayer(player);
});

menu.displayForPlayer(player);
```