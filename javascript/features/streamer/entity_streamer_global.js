// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const EntityStreamer = require('features/streamer/entity_streamer.js');

// Implementation of the EntityStreamer base class that adheres to a global entity limit, for
// example vehicles and pickups. See EntityStreamerPlayer for an implementation that will instead
// stream entities up to the limit per player.
class EntityStreamerGlobal extends EntityStreamer {
    constructor({ maxVisible, streamingDistance = 300 } = {}) {
        super({ maxVisible, streamingDistance });
    }

    // ---------------------------------------------------------------------------------------------

    // Indicates that |storedEntity| must now be created. Must be implemented by the streamer that
    // is specific to a particular kind of entity.
    createEntity(storedEntity) {
        throw new Error('EntityStreamerGlobal::createEntity() must be overridden.');
    }

    // Indicates that |storedEntity| must now be deleted. Must be implemented by the streamer that
    // is specific to a particular kind of entity.
    deleteEntity(storedEntity) {
        throw new Error('EntityStreamerGlobal::deleteEntity() must be overridden.');
    }

    // ---------------------------------------------------------------------------------------------

    //


    // ---------------------------------------------------------------------------------------------

    dispose() {
        super.dispose();
    }
}

exports = EntityStreamerGlobal;
