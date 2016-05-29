// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Mocked implementation for Date to mock the now()-method. To not wait in tests I thought to mock
// the now()-method to be able to change the time.
class MockDate {
    constructor() {
        this.nowTimestamp_ = null;
    }

    setNow (nowTimestamp) {
        this.nowTimestamp_ = nowTimestamp;
    }

    now() {
        return this.nowTimestamp_;
    }
}

exports = MockDate;
