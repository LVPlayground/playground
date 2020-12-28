// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ScopedCallbacks } from 'base/scoped_callbacks.js';

export class SpawnArmourManager {
    
    constructor(settings, announce) {
        this.settings_ = settings;
        this.announce_ = announce;

        this.playersWithSpawnArmour_ = new Map();

         this.callbacks_ = new ScopedCallbacks();
         this.callbacks_.addEventListener(
             'playerresolveddeath', SpawnArmourManager.prototype.onPlayerDeath.bind(this));

        //server.playerManager.addObserver(this);
    }

    onPlayerSpawn(player) {
        player.sendMessage(Message.SPAWN_ARMOUR_ACTIVATED);
        this.playersWithSpawnArmour_.set(player, 1);
        player.syncedData.spawnArmour = true;

        const spawnArmourDuration = this.settings_().getValue('abuse/spawn_armour_duration');
        wait(spawnArmourDuration * 1000).then(() => {
            // Class has been disposed since.
            if(this.playersWithSpawnArmour_ == null)
                return;

            // If player shouldn't have the armour anymore remove it.
            if(!this.playersWithSpawnArmour_.has(player))
                return;
            
            player.syncedData.spawnArmour = false;
            this.playersWithSpawnArmour_.delete(player);
         });
    }

    onPlayerDeath(event) {
        //Bad luck, somehow he killed himself.
        if(event.playerid === event.killerid)
            return;
        
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;
        
        const killer = server.playerManager.getById(event.killerid);
        if (!killer)
            return;

        killer.sendMessage(Message.SPAWN_ARMOUR_PLAYER_KILLED);

        // Announce to admins this player has been bad.
        // If this happens often we might introduce automatic punishment.
        this.announce_().announceToAdministrators(Message.SPAWN_ARMOUR_PLAYER_KILLED_NOTIFY, player.name, 
            killer.name, killer.name)
    }

    onPlayerDisconnect(player) {
        player.syncedData.spawnArmour = false;
        this.playersWithSpawnArmour_.delete(player);
    }

    dispose() {        
        this.callbacks_.dispose();
        this.callbacks_ = null;

        server.playerManager.removeObserver(this);

        this.playersWithSpawnArmour_.forEach((_, player) => {
            player.syncedData.spawnArmour = false;
            this.playersWithSpawnArmour_.delete(player);
        });

        this.playersWithSpawnArmour_ = null;
    }
}