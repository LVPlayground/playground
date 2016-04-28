// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Rectangle = require('components/text_draw/rectangle.js'),
    TextDraw = require('components/text_draw/text_draw.js');

// Background color of the message. Should be semi-transparent.
const BACKGROUND_COLOR = Color.fromRGBA(0, 0, 0, 100);

// Displays a message to all remaining participants. The participant will be frozen while the
// message is being displayed on their screen.
class MessageView {
  constructor(message) {
    this.message_ = message;
  }

  // Returns an array of the players for whom the message should be displayed.
  getTargetPlayers() {
    throw new Error('The getTargetPlayers() method must be overridden.');
  }

  // Displays the message for |milliseconds|. The user interface follows the other messages that
  // will be used for information about races.
  display(milliseconds) {
    let background = new Rectangle(161, 140, 317.5, 36.8, BACKGROUND_COLOR);
    let description = new TextDraw({
      position: [320, 146.5],
      alignment: TextDraw.ALIGN_CENTER,

      text: this.message_,
      font: TextDraw.FONT_MONOSPACE,
      letterSize: [0.4, 1.6],
      shadowSize: 0
    });

    let messageRecipients = [];

    // Display all textdraws to all participants of the race.
    this.getTargetPlayers().forEach(player => {
      player.controllable = false;

      messageRecipients.push(player);

      background.displayForPlayer(player);
      description.displayForPlayer(player);
    });

    return wait(milliseconds).then(() => {
      messageRecipients.forEach(player => {
        background.hideForPlayer(player);
        description.hideForPlayer(player);
      });
    });
  }
};

exports = MessageView;
