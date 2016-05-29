// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Mocked version of the TextLabel class that supports the same API, but won't interact with the
// SA-MP server in order to do its actions.
class MockTextLabel {
    constructor(manager, options) {
        this.manager_ = manager;

        this.text_ = options.text;
        this.color_ = options.color;
        this.position_ = options.position;
        this.drawDistance_ = options.drawDistance;
        this.virtualWorld_ = options.virtualWorld;
        this.testLineOfSight_ = options.testLineOfSight;

        this.attached_ = false;

        this.id_ = Math.round(Math.random() * 10000);
    }

    // Gets the Id SA-MP assigned to this text label.
    get id() { return this.id_; }

    // Returns whether the text label still exists on the server.
    isConnected() { return this.id_ !== null; }

    // Returns whether the text label is attached to another entity.
    isAttached() { return this.attached_; }

    // Gets or sets the text that's being displayed using this text label.
    get text() { return this.text_; }
    set text(value) { this.text_ = value; }

    // Gets or sets the color in which the text on the text label is being drawn.
    get color() { return this.color_; }
    set color(value) { this.color_ = value; }

    // Gets the position of the text label. This will be irrelevant if the text label has been
    // attached to another entity in the world, which isAttached() will tell you.
    get position() { return this.position_; }

    // Gets the draw distance of the label, i.e. the distance from which players will see it.
    get drawDistance() { return this.drawDistance_; }

    // Gets the virtual world in which the text label is being shown.
    get virtualWorld() { return this.virtualWorld_; }

    // Returns whether the text draw tests for having a clear line-of-sight from the player.
    testsLineOfSight() { return this.testLineOfSight_; }

    // Attaches the text label to the |player| at |offset|.
    attachToPlayer(player, offset) {
        this.attached_ = true;
    }

    // Attaches the text label to the |vehicle| at |offset|.
    attachToVehicle(vehicle, offset) {
        this.attached_ = true;
    }

    dispose() {
        this.manager_.didDisposeTextLabel(this);
        this.manager_ = null;

        this.id_ = null;
    }
}

exports = MockTextLabel;
