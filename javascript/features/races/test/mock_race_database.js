// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The mocked race database exposes the same API as the actual RaceDatabase class, but will return
// fake data rather than actually communicating with the database.
class MockRaceDatabase {
    loadRecordTimes() {
        let times = new Map();
        times.set(42, { name: 'Russell', time: 83 /* 1:23 */ });

        return Promise.resolve(times);
    }

    loadRecordTimesForPlayer(player) {
        let times = new Map();
        if (player.account.isRegistered())
            times.set(42, 83 /* 1:23 */);

        return Promise.resolve(times);
    }

    loadBestResultsForParticipants(raceId, userIds) {
        return Promise.resolve([]);
    }

    dispose() {}
}

export default MockRaceDatabase;
