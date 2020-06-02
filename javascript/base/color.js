// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Private symbol ensuring that the Color constructor won't be used.
const PrivateSymbol = Symbol('Please use the static methods.');

// A color instance defines a color that can be used for text, background or other features. The
// internal representation separates red, green, blue and the alpha channel, but it can be exported
// in various formats.
class Color {
    // Create a new Color instance based on the |r|, |g|, |b| channels.
    static fromRGB(r, g, b) {
        return new Color(PrivateSymbol, r, g, b, 255);
    }

    // Create a new Color instance based on the |r|, |g|, |b|, |a| channels.
    static fromRGBA(r, g, b, a) {
        return new Color(PrivateSymbol, r, g, b, a);
    }

    // Create a new Color instance based on the |number|, which must be in 0xRRGGBB format.
    static fromNumberRGB(number) {
        return new Color(PrivateSymbol, (number >> 16) & 0xFF, (number >> 8) & 0xFF,
                         number & 0xFF, 255);
    }

    // Create a new Color instance based on the |number|, which must be in 0xRRGGBBAA format. This
    // is the number format used by San Andreas: Multiplayer.
    static fromNumberRGBA(number) {
        return new Color(PrivateSymbol,
                         (number >> 24) & 0xFF, (number >> 16) & 0xFF,
                         (number >> 8) & 0xFF, (number) & 0xFF);
    }

    // Create a new Color instance based on the |hex| string.
    static fromHex(hex, alpha = 255) {
        return new Color(PrivateSymbol,
                         parseInt(hex.substr(0, 2), 16), parseInt(hex.substr(2, 2), 16),
                         parseInt(hex.substr(4, 2), 16), parseInt(hex.substr(6, 2), 16) || alpha);
    }

    // Constructor of the Color class. Not to be used except by the public static methods above.
    constructor(privateSymbol, r, g, b, a) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal constructor. Use the static methods instead.');

        this.r_ = r & 0xFF;
        this.g_ = g & 0xFF;
        this.b_ = b & 0xFF;
        this.a_ = a & 0xFF;
    }

    // Gets the red component of the stored color.
    get r() { return this.r_; }

    // Gets the green component of the stored color.
    get g() { return this.g_; }

    // Gets the blue component of the stored color.
    get b() { return this.b_; }

    // Gets the alpha component of the stored number.
    get a() { return this.a_; }

    // Exports the color as a 32-bit number in RGB format.
    toNumberRGB() {
        return (this.r_ << 16) + (this.g_ << 8) + this.b_;
    }

    // Exports the color as a 32-bit number in RGBA format. This is the format that most SA-MP APIs
    // expect. When using the value as a 32-bit signed number, it may appear to be negative.
    toNumberRGBA() {
        return (this.r_ << 24) + (this.g_ << 16) + (this.b_ << 8) + this.a_;
    }

    // Exports the color as an RGB HEX string. This is the format to use in chat messages.
    toHexRGB() {
        return (('0' + this.r_.toString(16)).substr(-2) +
                ('0' + this.g_.toString(16)).substr(-2) +
                ('0' + this.b_.toString(16)).substr(-2)).toUpperCase();
    }

    // Exports the color as an RGBA HEX string.
    toHexRGBA() {
        return (('0' + this.r_.toString(16)).substr(-2) +
                ('0' + this.g_.toString(16)).substr(-2) +
                ('0' + this.b_.toString(16)).substr(-2) +
                ('0' + this.a_.toString(16)).substr(-2)).toUpperCase();
    }

    // Returns the current color with the given |alpha| channel.
    withAlpha(alpha) {
        return new Color(PrivateSymbol, this.r_, this.g_, this.b_, alpha);
    }
};

// Define common colors as static properties on the Color class.
Color.BLUE = Color.fromRGB(0, 0, 255);
Color.GREEN = Color.fromRGB(0, 255, 0);
Color.RED = Color.fromRGB(255, 0, 0);
Color.WHITE = Color.fromRGB(255, 255, 255);
Color.YELLOW = Color.fromRGB(255, 255, 0);

// Define the Color object on the global object.
global.Color = Color;

export default Color;
