// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('VehicleModel', it => {
    it('should be able to find vehicles by their Id', assert => {
        assert.isNull(VehicleModel.getById(42));
        assert.isNull(VehicleModel.getById(100));
        assert.isNull(VehicleModel.getById(1337));
        assert.isNull(VehicleModel.getById(12356));
        assert.isNull(VehicleModel.getById('CHEESE'));

        for (let modelId = 400; modelId <= 611; ++modelId)
            assert.isNotNull(VehicleModel.getById(modelId));

        assert.equal(VehicleModel.getById(520).name, 'Hydra');
        assert.equal(VehicleModel.getById(411).name, 'Infernus');
        assert.equal(VehicleModel.getById(449).name, 'Tram');
    });

    it('should be able to find vehicles by their name', assert => {
        assert.isNull(VehicleModel.getByName(null));
        assert.isNull(VehicleModel.getByName(42));
        assert.isNull(VehicleModel.getByName('TEF'));

        for (let modelId = 400; modelId <= 611; ++modelId) {
            assert.equal(VehicleModel.getById(modelId),
                         VehicleModel.getByName(VehicleModel.getById(modelId).name));
        }

        assert.equal(VehicleModel.getByName('Hydra').id, 520);
        assert.equal(VehicleModel.getByName('Infernus').id, 411);
        assert.equal(VehicleModel.getByName('Tram').id, 449);
    });

    it('should be able to tell whether a vehicle is a trailer', assert => {
        assert.isFalse(VehicleModel.getById(489 /* Rancher */).isTrailer());
        assert.isFalse(VehicleModel.getById(411 /* Infernus */).isTrailer());

        assert.isTrue(VehicleModel.getById(606 /* Luggage Trailer */).isTrailer());
        assert.isTrue(VehicleModel.getById(610 /* Farm Plow */).isTrailer());
    });
});
