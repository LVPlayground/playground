// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('DecorationRegistry', it => {
    it('should be able to load and process all decorations from disk', assert => {
        const feature = server.featureManager.loadFeature('player_decorations');
        const registry = feature.registry_;

        // (1) Category information is available.
        const categories = registry.getDecorationCategories();

        assert.isTrue(Array.isArray(categories));
        assert.isAbove(categories.length, 0);

        for (const { category, decorationCount } of categories) {
            assert.typeOf(category, 'string');
            assert.typeOf(decorationCount, 'number');

            assert.isAbove(decorationCount, 0);
        }

        // (2) It should be possible to retrieve decorations based on their unique Id.
        const blackHairDecoration = registry.getDecoration(4230631640);

        assert.isDefined(blackHairDecoration);
        assert.equal(blackHairDecoration.uniqueId, 4230631640);
        assert.equal(blackHairDecoration.name, 'Funky black hair');
        assert.equal(blackHairDecoration.modelId, 19077);
    });
});
