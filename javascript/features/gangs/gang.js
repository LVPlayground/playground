// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Encapsulates the information associated with a gang.
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

    // Gets the goal of this gang, as can be used for presentation.
    get goal() { return this.goal_; }

    // Gets the color of members of this gang.
    get color() { return this.color_; }

    // Gets the number of members that are currently in the gang.
    get memberCount() { return this.members_.size; }

    // Adds |player| with |role| to the gang. The |role| must be one of the ROLE_* constants defined
    // on the function object of this class.
    addPlayer(player, role) {
        this.members_.set(player, role);
    }

    // Returns whether |player| is part of this gang.
    hasPlayer(player) {
        return this.members_.has(player);
    }

    // Removes |player| from the list of members of this gang.
    removePlayer(player) {
        this.members_.delete(player);
    }
}

// The different roles players can have in gangs.
Gang.ROLE_LEADER = 0;
Gang.ROLE_MANAGER = 1;
Gang.ROLE_MEMBER = 2;

exports = Gang;
