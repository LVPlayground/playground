// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';
import { ObjectGroup } from 'entities/object_group.js';
import ObjectRemover from 'features/player_favours/object_remover.js';
import ScopedEntities from 'entities/scoped_entities.js';

import { format } from 'base/string_formatter.js';

// Implementation of a collection of features that have been implemented specifically by request of
// a particular player. The actual features and their owners are documented in the README.md file.
class PlayerFavours extends Feature {
    constructor() {
        super();

        this.finance_ = this.defineDependency('finance');

        this.eagleCashPlayers_ = new WeakSet();

        this.objectRemover_ = new ObjectRemover();
        this.objectRemover_.load('data/favours/caligula_basement_door.json'); // Door which blocks access to basement in caligulas

        this.objectGroups_ = [];

        // -----------------------------------------------------------------------------------------
        // Russell (https://sa-mp.nl/players/52872/russell.html)

        this.objectRemover_.load('data/favours/russell_house_removals.json');
        this.objectGroups_.push(ObjectGroup.create('data/favours/russell_house_objects.json', 0, 0));

	    // -----------------------------------------------------------------------------------------
        // Jasmine (https://forum.sa-mp.nl/thread-33720.html)

        this.objectRemover_.load('data/favours/jasmine_house_tower.json');
        this.objectGroups_.push(ObjectGroup.create('data/favours/jasmine_house_tower.json', 0, 0));

        // -----------------------------------------------------------------------------------------
        // Joe (https://sa-mp.nl/players/30/joe.html)

        this.objectRemover_.load('data/favours/joe_house_removals.json');
        this.objectGroups_.push(ObjectGroup.create('data/favours/joe_house_objects.json', 0, 0));

        // -----------------------------------------------------------------------------------------
        // Houdini (https://forum.sa-mp.nl/user-19296.html)

        this.objectGroups_.push(ObjectGroup.create('data/favours/houdini_house_tower.json', 0, 0));

        // -----------------------------------------------------------------------------------------
        // Huracan (https://sa-mp.nl/players/120307/huracan.html)

        this.huracanActors_ = new ScopedEntities();
        this.huracanActors_.createActor({
            modelId: 287,
            position: new Vector(1122.71, -2033.97, 69.89),
            rotation: 270
        });

        this.huracanActors_.createActor({
            modelId: 287,
            position: new Vector(1122.71, -2040.10, 69.89),
            rotation: 270
        });

        this.huracanActors_.createActor({
            modelId: 116,
            position: new Vector(1117.91, -2037.05, 78.75),
            rotation: 270
        });

        // -----------------------------------------------------------------------------------------
        // [ER]Luka (https://sa-mp.nl/players/123358/er-luka.html) and
        // ToxicCookie (https://sa-mp.nl/players/119454/toxiccookie.html)

        this.lukaAndToxicccokieActors_ = new ScopedEntities();
        this.lukaAndToxicccokieActors_.createActor({
            modelId: 240,
            position: new Vector(-378.03, 2242.15, 46.09),
            rotation: 103
        });

        this.lukaAndToxicccokieActors_.createActor({
            modelId: 106,
            position: new Vector(-384.11, 2206.16, 45.67),
            rotation: 276
        });

        // -----------------------------------------------------------------------------------------
        // TheMightyQ (https://forum.sa-mp.nl/user-16597.html)

        this.objectGroups_.push(ObjectGroup.create('data/favours/tmq_house_objects.json', 0, 0));

        // -----------------------------------------------------------------------------------------
        // Xanland (https://sa-mp.nl/players/423/xanland.html)

        this.objectRemover_.load('data/favours/xanland_lvairport_entrance.json');
        this.xanlandObjectDetails_ = JSON.parse(readFile('data/favours/xanland_lvairport_entrance.json'))[0];
        this.xanlandObjectDetails_.position = new Vector(...this.xanlandObjectDetails_.position);
        this.xanlandObjectDetails_.rotation = new Vector(...this.xanlandObjectDetails_.rotation);
        this.xanlandObjectEntities_ = new ScopedEntities();
        this.xanlandObject_ = this.xanlandObjectEntities_.createObject(this.xanlandObjectDetails_);
        this.showXanlandObject_();

        server.commandManager.buildCommand('eaglecash')
            .build(PlayerFavours.prototype.onEagleCashCommand.bind(this));

        server.commandManager.buildCommand('xanlandobject')
            .restrict(Player.LEVEL_MANAGEMENT)
            .build(PlayerFavours.prototype.onXanlandObjectCommand.bind(this));
        // -----------------------------------------------------------------------------------------
    }

    onEagleCashCommand(player) {
        const serialNumbers = [ 1667109447, 648955637, 1915947708, 1715132128 ];

        if (player.name !== 'Eagle_Force_One' || !serialNumbers.includes(player.serial)) {
            player.sendMessage(
                Message.COMMAND_ERROR, 'Sorry, this command is only available to Eagle_Force_One.');

            return;
        }

        if (this.eagleCashPlayers_.has(player)) {
            player.sendMessage(Message.COMMAND_ERROR, 'You can only use this once per session!');
            return;
        }

        const amount = Math.floor(Math.random() * 100000) + 25000;

        this.eagleCashPlayers_.add(player);
        this.finance_().givePlayerCash(player, amount);

        player.sendMessage(Message.COMMAND_SUCCESS, `Sure! Here is your ${format('%$', amount)}.`);
    }

    onXanlandObjectCommand(player) {
        if (this.isXanlandObjectVisible_) {
            this.hideXanlandObject_();
            player.sendMessage('Done, hidden!');
        } else {
            this.showXanlandObject_();
            player.sendMessage('Done, shown!');
        }
    }

    showXanlandObject_() {
        this.xanlandObject_.position = this.xanlandObjectDetails_.position;
        this.isXanlandObjectVisible_ = true;
    }

    hideXanlandObject_() {
        const position = new Vector(this.xanlandObjectDetails_.position.x, this.xanlandObjectDetails_.position.y,
                                    3); // Just below groundlevel
        this.xanlandObject_.position = position;
        this.isXanlandObjectVisible_ = false;
    }

    // This feature has no public API.

    dispose() {
        this.huracanActors_.dispose();
        this.huracanActors_ = null;

        this.lukaAndToxicccokieActors_.dispose();
        this.lukaAndToxicccokieActors_ = null;

        for (const objectGroup of this.objectGroups_)
            objectGroup.dispose();

        this.objectGroups_ = null;

        this.objectRemover_.dispose();
        this.objectRemover_ = null;

        this.hideXanlandObject_();
        this.xanlandObjectDetails_ = null;
        this.xanlandObject_.dispose();
        this.xanlandObject_ = null;
        this.xanlandObjectEntities_.dispose();
        this.xanlandObjectEntities_ = null;

        server.commandManager.removeCommand('xanlandobject');
        server.commandManager.removeCommand('eaglecash');
    }
}

export default PlayerFavours;
