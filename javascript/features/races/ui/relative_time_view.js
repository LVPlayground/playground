// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let TimeView = require('features/races/ui/time_view.js');

// Color to use when a relative time should be displayed as a positive thing.
const TIME_AHEAD_COLOR = Color.GREEN;

// Color to use when a relative time should be displayed as a negative thing.
const TIME_BEHIND_COLOR = Color.RED;

// This is a view for displaying relative times, for example [+00.000] or [-00:00.000]. Positive
// times will be displayed in red, whereas negative times will be displayed in green, because they
// respectively indicate that the participant is doing worse or better.
class RelativeTimeView extends TimeView {
  constructor(x, y) {
    super(x, y);
  }

  setTime(player, time) {
    console.log('Update relative time: ' + time);

    this.updateTextForPlayer(player, ...TimeView.distillTimeForDisplay(Math.abs(time)));
  }
};

exports = RelativeTimeView;
