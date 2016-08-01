// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Path to the UNIX socket through which logstash events will be reported.
const LOGSTASH_UNIX_SOCKET = '/tmp/logstash.sock';

// The log writer is responsible for actually writing entries to the backend. It has a mocked
// implementation used for testing in the test/ directory that should be kept in sync.
class LogWriter {
    constructor() {
        logstash('' /* empty message */, LOGSTASH_UNIX_SOCKET);
    }

    // Writes the |event| to the system log. The timestamp will be appended automatically. Elastic
    // can do this themselves, but that creates a risk of invalid timestamps for delayed imports.
    writeEvent(type, event) {
        event['@timestamp'] = this.createTimestamp();
        event['type'] = type;

        const message = JSON.stringify(event).replace(/\\n/g, "\\n")
                                             .replace(/\\r/g, "\\r");

        logstash(message);
    }

    // Creates a string representing the current time as "YYYY-MM-DDTHH:II:SS.UUUZ".
    createTimestamp() {
        // Utility function to make sure that |number| has two digits.
        const ensureDoubleDigit = number => ('0' + number.toString()).substr(-2);

        const date = new Date();
        const dateString = date.getFullYear() + '-' + ensureDoubleDigit(date.getMonth() + 1) + '-' +
                           ensureDoubleDigit(date.getDate());
        const timeString = ensureDoubleDigit(date.getHours()) + ':' +
                           ensureDoubleDigit(date.getMinutes()) + ':' +
                           ensureDoubleDigit(date.getSeconds());

        return dateString + 'T' + timeString + 'Z';
    }

    dispose() {}
}

exports = LogWriter;
