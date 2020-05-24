// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

class Rect {
    constructor(minX, minY, maxX, maxY) {
        this.minX_ = minX || 0;
        this.minY_ = minY || 0;
        this.maxX_ = maxX || 0;
        this.maxY_ = maxY || 0;
    }

    get minX() { return this.minX_; }
    get minY() { return this.minY_; }
    get maxX() { return this.maxX_; }
    get maxY() { return this.maxY_; }

    // Gets the width of this rectangle.
    get width() { return this.maxX_ - this.minX_; }

    // Gets the height of this rectangle.
    get height() { return this.maxY_ - this.minY_; }

    // Gets the circumference of this rectangle.
    get circumference() { return 2 * this.width + 2 * this.height; }

    // Gets the area of this rectangle.
    get area() { return this.width * this.height; }

    // Gets the center coordinates (on a 2D plane) of this rectangle.
    get center() {
        return [ this.minX_ + this.width / 2,
                 this.minY_ + this.height / 2 ];
    }

    // Gets the top-left corner of this rectangle.
    get topLeft() { return [ this.minX_, this.minY_ ]; }

    // Gets the top-right corner of this rectangle.
    get topRight() { return [ this.maxX_, this.minY_ ]; }

    // Gets the bottom-left corner of this rectangle.
    get bottomLeft() { return [ this.minX_, this.maxY_ ]; }

    // Gets the bottom-right corner of this rectangle.
    get bottomRight() { return [ this.maxX_, this.maxY_ ]; }

    // Returns whether this rectangle contains the given |point|, which should have {x, y}, i.e.
    // a Vector or a similar data structure.
    contains(position) {
        return position.x >= this.minX_ && position.x < this.maxX_ &&
               position.y >= this.minY_ && position.y < this.maxY_;
    }

    // Returns a new Rect instance that's larger by a certain amount. Possible ways of calling this
    // method are as follows:
    //
    //     extend(units);
    //     extend(horizontal, vertical);
    //
    extend(arg1, arg2 = null) {
        let units = [ arg2, arg1, arg2, arg1 ];
        if (arg2 === null)
            units = [ arg1, arg1, arg1, arg1 ];

        return new Rect(this.minX_ - units[3], this.minY_ - units[2],
                        this.maxX_ + units[1], this.maxY_ + units[0]);
    }

    // Returns a new Rect instance that's smaller by a certain amount. Possible ways of calling this
    // method are as follows:
    //
    //     shrink(units);
    //     shrink(horizontal, vertical);
    //
    shrink(arg1, arg2 = null) {
        let units = [ arg2, arg1, arg2, arg1 ];
        if (arg2 === null)
            units = [ arg1, arg1, arg1, arg1 ];

        return new Rect(this.minX_ + units[3], this.minY_ + units[2],
                        this.maxX_ - units[1], this.maxY_ - units[0]);
    }

    // Returns whether the |other| rectangle overlaps with this one. (Touching is not enough.)
    overlaps(other) {
        return this.minX_ < other.maxX_ && this.maxX_ > other.minX_ &&
               this.minY_ < other.maxY_ && this.maxY_ > other.minY;
    }

    toString() {
        return `x: ${this.minX_}, y: ${this.minY_}, width: ${this.width}, height: ${this.height}`;
    }
};

global.Rect = Rect;
