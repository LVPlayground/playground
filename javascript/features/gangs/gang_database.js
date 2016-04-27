// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The gang database is responsible for interacting with the MySQL database for queries related to
// gangs, e.g. loading, storing and updating the gang and player information.
class GangDatabase {
    constructor(database) {
        this.database_ = database;
    }
}

exports = GangDatabase;
