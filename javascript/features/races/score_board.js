// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Rectangle = require('components/text_draw/rectangle.js'),
    TextDraw = require('components/text_draw/text_draw.js');

// Background color of the score board. Should be semi-transparent.
const BACKGROUND_COLOR = new Color(0, 0, 0, 100);

// Color of the text indicating the number of players. Should be white-ish.
const PLAYER_COUNT_COLOR = new Color(255, 255, 255, 100);

// Powers the visual score board on the right-hand side of a player's screen. It displays data about
// the current race, for example the time and distances to the other player, but also time based on
// the player's previous best time when available.
//
// The ScoreBoard class implements the following user interface:
//
//     =============================
//     =   _                       =
//     =  |  | TH       00:00.000  =
//     =  |__| /0    PR 00:00.000  =
//     =                           =
//     =============================
//
//     =============================
//     =                           =
//     =  #1 FirstRacerName        =
//     =                  -00.000  =
//     =  #3 SecondRacerName       =
//     =                  +00.000  =
//     =  #4 ThirdRacerName        =
//     =               +00:00.000  =
//     =                           =
//     =============================
//
// The player's current time will be updated several times per second. The personal record will be
// updated when they pass through the next checkpoint. The position of all players, including the
// times between them, will be updated when any of the participants passes a checkpoint.
//
// Colors will be applied to times to clarify whether it's a good thing or a bad thing. Negative
// time values will be displayed in green (they're doing better than the other time), whereas
// positive values will be displayed in red (they're doing worse than the other time).
class ScoreBoard {
  constructor(participant, participants) {
    this.participants_ = participants;
    this.participant_ = participant;
    this.player_ = participant.player;

    this.hasPersonalRecords_ = false;
    this.displaying_ = false;

    this.positionBackground_ = new Rectangle(500, 140, 106, 36.8, BACKGROUND_COLOR);

    // Section (1): Position compared to the other players in the current race
    // ---------------------------------------------------------------------------------------------

    this.positionValue_ = new TextDraw({
      position: [505, 143],

      text: '1',
      font: TextDraw.FONT_PRICEDOWN,
      letterSize: [0.582, 2.446],
      shadowSize: 0,
      proportional: false
    });

    this.positionSuffix_ = new TextDraw({
      position: [516, 145],

      text: 'st',
      font: TextDraw.FONT_MONOSPACE,
      letterSize: [0.177, 0.97],
      shadowSize: 0
    });

    this.participantsValue_ = new TextDraw({
      position: [524.9, 153.796],
      color: PLAYER_COUNT_COLOR,

      text: '_',  // to be filled in on start
      font: TextDraw.FONT_PRICEDOWN,
      letterSize: [0.249, 1.135],
      shadowSize: 0,
      alignment: TextDraw.ALIGN_RIGHT,
      proportional: false
    });


    // Section (2): Running time in the current race, personal record and relative offset of that.
    // ---------------------------------------------------------------------------------------------

    this.timeValue_ = new AbsoluteTimeView(556.5, 145.5);

    this.personalRecordValue_ = new AbsoluteTimeView(556.5, 154.726);
    this.personalRecordLabel_ = new TextDraw({
      position: [543, 153.5],

      text: 'pr',
      font: TextDraw.FONT_MONOSPACE,
      letterSize: [0.205, 1.235],
      shadowSize: 0
    });
  }

  // Displays the score board for the player. All (initial) values for the texts should've been set,
  // except for the number of participants which will only be available now.
  displayForPlayer() {
    this.participantsValue_.text = '/' + this.participants_.racingPlayerCount();

    this.positionBackground_.displayForPlayer(this.player_);

    this.positionValue_.displayForPlayer(this.player_);
    this.positionSuffix_.displayForPlayer(this.player_);
    this.participantsValue_.displayForPlayer(this.player_);
    this.timeValue_.displayForPlayer(this.player_);

    if (this.hasPersonalRecords_) {
      this.personalRecordLabel_.displayForPlayer(this.player_);
      this.personalRecordValue_.displayForPlayer(this.player_);
    }

    this.displaying_ = true;
  }

  // Hides all the text draws that are part of this score board for the player. Generally done when
  // the race ends for them. Garbage collection will take care of deleting the objects.
  hideForPlayer() {
    this.personalRecordValue_.hideForPlayer(this.player_);
    this.personalRecordLabel_.hideForPlayer(this.player_);
    this.timeValue_.hideForPlayer(this.player_);
    this.participantsValue_.hideForPlayer(this.player_);
    this.positionSuffix_.hideForPlayer(this.player_);
    this.positionValue_.hideForPlayer(this.player_);

    this.positionBackground_.hideForPlayer(this.player_);
  }

  // Called when the player's best time has been loaded from the database. It will be displayed on
  // the score board until relative times based on their performance are known.
  setBestTime(time) {
    this.hasPersonalRecords_ = true;
    this.personalRecordValue_.setTime(this.player_, time);

    if (this.displaying_) {
      this.personalRecordLabel_.displayForPlayer(this.player_);
      this.personalRecordValue_.displayForPlayer(this.player_);
    }
  }

