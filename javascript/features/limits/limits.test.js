// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('Limits', (it, beforeEach) => {
    let decider = null;
    let feature = null;
    let gunther = null;

    beforeEach(() => {
        feature = server.featureManager.loadFeature('limits');
        gunther = server.playerManager.getById(/* Gunther= */ 0);

        decider = feature.decider_;
    });

    it('rejects invalid requirements and throttles', assert => {
        assert.throws(() => decider.decide(gunther, { requirements: [ 'bananas' ] }));
    });

    it('should allow operations when no requirements or throttles have been passed', assert => {
        assert.isTrue(decider.decide(gunther, {}).isApproved());
    });
});
