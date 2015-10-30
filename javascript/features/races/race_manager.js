// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The race manager is responsible for keeping track of the available races, the in-progress races
// and providing the ability to start or stop races when that's necessary.
class RaceManager {
  constructor() {
    this.races_ = [];
  }

  // Returns a promise that will be resolved with a personalized list of races available for the
  // |player|, together with the all-time best time of registered players on the race. If |player|
  // is a registered player, their personal best time will be included in the overview as well.
  availableRacesForPlayer(player) {
    return Promise.resolve([
      { id: 1, name: 'My Race', bestTime: 60, personalBestTime: 120 }
    ]);
  }
};

exports = RaceManager;
