// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Logger from 'features/logger/logger.js';
import MockLogWriter from 'features/logger/test/mock_log_writer.js';

// The mocked logger is an implementation of the Logger class with an injected void writer. This
// makes sure that none of the events used during testing will reach the index.
class MockLogger extends Logger {
    constructor() {
        super(new MockLogWriter());
    }
}

export default MockLogger;
