// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ObjectGroup = require('features/playground/object_group.js');

// The VIP room offers our donating players a cool place to hangout or get some
// health/armor and weapons.
class VeryImportantPlayersRoom {
    constructor() {
        this.objects_ = ObjectGroup.create('data/objects/vip_room.json',
                                           0 /* virtual world */, 0 /* interior */);
    }

    // ---------------------------------------------------------------------------------------------
    // This feature has no public API  (yet).
    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.objects_.dispose();
    }
}

exports = VeryImportantPlayersRoom;
