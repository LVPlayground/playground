// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import GangCommands from 'features/gangs/gang_commands.js';
import GangManager from 'features/gangs/gang_manager.js';

// Implementation of the gangs feature. A gang is a group of players that fight together under a
// collaborative name. They get a shared bank account, have a private-ish group chat available to
// them and will be displayed on the Gangs section of the website.
class Gangs extends Feature {
    constructor() {
        super();

        // Used for announcing gang-related events to players and administrators.
        const announce = this.defineDependency('announce');

        // Used to interact with the bank accounts owned by individual players.
        const finance = this.defineDependency('finance');

        // Used to display a color picker when selecting a gang color.
        const playerColors = this.defineDependency('player_colors');

        // Used to customize bits of functionality related to how gangs work.
        const settings = this.defineDependency('settings');

        // Uses player settings to store whether the gang skin should be used.
        this.defineDependency('player_settings');

        this.manager_ = new GangManager();
        this.commands_ = new GangCommands(this.manager_, announce, finance, playerColors, settings);
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the gangs feature.
    // ---------------------------------------------------------------------------------------------

    // Adds the |observer| as a gang mutation observer, that will be informed of changes in the
    // members that are part of a gang. The |observer| can implement the following methods that will
    // be informed of changes within a gang:
    //
    //     onGangMemberConnected(userId, gangId)
    //     onGangSettingUpdated(gang)
    //     onUserJoinGang(userId, gangId, gang)
    //     onUserLeaveGang(userId, gangId)
    //
    // Events are based on users as opposed to players because mutations can happen whilst the
    // target player is offline.
    addObserver(observer) {
        this.manager_.addObserver(observer);
    }

    // Removes the |observer| from the list of gang mutation observers.
    removeObserver(observer) {
        this.manager_.removeObserver(observer);
    }

    // Returns an array with the gangs that currently exist on Las Venturas Playground.
    getGangs() {
        return this.manager_.gangs;
    }

    // Returns the gang that the |player| is part of, or NULL otherwise.
    getGangForPlayer(player) {
        return this.manager_.gangForPlayer(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Announces the given |messages| to all players in the given |gangId|, with the exception of
    // |excludePlayer| who will receive the confirmation in another way.
    announceToGang(gangId, excludePlayer, message, ...args) {
        const gang = this.manager_.gangs_.get(gangId);
        if (gang)
            this.manager_.announceToGang(gang, excludePlayer, message, ...args);
    }

    // Returns the account balance of the given |gangId|. Should be used to verify whether the gang
    // has sufficient funds available before starting a heavier flow. `withdrawFromGangAccount`
    // should be preferred for most usages.
    async getGangAccountBalance(gangId) {
        return (await this.manager_.finance.getAccountBalance(gangId)) ?? 0;
    }

    // Attempts to withdraw the given |amount| from the bank account owned by the |gangId|, on
    // behalf of the server for the given |reason|. Returns whether the bank accepted this
    // transaction. Banks are allowed to go in the negative for payments, but only once.
    async withdrawFromGangAccount(gangId, player, amount, reason) {
        const balance = await this.manager_.finance.getAccountBalance(gangId);
        if (!balance || balance < 0)
            return false;  // they don't have any money available
        
        await this.manager_.finance.withdrawFromAccount(
            gangId, player?.account.userId, amount, reason);

        return true;
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.commands_.dispose();
        this.manager_.dispose();
    }
}

export default Gangs;

