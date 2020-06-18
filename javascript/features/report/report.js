// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import ReportCommands from 'features/report/report_commands.js';

// Players are able to report other players in-game if they are suspecting they are using illegal
// stuff.
class Report extends Feature {
    constructor() {
        super();

        // Be able to send a certain message to a certain public
        const announce = this.defineDependency('announce');

        // Be able to send reports to the crew channel on IRC.
        const nuwani = this.defineDependency('nuwani');

        this.commands_ = new ReportCommands(announce, nuwani);
    }

    dispose() {
        this.commands_.dispose();
    }
}

export default Report;
