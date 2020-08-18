// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { substitute } from 'components/database/substitute.js';

// Query to record commands into the database. Split up in the value component, as well as the base
// query component. Multiple values can be substituted into the same query.
const kRecordCommandsQueryValue = `(?, ?, ?)`;
const kRecordCommandsQueryBase = `
    INSERT INTO
        instrumentation_commands
        (instrumentation_user_id, command_name, command_result)
    VALUES `;

// Query to record commands into the database. Split up in the value component, as well as the base
// query component. Multiple values can be substituted into the same query.
const kRecordSignalsQueryValue = `(?, ?, ?)`;
const kRecordSignalsQueryBase = `
    INSERT INTO
        instrumentation_signals
        (instrumentation_user_id, signal_id, signal_values)
    VALUES `;

// Delay before committing instrumentation data to the database, in milliseconds.
export const kInstrumentationCommitDelayMs = 5000;

// Provides the ability to persist instrumentation data in the database. Data is associated with a
// user id when known, but this will not generally be exposed on dashboards unless required.
export class InstrumentationDatabase {
    #commandQueue_ = [];
    #signalQueue_ = [];

    #writePending_ = false;

    // ---------------------------------------------------------------------------------------------

    // Records that the |player| has executed the |commandName|. Will not write to the database
    // immediately, but will rather buffer writes which will be committed once per X seconds.
    async recordCommand(player, commandName, commandSuccess) {
        const userId = player.account.isIdentified() ? player.account.userId
                                                     : /* unregistered= */ 0;

        this.#commandQueue_.push([ userId, commandName, commandSuccess ]);
        this.requestWrite();
    }

    // Records that the |player| has executed the given |signal|. Will not write to the database
    // immediately, but will rather buffer writes which will be committed once per X seconds.
    async recordSignal(player, signal, ...values) {
        const valueString = values.length ? JSON.stringify(values) : '';
        const userId = player.account.isIdentified() ? player.account.userId
                                                     : /* unregistered= */ 0;

        this.#signalQueue_.push([ userId, signal.id, valueString ]);
        this.requestWrite();
    }

    // ---------------------------------------------------------------------------------------------

    // Requests a write to the database. We, at most, write once per five seconds, in which all
    // pending data will be aggregated into one database query per category.
    requestWrite() {
        if (this.#writePending_)
            return;  // a write is already pending

        this.#writePending_ = true;

        wait(kInstrumentationCommitDelayMs).then(async () => {
            if (this.#commandQueue_.length)
                await this.commitCommandQueue();

            if (this.#signalQueue_.length)
                await this.commitSignalQueue();

            this.#writePending_ = false;
        });
    }

    // Commits all pending commands to the database. There can be any number of commands stored in
    // the command queue, each recorded in the past |kInstrumentationCommitDelayMs|.
    async commitCommandQueue() {
        const values = [];

        for (const parameters of this.#commandQueue_)
            values.push(substitute(kRecordCommandsQueryValue, ...parameters));

        this.#commandQueue_ = [];

        if (values.length)
            return this.runQuery(kRecordCommandsQueryBase + values.join(','));
    }

    // Commits all pending signals to the database. There can be any number of signals stored in the
    // signal queue, but each will have been recorded in the past |kInstrumentationCommitDelayMs|.
    async commitSignalQueue() {
        const values = [];

        for (const parameters of this.#signalQueue_)
            values.push(substitute(kRecordSignalsQueryValue, ...parameters));

        this.#signalQueue_ = [];

        if (values.length)
            return this.runQuery(kRecordSignalsQueryBase + values.join(','));
    }

    // Method to execute the given |query|. Extracted into a separate method so that tests can cover
    // the buffered commit flow implemented in this class.
    async runQuery(query) {
        return server.database.query(query);
    }
}
