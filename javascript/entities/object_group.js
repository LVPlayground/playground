// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ScopedEntities from 'entities/scoped_entities.js';

// Private symbol ensuring that the ColorPicker constructor won't be used.
const PrivateSymbol = Symbol('Please use the static methods.');

// An object group is an immutable group of objects, loaded from a JSON file, that is tied to a
// given interior and virtual world. The group can easily be disposed of again.
class ObjectGroup {
    // Creates a new object group based on |filename| for the |virtualWorld| in |interiorId|. Will
    // return an ObjectGroup instance when successful, or throw an exception in case of failure.
    static create(filename, virtualWorld, interiorId) {
        const objectData = JSON.parse(readFile(filename));

        let entities = new ScopedEntities();
        objectData.forEach(object => {
            entities.createObject({
                modelId: object.modelId,
                position: new Vector(...object.position),
                rotation: new Vector(...object.rotation),
                virtualWorld: object.virtualWorld || virtualWorld,
                interiorId: object.interiorId || interiorId
            });
        });

        return new ObjectGroup(PrivateSymbol, entities);
    }

    constructor(privateSymbol, entities) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal constructor. Use the static methods instead.');

        this.entities_ = entities;
    }

    dispose() {
        this.entities_.dispose();
        this.entities_ = null;
    }
}

export default ObjectGroup;
