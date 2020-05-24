// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

import Menu from 'components/menu/menu.js';
import { Player } from 'entities/player.js';

import confirm from 'components/dialogs/confirm.js';

// Data file in which the available gang zone decorations have been stored.
const kZoneDecorationDataFile = 'data/gang_zone_decorations.json';

// Implements the commands associated with gang zones, which enable gangs to modify their settings,
// purchase decorations and special effects.
export class ZoneCommands {
    manager_ = null;
    playground_ = null;

    decorationCache_ = null;

    constructor(manager, playground) {
        this.manager_ = manager;

        this.playground_ = playground;
        this.playground_.addReloadObserver(this, () => this.registerTrackedCommands());

        this.registerTrackedCommands();

        // /zone
        server.commandManager.buildCommand('zone')
            .restrict(player => this.playground_().canAccessCommand(player, 'zone'))
            .sub('reload')
                .restrict(Player.LEVEL_MANAGEMENT)
                .build(ZoneCommands.prototype.onZoneReloadCommand.bind(this))
            .build(ZoneCommands.prototype.onZoneCommand.bind(this));
    }

    // Registers the tracked commands with the Playground feature, so that
    registerTrackedCommands() {
        this.playground_().registerCommand('zone', Player.LEVEL_MANAGEMENT);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has entered the "/zone" command. If they're in a zone that's owned
    // by a gang that they're part of, they have the ability to customize the zone here.
    async onZoneCommand(player) {
        const zone = this.manager_.getZoneForPlayer(player);
        if (!zone) {
            player.sendMessage(Message.ZONE_NOT_IN_ZONE);
            return;
        }

        // Verify that the |player| is part of the gang who owns this zone. Administrators have the
        // ability to override this, but will be given a warning when doing so.
        if (player.gangId !== zone.gangId) {
            if (!player.isAdministrator()) {
                player.sendMessage(Message.ZONE_NOT_IN_OWNED_ZONE, zone.gangName);
                return;
            }

            const confirmed = await confirm(player, {
                title: 'Zone Management',
                message: `This zone is owned by ${zone.gangName}, and you should not interfere ` +
                         `with their business unless you have an administrative need. Continue?`
            });

            if (!confirmed)
                return;  // the |player| changed their mind about this
        }

        // Build the menu with options about managing the zone.
        const dialog = new Menu('Zone Management');

        // TODO: Add the actual options for the menu.

        await dialog.displayForPlayer(player);
    }

    // Called when a Management member has entered the "/zone reload" command, which can be used to
    // reload all configuration files without having to restart the server.
    onZoneReloadCommand(player) {
        this.decorationCache_ = null;

        player.sendMessage(Message.ZONE_RELOADED);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.playground_().unregisterCommand('zone');
        this.playground_.removeReloadObserver(this);
    }
}
