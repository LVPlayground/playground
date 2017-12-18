// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Path to the UNIX socket through which logstash events will be reported.
const LOGSTASH_UNIX_SOCKET = '/tmp/logstash.sock';

// Refresh the socket to the logstash unix socket every five minutes. The logstash() implementation
// is a no-op if the endpoint doesn't change and the connection is still active.
const LOGSTASH_SOCKET_REFRESH_INTERVAL_MS = 60 * 1000;

// The log writer is responsible for actually writing entries to the backend. It has a mocked
// implementation used for testing in the test/ directory that should be kept in sync.
class LogWriter {
    constructor(sessions) {
        this.sessions_ = sessions;
        this.disposed_ = false;

        this.warnings_ = new WeakSet();

        this.refreshSocketTaskRunner();
    }

    // Refreshes the socket every defined number of milliseconds.
    refreshSocketTaskRunner() {
        if (this.disposed_)
            return;

        logstash('' /* empty message */, LOGSTASH_UNIX_SOCKET);
        wait(LOGSTASH_SOCKET_REFRESH_INTERVAL_MS).then(
            LogWriter.prototype.refreshSocketTaskRunner.bind(this));
    }

    // Writes the |event| to the system log, attributed to the |player|.
    writeAttributedEvent(player, type, event = {}) {
        if (!this.sessions_.has(player)) {
            if (!this.warnings_.has(player)) {
                console.log(
                    'Warning: no known session for player #' + player.id + ', ' + player.name);
            }

            this.warnings_.add(player);
            return;
        }

        event.session = this.sessions_.get(player);
        event.user_id = player.userId;
        event.gang_id = player.gangId || 0;

        this.writeEvent(type, event);
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
        const dateString = date.getUTCFullYear() + '-' + ensureDoubleDigit(date.getUTCMonth() + 1) + '-' +
                           ensureDoubleDigit(date.getUTCDate());
        const timeString = ensureDoubleDigit(date.getUTCHours()) + ':' +
                           ensureDoubleDigit(date.getUTCMinutes()) + ':' +
                           ensureDoubleDigit(date.getUTCSeconds());

        return dateString + 'T' + timeString + 'Z';
    }

    dispose() {
        this.disposed_ = true;
        this.sessions_ = null;
    }
}

export default LogWriter;
