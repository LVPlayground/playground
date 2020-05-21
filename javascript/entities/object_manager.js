// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The object manager maintains and owns all objects that have been created on the server. It also
// powers the events required for the promises on the GameObject instances to work.
class ObjectManager {
    constructor(objectConstructor = GameObject) {
        this.objectConstructor_ = objectConstructor;
        this.objects_ = new Map();
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

    // ---------------------------------------------------------------------------------------------

    // Removes the |object| from the maintained set of objects. Should only be used by the
    // GameObject implementation to inform the manager about their disposal.
    didDisposeObject(object) {
        if (!this.objects_.has(object.id))
            throw new Error('Attempting to dispose an invalid object: ' + object);

        this.objects_.delete(object.id);
    }

    // Removes all ramaining objects from the server.
    dispose() {
        this.objects_.forEach(object => object.dispose());

        if (this.objects_.size != 0)
            throw new Error('There are remaining objects after disposing all of them.');
    }
}

export default ObjectManager;
