// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Rectangle = require('components/text_draw/rectangle.js'),
    TextDraw = require('components/text_draw/text_draw.js');

// Background color of the countdown. Should be semi-transparent.
const BACKGROUND_COLOR = new Color(0, 0, 0, 100);

// Text color of the counter that's actually counting down, and will shout "Go!"
const COUNTDOWN_COUNTER_COLOR = new Color(255, 255, 0, 255);

// This class implements the visual count down that will be presented to the player right before
// they can start a race. This gives each player the chance to see the environment prior to starting
// and gives San Andreas the chance to load the resources in the surrounding area.
class Countdown {
  constructor(participants) {
    this.participants_ = participants;
  }

  // Starts a countdown for |seconds| seconds. Returns a promise that will be resolved when the
  // given number of seconds has passed.
  start(seconds) {
    let background = new Rectangle(161, 140, 317.5, 115, BACKGROUND_COLOR);
    let description = new TextDraw({
      position: [320, 150],
      alignment: TextDraw.ALIGN_CENTER,

      text: 'GET READY',
      font: TextDraw.FONT_MONOSPACE,
      letterSize: [0.4, 1.6],
      shadowSize: 0
    });

    let counter = new TextDraw({
      position: [320, 175],
      alignment: TextDraw.ALIGN_CENTER,

      text: seconds,
      font: TextDraw.FONT_MONOSPACE,
      color: COUNTDOWN_COUNTER_COLOR,
      letterSize: [0.722, 2.94],
      shadowSize: 0
    });

    // Display all countdown textdraws to all participants of the race.
    for (let participant of this.participants_.racingParticipants()) {
      let player = participant.player;

      background.displayForPlayer(player);
      description.displayForPlayer(player);
      counter.displayForPlayer(player);
    }

    return new Promise(resolve => {
      let display = seconds => {
        for (let participant of this.participants_.racingParticipants()) {
          counter.updateTextForPlayer(participant.player, seconds == 0 ? 'GO!'
                                                                       : seconds);
        }

        // If there is still time left on the counter, re-schedule an invocation of this function in
        // about a second to process the next phase of the countdown.
        if (seconds > 0) {
          wait(1000).then(display.bind(null, seconds - 1));
          return;
        }

        // The timer has run out. Add an artificial wait of 300 seconds so that the "GO!" text is
        // briefly displayed on the player's screens, after which the race can commence.
        wait(300).then(() => {
          for (let participant of this.participants_.racingParticipants()) {
            let player = participant.player;

            background.hideForPlayer(player);
            description.hideForPlayer(player);
            counter.hideForPlayer(player);
          }

          // Resolve the promise - this will allow the race to begin.
          resolve();
        });
      };

      // Start the counter by requesting display for |seconds| seconds.
      display(seconds);
    });
  }

  // Starts a new countdown for |seconds| seconds, displayed to the |participants|.
  static startForParticipants(seconds, participants) {
    let countdown = new Countdown(participants);
    return countdown.start(seconds);
  }
};

exports = Countdown;
