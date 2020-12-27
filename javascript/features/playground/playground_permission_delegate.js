// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandPermissionDelegate } from 'components/commands/command_permission_delegate.js';

// Time, in milliseconds, after which exceptions expire after disconnecting from the server. We set
// this to 15 minutes which allows people to take a reasonable break.
export const kExceptionExpirationTimeMs = 15 * 60 * 1000;

// Delegate that defers command permission access checking to the Playground feature, adding various
// abilities for overrides and exceptions on top of the generic command system.
export class PlaygroundPermissionDelegate extends CommandPermissionDelegate {
    #exceptions_ = null;
    #expired_ = null;
    #overrides_ = null;
    #temporaryStatusOverrides_ = null;

    constructor() {
        super();

        // Map from CommandDescription instance to a Set of Player entries.
        this.#exceptions_ = new Map();

        // Map of expired exceptions, keyed by User ID, valued by { expirationTime, commands }.
        this.#expired_ = new Map();

        // Map from CommandDescription instance to a Player.LEVEL_* constant value.
        this.#overrides_ = new Map();

        // Map from CommandDescription instance to a boolean indicated whether the given command
        // should be restricted to temporary administrators.
        this.#temporaryStatusOverrides_ = new Map();

        // Observe login and disconnect events to enable exceptions to last between sessions.
        server.playerManager.addObserver(this);

        // Instate ourselves as the canonical permission delegate for commands on the server.
        server.commandManager.setPermissionDelegate(this);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: access exceptions
    // ---------------------------------------------------------------------------------------------

    // Adds an exception for the given |player| to use the given |command|.
    addException(player, command) {
        if (!this.#exceptions_.has(command))
            this.#exceptions_.set(command, new Set());

        const overrides = this.#exceptions_.get(command);
        overrides.add(player);
    }

    // Gets an array with the players who have exceptions to use the given |command|.
    getExceptions(command) {
        if (this.#exceptions_.has(command))
            return [ ...this.#exceptions_.get(command) ];

        return [];
    }

    // Returns whether the given |player| has an exception to execute the given |command|.
    hasException(player, command) {
        const overrides = this.#exceptions_.get(command);
        return overrides && overrides.has(player);
    }

    // Removes the previously created exception that allowed the |player| to use the |command|. The
    // entire Set will be removed if there are no more overrides left for the |command|.
    removeException(player, command) {
        if (!this.#exceptions_.has(command))
            return;  // there are no overrides to remove

        const overrides = this.#exceptions_.get(command);
        overrides.delete(player);

        if (!overrides.size)
            this.#exceptions_.delete(command);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: access level amendments
    // ---------------------------------------------------------------------------------------------

    // Returns information about a command's access requirements { restrictLevel, originalLevel },
    // which includes whether the access level has been overridden by the system.
    getCommandLevel(command) {
        return {
            restrictLevel: this.#overrides_.get(command) ?? command.restrictLevel,
            originalLevel: command.restrictLevel,

            restrictTemporary:
                this.#temporaryStatusOverrides_.get(command) ?? command.restrictTemporary,
            originalTemporary: command.restrictTemporary,
        };
    }

    // Changes the required level for |command| to the given |level|. This will automatically
    // release the override if it's being restored to the command's original level. Optionally the
    // |restrictedToTemporaries| argument may be used, to toggle restrictions on a command.
    setCommandLevel(command, level, restrictedToTemporaries = null) {
        if (command.restrictLevel === level)
            this.#overrides_.delete(command);
        else
            this.#overrides_.set(command, level);

        if (level === Player.LEVEL_ADMINISTRATOR && restrictedToTemporaries !== null)
            this.#temporaryStatusOverrides_.set(command, restrictedToTemporaries);
        else
            this.#temporaryStatusOverrides_.delete(command);
    }

    // ---------------------------------------------------------------------------------------------
    // PlayerManager observer:
    // ---------------------------------------------------------------------------------------------

    // Called when the given |player| has logged in. Any exceptions that they were previously savvy
    // to will be restored, if they reconnected within the allocated amount of time.
    onPlayerLogin(player) {
        const data = this.#expired_.get(player.account.userId);
        if (!data)
            return;  // no exception data was stored for the |player|

        // Delete the data, as it's not going to be expired anymore in either case.
        this.#expired_.delete(player.account.userId);

        if (data.expirationTime <= server.clock.monotonicallyIncreasingTime())
            return;  // the |data| has expired, we won't apply it anymore

        // (a) Restore the exceptions for the |player|.
        for (const command of data.commands)
            this.addException(player, command);

        // (b) Let the |player| know that the exceptions have been restored.
        player.sendMessage(Message.LVP_ACCESS_EXCEPTIONS_RESTORED, data.commands.length);
    }

    // Called when the given |player| has disconnected from the server.  Any exceptions that they
    // have been granted will be stored with their user ID, in case they reconnect soon after.
    onPlayerDisconnect(player) {
        if (!player.account.isIdentified())
            return;  // exceptions can only be stored for identified players

        const commands = [];
        for (const [ command, players ] of this.#exceptions_) {
            if (!players.has(player))
                continue;  // this |command| does not have an exception for the |player|

            commands.push(command);
            players.delete(player);

            // Clean up the entire listing for the |command| if there are no more exceptions left,
            // in which case there's no need for the entry to exist at all.
            if (!players.size)
                this.#exceptions_.delete(command);
        }

        // If the |player| had exceptions, store them in the expired map which enables it to be
        // re-instated if they connect within |kExceptionExpirationTimeMs|.
        if (commands.length) {
            this.#expired_.set(player.account.userId, {
                commands,
                expirationTime:
                    server.clock.monotonicallyIncreasingTime() + kExceptionExpirationTimeMs
            });
        }
    }

    // ---------------------------------------------------------------------------------------------
    // CommandPermissionDelegate implementation:
    // ---------------------------------------------------------------------------------------------

    // Returns whether the |player| has permission to execute the given |command|, which is an
    // instance of CommandDescription. When |verbose| is set, the implementation is expected to
    // share the details of any access error with the given |player|.
    canExecuteCommand(player, _, command, verbose) {
        // (1) If the |player| has an exception to use the |command|, have it take precedence.
        if (this.#exceptions_.has(command) && player.account.isIdentified()) {
            const exceptions = this.#exceptions_.get(command);
            if (exceptions.has(player))
                return true;
        }

        // (2) Determine the actual level restriction to put in place, considering an override.
        let restrictLevel = this.#overrides_.get(command) ?? command.restrictLevel;
        let restrictTemporary =
            this.#temporaryStatusOverrides_.get(command) ?? command.restrictTemporary;

        // (a) If |restrictLevel| is set to all players, bail out right away.
        if (restrictLevel === Player.LEVEL_PLAYER)
            return true;

        // (b) If |restrictTemporary| is set, but the |restrictLevel| is not administrator, void it.
        if (restrictTemporary && restrictLevel != Player.LEVEL_ADMINISTRATOR)
            restrictTemporary = false;

        // (3) Determine if the |player| has access to execute this command.
        let access = restrictLevel <= player.level;
        if (access && restrictTemporary && player.levelIsTemporary)
            access = false;

        // (4) If the |player| does not have access, and |verbose| is set, let them know about it.
        if (!access && verbose) {
            const requiredLevel = this.textualRepresentationForLevel(restrictLevel);

            // Inform the |player| of the fact that they're not allowed to execute this command.
            player.sendMessage(Message.COMMAND_ERROR_INSUFFICIENT_RIGHTS, requiredLevel);
        }

        return access;
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.commandManager.setPermissionDelegate(null);
        server.playerManager.removeObserver(this);

        this.#exceptions_.clear();
        this.#exceptions_ = null;

        this.#overrides_.clear();
        this.#overrides_ = null;

        this.#temporaryStatusOverrides_.clear();
        this.#temporaryStatusOverrides_ = null;
    }
}
