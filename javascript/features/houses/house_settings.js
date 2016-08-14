// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// This class represents the settings associated with a given house.
class HouseSettings {
    constructor(id) {
        this.id_ = id;
    }

    // Gets the internal Id of this house in the database.
    get id() { return this.id_; }

    dispose() {
        
    }
}

exports = HouseSettings;
