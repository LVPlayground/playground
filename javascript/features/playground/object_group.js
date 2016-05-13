// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Vector = require('base/vector.js');

// Private symbol ensuring that the ColorPicker constructor won't be used.
const PrivateSymbol = Symbol('Please use the static methods.');

// An object group is an immutable group of objects, loaded from a JSON file, that is tied to a
// given interior and virtual world. The group can easily be disposed of again.
class ObjectGroup {
    // Creates a new object group based on |filename| for the |virtualWorld| in |interiorId|. Will
    // return an ObjectGroup instance when successful, or throw an exception in case of failure.
    static create(filename, virtualWorld, interiorId) {
        const objectData = JSON.parse(readFile(filename));

        let objects = [];
        objectData.forEach(object => {
            if (server.isTest())
                return;  // don't create objects in tests

            objects.push(new GameObject({
                modelId: object.modelId,
                position: new Vector(...object.position),
                rotation: new Vector(...object.rotation),
                worlds: [ virtualWorld ],
                interiors: [ interiorId ]
            }));
        });

        return new ObjectGroup(PrivateSymbol, objects);
    }

    constructor(privateSymbol, objects) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal constructor. Use the static methods instead.');

        this.objects_ = objects;
    }

    dispose() {
        this.objects_.forEach(object => object.dispose());
    }
}

exports = ObjectGroup;
