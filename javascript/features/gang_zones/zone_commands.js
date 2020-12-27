// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

import { EditObjectFlow } from 'features/gang_zones/util/edit_object_flow.js';
import { Menu } from 'components/menu/menu.js';
import { Player } from 'entities/player.js';
import { ScopedEntities } from 'entities/scoped_entities.js';
import { SelectObjectFlow } from 'features/gang_zones/util/select_object_flow.js';
import { Vector } from 'base/vector.js';

import { alert } from 'components/dialogs/alert.js';
import { confirm } from 'components/dialogs/confirm.js';
import { format } from 'base/format.js';

// Implements the commands associated with gang zones, which enable gangs to modify their settings,
// purchase decorations and special effects.
export class ZoneCommands {
    announce_ = null;
    gangs_ = null;
    manager_ = null;

    entities_ = null;

    constructor(manager, announce, gangs) {
        this.announce_ = announce;
        this.gangs_ = gangs;
        this.manager_ = manager;

        this.entities_ = new ScopedEntities();

        // /zone
        server.commandManager.buildCommand('zone')
            .description('Manage the details of your gang zone.')
            .sub('reload')
                .description('Reload the gang object definition files.')
                .restrict(Player.LEVEL_MANAGEMENT)
                .build(ZoneCommands.prototype.onZoneReloadCommand.bind(this))
            .build(ZoneCommands.prototype.onZoneCommand.bind(this));
    }

    // Gets the ZoneDecorations instance canonically owned by the manager.
    get decorations() { return this.manager_.decorations; }

