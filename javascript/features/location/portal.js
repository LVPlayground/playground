// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this entrance code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// A portal represents bidirectional teleportation points that teleport to each other. Both of the
// portal's points has a position, and a rotation in which the player will be facing when being
// teleported to it. Both sides of a portal have an assigned interior and virtual world as well.
class Portal {
    constructor(name, entrance, exit, { color = 'yellow', disabled = false, label = null,
                                        accessCheckFn = null, enterFn = null, exitFn = null } = {}) {
        if (!Portal.validatePoint(entrance)) {
            throw new Error('The `entrance` must be an object having { position, facingAngle, ' +
                            'interior and virtualWorld }.');
        }

        if (!Portal.validatePoint(exit)) {
            throw new Error('The `exit` must be an object having { position, facingAngle, ' +
                            'interior and virtualWorld }.');
        }

        this.name_ = name;
        this.color_ = color;

        this.entrancePosition_ = entrance.position;
        this.entranceFacingAngle_ = entrance.facingAngle;
        this.entranceInteriorId_ = entrance.interiorId;
        this.entranceVirtualWorld_ = entrance.virtualWorld;

        this.exitPosition_ = exit.position;
        this.exitFacingAngle_ = exit.facingAngle;
        this.exitInteriorId_ = exit.interiorId;
        this.exitVirtualWorld_ = exit.virtualWorld;

        this.disabled_ = disabled;
        this.label_ = label;

        this.accessCheckFn_ = accessCheckFn;
        this.enterFn_ = enterFn;
        this.exitFn_ = exitFn;
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

    // Gets or sets the color of this portal. Updating the color should only be done by the Interior
    // Manager, as the portal may have to be recreated for the change to take effect.
    get color() { return this.color_; }
    set color(value) { this.color_ = value; }

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

    // Gets or sets the label that should be displayed with this portal. The label should only be
    // updated by the InteriorManager since it may have to be recreated.
    get label() { return this.label_; }
    set label(value) { this.label_ = value; }

    // Gets the access check function unique to this portal. May be asynchronous. May be NULL.
    get accessCheckFn() { return this.accessCheckFn_; }

    // Gets the function that is to be executed when a player enters the portal. May be NULL.
    get enterFn() { return this.enterFn_; }

    // Gets the function that is to be executed when a player exits the portal. May be NULL.
    get exitFn() { return this.exitFn_; }
}

export default Portal;
