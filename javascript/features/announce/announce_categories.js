// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AnnounceCategory } from 'features/announce/announce_category.js';

import { messages } from 'features/announce/announce.messages.js';

// Shortcuts that can be used to indicate the default value of certain broadcasts.
const defaultDisabled = true;
const defaultEnabled = true;

// Map of all the announcement categories available on Las Venturas Playground. They can be grouped
// by category automatically through the "/my settings" command.
export const kAnnouncementCategories = new Map([
    // ---------------------------------------------------------------------------------------------
    // Section: administrators
    // ---------------------------------------------------------------------------------------------

    // Abuse ---------------------------------------------------------------------------------------

    [
        'admin/abuse/detected',
        {
            name: 'Anticheat (detected)',
            level: Player.LEVEL_ADMINISTRATOR,
            prefix: messages.announce_prefix_admin,
            defaultEnabled,
        }
    ],
    [
        'admin/abuse/heads-up',
        {
            name: 'Anticheat (heads-up)',
            level: Player.LEVEL_ADMINISTRATOR,
            prefix: messages.announce_prefix_admin,
            defaultEnabled,
        }
    ],
    [
        'admin/abuse/monitor',
        {
            name: 'Anticheat (oddities)',
            level: Player.LEVEL_ADMINISTRATOR,
            prefix: messages.announce_prefix_admin,
            defaultDisabled,
        }
    ],
    [
        'admin/abuse/suspected',
        {
            name: 'Anticheat (suspicions)',
            level: Player.LEVEL_ADMINISTRATOR,
            prefix: messages.announce_prefix_admin,
            defaultEnabled,
        }
    ],

    // Gangs ---------------------------------------------------------------------------------------

    [
        'admin/gangs/color',
        {
            name: 'Gang color changes',
            level: Player.LEVEL_ADMINISTRATOR,
            prefix: messages.announce_prefix_admin,
            defaultDisabled,
        }
    ],
    [
        'admin/gangs/goal',
        {
            name: 'Gang goal changes',
            level: Player.LEVEL_ADMINISTRATOR,
            prefix: messages.announce_prefix_admin,
            defaultDisabled,
        }
    ],
    [
        'admin/gangs/invitation',
        {
            name: 'Gang invitations',
            level: Player.LEVEL_ADMINISTRATOR,
            prefix: messages.announce_prefix_admin,
            defaultEnabled,
        }
    ],
    [
        'admin/gangs/kicked',
        {
            name: 'Gang removals',
            level: Player.LEVEL_ADMINISTRATOR,
            prefix: messages.announce_prefix_admin,
            defaultEnabled,
        }
    ],
    [
        'admin/gangs/name',
        {
            name: 'Gang name changes',
            level: Player.LEVEL_ADMINISTRATOR,
            prefix: messages.announce_prefix_admin,
            defaultEnabled,
        }
    ],
    [
        'admin/gangs/skin',
        {
            name: 'Gang skin changes',
            level: Player.LEVEL_ADMINISTRATOR,
            prefix: messages.announce_prefix_admin,
            defaultDisabled,
        }
    ],
    [
        'admin/gangs/tag',
        {
            name: 'Gang tag changes',
            level: Player.LEVEL_ADMINISTRATOR,
            prefix: messages.announce_prefix_admin,
            defaultDisabled,
        }
    ],

].map(([ key, value ]) => [ key, new AnnounceCategory(value) ]));
