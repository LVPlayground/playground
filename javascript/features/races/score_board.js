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
//
// The ScoreBoard class implements the following user interface:
//
//     =============================
//     =     __                    =
//     =  ## |  |       00:00.000  =
//     =  ## |__|  PR: +00:00.000  =
//     =                           =
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
// Colors will be applied to times to clarify whether it's a good thing or a bad thing. For the
// player's personal record, negative values are good (they're beating it!), whereas for the times
// between them and other players, positive values are good (they're ahead of them!) This may be
// confusing for new players, at least initially, but I do think it makes sense.
class ScoreBoard {
  constructor(player, participants) {
    this.player_ = player;

    // TODO: Calculate the height of the background area based on the number of participants.
    this.background_ = new Rectangle(500, 140, 106, 200, BACKGROUND_COLOR);

    // Section (1): Position, current time and difference from the player's personal best.

    this.positionValue_ = new TextDraw({
      position: [505, 143],

      text: '1',
      font: TextDraw.FONT_PRICEDOWN,
      letterSize: [0.582, 2.446],
      shadowSize: 0
    });

    this.positionSuffix_ = new TextDraw({
      position: [516, 145.225],

      text: 'st',
      font: TextDraw.FONT_MONOSPACE,
      letterSize: [0.177, 0.97],
      shadowSize: 0
    });

    this.timeValue_ = new TextDraw({
      position: [556.5, 145.5],

      text: '00:00.000',
      font: TextDraw.FONT_PRICEDOWN,
      letterSize: [0.263, 1.036],
      shadowSize: 0
    });

    // TODO: Only display the personal record data when available.
    this.personalRecordLabel_ = new TextDraw({
      position: [538, 153.6],

      text: 'pr',
      font: TextDraw.FONT_MONOSPACE,
      letterSize: [0.205, 1.235],
      shadowSize: 0
    });

    this.personalRecordValue_ = new TextDraw({
      position: [599.9, 154.726],

      text: '+ 00:00.000',
      font: TextDraw.FONT_PRICEDOWN,
      letterSize: [0.263, 1.036],
      shadowSize: 0,
      alignment: TextDraw.ALIGN_RIGHT
    });

    // Section (2): Positions and time differences for up to three other players.

    // TODO: Figure these out from |contestants|.
    let playerNames = [
      'Luka_Bulum',
      '[MVP]_Nikola_',
      'T_Bone_Johnson'
    ];

    this.rankingNames_ = new TextDraw({
      position: [505, 178],

      text: '1. ' + playerNames.join('~n~~n~~n~2. '),
      font: TextDraw.FONT_SANS_SERIF,
      letterSize: [0.16, 0.887],
      shadowSize: 0
    });
  }

  // Displays the score board for the player. All (initial) values for the texts should've been set.
  displayForPlayer() {
    this.background_.displayForPlayer(this.player_);

    this.positionValue_.displayForPlayer(this.player_);
    this.positionSuffix_.displayForPlayer(this.player_);
    this.timeValue_.displayForPlayer(this.player_);
    this.personalRecordLabel_.displayForPlayer(this.player_);
    this.personalRecordValue_.displayForPlayer(this.player_);

    this.rankingNames_.displayForPlayer(this.player_);
    // TODO: Show text draws that are part of section (2).
  }

  // Hides all the text draws that are part of this score board for the player. Generally done when
  // the race ends for them. Garbage collection will take care of deleting the objects.
  hideForPlayer() {
    // TODO: Hide text draws that are part of section (2).
    this.rankingNames_.hideForPlayer(this.player_);

    this.personalRecordValue_.hideForPlayer(this.player_);
    this.personalRecordLabel_.hideForPlayer(this.player_);
    this.timeValue_.hideForPlayer(this.player_);
    this.positionSuffix_.displayForPlayer(this.player_);
    this.positionValue_.hideForPlayer(this.player_);

    this.background_.hideForPlayer(this.player_);
  }

  // Called every few hundred milliseconds while the race is active. Gives us the opportunity to
  // update the running counter on a player's screen.
  update(runningTime) {
    this.timeValue_.updateTextForPlayer(this.player_, ScoreBoard.formatTime(runningTime, true));
  }

  // -----------------------------------------------------------------------------------------------

  // Formats |time|, in milliseconds, as a human readable value formatted as MM:SS.XXX. The minute
  // counter will be omitted when zero, unless |alwaysShowMinuteCounter| is set.
  static formatTime(time, alwaysShowMinuteCounter) {
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
