# Component: Menu
The menu component provides a idiomatic JavaScript interface to SA-MP's menu system. It enables you
to create menus with up to 12 items, optionally having two columns. Because the SA-MP server imposes
a limit on having no more than 128 menus at any given time, this component will intelligently create
and dispose of menus as it sees fit.

## Interface documentation
The exported `Menu` class has the following interface:

```webidl
interface Menu {
  constructor(string title);
  constructor(string title, object columns[]);

  // Adds an item to the menu, either just for the first (only?) column, or for
  // both columns. Per-item event listeners may be attached.
  void addItem(string title, optional function listener = null);
  void addItem(string firstTitle, string secondTitle, optional function listener = null);

  // Displays or hides the menu for |player|.
  void displayForPlayer(Player player);
  void closeForPlayer(Player player);
  
  // Event handlers invoked when the menu is opened or closed for a player.
  event onshow;
  event onclose;
  
  // Event handler invoked when a player has selected an item from the menu.
  event onselect;
};
```

When passing an array of `columns` to the constructor, each entry must be an object having a `title`
and a `width`. The `width` must be a number between in the range of `[0, 640]`, inclusive.

Menus will become immutable once they have been presented to a player for the first time. This is
what allows the menu allocation system to work reliably.

## Example: Picking your favorite animal
The following code will enable the player to select their favorite animal.

```javascript
let animalMenu = new Menu('What is your favorite animal?');
animalMenu.addItem('Cats', player => {
  console.log(player.name + ' prefers cats!');
});

animalMenu.addItem('Dogs', player => {
  console.log(player.name + ' prefers dogs over cats!');
});

animalMenu.showForPlayer(myPlayer);
```

## Example: Picking a tuning shop in a specific city.
The following code will create a menu with two columns, one for the shop's name, one for the city
it's located in.

```javascript
let tuningMenu = new Menu('Which tuning shop do you want to go to?', [
  { title: 'Tuning shop', width: 150 },
  { title: 'City', width: 80 }
]);

tuningMenu.addItem('Loco Low Co.', 'Los Santos');
tuningMenu.addItem('TransFender', 'Los Santos');
tuningMenu.addItem('Wheel Arch Angels', 'San Fierro');
tuningMenu.addItem('TransFender', 'San Fierro');
tuningMenu.addItem('TransFender', 'Las Venturas');

tuningMenu.addEventListener('select', event => {
  console.log(event.player + ' wants to go to ' + event.secondTitle);
});
```

## References
- [SA-MP Wiki: Creating a simple menu](http://wiki.sa-mp.com/wiki/Creating_a_simple_Menu)
- [SA-MP Wiki: CreateMenu](http://wiki.sa-mp.com/wiki/CreateMenu)
