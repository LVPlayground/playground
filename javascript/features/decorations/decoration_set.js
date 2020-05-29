// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ScopedEntities from 'entities/scoped_entities.js';

// Encapsulates a particular decoration. It will be loaded from a JSON file, of which the structure
// is specified in README.md. Data in other formats will throw exceptions. Validity of all known
// data will be tested before Las Venturas Playground starts the gamemode on the server, as a test.
export class DecorationSet {
    entities_ = null;

    objects_ = null;

    constructor(filename) {
        this.objects_ = new Set();

        const structure = JSON.parse(readFile(filename));
        if (structure.hasOwnProperty('objects') && Array.isArray(structure.objects))
            this.loadObjects(structure.objects);
    }

    // ---------------------------------------------------------------------------------------------

    // Validates and loads all the |objects| to the local |objects_| set.
    loadObjects(objects) {
        for (const object of objects) {
            if (!object.hasOwnProperty('modelId'))
                throw new Error('Each object must define its model Id.');
            
            if (!object.hasOwnProperty('position') || !Array.isArray(object.position))
                throw new Error('Each object must define its position vector.');
            
            if (!object.hasOwnProperty('rotation') || !Array.isArray(object.rotation))
                throw new Error('Each object must define its rotation vector.');
            
            this.objects_.add({
                modelId: object.modelId,
                position: new Vector(...object.position),
                rotation: new Vector(...object.rotation),
                effect: object.effect || null,
            });
        }
    }
    
    // ---------------------------------------------------------------------------------------------

    enable() {
        if (this.entities_ !== null)
            return;  // the set has already been enabled
        
        this.entities_ = new ScopedEntities({ interiorId: 0, virtualWorld: 0 });

        // Create all the objects that are part of this decoration set.
        for (const { modelId, position, rotation, effect } of this.objects_) {
            const object = this.entities_.createObject({ modelId, position, rotation });
            switch (effect) {
                case 'snow':
                    for (let material = 0; material <= 15; ++material)
                        object.setMaterial(material, 17944, 'lngblok_lae2', 'white64bumpy', 0);

                    break;
            }
        }
    }

    // ---------------------------------------------------------------------------------------------

    disable() {
        if (this.entities_ !== null) {
            this.entities_.dispose();
            this.entities_ = null;
        }
    }
}
