// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/commands/command_builder.js';
import { DeathMatchLocation } from 'features/death_match/death_match_location.js';
import { Menu } from 'components/menu/menu.js';

// Contains the /dm command for players to allow to teleport to a DM zone with specific weapons.
export class DeathMatchCommands {
    constructor(limits, manager) {
        server.commandManager.buildCommand('deathmatch')
            .description('Enter one of the deathmatch zones.')
            .sub('leave')
                .description(`Leave the deathmatch zone you're in.`)
                .build(DeathMatchCommands.prototype.onLeaveCommand.bind(this))
            .sub('stats')
                .description('See fighting statistics of your time in the zone.')
                .build(DeathMatchCommands.prototype.onStatsCommand.bind(this))
            .parameters([{ name: 'zone', type: CommandBuilder.kTypeNumber, optional: true }])
            .build(DeathMatchCommands.prototype.onDmCommand.bind(this));

        this.limits_ = limits;
        this.manager_ = manager;
    }

    // The death match command is being used.
    async onDmCommand(player, zone) {
        if(DeathMatchLocation.hasLocation(zone))
            return this.enterDeathMatchZone(zone, player);

        const dialog = new Menu('Choose a death match zone.', ['Zone', 'Name', 'Teams / Lag shot', 'Players']);
        for(const zoneId of this.manager_.validDmZones()) {
            const location = DeathMatchLocation.getById(zoneId);
            dialog.addItem(
                location.id,
                location.name,
                (location.hasTeams ? "Yes / " : "No / ") + (location.lagShot ? "Yes": "No"),
                this.manager_.getPlayersInZone(zoneId),
                DeathMatchCommands.prototype.enterDeathMatchZone.bind(this, zoneId)
            );
        }

        await dialog.displayForPlayer(player);
    }

    async enterDeathMatchZone(zone, player) {
        let decision = null;

        // If the |player| is switching to a new deathmatch zone, we allow them to switch when they
        // haven't been shot recently. Otherwise we need to meet the full minigame criteria.
        if (player.activity === Player.PLAYER_ACTIVITY_JS_DM_ZONE)
            decision = this.limits_().canLeaveDeathmatchZone(player);
        else
            decision = this.limits_().canStartMinigame(player);

        if (!decision.isApproved()) {
            player.sendMessage(Message.DEATH_MATCH_TELEPORT_BLOCKED, decision);
            return;
        }

        this.manager_.goToDmZone(player, zone);
    }

    onLeaveCommand(player) {
        this.manager_.leave(player);
    }

    onStatsCommand(player) {
        this.manager_.showStats(player);
    }

    // Cleans up the state created by this class, i.e. removes the command.
    dispose() {
        server.commandManager.removeCommand('deathmatch');
    }
}