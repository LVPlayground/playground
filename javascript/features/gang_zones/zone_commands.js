// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

import Menu from 'components/menu/menu.js';
import { Player } from 'entities/player.js';
import ScopedEntities from 'entities/scoped_entities.js';
import { Vector } from 'base/vector.js';
import { VisualBoundingBox } from 'features/gang_zones/util/visual_bounding_box.js';

import confirm from 'components/dialogs/confirm.js';
import { format } from 'base/string_formatter.js';

// Data file in which the available gang zone decorations have been stored.
const kZoneDecorationDataFile = 'data/gang_zone_decorations.json';

// Implements the commands associated with gang zones, which enable gangs to modify their settings,
// purchase decorations and special effects.
export class ZoneCommands {
    manager_ = null;
    playground_ = null;

    decorationCache_ = null;
    entities_ = null;

    constructor(manager, playground) {
        this.manager_ = manager;
        this.entities_ = new ScopedEntities();

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

        // If the |decorationCache_| has not been populated yet, do that first to make sure that
        // the necessary information is available on the server.
        if (!this.decorationCache_)
            this.decorationCache_ = JSON.parse(readFile(kZoneDecorationDataFile));

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

        dialog.addItem(
            'Purchase decorations',
            ZoneCommands.prototype.handlePurchaseDecorationOption.bind(this, player, zone));

        await dialog.displayForPlayer(player);
    }

    // Handles the option to purchase a new decoration for the |zone|. The player first has to
    // select an object of their choice, after which they will be able to position it.
    async handlePurchaseDecorationOption(player, zone) {
        const dialog = new Menu('Zone Management', [ 'Category', 'Objects' ]);

        for (const [ category, objects ] of Object.entries(this.decorationCache_)) {
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
        const boundingBox = new VisualBoundingBox(zone);
        boundingBox.displayForPlayer(player);

        // The distance, in in-game map units, ahead of the player the object should be shown.
        const kDistance = 5;

        // Create the object about five units ahead of the |player|, then update the streamer for
        // them to make sure that it's visible, then immediately move to editing mode.
        const object = this.entities_.createObject({
            modelId: objectInfo.model,
            position: player.position.translateTo2D(kDistance, player.rotation),
            rotation: new Vector(0, 0, 0),
        });

        player.updateStreamerObjects();

        let position = null;
        let rotation = null;

        // Have the |player| edit the object. The result will either be { position, rotation } when
        // the flow succeeded, or NULL when the player edited or disconnected from the server.
        while (player.isConnected()) {
            const result = await object.edit(player);
            if (!result)
                break;  // the edit was cancelled
            
            // Verify that the position contained within the result is part of the gang zone. While
            // the |player|'s gangs owns the zone, they don't own the area surrounding it.
            if (!zone.area.contains(result.position)) {
                const confirmation = await confirm(player, {
                    title: 'Zone Management',
                    message: 'The object must be located within the zone. Do you want to try again?'
                });

                if (!confirmation)
                    break;
                
                // fall-through, and just kick the player back in editing mode
                
            } else {
                position = result.position;
                rotation = result.rotation;
                break;
            }
        }

        // Remove the object that was being edited, the decorator will take over from here.
        object.dispose();

        boundingBox.hideForPlayer(player);
    }

    // Called when a Management member has entered the "/zone reload" command, which can be used to
    // reload all configuration files without having to restart the server.
    onZoneReloadCommand(player) {
        this.decorationCache_ = null;

        player.sendMessage(Message.ZONE_RELOADED);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.commandManager.removeCommand('zone');

        this.playground_().unregisterCommand('zone');
        this.playground_.removeReloadObserver(this);
    }
}
