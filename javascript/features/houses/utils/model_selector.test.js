// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ModelSelector = require('features/houses/utils/model_selector.js');

describe('ModelSelector', (it, beforeEach) => {
    // Generates a fake model entry. Can optionally have a label and/or a price.
    const generateFakeModel = (hasLabel, hasPrice) => {
        const model = { modelId: Math.floor(Math.random() * 10000) };
        if (hasLabel)
            model.label = 'Label';
        if (hasPrice)
            model.price = Math.floor(Math.random() * 100000) + 5000;

        return model;
    };

    // Generates a fake model list of |count| entries, optionally having labels and/or prices.
    const generateFakeModelList = (count, hasLabel = false, hasPrice = false) => {
        const models = [];
        for (let i = 0; i < count; ++i)
            models.push(generateFakeModel(hasLabel, hasPrice));

        return models;
    };

    let gunther = null;
    beforeEach(() => gunther = server.playerManager.getById(0 /* Gunther */));

    it('should resolve ModelSelector.select() based on the finished promise', async(assert) => {
        const models = generateFakeModelList(8);

        const resolver = ModelSelector.select(gunther, 'My selector', models);
        const selector = ModelSelector.getSelectorForPlayerForTests(gunther);

        selector.resolve_(models[5]);

        assert.equal(await resolver, models[5]);
    });
});
