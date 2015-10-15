// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

require('base/timers.js');

let Player = require('entities/player.js');

let Menu = require('components/menu/menu.js'),
    menu = new Menu('Hello, world!');

menu.addItem('foo', player => {
  console.log(player.name + ' clicked!');
});

self.addEventListener('playerconnect', event => {
  let player = new Player(event.playerid);
  
  wait(10000).then(() => menu.displayForPlayer(player));
});

let counter = 0;
self.addEventListener('frame', event => {
  if (++counter % 100 != 0)
    return;

  console.log('Time: ' + event.now);
});
