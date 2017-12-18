// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import PlayerSyncedData from 'entities/player_synced_data.js';

// Mocked implementation of the PlayerSynchedData structure.
class MockPlayerSynchedData extends PlayerSyncedData {
    async sync(property, value) { /* No synchronization calls will be issued. */ }
}

export default MockPlayerSynchedData;
