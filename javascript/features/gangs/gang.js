// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Encapsulates the information associated with a gang. Changes to data stored in this class should
// only be made from the Gang Manager, since it may have to be propagated to multiple places.
class Gang {
    constructor(info) {
        this.id_ = info.id;
        this.tag_ = info.tag;
        this.name_ = info.name;
        this.goal_ = info.goal;
        this.color_ = info.color;

        this.members_ = new Map();
    }

    // Gets the persistent Id of this gang as stored in the database.
    get id() { return this.id_; }

    // Gets the tag used by members of this gang.
    get tag() { return this.tag_; }

    // Gets the name of this gang, as can be used for presentation.
    get name() { return this.name_; }

    // Gets or sets the goal of this gang, as can be used for presentation.
    get goal() { return this.goal_; }
    set goal(value) { this.goal_ = value; }

    // Gets the color of members of this gang.
    get color() { return this.color_; }

    // Gets an iterable of the members in this gang. Must be used with `for of`.
    get members() { return this.members_.keys(); }

    // Gets the number of members that are currently in the gang.
    get memberCount() { return this.members_.size; }

    // Adds |player| with |role| to the gang. The |role| must be one of the ROLE_* constants defined
    // on the function object of this class.
    addPlayer(player, role) {
        this.members_.set(player, role);

        if (!server.isTest() && this.color_ !== null)
            pawnInvoke('OnUpdatePlayerGangColor', 'ii', player.id, this.color_);
    }

    // Returns the role |player| has in the gang, or NULL when they are not part of the gang.
    getPlayerRole(player) {
        if (!this.members_.has(player))
            return null;

        return this.members_.get(player);
    }

    // Returns whether |player| is part of this gang.
    hasPlayer(player) {
        return this.members_.has(player);
    }

    // Removes |player| from the list of members of this gang.
    removePlayer(player) {
        this.members_.delete(player);

        if (!server.isTest() && !player.isDisconnecting())
            pawnInvoke('OnUpdatePlayerGangColor', 'ii', player.id, 0 /* reset */);
    }
}

// The different roles players can have in gangs.
Gang.ROLE_LEADER = 0;
Gang.ROLE_MANAGER = 1;
Gang.ROLE_MEMBER = 2;

exports = Gang;
