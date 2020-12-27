// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { InstrumentationDatabase,
         kInstrumentationCommitDelayMs } from 'features/instrumentation/instrumentation_database.js';

import * as signals from 'features/instrumentation/instrumentation_signals.js';

describe('Instrumentation', (it, beforeEach) => {
    let database = null;
    let feature = null;
    let gunther = null;
    let russell = null;

    beforeEach(async () => {
        feature = server.featureManager.loadFeature('instrumentation');

        database = feature.database_;
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);

        russell.level = Player.LEVEL_ADMINISTRATOR;

        await russell.identify({ userId: 13 });
    });

    it('should be able to log command executions', async (assert) => {
        server.featureManager.loadFeature('communication_commands');

        // (1) Successful sub-command.
        assert.isTrue(await gunther.issueCommand('/pm Russell Hey mate!'));

        assert.equal(database.commands.length, 1);
        assert.strictEqual(database.commands[0].player, gunther);
        assert.equal(database.commands[0].commandName, '/pm');
        assert.isTrue(database.commands[0].commandSuccess);

        // (2) Failed sub-command.
        assert.isFalse(await gunther.issueCommand('/pm CookieMonster y u not her'));

        assert.equal(database.commands.length, 2);
        assert.strictEqual(database.commands[1].player, gunther);
        assert.equal(database.commands[1].commandName, '/pm');
        assert.isFalse(database.commands[1].commandSuccess);

        // (3) Successful main command.
        assert.isTrue(await russell.issueCommand('/ignored Gunther'));

        assert.equal(database.commands.length, 3);
        assert.strictEqual(database.commands[2].player, russell);
        assert.equal(database.commands[2].commandName, '/ignored [target]');
        assert.isTrue(database.commands[2].commandSuccess);

        // (4) Failed main command.
        assert.isFalse(await russell.issueCommand('/cookiecommand'));

        assert.equal(database.commands.length, 4);
        assert.strictEqual(database.commands[3].player, russell);
        assert.equal(database.commands[3].commandName, '/cookiecommand');
        assert.isFalse(database.commands[3].commandSuccess);

        // (5) Ignored failed main command. (Exists in Pawn.)
        assert.isFalse(await russell.issueCommand('/gotogtamv'));

        assert.equal(database.commands.length, 4);
    });

    it('should be able to record signals', assert => {
        const ids = new Set();

        let iteration = 1;
        for (const [ name, signal ] of Object.entries(signals)) {
            assert.setContext(name);

            // (1) Make sure that the |signal| is unique, and has all required data set.
            assert.typeOf(signal.id, 'number');
            assert.typeOf(signal.name, 'string');
            assert.typeOf(signal.description, 'string');

            assert.isAbove(signal.name.length, 3);
            assert.isAbove(signal.description.length, 3);

            assert.isFalse(ids.has(signal.id));  // <-- if this fails, you've got a duplicate ID

            ids.add(signal.id);

            // (2) Make sure that we can write the given |signal|.
            assert.doesNotThrow(() => feature.recordSignal(gunther, signal));

            assert.equal(database.signals.length, iteration);
            assert.strictEqual(database.signals[iteration - 1].player, gunther);
            assert.strictEqual(database.signals[iteration - 1].signal, signal);

            ++iteration;
        }
    });

    it('should be able to buffer command and signal queries', async (assert) => {
        let latestQuery = null;

        const realDatabase = new class extends InstrumentationDatabase {
            async runQuery(query) {
                latestQuery = query;
            }
        };

        // (1) Record three commands, expect them to be batched together.
        realDatabase.recordCommand(gunther, '/pm', true);
        realDatabase.recordCommand(russell, '/pm', true);
        realDatabase.recordCommand(gunther, '/whatisthis', false);

        assert.isNull(latestQuery);

        await server.clock.advance(kInstrumentationCommitDelayMs);
        await Promise.resolve();

        assert.isNotNull(latestQuery);

        assert.includes(latestQuery, '/pm');
        assert.includes(latestQuery, '13');  // Russell's user ID

        latestQuery = null;

        // (2) Record two signals, and expect them to be batched together as well.
        realDatabase.recordSignal(gunther, signals.kAccountNameChange, 'Guntah');
        realDatabase.recordSignal(russell, signals.kAccountViewInformation);

        assert.isNull(latestQuery);

        await server.clock.advance(kInstrumentationCommitDelayMs);
        await Promise.resolve();

        assert.isNotNull(latestQuery);

        assert.includes(latestQuery, String(signals.kAccountNameChange.id));
        assert.includes(latestQuery, 'Guntah');  // Value for the name change signal
        assert.includes(latestQuery, '13');  // Russell's user ID
    });
});
