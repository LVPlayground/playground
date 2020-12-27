// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { kDefaultTickIntervalMs } from 'features/games/game_description.js';

// Returns the Game instance of the currently running game. When there are multiple games live
// on the server, only the first will be returned.
export function getGameInstance() {
    const feature = server.featureManager.loadFeature('games');
    if (!feature.manager_.runtimes_.size)
        throw new Error('There currently are no running games on the server.');

    // Return the Game instance, which is what this layer cares about.
    return [ ...feature.manager_.runtimes_ ][0].game_;
}

// Runs the loop that keeps the game alive, i.e. continues to fire timers and microtasks in a
// deterministic manner to match what would happen in a production environment.
export async function runGameLoop() {
    for (let tick = 0; tick <= 2; ++tick) {
        await server.clock.advance(kDefaultTickIntervalMs);
        for (let i = 0; i < 5; ++i)
            await Promise.resolve();
    }
}
