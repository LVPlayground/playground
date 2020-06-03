// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DecorationNpc } from 'features/decorations/decoration_npc.js';
import ScopedEntities from 'entities/scoped_entities.js';

// Encapsulates a particular decoration. It will be loaded from a JSON file, of which the structure
// is specified in README.md. Data in other formats will throw exceptions. Validity of all known
// data will be tested before Las Venturas Playground starts the gamemode on the server, as a test.
export class DecorationSet {
    entities_ = null;

    npcs_ = new Set();
    objects_ = new Set();

    constructor(filename) {
        const structure = JSON.parse(readFile(filename));
        if (structure.hasOwnProperty('npcs') && Array.isArray(structure.npcs))
            this.loadNonPlayerCharacters(structure.npcs);

        if (structure.hasOwnProperty('objects') && Array.isArray(structure.objects))
            this.loadObjects(structure.objects);
    }

    // ---------------------------------------------------------------------------------------------

    // Loads all the non-player characters from the |npc| arrays into the |npcs_| set.
    loadNonPlayerCharacters(npcs) {
        for (const npc of npcs) {
            if (!npc.hasOwnProperty('name') || typeof npc.name !== 'string')
                throw new Error('Each NPC must have its name defined.');

            if (!npc.hasOwnProperty('script') || typeof npc.script !== 'string')
                throw new Error('Each NPC must have its powering Pawn script defined.');
            
            if (!npc.hasOwnProperty('position') || !Array.isArray(npc.position))
                throw new Error('Each NPC must have a spawning position set.');
            
            if (!npc.hasOwnProperty('rotation') || typeof npc.rotation !== 'number')
                throw new Error('Each NPC must have a spawning rotation set.');

            this.npcs_.add(new DecorationNpc(npc));
        }
    }

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

        for (const npc of this.npcs_)
            npc.enable(this.entities_);

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
            for (const npc of this.npcs_)
                npc.disable();

            this.entities_.dispose();
            this.entities_ = null;
        }
    }
}