    // Gets the ZoneDecorationRegistry instance canonically owned by the manager.
    get decorationRegistry() { return this.manager_.decorations.registry; }

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
                message: `This zone is owned by ${zone.gangName}, and you should not interfere\n` +
                         `with their business unless you have an administrative need. Continue?`
            });

            if (!confirmed)
                return;  // the |player| changed their mind about this
        }

        // Build the menu with options about managing the zone.
        const decorations = this.decorations.getObjectsForZone(zone)?.size ?? 0;
        const dialog = new Menu('Zone Management', [ 'Option', 'Details' ]);

        dialog.addItem(
            'Purchase decorations', '-',
            ZoneCommands.prototype.handlePurchaseDecorationOption.bind(this, player, zone));

        // Only display the ability to edit and remove decorations if any have been added to this
        // zone, otherwise it's a bit of a silly action to try and do.
        if (decorations > 0) {
            const label = `{FFFF00}${decorations} decoration${decorations === 1 ? '' : 's'}`;

            dialog.addItem(
                'Move an existing decoration', label,
                ZoneCommands.prototype.handleUpdateDecorationFlow.bind(this, player, zone));

            dialog.addItem(
                'Remove an existing decoration', label,
                ZoneCommands.prototype.handleRemoveDecorationFlow.bind(this, player, zone));
        }

        await dialog.displayForPlayer(player);
    }

    // Handles the option to purchase a new decoration for the |zone|. The player first has to
    // select an object of their choice, after which they will be able to position it.
    async handlePurchaseDecorationOption(player, zone) {
        const dialog = new Menu('Zone Management', [ 'Category', 'Objects' ]);

        for (const [ category, objects ] of this.decorationRegistry.categories) {
            const label = `${objects.length} object${objects.length === 1 ? '' : 's'}`;

            // Add the option to the menu, which is proceeded by giving the player the ability to
            // pick one of the objects within the category itself.
            dialog.addItem(category, label, async () => {
                const picker = new Menu('Zone Management', [ 'Object', 'Price ($/day)' ]);

                // Adds options for each of the |objects|, displaying their name and price. Clicking
                // on one of them will immediately start the object editing flow for the player.
                for (const objectInfo of objects) {
                    picker.addItem(
                        objectInfo.name, format('%$', objectInfo.price),
                        ZoneCommands.prototype.handlePurchaseDecorationFlow.bind(
                            this, player, zone, objectInfo));
                }

                await picker.displayForPlayer(player);
            });
        }

        await dialog.displayForPlayer(player);
    }

    // Handles the part where the objects will be created for the player, with them having the
    // ability to edit it as they please, as long as the object is located in the zone.
    async handlePurchaseDecorationFlow(player, zone, objectInfo) {
        const balance = await this.gangs_().getGangAccountBalance(zone.gangId);
        if (balance < objectInfo.price) {
            return await alert(player, {
                title: 'Zone Management',
                message: Message.format(Message.ZONE_DECORATION_PURCHASE_NO_FUNDS, objectInfo.name,
                                        objectInfo.price, balance),
            });
        }

        // The distance, in in-game map units, ahead of the player the object should be shown.
        const kDistance = 5;

        // Create the object about five units ahead of the |player|, then update the streamer for
        // them to make sure that it's visible, then immediately move to editing mode.
        const object = this.entities_.createObject({
            modelId: objectInfo.model,
            position: player.position.translateTo2D(kDistance, player.rotation),
            rotation: new Vector(0, 0, 0),
        });

        // Run the object editing flow for the |player|, for the newly created |object|.
        const result = await EditObjectFlow.runForPlayer(player, {
            entities: this.entities_,
            object, zone,
        });

        object.dispose();

        if (!result)
            return;  // the |player| has aborted the purchase flow

        const { position, rotation } = result;

        // Withdraw the funds from the bank's account, which could fail again.
        const reason = `Purchase of a ${objectInfo.name}`;

        if (!await this.gangs_().withdrawFromGangAccount(
                zone.gangId, player, objectInfo.price, reason)) {
            return await alert(player, {
                title: 'Zone Management',
                message: Message.format(Message.ZONE_DECORATION_PURCHASE_NO_FUNDS, objectInfo.name,
                                        objectInfo.price, balance),
            });
        }

        // Request creation of the object from the decoration manager.
        await this.decorations.createObject(zone, objectInfo.model, position, rotation);

        // Announce the purchase to other people within the gang.
        this.gangs_().announceToGang(
            zone.gangId, player, Message.ZONE_DECORATION_PURCHASE_ANNOUNCE, player.name, player.id,
            objectInfo.name, objectInfo.price);

        // Announce the same message to administrators, who should know about this purchase too.
        this.announce_().announceToAdministrators(
            Message.ZONE_DECORATION_PURCHASE_ANNOUNCE, player.name, player.id, objectInfo.name,
            objectInfo.price);

        // And, finally, let the |player| know about the purchase as well.
        return await alert(player, {
            title: 'Zone Management',
            message: Message.format(Message.ZONE_DECORATION_PURCHASED, objectInfo.name,
                                    objectInfo.price),
        });
    }

    // Handles the flow where the |player| wants to move one of the objects in the |zone| to another
    // location, or perhaps change its rotation. Combines selection and editing flows.
    async handleUpdateDecorationFlow(player, zone) {
        const selectionResult = await SelectObjectFlow.runForPlayer(player, {
            decorations: this.decorations,
            entities: this.entities_,
            zone
        });

        // If there is no |result|, the player either cancelled selection, or, more likely, object
        // selection timed out. This is a rather buggy feature in SA-MP.
        if (!selectionResult)
            return;

        const { decorationId, object } = selectionResult;

        const originalPosition = object.position;
        const originalRotation = object.rotation;

        // Run the object editing flow for the |player|, for the existing |object|.
        const editingResult = await EditObjectFlow.runForPlayer(player, {
            entities: this.entities_,
            object, zone,
        });

        // Bail out if the user has aborted the flow, but reset the object first to the original
        // position and rotation to avoid this from having lasting effects.
        if (!editingResult) {
            object.position = originalPosition;
            object.rotation = originalRotation;
            return;
        }

        const { position, rotation } = editingResult;

        // Get the name of the |object|, to share more sensible messages throughout the server.
        const objectName = this.decorationRegistry.getNameForModelId(object.modelId);

        // Request creation of the object from the decoration manager.
        await this.decorations.updateObject(zone, decorationId, position, rotation);

        // Announce the updated object to other players in the gang.
        this.gangs_().announceToGang(
            zone.gangId, player, Message.ZONE_DECORATION_UPDATE_ANNOUNCE, player.name, player.id,
            objectName);

        // Let the |player| know that the object has been moved.
        return await alert(player, {
            title: 'Zone Management',
            message: Message.format(Message.ZONE_DECORATION_UPDATED, objectName),
        });
    }

    // Handles the flow where a player wants to remove an existing object from the gang zone. No
    // money will be refunded, but the object will disappear forever.
    async handleRemoveDecorationFlow(player, zone) {
        const result = await SelectObjectFlow.runForPlayer(player, {
            decorations: this.decorations,
            entities: this.entities_,
            zone
        });

        // If there is no |result|, the player either cancelled selection, or, more likely, object
        // selection timed out. This is a rather buggy feature in SA-MP.
        if (!result)
            return;

        const { decorationId, object } = result;

        // Get the name of the |object|, to share more sensible messages throughout the server.
        const objectName = this.decorationRegistry.getNameForModelId(object.modelId);

        // Confirm whether the |player| really wants to remove this object.
        const confirmation = await confirm(player, {
            title: 'Zone Management',
            message: Message.format(Message.ZONE_DECORATION_REMOVE_CONFIRM, objectName),
        });

        if (!confirmation)
            return;  // the |player| changed their mind

        await this.decorations.removeObject(zone, decorationId);

        // Announce the purchase to other people within the gang.
        this.gangs_().announceToGang(
            zone.gangId, player, Message.ZONE_DECORATION_REMOVE_ANNOUNCE, player.name, player.id,
            objectName);

        // Finally, let the |player| know that the object has been deleted as well.
        return await alert(player, {
            title: 'Zone Management',
            message: Message.format(Message.ZONE_DECORATION_REMOVED, objectName),
        });
    }

    // Called when a Management member has entered the "/zone reload" command, which can be used to
    // reload all configuration files without having to restart the server.
    onZoneReloadCommand(player) {
        this.decorationRegistry.reload();

        player.sendMessage(Message.ZONE_RELOADED);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.entities_.dispose();
        this.entities_ = null;

        server.commandManager.removeCommand('zone');
    }
}
