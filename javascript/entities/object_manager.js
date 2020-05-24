// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Vector } from 'base/vector.js';

// The object manager maintains and owns all objects that have been created on the server. It also
// powers the events required for the promises on the GameObject instances to work.
class ObjectManager {
    objectConstructor_ = null;
    objects_ = null;

    editingPlayers_ = null;

    constructor(objectConstructor = GameObject) {
        this.objectConstructor_ = objectConstructor;
        this.objects_ = new Map();

        this.editingPlayers_ = new WeakMap();
    }

    // Gets the number of objects currently created on the server.
    get count() { return this.objects_.size; }

    // Creates a new object with the given options. The options are based on the available settings
    // as part of the Object Streamer, and some can be changed after the object's creation.
    createObject({ modelId, position, rotation, interiors = null, interiorId = -1,
                   virtualWorlds = null, virtualWorld = -1, players = null, playerId = -1 } = {}) {
        const object = new this.objectConstructor_(this);

        // Initializes the |object| with all the configuration passed to the manager.
        object.initialize({
            modelId: modelId,

            position: position,
            rotation: rotation,

            interiors: interiors ?? [ interiorId ],
            virtualWorlds: virtualWorlds ?? [ virtualWorld ],
            players: players ?? [ playerId ],
            areas: [ -1 ], 

            streamDistance: 300.0,
            drawDistance: 0.0,
            priority: 0,
        });

        this.objects_.set(object.id, object);
        return object;
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the object in |event| has finished moving. If it's one created by JavaScript, let
    // the GameObject instance know so that any listening promises can be resolved.
    onObjectMoved(event) {
        const object = this.objects_.get(event.objectid);
        if (!object)
            return;  // the |object| is not known to JavaScript
        
        object.onMoved();
    }

    // Called when the object in |event| has been edited by the player. The new position and
    // rotation are included in the event, and will be made available, unless it was cancelled.
    onObjectEdited(event) {
        const object = this.objects_.get(event.objectid);
        if (!object)
            return;  // the |object| is not known to JavaScript
        
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // the event is invalid, because the |player| could not be found
        
        switch (event.response) {
            case 0:  // EDIT_RESPONSE_CANCEL
                this.editingPlayers_.delete(player);

                object.onEdited(null);
                break;
            
            case 1:  // EDIT_RESPONSE_FINAL
                this.editingPlayers_.delete(player);

                object.onEdited({
                    position: new Vector(event.x, event.y, event.z),
                    rotation: new Vector(event.rx, event.ry, event.rz),
                });
                break;
            
            case 2:  // EDIT_RESPONSE_UPDATE
                break;
        }
    }

    // Called when the |player| has disconnected from the server. If they are still editing an
    // object, the associated operation will be cancelled, settling the promise.
    onPlayerDisconnect(player) {
        if (!this.editingPlayers_.has(player))
            return;  // the |player| is not editing an object
        
        const object = this.editingPlayers_.get(player);
        object.onEdited(null);  // cancelled

        this.editingPlayers_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Removes the |object| from the maintained set of objects. Should only be used by the
    // GameObject implementation to inform the manager about their disposal.
    didDisposeObject(object) {
        if (!this.objects_.has(object.id))
            throw new Error('Attempting to dispose an invalid object: ' + object);

        this.objects_.delete(object.id);
    }

    // Called when the |object| has started to be edited by the given |player|.
    didRequestEditObject(object, player) {
        if (this.editingPlayers_.has(player))
            throw new Error(`The player (${player.name}) is already editing an object.`);

        this.editingPlayers_.set(player, object);
    }

    // Removes all ramaining objects from the server.
    dispose() {
        this.objects_.forEach(object => object.dispose());

        if (this.objects_.size != 0)
            throw new Error('There are remaining objects after disposing all of them.');
    }
}

export default ObjectManager;
