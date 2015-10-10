// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

require('base/timers.js');

require('entities/player.js');

self.addEventListener('playerconnect', event => {
  let player = new Player(event.playerid);
  player.name = 'YourNewName';
  
  wait(1500).then(() =>
      console.log('Hello, ' + player.name + '!'));

  wait(2500).then(() =>
      self.commands.triggerCommand(player, '/test hello'));
});

let counter = 0;
self.addEventListener('frame', event => {
  if (++counter % 100 == 0)
    console.log('Time: ' + event.now);
});
