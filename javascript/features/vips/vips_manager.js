// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const VeryImportantPlayersRoom = require('features/vips/vips_room.js');

// The VIP manager provides back-end logic for the features provided as part of this module.
class VeryImportantPlayersManager {
    constructor() {
        this.veryImportantPlayersRoom_ = new VeryImportantPlayersRoom();
    }

    // ---------------------------------------------------------------------------------------------
    // This feature has no public API.
    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.veryImportantPlayersRoom_.dispose();
    }
}

exports = VeryImportantPlayersManager;
