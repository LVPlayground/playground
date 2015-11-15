// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Rectangle = require('components/text_draw/rectangle.js'),
    TextDraw = require('components/text_draw/text_draw.js');

// Background color of the countdown. Should be semi-transparent.
const BACKGROUND_COLOR = new Color(0, 0, 0, 100);

// Displays a message to all remaining participants that the race has expired, and that they will
// have to stop. The participant will be frozen while the message is being displayed.
class RaceExpired {
  constructor(participants) {
    this.participants_ = participants;
  }

  // Displays the message for |milliseconds|. The user interface follows the other messages that
  // will be used for information about races.
  display(milliseconds) {
    let background = new Rectangle(161, 140, 317.5, 36.8, BACKGROUND_COLOR);
    let description = new TextDraw({
      position: [320, 146.5],
      alignment: TextDraw.ALIGN_CENTER,

      text: 'Time\'s up!',
      font: TextDraw.FONT_MONOSPACE,
      letterSize: [0.4, 1.6],
      shadowSize: 0
    });

    let messageRecipients = [];

    // Display all countdown textdraws to all participants of the race.
    for (let participant of this.participants_.racingParticipants()) {
      let player = participant.player;
      player.controllable = false;

      messageRecipients.push(player);

      background.displayForPlayer(player);
      description.displayForPlayer(player);
    }

    return wait(milliseconds).then(() => {
      messageRecipients.forEach(player => {
        background.hideForPlayer(player);
        description.hideForPlayer(player);
      });
    });
  }

  // Displays a message about having ran out of time to |participants| for |milliseconds|.
  static displayForParticipants(milliseconds, participants) {
    let raceExpired = new RaceExpired(participants);
    return raceExpired.display(milliseconds);
  }
};

exports = RaceExpired;
