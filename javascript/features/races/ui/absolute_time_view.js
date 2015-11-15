// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let TimeView = require('features/races/ui/time_view.js');

// This is a time view that can be used to draw time in the format of [00:00.000] with consistent
// spacing regardless of the value and without having to rely on ugly proportional text rendering.
class AbsoluteTimeView extends TimeView {
  constructor(x, y) {
    super(x, y, false /* trim */);
  }

  setTime(player, time) {
    this.updateTextForPlayer(player, ...TimeView.distillTimeForDisplay(time));
  }
};

exports = AbsoluteTimeView;
