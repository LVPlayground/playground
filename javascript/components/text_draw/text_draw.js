// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Sensible maximum shadow size that may be used for a text draw.
const MAXIMUM_SHADOW_SIZE = 24;

// Returns whether |value| is an array having two values, both of which are numbers.
let isTwoNumberArray = value =>
    Array.isArray(value) && value.length == 2 && typeof value[0] === 'number' && typeof value[1] === 'number';

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

    this.useBox_ = null;

    this.text_ = ' ';
    this.font_ = null;

    this.alignment_ = null;
    this.proportional_ = null;

    this.textSize_ = null;
    this.letterSize_ = null;

    this.color_ = null;
    this.boxColor_ = null;

    this.outlineSize_ = null;
    this.shadowSize_ = null;
    this.shadowColor_ = null;

    this.selectable_ = null;

    if (!options)
      return;

    // If the |options| are defined, it must be an object.
    if (typeof options !== 'object' || Array.isArray(options))
      throw new Error('The options for a text draw must be an object.');

    // Walk through all available settings for the text-draw, then apply them using the setter.
    ['position', 'useBox', 'text', 'font', 'alignment', 'proportional', 'textSize', 'letterSize', 'color', 'boxColor', 'outlineSize', 'shadowSize', 'shadowColor', 'selectable'].forEach(property => {
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

  // Gets or sets whether a box should be used for displaying this text draw. When set, a background
  // will be added to the size of the text draw.
  get useBox() { return this.useBox_; }
  set useBox(value) {
    if (typeof value !== 'boolean')
      throw new Error('The useBox of a text draw must be set using a boolean.');

    this.useBox_ = value;
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

  // Updates the text of the text draw to |value|. If the text draw is being displayed to |player|,
  // the visible state on their screen will be updated as well.
  updateTextForPlayer(player, text) {
    let textDrawId = server.textDrawManager.getForPlayer(player, this);
    if (textDrawId !== null)
      pawnInvoke('PlayerTextDrawSetString', 'iis', player.id, textDrawId, text);
  }

  // Gets or sets the font of a text draw. The value must be one of the FONT_* constants defined on
  // the TextDraw class. Custom fonts are not possible.
  get font() { return this.font_; }
  set font(value) {
    if (typeof value !== 'number' || value < 0 || value > TextDraw.FONT_TEXTURE)
      throw new Error('The font of a text draw must be set using one of the TextDraw.FONT_* constants.');

    this.font_ = value;
  }

  // Gets or sets the alignment of the text. This must be one of the ALIGN_* constants defined on
  // the TextDraw class. This may affect the positioning of the text draw itself.
  get alignment() { return this.alignment_; }
  set alignment(value) {
    if (typeof value !== 'number' || value < 1 || value > TextDraw.ALIGN_RIGHT)
      throw new Error('The alignment of a text draw must be set using one of the TextDraw.ALIGN_* constants.');

    this.alignment_ = value;
  }

  // Gets or sets whether the text draw should scale text according to a proportional ratio. Must
  // be a boolean value.
  get proportional() { return this.proportional_; }
  set proportional(value) {
    if (typeof value !== 'boolean')
      throw new Error('The proportionality of a text draw must be set using a boolean.');

    this.proportional_ = value;
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

  // Gets or sets the outline size of the text draw. This must be a number between 0 (no outline)
  // and MAXIMUM_SHADOW_SIZE. The outline's color can be changed using the shadowColor property.
  get outlineSize() { return this.outlineSize_; }
  set outlineSize(value) {
    if (typeof value !== 'number' || value < 0 || value > MAXIMUM_SHADOW_SIZE)
      throw new Error('The outline size of a text draw must be a number in range of [0, ' + MAXIMUM_SHADOW_SIZE + '].');

    this.outlineSize_ = value;
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

  // Gets or sets whether the
  get selectable() { return this.selectable_; }
  set selectable(value) { this.selectable_ = value; }

  // Builds and displays the text draw to |player|. This method is a no-op if the text draw is
  // already being shown for the player.
  displayForPlayer(player) {
    let textDrawId = server.textDrawManager.createForPlayer(player, this);
    if (textDrawId === null)
      return true;  // |this| is already being displayed.

    if (this.font_ !== null)
      pawnInvoke('PlayerTextDrawFont', 'iii', player.id, textDrawId, this.font_);

    if (this.alignment_ !== null)
      pawnInvoke('PlayerTextDrawAlignment', 'iii', player.id, textDrawId, this.alignment_);

    if (this.proportional_ !== null)
      pawnInvoke('PlayerTextDrawSetProportional', 'iii', player.id, textDrawId, this.proportional_ ? 1 : 0);

    if (this.useBox_ !== null)
      pawnInvoke('PlayerTextDrawUseBox', 'iii', player.id, textDrawId, this.useBox_ ? 1 : 0);

    if (this.textSize_ !== null)
      pawnInvoke('PlayerTextDrawTextSize', 'iiff', player.id, textDrawId, ...this.textSize_);

    if (this.letterSize_ !== null)
      pawnInvoke('PlayerTextDrawLetterSize', 'iiff', player.id, textDrawId, ...this.letterSize_);

    if (this.color_ !== null)
      pawnInvoke('PlayerTextDrawColor', 'iii', player.id, textDrawId, this.color_.toNumberRGBA());

    if (this.boxColor_ !== null)
      pawnInvoke('PlayerTextDrawBoxColor', 'iii', player.id, textDrawId, this.boxColor_.toNumberRGBA());

    if (this.outlineSize_ !== null)
      pawnInvoke('PlayerTextDrawSetOutline', 'iii', player.id, textDrawId, this.outlineSize_);

    if (this.shadowSize_ !== null)
      pawnInvoke('PlayerTextDrawSetShadow', 'iii', player.id, textDrawId, this.shadowSize_);

    if (this.shadowColor_ !== null)
      pawnInvoke('PlayerTextDrawBackgroundColor', 'iii', player.id, textDrawId, this.shadowColor_.toNumberRGBA());

    if (this.selectable_ !== null)
      pawnInvoke('PlayerTextDrawSetSelectable', 'iii', player.id, textDrawId, this.selectable_ ? 1 : 0);

    // TODO: PlayerTextDrawSetPreviewModel: Set model ID of a 3D player textdraw preview.

    // TODO: PlayerTextDrawSetPreviewRot: Set rotation of a 3D player textdraw preview.

    // TODO: PlayerTextDrawSetPreviewVehCol: Set the colours of a vehicle in a 3D player textdraw preview.

    pawnInvoke('PlayerTextDrawShow', 'ii', player.id, textDrawId);
    return true;
  }

  // Called when the player has clicked on the text draw. Only applicable if it's selectable.
  onClick(player) {
    console.log('ERROR: The text draw [' + this.text_ + '] has no onClick() handler.');
  }

  // Hides the text draw from |player| their screen if it's currently being shown.
  hideForPlayer(player) {
    return server.textDrawManager.hideForPlayer(player, this);
  }
};

// The fonts that may be used with a text draw.
TextDraw.FONT_CLASSIC = 0;
TextDraw.FONT_SANS_SERIF = 1;
TextDraw.FONT_MONOSPACE = 2;
TextDraw.FONT_PRICEDOWN = 3;
TextDraw.FONT_TEXTURE = 4;

// The alignment values that may be used with a text draw.
TextDraw.ALIGN_LEFT = 1;
TextDraw.ALIGN_CENTER = 2;
TextDraw.ALIGN_RIGHT = 3;

export default TextDraw;
