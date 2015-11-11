// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Rectangle = require('components/text_draw/rectangle.js'),
    TextDraw = require('components/text_draw/text_draw.js');

// Background color of the score board. Should be semi-transparent.
const BACKGROUND_COLOR = new Color(0, 0, 0, 100);

// Powers the visual score board on the right-hand side of a player's screen. It displays data about
// the current race, for example the time and distances to the other player, but also time based on
// the player's previous best time when available.
class ScoreBoard {
  constructor(player, contestants) {
    this.player_ = player;

    // TODO: Calculate the height of the background area.
    this.background_ = new Rectangle(500, 140, 106, 200, BACKGROUND_COLOR);
    this.background_.displayForPlayer(this.player_);

    this.timeLabel_ = this.createLabel(510, 150, 'Time');
    this.timeValue_ = this.createValue(596, 165, '00:00.000');
  }

  // Disposes of the score board for this player.
  dispose() {
    this.timeValue_.hideForPlayer(this.player_);
    this.timeLabel_.hideForPlayer(this.player_);

    this.background_.hideForPlayer(this.player_);
  }

  // Called every few hundred milliseconds while the race is active. Gives us the opportunity to
  // update the running counter on a player's screen.
  update(runningTime) {
    this.timeValue_.updateTextForPlayer(this.player_, this.formatTime(runningTime, true));
  }

  // -----------------------------------------------------------------------------------------------

  createLabel(x, y, text) {
    let label = new TextDraw({
      position: [x, y],
      text: text,
      font: TextDraw.FONT_SANS_SERIF
    });

    label.displayForPlayer(this.player_);
    return label;
  }

  createValue(x, y, initial) {
    let value = new TextDraw({
      position: [x, y],
      text: initial,
      font: TextDraw.FONT_MONOSPACE,
      alignment: TextDraw.ALIGN_RIGHT
    });

    value.displayForPlayer(this.player_);
    return value;
  }

  // -----------------------------------------------------------------------------------------------

  // Formats |time|, in milliseconds, as a human readable value formatted as MM:SS.XXX. The minute
  // counter will be omitted when zero, unless |alwaysShowMinuteCounter| is set.
  formatTime(time, alwaysShowMinuteCounter) {
    let decimalSeconds = time / 1000;

    let seconds = Math.floor(decimalSeconds);
    let milliseconds = Math.floor((decimalSeconds - seconds) * 1000);

    let minutes = Math.floor(seconds / 60);
    if (minutes > 0)
      seconds -= minutes * 60;

    let representation = '';
    if (minutes > 0 || alwaysShowMinuteCounter)
      representation += (minutes < 10 ? '0' : '') + minutes + ':';

    representation += (seconds < 10 ? '0' : '') + Math.floor(seconds) + '.';
    representation += (milliseconds < 10 ? '00' : (milliseconds < 100 ? '0' : '')) + milliseconds;

    return representation;
  }
};

exports = ScoreBoard;
