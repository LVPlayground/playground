// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('DecorationSync', (it, beforeEach) => {
    let gunther = null;
    let registry = null;
    let sync = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('player_decorations');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        registry = feature.registry_;
        sync = feature.sync_;
    });

    it('should attach and remove objects when a player connects or disconnects', async (assert) => {
        await gunther.identify();

        assert.equal([ ...gunther.getAttachedObjects() ].length, 0);

        // Now amend Gunther's skin decoration configuration to include some hair. It should be
        // shown on their persona when we "resume" the decorations again.
        assert.isDefined(registry.getDecoration(4230631640));

        gunther.account.skinDecorations = [ 4230631640 ];

        assert.doesNotThrow(() => sync.resumeForPlayer(gunther));

        // Verify that Gunther has one attached object, which happens to be the hair model ID.
        assert.equal([ ...gunther.getAttachedObjects() ].length, 1);
        assert.equal([ ...gunther.getAttachedObjects() ][0][1], 19077);

        // When we suspend decorations again, they should've disappeared from their persona.
        assert.doesNotThrow(() => sync.suspendForPlayer(gunther));
        assert.equal([ ...gunther.getAttachedObjects() ].length, 0);
    });
});
