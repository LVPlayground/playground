// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// A color instance defines a color that can be used for text, background or other features. The
// internal representation separates red, green, blue and the alpha channel, but it can be exported
// in various formats.
class Color {
  constructor(r, g, b, a = 255) {
    this.r_ = r;
    this.g_ = g;
    this.b_ = b;
    this.a_ = a;
  }

  // Exports the color as a 32-bit number. This is the format that most SA-MP APIs expect. When
  // using the value as a 32-bit signed number, it may appear to be negative.
  asNumber() {
    return (this.r_ << 24) + (this.g_ << 16) + (this.b_ << 8) + this.a_;
  }
};

// Define common colors as static properties on the Color class.
Color.RED = new Color(255, 0, 0);
Color.GREEN = new Color(0, 255, 0);
Color.BLUE = new Color(0, 0, 255);

// Define the Color object on the global object.
global.Color = Color;
