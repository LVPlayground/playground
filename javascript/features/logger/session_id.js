// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const SESSION_BUFFER_SIZE_LIMIT = 1000;

// Array containing the thousand most recently generated session Ids.
let sessionBuffer = [];

// Set containing the thousand most recently generated session Ids. Used for quick lookups.
let sessionSet = new Set();

// The session id provides an identifier that links events recorded for a particular session
// together, so that events in the data storage can be associated together. This is not a perfect
// method as it *may* hand out duplicated Ids when more than |SESSION_BUFFER_SIZE_LIMIT| players
// join the servers when reverting the clock during a timezone change, but sure.
class SessionId {
    static generateForPlayer(player) {
        let sessionId = Math.round(Date.now() / 1000);
        while (sessionSet.has(sessionId))
            sessionId++;

        sessionSet.add(sessionId);
        sessionBuffer.push(sessionId);

        if (sessionBuffer.length > SESSION_BUFFER_SIZE_LIMIT)
            sessionSet.delete(sessionBuffer.shift());
        
        return sessionId;
    }
}

exports = SessionId;
