// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Encapsulates the settings associated with a minigame. Normally created when initializing a
// sub-class of the Minigame class. The object is immutable after construction.
class MinigameSettings {
    constructor(settings) {
        if (typeof settings !== 'object')
            throw new Error('An object with settings must be passed when creating a minigame.');

        // Verify that all required properties exist on the |settings| object.
        if (!settings.hasOwnProperty('name') || typeof settings.name !== 'string')
            throw new Error('A minigame must be given a player-readable name.');
        if (!settings.hasOwnProperty('command') || typeof settings.command !== 'string')
            throw new Error('A minigame must be given a player-executable command.');

        if (!settings.hasOwnProperty('minimumParticipants'))
            throw new Error('A minigame must have a minimum number of participants.');
        if (!settings.hasOwnProperty('maximumParticipants'))
            throw new Error('A minigame must have a maximum number of participants.');

        this.name_ = settings.name;
        this.command_ = settings.command;

        this.timeout_ = settings.timeout || 0;

        this.minimumParticipants_ = settings.minimumParticipants;
        this.maximumParticipants_ = settings.maximumParticipants;

        this.enableRespawn_ = settings.enableRespawn || false;
    }

    // Gets the name of this minigame.
    get name() { return this.name_; }

    // Gets the command through which players can join this minigame.
    get command() { return this.command_; }

    // Gets the timeout, in seconds, that this minigame is allowed to run for.
    get timeout() { return this.timeout_; }

    // Gets the minimum number of participants required to run this minigame.
    get minimumParticipants() { return this.minimumParticipants_; }

    // Gets the maximum number of participants that may participate in this minigame.
    get maximumParticipants() { return this.maximumParticipants_; }

    // Gets whether players can respawn within the lifetime of this minigame.
    get enableRespawn() { return this.enableRespawn_; }
}

export default MinigameSettings;
