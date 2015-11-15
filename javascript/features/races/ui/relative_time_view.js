// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let TextDraw = require('components/text_draw/text_draw.js'),
    TimeView = require('features/races/ui/time_view.js');

// Color to use when a relative time should be displayed as a positive thing.
const TIME_AHEAD_COLOR = Color.GREEN;

// Color to use when a relative time should be displayed as a negative thing.
const TIME_BEHIND_COLOR = Color.RED;

// This is a view for displaying relative times, for example [+00.000] or [-00:00.000]. Positive
// times will be displayed in red, whereas negative times will be displayed in green, because they
// respectively indicate that the participant is doing worse or better.
class RelativeTimeView extends TimeView {
  constructor(x, y) {
    super(x, y, true /* trim */);

    this.isPositive_ = true;

    // The + character that might be prepended to a relative time.
    this.positiveMark_ = new TextDraw({
      position: [x - 1.632, y - 0.236],
      alignment: TextDraw.ALIGN_RIGHT,

      text: '+',
      font: TextDraw.FONT_SANS_SERIF,
      color: TIME_BEHIND_COLOR,
      letterSize: [0.227, 1.08],
      shadowSize: 0
    });

    // The - character that might be prepended to a relative time.
    this.negativeMark_ = new TextDraw({
      position: [x - 1.232, y - 0.73],
      alignment: TextDraw.ALIGN_RIGHT,

      text: '-',
      font: TextDraw.FONT_CLASSIC,
      letterSize: [0.274, 1.144],
      color: TIME_AHEAD_COLOR,
      shadowSize: 0
    });
  }

  setTime(player, time) {
    let displaying = this.displaying;

    this.isPositive_ = time >= 0;

    let [minuteValue, secondValue, millisecondValue] = TimeView.distillTimeForDisplay(Math.abs(time));
    if (minuteValue == '00' && secondValue.startsWith('0'))
      secondValue = secondValue.substr(1);

    let timeColor = this.isPositive_ ? TIME_BEHIND_COLOR : TIME_AHEAD_COLOR;
    let needsRefresh =
        displaying && ((timeColor != this.color) ||
                       (minuteValue != '00' && !this.displayingMinutes) ||
                       (minuteValue == '00' && this.displayingMinutes));

    if (needsRefresh) {
      this.hideForPlayer(player);

      this.minuteView_ = null;
      this.secondView_ = null;
      this.millisecondView_ = null;
      this.separatorView_ = null;
    }

    this.color = timeColor;

    this.updateTextForPlayer(player, minuteValue, secondValue, millisecondValue);

    if (needsRefresh)
      this.displayForPlayer(player);
  }

  displayForPlayer(player) {
    super.displayForPlayer(player);

    if (this.isPositive_)
      this.positiveMark_.displayForPlayer(player);
    else
      this.negativeMark_.displayForPlayer(player);
  }

  hideForPlayer(player) {
    super.hideForPlayer(player);

    this.positiveMark_.hideForPlayer(player);
    this.negativeMark_.hideForPlayer(player);
  }
};

exports = RelativeTimeView;
