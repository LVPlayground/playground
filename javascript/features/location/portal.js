// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this entrance code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// A portal represents bidirectional teleportation points that teleport to each other. Both of the
// portal's points has a position, and a rotation in which the player will be facing when being
// teleported to it. Both sides of a portal have an assigned interior and virtual world as well.
//
// TODO: Portals should support labels.
// TODO: Portals should support custom (asynchronous) permission checks.
// TODO: Portals should support enter/exit callbacks.
class Portal {
    constructor(name, entrance, exit, disabled = false) {
        if (!Portal.validatePoint(entrance)) {
            throw new Error('The `entrance` must be an object having { position, facingAngle, ' +
                            'interior and virtualWorld }.');
        }

        if (!Portal.validatePoint(exit)) {
            throw new Error('The `exit` must be an object having { position, facingAngle, ' +
                            'interior and virtualWorld }.');
        }

        this.name_ = name;

        this.entrancePosition_ = entrance.position;
        this.entranceFacingAngle_ = entrance.facingAngle;
        this.entranceInteriorId_ = entrance.interiorId;
        this.entranceVirtualWorld_ = entrance.virtualWorld;

        this.exitPosition_ = exit.position;
        this.exitFacingAngle_ = exit.facingAngle;
        this.exitInteriorId_ = exit.interiorId;
        this.exitVirtualWorld_ = exit.virtualWorld;

        this.disabled_ = disabled;
    }

    // Validates that |point| represents a dictionary with the minimal required information, which
    // means the point's position, exit rotation, interior Id and virtual world.
    static validatePoint(point) {
        return point.hasOwnProperty('position') && (point.position instanceof Vector) &&
               point.hasOwnProperty('facingAngle') && typeof point.facingAngle === 'number' &&
               point.hasOwnProperty('interiorId') && typeof point.interiorId === 'number' &&
               point.hasOwnProperty('virtualWorld') && typeof point.virtualWorld === 'number';
    }

    // Gets the name of this portal.
    get name() { return this.name_; }

    // Gets the position of the portal's entrance point as a vector.
    get entrancePosition() { return this.entrancePosition_; }

    // Gets the rotation the player should face when teleporting to the portal's entrance.
    get entranceFacingAngle() { return this.entranceFacingAngle_; }

    // Gets the interior Id in which the portal's entrance should exist.
    get entranceInteriorId() { return this.entranceInteriorId_; }

    // Gets the virtual world in which the portal's entrance should exist.
    get entranceVirtualWorld() { return this.entranceVirtualWorld_; }

    // Gets the position of the portal's exit point as a vector.
    get exitPosition() { return this.exitPosition_; }

    // Gets the rotation the player should face when teleporting to the portal's exit.
    get exitFacingAngle() { return this.exitFacingAngle_; }

    // Gets the interior Id in which the portal's exit should exist.
    get exitInteriorId() { return this.exitInteriorId_; }

    // Gets the virtual world in which the portal's exit should exist.
    get exitVirtualWorld() { return this.exitVirtualWorld_; }

    // Gets or sets whether this portal is disabled.
    get disabled() { return this.disabled_; }
    set disabled(value) { this.disabled_ = value; }
}

exports = Portal;
