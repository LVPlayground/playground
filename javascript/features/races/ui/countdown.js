// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

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
    return new Promise(resolve => {
      // TODO: Display the countdown using text draws instead (yay aesthetics).
      // TODO: Display "Go" rather than zero.

      let display = seconds => {
        for (let participant of this.participants_.racingParticipants())
          participant.player.sendMessage(seconds + '...');

        if (seconds > 0)
          wait(1000).then(display.bind(null, seconds - 1));
        else
          resolve();
      };

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
