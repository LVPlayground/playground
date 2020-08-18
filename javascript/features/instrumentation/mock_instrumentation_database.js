// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { InstrumentationDatabase } from 'features/instrumentation/instrumentation_database.js';

// Implementation of the InstrumentationDatabase class with all the routines that actually interact
// with the database mocked out, to enable testing of this sub-system at the lowest level.
export class MockInstrumentationDatabase extends InstrumentationDatabase {
    commands = [];
    signals = [];

    async recordCommand(player, commandName, commandSuccess) {
        this.commands.push({ player, commandName, commandSuccess });
    }

    async recordSignal(player, signal) {
        this.signals.push({ player, signal });
    }
}
