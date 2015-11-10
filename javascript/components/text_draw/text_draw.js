// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let TextDrawManager = require('components/text_draw/text_draw_manager.js');

// Create an instance of the text draw manager that will do our bookkeeping.
let manager = new TextDrawManager();

// Represents a text draw region that can be shown to a player. There is no limit to the amount of
// text draws that can be created, however, at most 256 can be presented to a player at any given
// time. All text draws will use SA-MP's per-player text draw instances.
//
// There are no required parameters for a text draw, but many optional ones. Multiple text draws can
// be used to create a user interface of sorts.
//
// The coordinate space of text-draws assumes a screen resolution of 640x480 pixels, regardless of
// the actual resolution of the player's screen, with the origin being in the top-left corner.
class TextDraw {
  constructor(options) {
    this.position_ = [10, 10];
    this.text_ = ' ';

    if (!options)
      return;

    // If the |options| are defined, it must be an object.
    if (typeof options !== 'object' || Array.isArray(options))
      throw new Error('The options for a text draw must be an object.');

    // Walk through all available settings for the text-draw, then apply them using the setter.
    if (options.hasOwnProperty('position'))
      this.position = options.position;
    if (options.hasOwnProperty('text'))
      this.text = options.text;
  }

  // Gets or sets the position of this text draw. It must be an array with two numbers that together
  // represent the position on the screen (X, Y) at which the text draw should be shown.
  get position() { return this.position_; }
  set position(value) {
    if (!Array.isArray(value) || value.length != 2 || typeof value[0] !== 'number' || typeof value[1] !== 'number')
      throw new Error('The position must be an array having the [X, Y] coordinates.');

    this.position_ = value;
  }

  // Gets or sets the text of this text draw. The text must be at least a single character in length
  // as the SA-MP server lacks sensible error checking.
  get text() { return this.text_; }
  set text(value) {
    if (value === null || value === undefined)
      throw new Error('The text of a text draw must not be null or undefined.');

    value = value.toString();
    value = value.trimRight();

    if (value.length == 0)
      throw new Error('The text of a text draw must not be empty.');

    this.text_ = value;
  }

  // Builds and displays the text draw to |player|. This method is a no-op if the text draw is
  // already being shown for the player.
  displayForPlayer(player) {
    let textDrawId = manager.createForPlayer(player, this);
    if (textDrawId === null)
      return true;  // |this| is already being displayed.

    // ...

    pawnInvoke('PlayerTextDrawShow', 'ii', player.id, textDrawId);
    return true;
  }

  // Hides the text draw from |player| their screen if it's currently being shown.
  hideForPlayer(player) {
    return manager.hideForPlayer(player, this);
  }
};

exports = TextDraw;
