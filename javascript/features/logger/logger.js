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

        this.writer_ = injectedWriter || new LogWriter();
        this.sessions_ = new WeakMap();

        this.entityLogger_ = new EntityLogger(this.writer_, this.sessions_);
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the logger.
    // ---------------------------------------------------------------------------------------------

    // TODO(Russell): Define the public API for the logger.

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.entityLogger_.dispose();
        this.entityLogger_ = null;

        this.writer_.dispose();
        this.writer_ = null;
    }
}

exports = Logger;
