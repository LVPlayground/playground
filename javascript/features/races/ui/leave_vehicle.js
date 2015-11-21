// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let MessageView = require('features/races/ui/message_view.js');

// The message that should be displayed when a participant has left their vehicle.
const MESSAGE = 'You left your vehicle!';

// Displays a message to a specific player that they have left their vehicle and therefore will be
// dropping out of the race. They will be frozen while the message is displaying.
class LeaveVehicle extends MessageView {
  constructor(participant) {
    super(MESSAGE);

    this.players_ = [participant.player];
  }

  getTargetPlayers() { return this.players_; }

  // Displays a message about having left the vehicle to |participant| for |milliseconds|.
  static displayForParticipant(participant, milliseconds) {
    let leaveVehicle = new LeaveVehicle(participant);
    return leaveVehicle.display(milliseconds);
  }
};

exports = LeaveVehicle;
