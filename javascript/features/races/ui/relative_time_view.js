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
    super(x, y, null /* color */, true /* trim */);

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

    this.positiveMarkOffset_ = -1.632;
    this.negativeMarkOffset_ = -1.232;
    this.markOffset_ = 0;
  }

  // Updates the time displayed by the relative time view to |time|. This may cause all views to be
  // recreated in certain circumstances.
  setTime(player, time) {
    let displaying = this.displaying;

    this.isPositive_ = time >= 0;

    let [minuteValue, secondValue, millisecondValue] = TimeView.distillTimeForDisplay(Math.abs(time));
    if (minuteValue.startsWith('0'))
      minuteValue = minuteValue.substr(1);

    if (minuteValue === '0' && secondValue.startsWith('0'))
      secondValue = secondValue.substr(1);

    let markOffset = this.determineMarkOffset(minuteValue, secondValue);

    let timeColor = this.isPositive_ ? TIME_BEHIND_COLOR : TIME_AHEAD_COLOR;
    let needsRefresh =
        displaying && ((timeColor != this.color) ||
                       (minuteValue !== '0' && !this.displayingMinutes) ||
                       (minuteValue === '0' && this.displayingMinutes));

    if (needsRefresh) {
      this.hideForPlayer(player);

      this.minuteView_ = null;
      this.secondView_ = null;
      this.millisecondView_ = null;
      this.separatorView_ = null;
    }

    if (this.markOffset_ != markOffset) {
      if (!needsRefresh) {
        this.positiveMark_.hideForPlayer(player);
        this.negativeMark_.hideForPlayer(player);
      }

      this.markOffset_ = markOffset;
      this.positiveMark_.position = [ this.position_[0] + markOffset + this.positiveMarkOffset_,
                                      this.positiveMark_.position[1] ];

      this.negativeMark_.position = [ this.position_[0] + markOffset + this.negativeMarkOffset_,
                                      this.negativeMark_.position[1] ];

      if (!needsRefresh) {
        if (this.isPositive_)
          this.positiveMark_.displayForPlayer(player);
        else
          this.negativeMark_.displayForPlayer(player);
      }
    }

    this.color = timeColor;

    this.updateTextForPlayer(player, minuteValue, secondValue, millisecondValue);

    if (needsRefresh)
      this.displayForPlayer(player);
  }

  // Determines the x-offset for the marker depending on |minuteValue| and |secondValue|. It needs
  // to closely prepend the first digit of the rendered time value.
  determineMarkOffset(minuteValue, secondValue) {
    if (minuteValue === '0') {
      if (secondValue.length == 1)
        return 19.595;  // 0.000

      return 14.496;  // 00.000
    }

    if (minuteValue.length == 1)
      return 6.065;  // 0:00.000

    return 0;  // 00:00.000
  }

  // Displays all elements belonging to this relative time view to |player|.
  displayForPlayer(player) {
    super.displayForPlayer(player);

    if (this.isPositive_)
      this.positiveMark_.displayForPlayer(player);
    else
      this.negativeMark_.displayForPlayer(player);
  }

  // Hides the relative time view and all owned elements from the player.
  hideForPlayer(player) {
    super.hideForPlayer(player);

    this.positiveMark_.hideForPlayer(player);
    this.negativeMark_.hideForPlayer(player);
  }
};

exports = RelativeTimeView;
