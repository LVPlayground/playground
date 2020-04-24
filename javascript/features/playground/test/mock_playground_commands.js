// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import PlaygroundAccessTracker from 'features/playground/playground_access_tracker.js';
import PlaygroundCommands from 'features/playground/playground_commands.js';

// The MockPlaygroundCommands class is exactly the same as the PlaygroundCommands class, with the
// exception that the arguments required for the constructor are automatically injected.
class MockPlaygroundCommands extends PlaygroundCommands {
    constructor() {
        const announce = server.featureManager.loadFeature('announce');
        const nuwani = server.featureManager.loadFeature('nuwani');

        super(new PlaygroundAccessTracker(), () => announce, () => nuwani);
    }
};

export default MockPlaygroundCommands;
