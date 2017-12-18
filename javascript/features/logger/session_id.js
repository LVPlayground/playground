// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The session id provides an identifier that links events recorded for a particular session
// together, so that events in the data storage can be associated together. This is not a perfect
// method as it *may* hand out duplicated Ids when future Ids have been handed out and the module
// reloads, but we'll just have to deal with that.
class SessionId {
    constructor() {
        this.latestSessionTime_ = 0;
    }

    generate() {
        const currentTime = Math.round(server.clock.currentTime() / 1000);
        if (this.latestSessionTime_ >= currentTime)
            return ++this.latestSessionTime_;

        this.latestSessionTime_ = currentTime;
        return currentTime;
    }
}

export default SessionId;
