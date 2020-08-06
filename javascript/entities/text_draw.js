// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Supplementable } from 'base/supplementable.js';

// Implementation of the TextDraw entity. They are either locked to a particular player or global to
// the server, which is abstracted through the TextDrawNativesInterface interface in the
// `text_draw_natives.js` file. Text draws should only be created through the TextDrawManager.
export class TextDraw extends Supplementable {
    // ID assigned to invalid TextDraws, both the default value and after destroying it.
    static kInvalidId = -1;

    // Possible alignment values for text draws.
    static kAlignLeft = 1;
    static kAlignCenter = 2;
    static kAlignRight = 3;

    // Possible values for the font of a text draw.
    static kFontClassic = 0;
    static kFontModelPreview = 5;
    static kFontMonospace = 2;
    static kFontPricedown = 3;
    static kFontSansSerif = 1;
    static kFontTexture = 4;

    #id_ = TextDraw.kInvalidId;
    #manager_ = null;
    #natives_ = null;
    #position_ = null;
    #selectable_ = false;
    #text_ = null;

    #alignment_ = TextDraw.kAlignLeft;
    #font_ = TextDraw.kFontSansSerif;
    #letterSize_ = null;
    #proportional_ = true;
    #textSize_ = null;

    #backgroundColor_ = null;
    #boxColor_ = null;
    #color_ = null;

    #box_ = false;
    #outline_ = 0;
    #shadow_ = 2;

    #previewModel_ = null;
    #previewRotation_ = null;
    #previewScale_ = null;
    #previewVehicleColor_ = null;

    constructor(manager, natives) {
        super();

        this.#manager_ = manager;
        this.#natives_ = natives;
    }

    initialize(position, text, options) {
        this.#position_ = position;
        this.#text_ = text;

        // Create the actual text draw on the server based on the given settings.
        this.#id_ = this.#natives_.create(position[0], position[1], text);

        // Apply each of the given |options| to the text draw on the server. NULL and undefined
        // values will be ignored in the loop, all others will pass through.
        for (const [ property, value ] of Object.entries(options)) {
            if (!TextDraw.prototype.hasOwnProperty(property))
                throw new Error(`Invalid text draw property given: ${property}.`);

            if (value === undefined || value === null)
                continue;  // ignore it

            this[property] = value;
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Section: identity & behaviour
    // ---------------------------------------------------------------------------------------------

    get id() { return this.#id_; }

    isConnected() { return this.#id_ !== TextDraw.kInvalidId; }

    get position() { return this.#position_; }
    set position(value) { throw new Error(`Position is immutable, create a new text instead.`); }

    get selectable() { return this.#selectable_; }
    set selectable(value) {
        if (this.#selectable_ === value)
            return;

        this.#selectable_ = !!value;
        this.#natives_.setSelectable(this.#id_, value);
    }

    get text() { return this.#text_; }
    set text(value) {
        if (this.#text_ === value)
            return;

        this.#text_ = value;
        this.#natives_.setString(this.#id_, value);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: interaction
    // ---------------------------------------------------------------------------------------------

    displayForAll() { this.#natives_.displayForAll(); }
    displayForPlayer(player) { this.#natives_.displayForPlayer(player); }

    hideForAll() { return this.#natives_.hideForAll(); }
    hideForPlayer(player) { this.#natives_.hideForPlayer(player); }

    // ---------------------------------------------------------------------------------------------
    // Section: text & positioning
    // ---------------------------------------------------------------------------------------------

    get alignment() { return this.#alignment_; }
    set alignment(value) {
        if (this.#alignment_ === value)
            return;

        this.#alignment_ = value;
        this.#natives_.setAlignment(this.#id_, value);
    }

    get font() { return this.#font_; }
    set font(value) {
        if (this.#font_ === value)
            return;

        this.#font_ = value;
        this.#natives_.setFont(this.#id_, value);
    }

    get letterSize() { return this.#letterSize_; }
    set letterSize(value) {
        this.#letterSize_ = value;
        this.#natives_.setLetterSize(this.#id_, value[0], value[1]);
    }

    get proportional() { return this.#proportional_; }
    set proportional(value) {
        if (this.#proportional_ === value)
            return;

        this.#proportional_ = !!value;
        this.#natives_.setProportional(this.#id_, value);
    }

    get textSize() { return this.#textSize_; }
    set textSize(value) {
        this.#textSize_ = value;
        this.#natives_.setTextSize(this.#id_, value[0], value[1]);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: colouring
    // ---------------------------------------------------------------------------------------------

    get backgroundColor() { return this.#backgroundColor_; }
    set backgroundColor(value) {
        this.#backgroundColor_ = value;
        this.#natives_.setBackgroundColor(this.#id_, value);
    }

    get boxColor() { return this.#boxColor_; }
    set boxColor(value) {
        this.#boxColor_ = value;
        this.#natives_.setBoxColor(this.#id_, value);
    }

    get color() { return this.#color_; }
    set color(value) {
        this.#color_ = value;
        this.#natives_.setColor(this.#id_, value);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: box
    // ---------------------------------------------------------------------------------------------

    get box() { return this.#box_; }
    set box(value) {
        if (this.#box_ === value)
            return;

        this.#box_ = !!value;
        this.#natives_.setBox(this.#id_, value);
    }

    get outline() { return this.#outline_; }
    set outline(value) {
        if (this.#outline_ === value)
            return;

        this.#outline_ = value;
        this.#natives_.setOutline(value);
    }

    get shadow() { return this.#shadow_; }
    set shadow(value) {
        if (this.#shadow_ === value)
            return;

        this.#shadow_ = value;
        this.#natives_.setShadow(this.#id_, value);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: preview
    // ---------------------------------------------------------------------------------------------

    get previewModel() { return this.#previewModel_; }
    set previewModel(value) {
        if (this.#previewModel_ === value)
            return;

        this.#previewModel_ = value;
        this.#natives_.setPreviewModel(this.#id_, value);
    }

    get previewRotation() { return this.#previewRotation_; }
    set previewRotation(value) {
        this.#previewRotation_ = value;
        if (this.#previewScale_ !== null && value !== null) {
            this.#natives_.setPreviewRotation(
                this.#id_, this.#previewRotation_, this.#previewScale_);
        }
    }

    get previewScale() { return this.#previewScale_; }
    set previewScale(value) {
        this.#previewScale_ = value;
        if (this.#previewRotation_ !== null && value !== null) {
            this.#natives_.setPreviewRotation(
                this.#id_, this.#previewRotation_, this.#previewScale_);
        }
    }

    get previewVehicleColor() { return this.#previewVehicleColor_; }
    set previewVehicleColor(value) {
        this.#previewVehicleColor_ = value;
        if (value !== null)
            this.#natives_.setPreviewVehicleColors(this.#id_, value, value);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        if (this.isConnected())
            this.#natives_.destroy(this.#id_);

        this.#id_ = TextLabel.kInvalidId;
        this.#natives_ = null;

        this.#manager_.didDisposeTextDraw(this);
        this.#manager_ = null;
    }

    // ---------------------------------------------------------------------------------------------

    toString() { return `[object TextDraw(${this.#id_}, ${this.#text_})]`; }
}
