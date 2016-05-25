// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const TextDraw = require('components/text_draw/text_draw.js');

// Represents a rectangular text draw that can be displayed on the player's screen. There is no text
// on the rectangle, it only has a set position, size and color.
//
// Please don't ask me why the calculations in this class work. I don't know. I ended up with this
// after a fair amount of trail and error, but it seems to work reliably despite the documentation
// pointing out that these are entirely the wrong values.
class Rectangle extends TextDraw {
  constructor(x, y, width, height, color) {
    super({
      position: [x, y],
      textSize: [x + width, 1],
      letterSize: [1, Math.pow((height - 3) / 10, 1.0122)],
      alignment: TextDraw.ALIGN_LEFT,
      
      useBox: true,
      boxColor: color,
      text: '_'
    });
  }
};

exports = Rectangle;
