// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';
import Menu from 'components/menu/menu.js';
import MessageBox from 'components/dialogs/message_box.js';

// The `/nuwani` command enables in-game staff to understand, control and manage the Nuwani IRC
// system. Access to this command is controlled per `/lvp access`. This feature solely is the
// command, and provides no other functionality.
export default class NuwaniCommand extends Feature {
    nuwani_ = null;

    constructor() {
        super();

        // It's no surprise that the command will have to depend on the feature.
        this.nuwani_ = this.defineDependency('nuwani');

        // Provides access control for the command itself, configurable whilst in-game.
        this.playground_ = this.defineDependency('playground');
        this.playground_().registerCommand('nuwani', Player.LEVEL_MANAGEMENT);

        // Defines the `/nuwani` command. Access ins controlled by the Playground module.
        server.commandManager.buildCommand('nuwani')
            .restrict(player => this.playground_().canAccessCommand(player, 'nuwani'))
            .build(NuwaniCommand.prototype.onNuwaniCommand.bind(this));
    }

    // Called when the `/nuwani` command has been executed. Shows the menu with all the options that
    // are available the the |player| for controlling the bot.
    async onNuwaniCommand(player) {
        const menu = new Menu('Nuwani IRC Bot');
        
        menu.addItem('Inspect bot status', NuwaniCommand.prototype.displayStatus.bind(this));
        
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

    dispose() {
        this.playground_().unregisterCommand('nuwani');
        this.nuwani_ = null;

        server.commandManager.removeCommand('nuwani');
    }
}
