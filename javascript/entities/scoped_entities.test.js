// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let ScopedEntities = require('entities/scoped_entities.js');

describe('ScopedEntities', it => {
  it('should dispose of vehicles', assert => {
    let entities = new ScopedEntities();

    // TODO: Is there a good way to count vehicles on the server? GetVehiclePoolSize() would return
    // the highest id, while a new vehicle might be assigned a lower Id instead.

    let vehicle = entities.createVehicle({ modelId: 411 });
    assert.isNotNull(vehicle);

    assert.equal(pawnInvoke('GetVehicleModel', 'i', vehicle.id), 411);

    entities.dispose();

    assert.equal(pawnInvoke('GetVehicleModel', 'i', vehicle.id), 0);
  });
});
