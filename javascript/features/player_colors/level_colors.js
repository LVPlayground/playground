// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Color } from 'base/color.js';

import { kDefaultAlpha } from 'features/player_colors/default_colors.js';

// The default color that will be assigned to administrators.
const kAdministratorColor = Color.fromRGBA(255, 255, 0, kDefaultAlpha);

// The default color that will be assigned to Management members.
const kManagementColor = Color.fromRGBA(255, 128, 0, kDefaultAlpha);

// Returns the level-specific color for the given |player|. May be NULL.
export function getLevelColorForPlayer(player) {
    switch (player.level) {
        case Player.LEVEL_MANAGEMENT:
            return kManagementColor;

        case Player.LEVEL_ADMINISTRATOR:
            return kAdministratorColor;
    }

    return null;
}
