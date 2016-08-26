// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this entrance code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Portal = require('features/location/portal.js');

// Loads a series of portals from a portal definition file into an array of Portal instances. The
// file should contain an array of portal entries, each of which is defined as:
//
// {
//     "name": "FOOBAR",
//     "entrance": { "position": [ X, Y, Z ], "facingAngle": 360, "interiorId": 0 },
//     "exit": { "position": [ X, Y, Z ], "facingAngle": 360, "interiorId": 7 }
// }
//
// Optionally, both the entrances and exits may have defined `virtualWorld` values. These default to
// a unique, private virtual world for the portal, but can be overridden for gameplay purposes. When
// either the entrance or the exit has a defined virtual world, so must the other.
//
// Finally, each portal may also define a "disabled" key. When set, the portal will not be created
// on the server, but it will be possible for administrators to enable it.
class PortalLoader {
    constructor() {
        this.portalIndex_ = 0;
        this.portalNames_ = new Set();
    }

    // Loads all portals from the |filename|, returning an array with the created Portal instances.
    fromFile(filename) {
        const definitions = JSON.parse(readFile(filename));
        if (!Array.isArray(definitions))
            throw new Error('The portal definition file "' + filename + '" must contain an array.');

        return definitions.map(definition => this.createPortal(definition));
    }

    // Loads all portals from the |definitions|. Should only be used for testing.
    fromArrayForTesting(definitions) {
        return definitions.map(definition => this.createPortal(definition));
    }

    // Creates a portal from |definition|. Validates that the |definition| is valid and assigns a
    // virtual world when required.
    createPortal(definition) {
        if (!definition.hasOwnProperty('name') || typeof definition.name !== 'string')
            throw new Error('Each portal definition must have a textual name.');

        if (!definition.hasOwnProperty('entrance') || typeof definition.entrance !== 'object' ||
            !definition.hasOwnProperty('exit') || typeof definition.exit !== 'object') {
            throw new Error('Each portal definition must have an entrance and an exit.');
        }

        if ((definition.entrance.hasOwnProperty('virtualWorld') &&
                !definition.exit.hasOwnProperty('virtualWorld')) ||
            (!definition.entrance.hasOwnProperty('virtualWorld') &&
                definition.exit.hasOwnProperty('virtualWorld'))) {
            throw new Error('Either both the entrance and exit have a virtual world, or neither.');
        }

        const name = definition.name;

        if (this.portalNames_.has(name))
            throw new Error('A portal named "' + name + '" has already been defined.');

        this.portalNames_.add(name);

        const entrance = this.createPointObject(definition.entrance, 0);
        const exit =
            this.createPointObject(definition.exit, VirtualWorld.forInterior(this.portalIndex_++));

        // Presence and truthyness of the `disabled` property defines whether to disable the portal.
        const disabled = !!definition.disabled;

        return new Portal(name, entrance, exit, { disabled });
    }

    // Creates an object representing the |point| with all data points filled in. The given
    // |defaultVirtualWorld| will be used unless the |point| defines its own.
    createPointObject(point, defaultVirtualWorld) {
        if (!point.hasOwnProperty('position') || !Array.isArray(point.position))
            throw new Error('Each portal entrance and exit must have a defined position.');

        if (!point.hasOwnProperty('facingAngle') || typeof point.facingAngle !== 'number')
            throw new Error('Each portal entrance and exit must have a facing angle.');

        if (!point.hasOwnProperty('interiorId') || typeof point.interiorId !== 'number')
            throw new Error('Each portal entrance and exit must have an interior Id.');

        if (point.hasOwnProperty('virtualWorld') && typeof point.virtualWorld !== 'number')
            throw new Error('Each portal entrance and exit must have a numeric virtual world.');

        return {
            position: new Vector(...point.position),
            facingAngle: point.facingAngle,
            interiorId: point.interiorId,
            virtualWorld: point.hasOwnProperty('virtualWorld') ? point.virtualWorld
                                                               : defaultVirtualWorld
        };
    }
}

exports = PortalLoader;
