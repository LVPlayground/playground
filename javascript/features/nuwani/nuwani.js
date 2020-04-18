// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';

import { Configuration } from 'features/nuwani/configuration.js';
import { Runtime } from 'features/nuwani/runtime/runtime.js';

// Base of the Nuwani feature, which is a JavaScript-powered implementation of the IRC Bots that
// provide echo and communication functionalities to a series of IRC channels.
export default class extends Feature {
    configuration_ = null;
    runtime_ = null;

    constructor() {
        super();

        if (server.isTest())
            return;

        this.configuration_ = new Configuration();

        this.runtime_ = new Runtime(this.configuration_);
        this.runtime_.connect();
    }

    dispose() {
        this.runtime_.dispose();
    }
}
