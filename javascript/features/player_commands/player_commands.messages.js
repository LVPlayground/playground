// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { globalMessages } from 'components/i18n/messages.js';

export const messages = globalMessages.extend({

    player_settings_admin_other:
        '%{player.name}s (Id:%{player.id}d) has %{visibility}s %{label}s announcements for %{target.name}s (Id:%{target.id}d).',
    player_settings_admin_self:
        '%{player.name}s (Id:%{player.id}d) has %{visibility}s %{label}s announcements.',

    player_settings_dialog_announcement_title: 'Announcement settings',
    player_settings_dialog_title: 'Player settings',

    player_settings_column_category: 'Category',
    player_settings_column_settings: 'Settings',

    player_settings_label_announcements: 'Announcement settings',
    player_settings_label_disabled: 'disabled',
    player_settings_label_enabled: 'enabled',
    player_settings_label_languages: 'Language settings',

    player_settings_confirm_disable_category: 'Do you want to disable messages about %{label}s?',
    player_settings_confirm_enable_category: 'Do you want to enable messages about %{label}s?',
    player_settings_confirm_updated: 'Your announcement preferences have been updated.',

    player_settings_fyi:
        '{33AA33}FYI{FFFFFF}: %{player.name}s (Id:%{player.id}) has changed your "%{label}s" announcement settings.',

    player_settings_no_account_other:
        '@error %{player.name}s needs to have an account in order for this command to be available.',
    player_settings_no_account_self:
        '@error You need to have an account in order to use this command. Check out /register!',
});
