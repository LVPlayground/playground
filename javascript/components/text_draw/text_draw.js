// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let TextDrawManager = require('components/text_draw/text_draw_manager.js');

// Sensible maximum shadow size that may be used for a text draw.
const MAXIMUM_SHADOW_SIZE = 24;

// Returns whether |value| is an array having two values, both of which are numbers.
let isTwoNumberArray = value =>
    Array.isArray(value) && value.length == 2 && typeof value[0] === 'number' && typeof value[1] === 'number';

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
    this.font_ = null;

    this.textSize_ = null;
    this.letterSize_ = null;

    this.color_ = null;
    this.boxColor_ = null;

    this.shadowSize_ = null;
    this.shadowColor_ = null;

    if (!options)
      return;

    // If the |options| are defined, it must be an object.
    if (typeof options !== 'object' || Array.isArray(options))
      throw new Error('The options for a text draw must be an object.');

    // Walk through all available settings for the text-draw, then apply them using the setter.
    ['position', 'text', 'font', 'textSize', 'letterSize', 'color', 'boxColor', 'shadowSize', 'shadowColor'].forEach(property => {
      if (options.hasOwnProperty(property))
        this[property] = options[property];
    });
  }

  // Gets or sets the position of this text draw. It must be an array with two numbers that together
  // represent the position on the screen (X, Y) at which the text draw should be shown.
  get position() { return this.position_; }
  set position(value) {
    if (!isTwoNumberArray(value))
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

  // Gets or sets the font of a text draw. The value must be one of the FONT_* constants defined on
  // the TextDraw class. Custom fonts are not possible.
  get font() { return this.font_; }
  set font(value) {
    if (typeof value !== 'number' || value < 0 || value > TextDraw.FONT_PRICEDOWN)
      throw new Error('The font of a text draw must be set using one of the TextDraw.FONT_* constants.');

    this.font_ = value;
  }

  // Gets or sets the text size of the entire text draw. If a box is used for this draw, it will set
  // that size. The value must be an array with two numbers, representing the X and Y dimensions.
  get textSize() { return this.textSize_; }
  set textSize(value) {
    if (!isTwoNumberArray(value))
      throw new Error('The text size must be an array having the [X, Y] dimensions.');

    this.textSize_ = value;
  }

  // Gets or sets the letter size of the individual characters in the text draw. The value must be
  // an array with two numbers, representing the X and Y dimensions.
  get letterSize() { return this.letterSize_; }
  set letterSize(value) {
    if (!isTwoNumberArray(value))
      throw new Error('The letter size must be an array having the [X, Y] dimensions.');

    this.letterSize_ = value;
  }

  // Gets or sets the color of a text draw. The value must be an instance of the Color class
  // representing a certain, verified color.
  get color() { return this.color_; }
  set color(value) {
    if (!(value instanceof Color))
      throw new Error('The color of a text draw must be an instance of the Color class.');

    this.color_ = value;
  }

  // Gets or sets the box color of a text draw. The value must be an instance of the Color class
  // representing a certain, verified color.
  get boxColor() { return this.boxColor_; }
  set boxColor(value) {
    if (!(value instanceof Color))
      throw new Error('The box color of a text draw must be an instance of the Color class.');

    this.boxColor_ = value;
  }

  // Gets or sets the size of the shadow. This must be a number between 0 (invisible) and the
  // MAXIMUM_SHADOW_SIZE. The shadow may be cut off if it's too large for the containing box.
  get shadowSize() { return this.shadowSize_; }
  set shadowSize(value) {
    if (typeof value !== 'number' || value < 0 || value > MAXIMUM_SHADOW_SIZE)
      throw new Error('The shadow size of a text draw must be a number in range of [0, ' + MAXIMUM_SHADOW_SIZE + '].');

    this.shadowSize_ = value;
  }

  // Gets or sets the shadow (background) color of a text draw. The value must be an instance of the
  // Color class representing a certain, verified color.
  get shadowColor() { return this.shadowColor_; }
  set shadowColor(value) {
    if (!(value instanceof Color))
      throw new Error('The shadow color of a text draw must be an instance of the Color class.');

    this.shadowColor_ = value;
  }

  // Builds and displays the text draw to |player|. This method is a no-op if the text draw is
  // already being shown for the player.
  displayForPlayer(player) {
    let textDrawId = manager.createForPlayer(player, this);
    if (textDrawId === null)
      return true;  // |this| is already being displayed.

    if (this.font_ !== null)
      pawnInvoke('PlayerTextDrawFont', 'iii', player.id, textDrawId, this.font_);

    // TODO: PlayerTextDrawAlignment: Set the alignment of a player-textdraw.

    // TODO: PlayerTextDrawSetProportional: Scale the text spacing in a player-textdraw to a proportional ratio.

    // TODO: PlayerTextDrawUseBox: Toggle the box on a player-textdraw.

    if (this.textSize_ !== null)
      pawnInvoke('PlayerTextDrawLetterSize', 'iiff', player.id, textDrawId, ...this.textSize_);

    if (this.letterSize_ !== null)
      pawnInvoke('PlayerTextDrawLetterSize', 'iiff', player.id, textDraw, ...this.letterSize_);

    if (this.color_ !== null)
      pawnInvoke('PlayerTextDrawColor', 'iii', player.id, textDrawId, this.color_.asNumber());

    if (this.boxColor_ !== null)
      pawnInvoke('PlayerTextDrawBoxColor', 'iii', player.id, textDrawId, this.boxColor_.asNumber());

    // TODO: PlayerTextDrawSetOutline: Toggle the outline on a player-textdraw.

    if (this.shadowSize_ !== null)
      pawnInvoke('PlayerTextDrawSetShadow', 'iii', player.id, textDrawId, this.shadowSize_);

    if (this.shadowColor_ !== null)
      pawnInvoke('PlayerTextDrawBackgroundColor', 'iii', player.id, textDrawId, this.shadowColor_.asNumber());

    // TODO: PlayerTextDrawSetSelectable: Sets whether a player-textdraw is selectable through SelectTextDraw

    // TODO: PlayerTextDrawSetPreviewModel: Set model ID of a 3D player textdraw preview.

    // TODO: PlayerTextDrawSetPreviewRot: Set rotation of a 3D player textdraw preview.

    // TODO: PlayerTextDrawSetPreviewVehCol: Set the colours of a vehicle in a 3D player textdraw preview.

    pawnInvoke('PlayerTextDrawShow', 'ii', player.id, textDrawId);
    return true;
  }

  // Hides the text draw from |player| their screen if it's currently being shown.
  hideForPlayer(player) {
    return manager.hideForPlayer(player, this);
  }
};

// The fonts that may be used with a text draw.
TextDraw.FONT_CLASSIC = 0;
TextDraw.FONT_SANS_SERIF = 1;
TextDraw.FONT_MONOSPACE = 2;
TextDraw.FONT_PRICEDOWN = 3;

exports = TextDraw;
