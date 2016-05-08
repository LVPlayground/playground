// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Vector = require('base/vector.js');

// Maintains a list of objects that have to be removed upon a player's connection. Additional data
// files can be loaded through the `load` method, which reads a JSON file.
class ObjectRemover {
    constructor() {
        this.removedObjects_ = [];

        // Objects will have to be removed when a player connects to the server.
        server.playerManager.addObserver(this);
    }

    // Loads the objects defined in |filename| to the list of objects that has to be removed. The
    // file must contain a JSON array containing objects, each of which has `modelId`, `position`
    // and `radius` properties.
    load(filename) {
        const data = JSON.parse(readFile(filename));
        if (!Array.isArray(data))
            throw new Error('The objects defined in "' + filename + '" must be an array.');

        data.forEach(removedObject => {
            if (!removedObject.hasOwnProperty('modelId'))
                throw new Error('Each removed object must define the modelId to remove.');

            if (!removedObject.hasOwnProperty('position'))
                throw new Error('Each removed object must define the position at which to remove.');

            this.removedObjects_.push({
                modelId: removedObject.modelId,
                position: new Vector(...removedObject.position),
                radius: removedObject.radius || 0.25
            });
        });
    }

    // Utility method that aims to optimize the list of objects that should be removed by applying
    // the `radius` property more efficiently. Not used in production code, but will often be needed
    // when removing objects for players so available in here after all.
    optimize(modelId) {
        const affectedObjects = this.removedObjects_.filter(
            removedObject => removedObject.modelId == modelId);

        let averagePosition = [ 0, 0, 0 ];
        let radius = 0;

        affectedObjects.forEach(removedObject => {
            averagePosition[0] += removedObject.position.x;
            averagePosition[1] += removedObject.position.y;
            averagePosition[2] += removedObject.position.z;
        });

        // Compute the average position of the affected objects in this remover.
        averagePosition = new Vector(...averagePosition.map(
            value => value / affectedObjects.length));

        // Compute the radius necessary for a rule to encapsulate all the objects.
        affectedObjects.forEach(removedObject =>
            radius = Math.max(radius, averagePosition.distanceTo(removedObject.position)));

        // Returns the new compound rule encapsulating all objects.
        return {
            modelId: modelId,
            position: averagePosition,
            radius: radius
        };
    }

    // Called when |player| connects to the server. They will have the loaded list of objects
    // removed from the map for them.
    onPlayerConnect(player) {
        this.removedObjects_.forEach(removedObject => {
            player.removeGameObject(
                removedObject.modelId, removedObject.position, removedObject.radius);
        });
    }

    dispose() {
        server.playerManager.removeObserver(this);
    }
}

exports = ObjectRemover;
