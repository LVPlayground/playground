// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { TextDraw } from 'components/text_draw/text_draw.js';

// This is a time view that can be used to draw time in the format of [00:00.000] with consistent
// spacing regardless of the value and without having to rely on ugly proportional text rendering.
export class TimeView {
    constructor(x, y, color, trim) {
        this.position_ = [x, y];
        this.color_ = color;
        this.trim_ = trim;

        this.displaying_ = false;
        this.displayingMinutes_ = false;

        this.minuteValue_ = '00';
        this.minuteView_ = null;

        this.secondValue_ = '00';
        this.secondView_ = null;

        this.millisecondValue_ = '000';
        this.millisecondView_ = null;

        this.separatorView_ = null;
    }

    // Returns the [x, y] position of the absolute time view.
    get position() { return this.position_; }

    // Returns or updates the color of the time view. May return NULL.
    get color() { return this.color_; }
    set color(value) { this.color_ = value; }

    // Returns whether the time view is currently being displayed.
    get displaying() { return this.displaying_; }

    // Returns whether minutes are currently being displayed on the board.
    get displayingMinutes() { return this.displayingMinutes_; }

    // Returns whether the required views exists. Check the second field as the minute field may be
    // optional when certain flags were supplied.
    hasViews() { return this.secondView_ !== null; }

    // Builds the views required to display the time.
    buildViews() {
        let displayMinutes = !this.trim_ || (this.minuteValue_ != '00' && this.minuteValue_ != '0');
        let [x, y] = this.position_;

        if (displayMinutes)
            this.minuteView_ = this.buildDigitView(x + 10.7, y, this.minuteValue_, TextDraw.ALIGN_RIGHT);

        this.secondView_ = this.buildDigitView(x + 24.733, y, this.secondValue_, TextDraw.ALIGN_RIGHT);
        this.millisecondView_ = this.buildDigitView(x + 26.8, y, this.millisecondValue_);

        let separatorOptions = {
            position: [x + 10.8 + (displayMinutes ? 0 : .15), y - 0.15],

            text: displayMinutes ? ':____.' : '_____.',
            font: TextDraw.FONT_PRICEDOWN,
            letterSize: [0.185, 1.007],
            shadowSize: 0
        };

        if (this.color_ !== null)
            separatorOptions.color = this.color_;

        this.separatorView_ = new TextDraw(separatorOptions);
        this.displayingMinutes_ = displayMinutes;
    }

    // Builds an individual digit view at position [x, y] and returns the created view.
    buildDigitView(x, y, value, alignment = null) {
        let options = {
            position: [x, y],

            text: value,
            font: TextDraw.FONT_PRICEDOWN,
            letterSize: [0.272, 1.007],
            shadowSize: 0
        };

        if (alignment !== null)
            options.alignment = alignment;

        if (this.color_ !== null)
            options.color = this.color_;

        return new TextDraw(options);
    }

    setTime() { /* no-op by default, must be overridden */ }

    // Displays the time view to |player|. Builds the views if they haven't been created yet.
    displayForPlayer(player) {
        if (!this.hasViews())
            this.buildViews();

        if (this.minuteView_)
            this.minuteView_.displayForPlayer(player);

        this.secondView_.displayForPlayer(player);
        this.millisecondView_.displayForPlayer(player);

        this.separatorView_.displayForPlayer(player);

        this.displaying_ = true;
    }

    // Updates the text of this time view for |player|. If the time view is currently being displayed
    // to the player, the live version will be updated for them as well.
    updateTextForPlayer(player, minuteValue, secondValue, millisecondValue) {
        this.minuteValue_ = minuteValue;
        this.secondValue_ = secondValue;
        this.millisecondValue_ = millisecondValue;

        if (this.displaying_) {
            if (this.minuteView_)
                this.minuteView_.updateTextForPlayer(player, minuteValue);

            this.secondView_.updateTextForPlayer(player, secondValue);
            this.millisecondView_.updateTextForPlayer(player, millisecondValue);
        }
    }

    // Hides the time view for |player|.
    hideForPlayer(player) {
        if (!this.displaying_)
            return;

        this.displaying_ = false;

        this.separatorView_.hideForPlayer(player);

        this.millisecondView_.hideForPlayer(player);
        this.secondView_.hideForPlayer(player);

        if (this.minuteView_)
            this.minuteView_.hideForPlayer(player);
    }

    // Splits up |time|, which should be in milliseconds, to a rounded number of minutes, seconds and
    // milliseconds which could be used for presentation.
    static distillTimeForDisplay(time, forceDoubleDigit = true) {
        let decimalSeconds = time / 1000;

        let seconds = Math.floor(decimalSeconds);
        let milliseconds = Math.floor((decimalSeconds - seconds) * 1000);

        let minutes = Math.floor(seconds / 60);
        if (minutes > 0)
            seconds -= minutes * 60;

        let fixMinuteDigits = forceDoubleDigit,
            fixSecondDigits = forceDoubleDigit || minutes > 0;

        let minuteValue = ((fixMinuteDigits && minutes < 10) ? '0' : '') + minutes,
            secondValue = ((fixSecondDigits && seconds < 10) ? '0' : '') + seconds,
            millisecondValue = (milliseconds < 100 ? (milliseconds < 10 ? '00' : '0') : '') + milliseconds;

        return [minuteValue, secondValue, millisecondValue];
    }
};