  // Updates the relative time the player is currently driving at. If the personal record value
  // still is an absolute time (as it is at the beginning of the race), re-create the view.
  setPersonalRecordRelativeTime(time) {
    if (this.personalRecordValue_ instanceof AbsoluteTimeView) {
      this.personalRecordValue_.hideForPlayer(this.player_);
      this.personalRecordLabel_.hideForPlayer(this.player_);

      this.personalRecordValue_ = new RelativeTimeView(...this.personalRecordValue_.position);
      this.personalRecordValue_.setTime(time);

      this.personalRecordValue_.displayForPlayer(this.player_);
      return;
    }

    this.personalRecordValue_.setTime(time);
  }

  // Called every ~hundred milliseconds while the race is active. Only update the high-resolution
  // race-duration counter on the player's screen.
  update(currentTime) {
    this.timeValue_.setTime(this.player_, currentTime - this.participant_.startTime);
  }
};

// This is a time view that can be used to draw time in the format of [00:00.000] with consistent
// spacing regardless of the value and without having to rely on ugly proportional text rendering.
class AbsoluteTimeView {
  constructor(x, y) {
    this.position_ = [x, y];

    this.minuteValue_ = '00';
    this.minuteView_ = new TextDraw({
      position: [x + 5.4, y],

      text: this.minuteValue_,
      font: TextDraw.FONT_PRICEDOWN,
      alignment: TextDraw.ALIGN_CENTER,
      letterSize: [0.272, 1.007],
      shadowSize: 0
    });

    this.secondValue_ = '00';
    this.secondView_ = new TextDraw({
      position: [x + 14.033 + 5.4, y],

      text: this.secondValue_,
      font: TextDraw.FONT_PRICEDOWN,
      alignment: TextDraw.ALIGN_CENTER,
      letterSize: [0.272, 1.007],
      shadowSize: 0
    });

    this.millisecondValue_ = '000';
    this.millisecondView_ = new TextDraw({
      position: [x + 26.8, y],

      text: this.millisecondValue_,
      font: TextDraw.FONT_PRICEDOWN,
      letterSize: [0.272, 1.007],
      shadowSize: 0
    });

    this.separatorView_ = new TextDraw({
      position: [x + 10.8, y - 0.15],

      text: ':____.',
      font: TextDraw.FONT_PRICEDOWN,
      letterSize: [0.185, 1.007],
      shadowSize: 0
    });

    this.displaying_ = false;
  }

  // Returns the [x, y] position of the absolute time view.
  get position() { return this.position_; }

  setTime(player, time) {
    let [minutes, seconds, milliseconds] = distillTime(time);

    let minuteValue = ((minutes < 10) ? '0' : '') + minutes,
        secondValue = ((seconds < 10) ? '0' : '') + seconds,
        millisecondValue = (milliseconds < 100 ? (milliseconds < 10 ? '00' : '0') : '') + milliseconds;

    // Update the local values if the absolute time view isn't being displayed yet, because there is
    // nothing to update for the player(s) it is being shown to.
    if (!this.displaying_) {
      this.minuteView_.text = this.minuteValue_ = minuteValue;
      this.secondView_.text = this.secondValue_ = secondValue;
      this.millisecondView_.text = this.millisecondValue_ = millisecondValue;
      return;
    }

    // Alternatively, update the live views that are being presented to the player.
    if (this.minuteValue_ != minuteValue)
      this.minuteView_.updateTextForPlayer(player, this.minuteValue_ = minuteValue);

    if (this.secondValue_ != secondValue)
      this.secondView_.updateTextForPlayer(player, this.secondValue_ = secondValue);

    if (this.millisecondValue_ != millisecondValue)
      this.millisecondView_.updateTextForPlayer(player, this.millisecondValue_ = millisecondValue);
  }

  displayForPlayer(player) {
    this.minuteView_.displayForPlayer(player);
    this.secondView_.displayForPlayer(player);
    this.millisecondView_.displayForPlayer(player);
    this.separatorView_.displayForPlayer(player);

    this.displaying_ = true;
  }

  hideForPlayer(player) {
    this.displaying_ = false;

    this.separatorView_.hideForPlayer(player);
    this.millisecondView_.hideForPlayer(player);
    this.secondView_.hideForPlayer(player);
    this.minuteView_.hideForPlayer(player);
  }
};

// This is a view for displaying relative times, for example [+00.000] or [-00:00.000]. Positive
// times will be displayed in red, whereas negative times will be displayed in green, because they
// respectively indicate that the participant is doing worse or better.
class RelativeTimeView {
  constructor(x, y) {

    this.displaying_ = false;
  }

  setTime(player, time) {

  }

  displayForPlayer(player) {
    this.displaying_ = true;
  }

  hideForPlayer(player) {
    this.displaying_ = false;
  }
};

// Splits up |time|, which should be in milliseconds, to a rounded number of minutes, seconds and
// milliseconds which could be used for presentation.
function distillTime(time) {
  let decimalSeconds = time / 1000;

  let seconds = Math.floor(decimalSeconds);
  let milliseconds = Math.floor((decimalSeconds - seconds) * 1000);

  let minutes = Math.floor(seconds / 60);
  if (minutes > 0)
    seconds -= minutes * 60;

  return [minutes, seconds, milliseconds];
}

// Only the ScoreBoard class is public, the other views are private to the implementation.
exports = ScoreBoard;
