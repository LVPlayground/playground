// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

require('base/timers.js');

let Menu = require('components/menu/menu.js'),
    Player = require('entities/player.js');

let menu = new Menu('Hello, world!');
menu.addItem('foo', player => console.log(player.name + ' clicked foo!'));
menu.addItem('bar', player => console.log(player.name + ' clicked bar!'));

self.addEventListener('playerconnect', event => {
  let player = new Player(event.playerid);
  
  console.log('Player ' + player.name + ' connected.');

  wait(10000).then(() =>{
    console.log('Displaying a menu for ' + player.name + '...');

    menu.displayForPlayer(player).then(item => {
      console.log(player.name + ' selected ' + item[0] + '!');
    }, error => {
      console.log('Error: ' + error);
    });
  });
});
