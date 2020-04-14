// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';

import { Configuration } from 'features/nuwani/configuration.js';

// Base of the Nuwani feature, which is a JavaScript-powered implementation of the IRC Bots that
// provide echo and communication functionalities to a series of IRC channels.
export default class extends Feature {
    #configuration_ = null;

    constructor() {
        super();

        this.#configuration_ = new Configuration();
    }

    dispose() {
    }
}
