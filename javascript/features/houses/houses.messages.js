// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { globalMessages } from 'components/i18n/messages.js';

export const messages = globalMessages.extend({
    // admin/houses/locations
    houses_admin_created: `%{player.name}s (Id:%{player.id}d) has created a new house location.`,
    houses_admin_deleted:
        `%{player.name}s (Id:%{player.id}d) has deleted a house location (Id:%{location}d).`,

    // admin/houses/ownership
    houses_admin_evicted:
        `%{player.name}s (Id:%{player.id}d) has evicted %{owner}s from their house (Id:%{location}d).`,
    houses_admin_purchased:
        `%{player.name}s (Id:%{player.id}d) has purchased a house for %{price}$ (Id:%{location}d).`,
    houses_admin_sold:
        `%{player.name}s (Id:%{player.id}d) has sold the "%{name}s" house (Id:%{location}d) for %{price}$.`,

    // admin/houses/teleportation
    houses_admin_goto:
        `%{player.name}s (Id:%{player.id}d) has teleported to "%{name}s", a house owned by %{owner}s.`,

    // admin/houses/settings
    houses_admin_access:
        `%{player.name}s (Id:%{player.id}d) has changed access of "%{name}s" (Id:%{house}d) to %{access}s.`,
    houses_admin_audio:
        `%{player.name}s (Id:%{player.id}d) has changed the audio stream of "%{name}s" (Id:%{house}d).`,
    houses_admin_marker:
        `%{player.name}s (Id:%{player.id}d) has changed the marker of "%{name}s" (Id:%{house}d) to %{marker}s.`,
    houses_admin_rename:
        `%{player.name}s (Id:%{player.id}d) has renamed their house to "%{name}s" (Id:%{house}d).`,
    houses_admin_welcome:
        `%{player.name}s (Id:%{player.id}d) has changed the welcome message of "%{name}s" (Id:%{house}d).`,

    // admin/houses/spawning
    houses_admin_spawn_set:
        `%{player.name}s (Id:%{player.id}d) has chosen to spawn at their "%{name}s" (Id:%{house}d) house.`,
    houses_admin_spawn_unset:
        `%{player.name}s (Id:%{player.id}d) does not spawn anymore at their "%{name}s" (Id:%{house}d) house anymore.`,
});
