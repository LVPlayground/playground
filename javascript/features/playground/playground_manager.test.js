// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const PlaygroundManager = require('features/playground/playground_manager.js');

describe('PlaygroundManager', (it, beforeEach, afterEach) => {
    let manager = null;
    let settings = null;

    beforeEach(() => {
        settings = server.featureManager.loadFeature('settings');
        manager = new PlaygroundManager(() => settings);
    });

    afterEach(() => {
        if (manager)
            manager.dispose();
    });

    it('should automatically initialize default-enabled settings', assert => {
        assert.isFalse(settings.getValue('decorations/objects_christmas'));
        settings.setValue('decorations/objects_christmas', true /* enabled */);

        const initialObjectCount = server.objectManager.count;

        // Initialize the manager. This should immediately load the setting.
        manager.initialize();
        assert.isAbove(server.objectManager.count, initialObjectCount);
    });

    it('should be able to toggle object-focused settings', assert => {
        manager.initialize();

        // List of settings that are expected to alter the server's object count.
        const object_focused_settings = [
            'decorations/objects_christmas',
            'decorations/objects_pirate_party'
        ];

        object_focused_settings.forEach(setting => {
            const initialObjectCount = server.objectManager.count;

            // Enable the feature. There should be more objects afterwards.
            settings.setValue(setting, true /* enabled */);
            assert.isAbove(server.objectManager.count, initialObjectCount);

            // Disable the feature. Initial object count should be restored.
            settings.setValue(setting, false /* enabled */);
            assert.equal(server.objectManager.count, initialObjectCount);
        });
    });

    it('should automatically disable features on disposal', assert => {
        manager.initialize();

        const initialObjectCount = server.objectManager.count;

        // Enable some features. There should be more objects afterwards.
        settings.setValue('decorations/objects_christmas', true /* enabled */);
        settings.setValue('decorations/objects_pirate_party', true /* enabled */);
        assert.isAbove(server.objectManager.count, initialObjectCount);

        // Dispose of the manager. Initial object could should be restored.
        manager.dispose();
        manager = null;

        assert.equal(server.objectManager.count, initialObjectCount);
    });
});
