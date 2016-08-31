// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const KilltimeCommands = require('features/killtime/killtime_commands.js');

// Players are able to report other players in-game if they are suspecting they are using illegal
// stuff.
class Killtime extends Feature {
    constructor() {
        super();

        // Be able to send a certain message to a certain public
        //const announce = this.defineDependency('announce', true /* isFunctional */);

        this.commands_ = new KilltimeCommands();//announce);
    }

    dispose() {
        this.commands_.dispose();
    }
}

exports = Killtime;
