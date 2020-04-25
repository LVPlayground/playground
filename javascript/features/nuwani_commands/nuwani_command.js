// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Menu from 'components/menu/menu.js';

import alert from 'components/dialogs/alert.js';
import confirm from 'components/dialogs/confirm.js';

// The `/nuwani` command enables in-game staff to understand, control and manage the Nuwani IRC
// system. Access to this command is controlled per `/lvp access`.
export class NuwaniCommand {
    announce_ = null;
    nuwani_ = null;
    playground_ = null;

    constructor(announce, nuwani, playground) {
        this.announce_ = announce;
        this.nuwani_ = nuwani;
        this.playground_ = playground;

        this.playground_().registerCommand('nuwani', Player.LEVEL_MANAGEMENT);

        // Defines the `/nuwani` command. Access is controlled by the Playground module.
        server.commandManager.buildCommand('nuwani')
            .restrict(player => this.playground_().canAccessCommand(player, 'nuwani'))
            .build(NuwaniCommand.prototype.onNuwaniCommand.bind(this));
    }

    // Called when the `/nuwani` command has been executed. Shows the menu with all the options that
    // are available the the |player| for controlling the bot.
    async onNuwaniCommand(player) {
        const menu = new Menu('Nuwani IRC Bot');
        
        menu.addItem('Inspect bot status', NuwaniCommand.prototype.displayStatus.bind(this));
        menu.addItem(
            'Request an increase in bots...', NuwaniCommand.prototype.requestIncrease.bind(this));
        menu.addItem(
            'Request a decrease in bots...', NuwaniCommand.prototype.requestDecrease.bind(this));

        await menu.displayForPlayer(player);
    }

    // Displays a menu with the status of each of the IRC bots, both the active and available ones.
    // The connected bots will further be shown with their connectivity status and command rate.
    async displayStatus(player) {
        const nuwani = this.nuwani_();
        const menu = new Menu('Nuwani: bot status', [
            'Bot',
            'Status',
            'Command rate',
        ]);

        for (const activeBot of nuwani.runtime.activeBots) {
            menu.addItem(...[
                activeBot.nickname,
                activeBot.isConnected() ? '{ADFF2F}connected'
                                        : '{FF782F}disconnected',
                nuwani.messageDistributor.getCommandRateForBot(activeBot) ?? '-',
            ]);
        }

        for (const availableBot of nuwani.runtime.availableBots) {
            menu.addItem(...[
                availableBot.nickname,
                '{BEC7CC}available',
                /* command rate= */ 0,
            ]);
        }

        await menu.displayForPlayer(player);
    }

    // Requests an additional bot to start to handle the IRC echo load. This could be useful in case
    // an administrator is aware of an upcoming increase in player volume.
    async requestIncrease(player) {
        const nuwani = this.nuwani_();

        if (!nuwani.runtime.availableBots.size) {
            return alert(player, {
                title: 'Nuwani Configuration',
                message: 'There are no available bots that could be connected.'
            });
        }
        
        const result = await confirm(player, {
            title: 'Nuwani Configuration',
            message: 'Are you sure that you want to connect an extra bot?',
        });

        if (!result)
            return;
        
        this.announce_().announceToAdministrators(
            Message.NUWANI_ADMIN_INCREASE_BOT, player.name, player.id);

        nuwani.runtime.requestSlaveIncrease();

        await alert(player, {
            title: 'Nuwani Configuration',
            message: 'An extra bot has been requested and should connect momentarily.',
        });
    }

    // Requests one of the optional bots to disconnect. The system will load balance automatically,
    // so in practice this should rarely be neccesary, but it's gimicky and it works.
    async requestDecrease(player) {
        const nuwani = this.nuwani_();

        let hasActiveOptionalBots = false;
        for (const activeBot of nuwani.runtime.activeBots) {
            if (activeBot.config.master || !activeBot.config.optional)
                continue;
            
            hasActiveOptionalBots = true;
            break;
        }

        if (!hasActiveOptionalBots) {
            return alert(player, {
                title: 'Nuwani Configuration',
                message: 'There are no active bots that could be disconnected.',
            });
        }

        const result = await confirm(player, {
            title: 'Nuwani Configuration',
            message: 'Are you sure that you want to disconnect one of the bots?',
        });

        if (!result)
            return;
        
        this.announce_().announceToAdministrators(
            Message.NUWANI_ADMIN_DECREASE_BOT, player.name, player.id);

        nuwani.runtime.requestSlaveDecrease();

        await alert(player, {
            title: 'Nuwani Configuration',
            message: 'One of the bots will be disconnecting from the network momentarily.',
        });
    }

    dispose() {
        this.playground_().unregisterCommand('nuwani');

        this.playground_ = null;
        this.nuwani_ = null;
        this.announce_ = null;

        server.commandManager.removeCommand('nuwani');
    }
}
