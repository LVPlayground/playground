// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Defines the interface available to game objects created for players in the game. New objects
// are only meant to be constructed through the ObjectManager.
export class GameObject {
    // Id to represent an invalid object. Maps to INVALID_STREAMER_ID, which is (0).
    static kInvalidId = 0;

    #id_ = null;
    #manager_ = null;

    #modelId_ = null;
    #drawDistance_ = null;
    #streamDistance_ = null;

    #interiors_ = null;
    #virtualWorlds_ = null;
    #editResolver_ = null;
    #moveResolver_ = null;

    constructor(manager) {
        this.#manager_ = manager;
    }

    initialize(options) {
        this.#modelId_ = options.modelId;

        this.#drawDistance_ = options.drawDistance;
        this.#streamDistance_ = options.streamDistance;

        this.#interiors_ = options.interiors;
        this.#virtualWorlds_ = options.virtualWorlds;

        this.#id_ = this.createInternal(options);
        if (this.#id_ === GameObject.kInvalidId)
            throw new Error('Unable to create the object with model Id #' + options.modelId);
    }

    // Creates the actual object on the server. May be overridden for testing purposes.
    createInternal(options) {
        return pawnInvoke('CreateDynamicObjectEx', 'iffffffffaaaaiiiii',
            /* modelid= */ options.modelId,
            /* x= */ options.position.x,
            /* y= */ options.position.y,
            /* z= */ options.position.z,
            /* rx= */ options.rotation.x,
            /* ry= */ options.rotation.y,
            /* rz= */ options.rotation.z,
            /* streamdistance= */ options.streamDistance,
            /* drawdistance= */ options.drawDistance,
            /* worlds= */ options.virtualWorlds,
            /* interiors= */ options.interiors,
            /* players= */ options.players,
            /* areas= */ options.areas,
            /* priority= */ options.priority,
            /* maxworlds= */ options.virtualWorlds.length,
            /* maxinteriors= */ options.interiors.length,
            /* maxplayers= */ options.players.length,
            /* maxareas= */ options.areas.length);
    }

    // Destroys the actual object on the server. May be overridden for testing purposes.
    destroyInternal() { pawnInvoke('DestroyDynamicObject', 'i', this.#id_); }

    // ---------------------------------------------------------------------------------------------

    get id() { return this.#id_; }

    get modelId() { return this.#modelId_; }
    get drawDistance() { return this.#drawDistance_; }
    get streamDistance() { return this.#streamDistance_; }

    get interiors() { return this.#interiors_; }
    get virtualWorlds() { return this.#virtualWorlds_; }

    isConnected() { return this.#id_ !== GameObject.kInvalidId; }

    // ---------------------------------------------------------------------------------------------

    get position() { return new Vector(...pawnInvoke('GetDynamicObjectPos', 'iFFF', this.#id_)); }
    set position(value) {
        pawnInvoke('SetDynamicObjectPos', 'ifff', this.#id_, value.x, value.y, value.z);
    }

    get rotation() { return new Vector(...pawnInvoke('GetDynamicObjectRot', 'iFFF', this.#id_)); }
    set rotation(value) {
        pawnInvoke('SetDynamicObjectRot', 'ifff', this.#id_, value.x, value.y, value.z);
    }

    // ---------------------------------------------------------------------------------------------

    attachToVehicle(vehicle, offset, rotation) {
        pawnInvoke('AttachDynamicObjectToVehicle', 'iiffffff', this.#id_, vehicle.id, offset.x,
                   offset.y, offset.z, rotation.x, rotation.y, rotation.z);
    }

    // ---------------------------------------------------------------------------------------------

    setMaterial(index, modelId, txdName, textureName, color) {
        pawnInvoke(
            'SetDynamicObjectMaterial', 'iiissi', this.#id_, index, modelId, txdName, textureName,
                                                  color);
    }

    // ---------------------------------------------------------------------------------------------

    async editInternal(player) { pawnInvoke('EditDynamicObject', 'ii', player.id, this.#id_); }
    async edit(player) {
        if (this.#editResolver_ !== null)
            throw new Error('This object is already being edited by another player.');
            
        this.#manager_.didRequestEditObject(this, player);
        this.editInternal(player);

        return new Promise(resolve => this.#editResolver_ = resolve);
    }

    async moveToInternal(position, speed) {
        pawnInvoke(
            'MoveDynamicObject', 'ifffffff', this.#id_, position.x, position.y, position.z,
            speed, /* rx= */ -1000, /* ry= */ -1000, /* rz= */ -1000);
    }

    async moveTo(position, speed) {
        this.moveToInternal(position, speed);
        
        return new Promise(resolve => this.#moveResolver_ = resolve);
    }

    // ---------------------------------------------------------------------------------------------

    onEdited(result) {
        if (!this.#editResolver_)
            return;
        
        this.#editResolver_(result);
        this.#editResolver_ = null;
    }

    onMoved() {
        if (!this.#moveResolver_)
            return;

        this.#moveResolver_();
        this.#moveResolver_ = null;
    }

    dispose() {
        this.destroyInternal();

        if (this.#manager_) {
            this.#manager_.didDisposeObject(this);
            this.#manager_ = null;
        }

        this.#id_ = GameObject.kInvalidId;
    }

    // ---------------------------------------------------------------------------------------------

    toString() { return `[object GameObject(${this.#id_}, ${this.#modelId_})]`; }
}

// Expose the GameObject object globally since it will be commonly used.
global.GameObject = GameObject;
