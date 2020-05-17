// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Area } from 'entities/area.js';

// Global counter for creating a unique mocked area ID.
let globalMockAreaId = 0;

// MockArea represents a fully functional Area object, just without actually hitting the server and
// creating them for the players. Used for testing purposes.
export class MockArea extends Area {
    // Overridden for testing, to avoid creating the actual area on the server.
    createCircularAreaInternal(center, radius) { return ++globalMockAreaId; }
    createCubicalAreaInternal(rectangle, minimumZ, maximumZ) { return ++globalMockAreaId; }
    createCylindricalAreaInternal(center, radius, minimumZ, maximumZ) { return ++globalMockAreaId; }
    createPolygonalAreaInternal(points, minimumZ, maximumZ) { return ++globalMockAreaId; }
    createRectangularAreaInternal(rectangle) { return ++globalMockAreaId; }
    createSphericalAreaInternal(center, radius) { return ++globalMockAreaId; }

    // Overridden for testing, to avoid destroying the actual area on the server.
    destroyInternal() {}

    // ---------------------------------------------------------------------------------------------

    attachToObject(object) {}
    attachToPlayer(player) {}
    attachToVehicle(vehicle) {}
}
