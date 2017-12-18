// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import IdentityBeam from 'features/houses/utils/identity_beam.js';

describe('IdentityBeam', it => {
    const position = new Vector(1000, 1000, 500);

    it('should create two objects on the server', assert => {
        const objectCount = server.objectManager.count;
        const textLabelCount = server.textLabelManager.count;

        const beam = new IdentityBeam(position);

        assert.equal(server.objectManager.count, objectCount + 2);
        assert.equal(server.textLabelManager.count, textLabelCount);

        beam.dispose();

        assert.equal(server.objectManager.count, objectCount);
        assert.equal(server.textLabelManager.count, textLabelCount);
    });

    it('should personalize the beam for the target player', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.rotation = 45;

        const beam = new IdentityBeam(position, { player: gunther });
        const objects = Array.from(beam.entities_.objects_);

        assert.equal(objects.length, 2);

        assert.equal(objects[0].rotation.z, 45);
        assert.equal(objects[1].rotation.z, 135);

        assert.isTrue(gunther.streamerObjectsUpdated());
    });

    it('should create a label for the beam when requested', assert => {
        const textLabelCount = server.textLabelManager.count;

        const beam = new IdentityBeam(position, {
            label: 'Foo Bar Baz'
        });

        assert.equal(server.textLabelManager.count, textLabelCount + 1);

        beam.dispose();

        assert.equal(server.textLabelManager.count, textLabelCount);
    });

    it('should honor the timeout given for the beam', async(assert) => {
        const objectCount = server.objectManager.count;
        const beam = new IdentityBeam(position, { timeout: 180000 });

        assert.equal(server.objectManager.count, objectCount + 2);

        await server.clock.advance(180000);

        assert.equal(server.objectManager.count, objectCount);
    });

    it('should be safe to be disposed multiple times', assert => {
        const beam = new IdentityBeam(position);

        beam.dispose();
        beam.dispose();
        beam.dispose();
    });
});
