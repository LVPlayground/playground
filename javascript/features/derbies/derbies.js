// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import { DerbyRegistry } from 'features/derbies/derby_registry.js';

// The Derbies feature is responsible for providing the derbies interface on the server. It builds
// on top of the Games API, for ensuring consistent behaviour of games on the server.
export default class Derbies extends Feature {
    registry_ = null;

    constructor() {
        super();

        // The registry is responsible for keeping tabs on the available derbies.
        this.registry_ = new DerbyRegistry();
    }

    // ---------------------------------------------------------------------------------------------
    // The derbies feature does not define a public API.
    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.registry_.dispose();
        this.registry_ = null;
    }
}
