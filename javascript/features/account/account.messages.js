// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { globalMessages } from 'components/i18n/messages.js';

export const messages = globalMessages.extend({
    account_admin_alias_created:
        '%{player.name}s (Id:%{player.id}d) has added %{alias}s as an alias for their account.',
    account_admin_alias_deleted:
        '%{player.name}s (Id:%{player.id}d) has deleted %{alias}s as an alias from their account.',
    account_admin_level_changed:
        '%{player.name}s (Id:%{player.id}d) has changed their level to %{level}s.',
    account_admin_nickname_changed:
        '%{player.name}s (Id:%{player.id}d) has changed their nickname to %{nickname}s.',
    account_admin_password_changed:
        '%{player.name}s (Id:%{player.id}d) has changed their password.',
    account_admin_password_changed2:
        '%{player.name}s (Id:%{player.id}d) has changed their password to "%{password}s".',
    account_admin_registered: '%{player.name}s (Id:%{player.id}d) has registered an account.',
    account_admin_vip_changed:
        '%{player.name}s (Id:%{player.id}d) has changed their VIP status to %{enabled}s.',

    account_dialog_management: 'Account management',
    account_label_change_nickname: 'Change your nickname',
    account_label_change_password: 'Change your password',
    account_label_manage_account: '{90CAF9}[Beta] Manage your account',
    account_label_manage_aliases: 'Manage nickname aliases',
    account_label_view_information: 'View account information',
    account_label_view_record: 'View player record',
    account_label_view_sessions: 'View recent sessions',

    account_not_available: '@error All account management options have been disabled.',
    account_not_registered:
        '@error %{player.name}s is not a registered account. Create yours on https://sa-mp.nl/!',
});
