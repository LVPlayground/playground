// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const KilltimeManager = require('features/killtime/killtime_manager.js');
const KilltimeCommands = require('features/killtime/killtime_commands.js');

// Killtime is a fun element in LVP for, especially, DMers. This provides the possibility to give a prize for the
// player who kills the most players in the given time.
class Killtime extends Feature {
    constructor() {
        super();

        // Be able to send a certain message to a certain public
        const announce = this.defineDependency('announce', true /* isFunctional */);

        // Killtime prizes are calculated by our economy-feature
        const economy = this.defineDependency('economy', true /* isFunctional */);

        this.manager_ = new KilltimeManager(announce, economy);
        this.commands_ = new KilltimeCommands(this.manager_);
    }

    dispose() {
        this.manager_.dispose();
        this.commands_.dispose();
    }
}

exports = Killtime;
