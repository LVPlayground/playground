// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('DamageManager', (it, beforeEach) => {
    let manager = null;
    let mitigator = null;

    beforeEach(() => {
        const abuse = server.featureManager.loadFeature('abuse');

        manager = abuse.damageManager_;
        mitigator = abuse.mitigator_;
    });

    // TODO: Define some tests.
});
