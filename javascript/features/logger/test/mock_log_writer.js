// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The mocked log writer follows the same interface as the LogWriter class, with the exception that
// the writes won't actually reach the backend.
class MockLogWriter {
    writeEvent(type, event) {}
    dispose() {}
}

exports = MockLogWriter;
