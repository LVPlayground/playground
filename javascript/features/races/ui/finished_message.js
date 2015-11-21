// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let MessageView = require('features/races/ui/message_view.js');

// The message that should be displayed when a participant finishes the race.
const MESSAGE = 'Congratulations!';

// Displays a message to a specific player that they have finished the race. This is not very
// insightful, but they can look at the scoreboard to the right to figure out how they did.
class FinishedMessage extends MessageView {
  constructor(participant) {
    super(MESSAGE);

    this.players_ = [participant.player];
  }

  getTargetPlayers() { return this.players_; }

  // Displays a message about having finished the race to |participant| for |milliseconds|.
  static displayForParticipant(participant, milliseconds) {
    let finished = new FinishedMessage(participant);
    return finished.display(milliseconds);
  }
};

exports = FinishedMessage;
