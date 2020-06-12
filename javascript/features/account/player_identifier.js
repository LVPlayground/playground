// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Class that encapsulates the behaviour to identify who a player might be. Input are an IP address
// and a serial number, output is an array of results, ordered by certainty in descending order.
export class PlayerIdentifier {
    database_ = null;

    constructor(database) {
        this.database_ = database;
    }
}
