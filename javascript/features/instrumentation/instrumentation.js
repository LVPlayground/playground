// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import { InstrumentationCommandObserver } from 'features/instrumentation/instrumentation_command_observer.js';
import { InstrumentationDatabase } from 'features/instrumentation/instrumentation_database.js';
import { MockInstrumentationDatabase } from 'features/instrumentation/mock_instrumentation_database.js';

// Understanding what happens on Las Venturas Playground is important in order to judge where to
// invest our time. For that reason we have the ability to instrument various parts of our system.
export default class Instrumentation extends Feature {
    commandObserver_ = null;
    database_ = null;

    constructor() {
        super();

        // The ability to instrument our system is a foundational feature, runs silently in the
        // background and has no dependencies on any other systems.
        this.markFoundational();

        // The database which is able to persist signals for us.
        this.database_ = server.isTest() ? new MockInstrumentationDatabase()
                                         : new InstrumentationDatabase();

        // Observes the command manager, so that all command executions can can be gracefully logged
        // in the database without needing more intrusive code.
        this.commandObserver_ = new InstrumentationCommandObserver(this.database_);
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the Instrumentation feature
    // ---------------------------------------------------------------------------------------------

    // TODO: Define the API

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.commandObserver_.dispose();
        this.commandObserver_ = null;

        this.database_ = null;
    }
}
