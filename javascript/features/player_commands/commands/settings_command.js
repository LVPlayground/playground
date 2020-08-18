// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Menu } from 'components/menu/menu.js';
import { PlayerCommand } from 'features/player_commands/player_command.js';

import { alert } from 'components/dialogs/alert.js';
import { confirm } from 'components/dialogs/confirm.js';
import { messages } from 'features/player_commands/player_commands.messages.js';

import { kAnnouncementCategories } from 'features/announce/announce_categories.js';

// Implements the "/my settings" command, which allows players to configure their settings on the
// server. This is quite similar to "/lvp settings", but intended for player configuration.
export class SettingsCommand extends PlayerCommand {
    get name() { return 'settings'; }
    get description() { return `Configure your Las Venturas Playground experience.`; }

    // This command is not available to all players yet, only to Management.
    get playerLevel() { return Player.LEVEL_MANAGEMENT; }

    // ---------------------------------------------------------------------------------------------

    // Called when a player executes the "/my settings" or "/p [player] settings" command. Settings,
    // with the exception of communication features, are limited to the calling player's rights.
    async execute(player, target) {
        if (!target.account.isIdentified()) {
            if (player === target)
                player.sendMessage(messages.player_settings_no_account_self);
            else
                player.sendMessage(messages.player_settings_no_account_other, { player });

            return;
        }

        const dialog = new Menu(messages.player_settings_dialog_title);

        // (1) Enables configuration of announcements on the server.
        dialog.addItem(
            messages.player_settings_label_announcements,
            SettingsCommand.prototype.handleAnnouncementCategoryList.bind(
                this, player, target, /* categories= */ null));

        // TODO: Key bindings for vehicle keys.

        // (2) Enables configuration of the used language on the server.
        dialog.addItem(
            messages.player_settings_label_languages,
            SettingsCommand.prototype.handleLanguages.bind(this, player, target));

        // TODO: Teleportation preferences for VIPs.

        await dialog.displayForPlayer(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Handles announcement configuration for the |target|, as done by the |player|, in the generic
    // category view. Messages get a slightly different view to easen up toggling.
    async handleAnnouncementCategoryList(player, target, categories = null) {
        categories = categories ?? this.buildAnnouncementTable(target);

        const dialog = new Menu(messages.player_settings_dialog_announcement_title, [
            messages.player_settings_column_category,
            messages.player_settings_column_settings,
        ]);

        for (const [ categoryName, subCategories ] of categories) {
            const categoryLabel = categoryName[0].toUpperCase() + categoryName.substring(1);

            // Compose the label for the `Settings` column.
            const categorySettings = String(subCategories.size);
            const categorySuffix = subCategories.size === 1 ? 'setting'
                                                            : 'settings';

            // The listener depends on whether we should enter the category view, or the individual
            // setting view. Assume that there's no mixture of them in any category.
            const hasSubCategories = [ ...subCategories ].some(([ key, value ]) => value.size);
            const listener =
                hasSubCategories
                    ? SettingsCommand.prototype.handleAnnouncementCategoryList.bind(
                          this, player, target, subCategories)
                    : SettingsCommand.prototype.handleAnnouncementSettingList.bind(
                          this, player, target, subCategories);

            // Finally, add the category to the |dialog|.
            dialog.addItem(categoryLabel, `${categorySettings} ${categorySuffix}`, listener);
        }

        await dialog.displayForPlayer(player);
    }

    // Handles announcement configuration for the |target|, displaying the individual settings for
    // the given |categories|. From this sub-menu out they can be toggled by the |player|.
    async handleAnnouncementSettingList(player, target, categories) {
        const dialog = new Menu(messages.player_settings_dialog_announcement_title, [
            messages.player_settings_column_category,
            messages.player_settings_column_settings,
        ]);

        for (const identifier of categories.values()) {
            const category = kAnnouncementCategories.get(identifier);

            // Used to determine whether to highlight the setting as having been modified.
            const playerValue = this.announce().isCategoryEnabledForPlayer(player, identifier);
            const defaultValue = category.defaultEnabled;

            // The highlight colour to apply to this menu row, indicating whether it's default.
            const highlight = playerValue === defaultValue ? '' : '{F44336}';
            const status = playerValue ? messages.player_settings_label_enabled
                                       : messages.player_settings_label_disabled;

            // Add the |category| with all computed information to the |dialog|.
            dialog.addItem(
                highlight + category.name, highlight + status,
                SettingsCommand.prototype.handleAnnouncementCategory.bind(
                    this, player, target, identifier));
        }

        await dialog.displayForPlayer(player);
    }

    // Handles configuration for the given |identifier|, which the |player| wants to change on
    // behalf of the |target|. This data will be stored in their account configuration.
    async handleAnnouncementCategory(player, target, identifier) {
        const category = kAnnouncementCategories.get(identifier);
        const enabled = this.announce().isCategoryEnabledForPlayer(player, identifier);

        // The label that will be shown in the message. These are not translated.
        const label = category.name.toLowerCase();

        const confirmation = await confirm(player, {
            title: messages.player_settings_dialog_announcement_title,
            message: enabled ? messages.player_settings_confirm_disable_category(player, { label })
                             : messages.player_settings_confirm_enable_category(player, { label }),
        });

        if (!confirmation)
            return;  // the |player| bailed out of the flow

        // Note that |enabled| reflects the previous value here, which we want to flip.
        if (enabled === category.defaultEnabled)
            target.account.setAnnouncementOverride(identifier, !enabled);
        else
            target.account.releaseAnnouncementOverride(identifier);

        // If |target| and |player| are not the same person, inform the |target| of this change.
        let message = messages.player_settings_admin_self;

        if (target !== player) {
            message = messages.player_settings_admin_other;

            target.sendMessage(messages.player_settings_fyi, {
                label: category.name,
                player
            });
        }

        // Announce the change to administrators. The message depends on whether the change is self
        // inflicted, or whether the |player| is changing this for someone else.
        this.announce().broadcast('admin/communication/visibility-change', message, {
            visibility: enabled ? 'disabled' : 'enabled',
            label, player, target,
        });

        // Tell the |player| that the bit has successfully been flipped.
        await alert(player, {
            title: messages.player_settings_dialog_announcement_title,
            message: messages.player_settings_confirm_updated
        });
    }

    // ---------------------------------------------------------------------------------------------

    // Handles language configuration for the |target|, as done by the |player|, in case they would
    // like to translate (parts of) Las Venturas Playground to other languages.
    async handleLanguages(player, target) {

    }

    // ---------------------------------------------------------------------------------------------

    // Builds a table with the announcement categories that are available on the server. They can be
    // infinitely nested, through slashes that divide the category's identifier.
    buildAnnouncementTable(player) {
        const categories = new Map();

        // TODO: Filter availability of messages & categories for the |player|.

        for (const [ identifier, category ] of kAnnouncementCategories) {
            if (category.level > player.level)
                continue;  // the |player| is not able to access these announcements

            if (category.hidden)
                continue;  // the |category| has been marked as not configurable

            const path = identifier.includes('/') ? identifier.split('/') : [ identifier ];
            const last = path.pop();

            let base = categories;
            for (const component of path) {
                if (!base.has(component))
                    base.set(component, new Map());

                base = base.get(component);
            }

            // Store the |category| last, as a string for the full identifier rather than a Map with
            // each of the sub-categories. This builds on our category composition assumptions.
            base.set(last, identifier);
        }

        return categories;
    }
}
