// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Mocked implementation of the settings database.
class MockSettingsDatabase {
    constructor() {
        this.loadCalls_ = 0;
        this.writeCalls_ = 0;
        this.deleteCalls_ = 0;
    }

    get loadCalls() { return this.loadCalls_; }
    get writeCalls() { return this.writeCalls_; }
    get deleteCalls() { return this.deleteCalls_; }

    async loadSettings() {
        ++this.loadCalls_;

        return new Map();
    }

    async writeSetting(setting) { ++this.writeCalls_; }

    async deleteSetting(setting) { ++this.deleteCalls_; }
}

exports = MockSettingsDatabase;
