// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Vector = require('base/vector.js');

// Defines the interface available to game objects created for players in the game. New objects
// are only meant to be constructed through the ObjectManager.
class GameObject {
    constructor(manager, options) {
        this.manager_ = manager;

        this.modelId_ = options.modelId;

        this.drawDistance_ = options.drawDistance;
        this.streamDistance_ = options.streamDistance;

        this.virtualWorld_ = options.virtualWorld;
        this.interiorId_ = options.interiorId;

        this.id_ = pawnInvoke('CreateDynamicObjectEx', 'iffffffffaaaaiiiii', options.modelId,
                              options.position.x, options.position.y, options.position.z,
                              options.rotation.x, options.rotation.y, options.rotation.z,
                              options.streamDistance, options.drawDistance, [options.virtualWorld],
                              [options.interiorId], [-1], [-1], 0 /* priority */, 1 /* maxworlds */,
                              1 /* maxinteriors */, 1 /* maxplayers */, 1 /* maxareas */);

        if (this.id_ === GameObject.INVALID_ID)
            throw new Error('Unable to create the object with model Id #' + options.modelId);

        this.cameraCollisionsEnabled_ = true;
        this.moving_ = false;

        // Promise resolver that is to be used when the current movement has to be prematurely
        // finished, for example because another move started or because it was aborted altogether.
        this.stopCurrentMoveResolver_ = null;
    }

    // Gets the id the streamer assigned to this object.
    get id() { return this.id_; }

    // Returns whether the object still exists on the server.
    isConnected() { return this.id_ !== null; }

    // Gets the Id of the model that is visually epresenting this object.
    get modelId() { return this.modelId_; }

    // Gets or sets the position of the object in the world.
    get position() { return new Vector(...pawnInvoke('GetDynamicObjectPos', 'iFFF', this.id_)); }
    set position(value) {
        pawnInvoke('GetDynamicObjectPos', 'ifff', this.id_, value.x, value.y, value.z);
    }

    // Gets or sets the rotation, in 3D space, of the object in the world.
    get rotation() { return new Vector(...pawnInvoke('GetDynamicObjectRot', 'iFFF', this.id_)); }
    set rotation(value) {
        pawnInvoke('GetDynamicObjectRot', 'ifff', this.id_, value.x, value.y, value.z);
    }

    // Gets the draw distance of the object.
    get drawDistance() { return this.drawDistance_; }

    // Gets the streaming distance the streamer will apply to this object.
    get streamDistance() { return this.streamDistance_; }

    // Gets the virtual world in which this object will be visible. Will return -1 when the object
    // should be visible in all virtual worlds.
    get virtualWorld() { return this.virtualWorld_; }

    // Gets the interior Id in which the object will be visible. Will return -1 when the object
    // should be visible in all interiors.
    get interiorId() { return this.interiorId_; }

    // Returns whether camera collisions are enabled for this object. They are by default.
    areCameraCollisionsEnabled() {
        return !!pawnInvoke('GetDynamicObjectNoCameraCol', 'i', this.id_);
    }

    // Disables collisions between the player's camera and the object. This only has an effect
    // outside of the common San Andreas map coordinates (beyond -3000 and 3000).
    disableCameraCollisions() { pawnInvoke('SetDynamicObjectNoCameraCol', 'i', this.id_); }

    // Returns whether the object is currently moving.
    isMoving() { return !!pawnInvoke('IsDynamicObjectMoving', 'i', this.id_); }

    // Moves the object to |position| with |rotation| over a period of |durationMs| milliseconds.
    // This an asynchronous function, and can be waited on to finish.
    async moveTo(position, rotation, durationMs) {
        if (this.stopCurrentMoveResolver_)
            this.stopCurrentMoveResolver_();

        const distanceUnits = position.distanceTo(this.position);
        const speed = distanceUnits / (durationMs / 1000);

        pawnInvoke('MoveDynamicObject', 'ifffffff', this.id_, position.x, position.y, position.z,
                   speed, rotation.x, rotation.y, rotation.z);

        const stopPromise = new Promise(resolve => this.stopCurrentMoveResolver_ = resolve);
        await Promise.race([
            wait(durationMs),
            stopPromise
        ]);

        this.stopCurrentMoveResolver_ = null;
    }

    // Stops moving the object immediately.
    stopMove() {
        pawnInvoke('StopDynamicObject', 'i', this.id_);
        if (this.stopCurrentMoveResolver_)
            this.stopCurrentMoveResolver_();
    }

    // Attaches the object to |object| at |offset| with |rotation|, both of which must be vectors.
    // Optionally |synchronize| can be set, which will synchronize the |object| when this one moves.
    attachToObject(object, offset, rotation, synchronize = false) {
        pawnInvoke('AttachDynamicObjectToObject', 'iiffffffi', this.id_, object.id, offset.x,
                   offset.y, offset.z, rotation.x, rotation.y, rotation.z, synchronize ? 1 : 0);
    }

    // Attaches the object to |player| at |offset| with |rotation|, both of which must be vectors.
    attachToPlayer(player, offset, rotation) {
        pawnInvoke('AttachDynamicObjectToPlayer', 'iiffffff', this.id_, player.id, offset.x,
                   offset.y, offset.z, rotation.x, rotation.y, rotation.z);
    }

    // Attaches the object to |vehicle| at |offset| with |rotation|, both of which must be vectors.
    attachToVehicle(vehicle, offset, rotation) {
        pawnInvoke('AttachDynamicObjectToVehicle', 'iiffffff', this.id_, vehicle.id, offset.x,
                   offset.y, offset.z, rotation.x, rotation.y, rotation.z);
    }

    // Enables the object editor for this object for |player|.
    enableEditorForPlayer(player) { pawnInvoke('EditDynamicObject', 'ii', player.id, this.id_); }

    // TODO(Russell): Design an API for the material-related natives available to objects.

    dispose() {
        pawnInvoke('DestroyDynamicObject', 'i', this.id_);
        this.id_ = null;

        this.manager_.didDisposeObject(this);
        this.manager_ = null;
    }
}

// The Id that is used to represent invalid objects (INVALID_STREAMER_ID in Pawn).
GameObject.INVALID_ID = 0;

// Expose the GameObject object globally since it will be commonly used.
global.GameObject = GameObject;
