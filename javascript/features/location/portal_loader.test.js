// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this entrance code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import PortalLoader from 'features/location/portal_loader.js';

describe('PortalLoader', it => {
    const validPoint = { position: [0, 0, 0], facingAngle: 0, interiorId: 0 };

    it('should validate that the input data matches the requirements', assert => {
        const loader = new PortalLoader();

        assert.throws(() => loader.fromArrayForTesting([ { } ]));
        assert.throws(() => loader.fromArrayForTesting([ { name: 'foo', entrance: 1, exit: 1 } ]));
        assert.throws(() => loader.fromArrayForTesting([
            { name: 'foo', entrance: { virtualWorld: 1 }, exit: {} }
        ]));

        assert.throws(() => loader.fromArrayForTesting([
            { name: 'foo', entrance: {}, exit: { virtualWorld: 1 } }
        ]));

        assert.throws(() => loader.fromArrayForTesting([
            { name: 'foo', entrance: {}, exit: {} }
        ]));

        assert.throws(() => loader.fromArrayForTesting([
            { name: 'foo', entrance: validPoint, exit: {} }
        ]));

        assert.throws(() => loader.fromArrayForTesting([
            { name: 'foo', entrance: {}, exit: validPoint }
        ]));

        assert.throws(() => loader.fromArrayForTesting([
            { name: 'foo', entrance: validPoint, exit: validPoint },
            { name: 'foo', entrance: validPoint, exit: validPoint }
        ]));
    });

    it('should assign incrementing virtual worlds to portals not defining their own', assert => {
        const loader = new PortalLoader();
        const portals = loader.fromArrayForTesting([
            {
                name: 'foo1',
                entrance: validPoint,
                exit: validPoint
            },
            {
                name: 'foo2',
                entrance: validPoint,
                exit: validPoint
            }
        ]);

        assert.equal(portals.length, 2);

        assert.equal(portals[0].entranceVirtualWorld, 0);
        assert.notEqual(portals[0].exitVirtualWorld, 0);

        assert.equal(portals[1].entranceVirtualWorld, 0);
        assert.notEqual(portals[1].exitVirtualWorld, 0);

        assert.notEqual(portals[0].exitVirtualWorld, portals[1].exitVirtualWorld);
    });

    it('should load portal information with the appropriate values', assert => {
        const loader = new PortalLoader();
        const portals = loader.fromArrayForTesting([
            {
                name: 'foo',
                entrance: { position: [1, 2, 3], facingAngle: 4, interiorId: 5, virtualWorld: 6 },
                exit: { position: [7, 8, 9], facingAngle: 10, interiorId: 11, virtualWorld: 12 },
                disabled: true
            }
        ]);

        assert.equal(portals.length, 1);

        const portal = portals[0];

        assert.equal(portal.name, 'foo');

        assert.equal(portal.entrancePosition.x, 1);
        assert.equal(portal.entrancePosition.y, 2);
        assert.equal(portal.entrancePosition.z, 3);
        assert.equal(portal.entranceFacingAngle, 4);
        assert.equal(portal.entranceInteriorId, 5);
        assert.equal(portal.entranceVirtualWorld, 6);

        assert.equal(portal.exitPosition.x, 7);
        assert.equal(portal.exitPosition.y, 8);
        assert.equal(portal.exitPosition.z, 9);
        assert.equal(portal.exitFacingAngle, 10);
        assert.equal(portal.exitInteriorId, 11);
        assert.equal(portal.exitVirtualWorld, 12);

        assert.isTrue(portal.disabled);
    });
});
