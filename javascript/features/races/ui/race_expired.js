// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let MessageView = require('features/races/ui/message_view.js');

// The message that should be displayed when a participant runs out of time.
const MESSAGE = 'Time\'s up!';

// Displays a message to all remaining participants that the race has expired, and that they will
// have to stop. The participant will be frozen while the message is being displayed.
class RaceExpired extends MessageView {
  constructor(participants) {
    super(MESSAGE);

    this.participants_ = participants;
  }

  getTargetPlayers() {
    let players = [];
    for (let participant of this.participants_.racingParticipants())
      players.push(participant.player);

    return players;
  }

  // Displays a message about having ran out of time to |participants| for |milliseconds|.
  static displayForParticipants(milliseconds, participants) {
    let raceExpired = new RaceExpired(participants);
    return raceExpired.display(milliseconds);
  }
};

exports = RaceExpired;
