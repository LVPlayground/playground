// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Vector = require('base/vector.js');

// Mocked implementation of the GameObject class that mimics the API of an in-game object, but will
// not actually interact with the SA-MP server or its plugins to create actual objects.
class MockObject {
    constructor(manager, options) {
        this.manager_ = manager;
        this.id_ = Math.floor(Math.random() * 1000000);

        this.modelId_ = options.modelId;

        this.position_ = options.position;
        this.rotation_ = options.rotation;

        this.drawDistance_ = options.drawDistance;
        this.streamDistance_ = options.streamDistance;

        this.virtualWorld_ = options.virtualWorld;
        this.interiorId_ = options.interiorId;

        this.cameraCollisionsEnabled_ = true;
        this.moving_ = false;
    }

    // Gets the id the streamer assigned to this object.
    get id() { return this.id_; }

    // Returns whether the object still exists on the server.
    isConnected() { return this.id_ !== null; }

    // Gets or sets the position of the object in the world.
    get position() { return this.position_; }
    set position(value) { this.position_ = value; }

    // Gets or sets the rotation, in 3D space, of the object in the world.
    get rotation() { return this.rotation_; }
    set rotation(value) { this.rotation_ = value; }

    // Gets the draw distance of the object.
    get drawDistance() { return this.drawDistance_; }

    // Gets the streaming distance the streamer will apply to this object.
    get streamDistance() { return this.streamDistance_; }

    // Gets the virtual world in which this object will be visible. Will return NULL when the object
    // should be visible in all virtual worlds.
    get virtualWorld() { return this.virtualWorld_; }

    // Gets the interior Id in which the object will be visible. Will return NULL when the object
    // should be visible in all interiors.
    get interiorId() { return this.interiorId_; }

    // Returns whether camera collisions are enabled for this object. They are by default.
    areCameraCollisionsEnabled() { return this.cameraCollisionsEnabled_; }

    // Disables collisions between the player's camera and the object. This only has an effect
    // outside of the common San Andreas map coordinates (beyond -3000 and 3000).
    disableCameraCollisions() { this.cameraCollisionsEnabled_ = false; }

    // Returns whether the object is currently moving.
    isMoving() { return this.moving_; }

    // Moves the object to |position| with |rotation| over a period of |durationMs| milliseconds.
    // This an asynchronous function, and can be waited on to finish.
    async moveTo(position, rotation, durationMs) { this.moving_ = true; }

    // Stops moving the object immediately.
    stopMove() { this.moving_ = false; }

    // Attaches the object to |object| at |offset| with |rotation|, both of which must be vectors.
    // Optionally |synchronize| can be set, which will synchronize the |object| when this one moves.
    attachToObject(object, offset, rotation, synchronize = false) {}

    // Attaches the object to |player| at |offset| with |rotation|, both of which must be vectors.
    attachToPlayer(player, offset, rotation) {}

    // Attaches the object to |vehicle| at |offset| with |rotation|, both of which must be vectors.
    attachToVehicle(vehicle, offset, rotation) {}

    // Enables the object editor for this object for |player|.
    enableEditorForPlayer(player) {}

    // TODO(Russell): Design an API for the material-related natives available to objects.

    dispose() {
        this.id_ = null;

        this.manager_.didDisposeObject(this);
        this.manager_ = null;
    }
}

exports = MockObject;
