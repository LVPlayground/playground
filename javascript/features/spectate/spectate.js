// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import { SpectateGroup } from 'features/spectate/spectate_group.js';

// Provides the ability to spectate other players on the server in a reliable manner. Immediately
// available for administrators, but can be used by any player for Games when allowed.
export default class Spectate extends Feature {
    constructor() {
        super();

        // Spectating others is a low-level capability, as it's integrated in various sub-systems
        // including administrative tools and games.
        this.markLowLevel();
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the Spectate feature
    // ---------------------------------------------------------------------------------------------

    // Creates a new group of players that can be spectated by others.
    createGroup(abandonBehaviour = SpectateGroup.kStopAbandonBehaviour) {
        return new SpectateGroup(/* manager= */ null, abandonBehaviour);
    }

    // Deletes the given |group| of spectatees. While the implementation of this method seems
    // trivial for now, please do call it in light of uniformity of the API.
    deleteGroup(group) { group.dispose(); }

    // Makes the |player| spectate the |group|. Optionally the |targetPlayer| may be given in case
    // they should start there. When doing so, the |targetPlayer| must be part of the |group|.
    spectate(player, group, targetPlayer = null) {}

    // Makes the |player| stop spectating. This will restore their previous state.
    stopSpectate(player) {}

    // ---------------------------------------------------------------------------------------------

    dispose() {}
}
