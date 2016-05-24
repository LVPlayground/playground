// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const ReportCommands = require('features/report/report_commands.js');

class Report extends Feature {
    constructor () {
        super();

        const announce = this.defineDependency('announce');

        this.commands_ = new ReportCommands(announce);
    }

    dispose () {
        this.commands_.dispose();
    }
}

exports = Report;
