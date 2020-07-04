// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Represents the location at which a fight will take place. Locations have a high amount of
// requirements, as we want to provide flexibility to players when they set up the rules for a
// particular fight. All of those are codified in this object.
export class FightLocation {
    #description_ = null;

    constructor(description) {
        this.#description_ = description;
    }

    // Gets the name for this location. Used by commands to refer to individual locations too.
    get name() { return this.#description_.name; }

    // Called when requesting a string representation of this location.
    toString() { return `[FightLocation: "${this.#description_.descriptionFilename}"]`; }
}
