// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const EntityLogger = require('features/logger/entity_logger.js');
const Feature = require('components/feature_manager/feature.js');
const LogWriter = require('features/logger/log_writer.js');

// Las Venturas Playground has the ability to record all in-game events and happenings for the
// purposes of gathering analytics. These provide important tools to administrators, as well as
// data to influence prioritization of new features.
class Logger extends Feature {
    constructor(_, injectedWriter) {
        super();

        this.sessions_ = new WeakMap();
        this.writer_ = injectedWriter || new LogWriter(this.sessions_);

        this.entityLogger_ = new EntityLogger(this.writer_, this.sessions_);
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the logger.
    // ---------------------------------------------------------------------------------------------

    // Records that |player| has passed a checkpoint of |raceId| in |time| milliseconds.
    recordRaceCheckpointResult(player, raceId, checkpointId, time) {
        this.writer_.writeAttributedEvent(player, 'racecheckpoint', {
            race_id: raceId,
            checkpoint_id: checkpointId,
            time: time
        });
    }

    // Records that the |player| has finished |raceId| in |time| milliseconds.
    recordRaceResult(player, raceId, time) {
        this.writer_.writeAttributedEvent(player, 'raceresult', {
            race_id: raceId,
            time: time
        });
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.entityLogger_.dispose();
        this.entityLogger_ = null;

        this.writer_.dispose();
        this.writer_ = null;
    }
}

exports = Logger;
