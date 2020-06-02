// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { kDecorations } from 'features/decorations/decorations.js';

describe('Decorations', it => {
    it('is able to load all the decorations defined for the server', assert => {
        const settings = server.featureManager.loadFeature('settings');
        const objects = server.objectManager.count;

        // If this throws, then pay attention to the JavaScript error that's been shown in the
        // console. It should tell you which decoration file has issues.
        server.featureManager.loadFeature('decorations');

        // Enable all decoration sets, to exercise all of the used code paths.
        for (const { setting } of kDecorations)
            settings.setValue(setting, true);
        
        assert.isAbove(server.objectManager.count, objects);

        // Disable all decoration sets, which will bring the count back to zero.
        for (const { setting } of kDecorations)
            settings.setValue(setting, false);
        
        assert.equal(server.objectManager.count, objects);
    });
});
