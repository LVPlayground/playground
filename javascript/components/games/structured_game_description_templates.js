// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Rect } from 'base/rect.js';
import { StructuredGameDescription } from 'components/games/structured_game_description.js';
import { Vector } from 'base/vector.js';

// Valid SA-MP pickup types, see https://wiki.sa-mp.com/wiki/PickupTypes
const kValidPickupTypes = new Set([ 0, 1, 2, 3, 4, 8, 11, 12, 13, 14, 15, 18, 19, 20, 22 ]);

// Validator function to check whether a given pickup type is valid.
function pickupTypePropertyValidator(type) {
    if (!kValidPickupTypes.has(type))
        throw new Error(`Invalid SA-MP pickup type specified: ${type}.`);
}

// Validator function to be used for validating the |position|, including a boundary check.
function positionPropertyValidator(positionArray) {
    if (positionArray.length !== 3)
        throw new Error('Positions must be indicated as [x, y, z] arrays.');
    
    const position = new Vector(positionArray[0], positionArray[1], positionArray[2]);
    if (position.x < -5500 || position.x >= 5500)
        throw new Error('The x-coordinate of positions must be within [-5500, 5500]');
    if (position.y < -5500 || position.y >= 5500)
        throw new Error('The y-coordinate of positions must be within [-5500, 5500]');
    if (position.z < -100 || position.z >= 1850)
        throw new Error('The z-coordinate of positions must be within [-100, 1850');

    return position;
}

// Validator function for importing the given |rectangleObject|, which must contain all of the
// minimum and maximum X/Y coordinates. Will be returned as a new Rect instance.
function positionRectanglePropertyValidator(rectangleObject) {
    const dimensions = {
        minimumX: -4096,
        maximumX: 4096,
        minimumY: -4096,
        maximumY: 4096,
    };

    let changed = false;
    for (const property of Object.getOwnPropertyNames(dimensions)) {
        if (!rectangleObject.hasOwnProperty(property))
            throw new Error(`The boundary box must define a "${property}" property.`);

        const value = rectangleObject[property];
        if (typeof value !== 'number')
            throw new Error(`The "${property}" property of a bounding box must be a number.`);

        if (value < -4096 || value > 4096)
            throw new Error(`The "${property}" of a bounding box must be within [-4096, 4096].`);

        if (value !== dimensions[property])
            changed = true;

        dimensions[property] = value;
    }

    if (dimensions.minimumX >= dimensions.maximumX)
        throw new Error(`The minimum X in a boundary box must be lower than the maximum X.`);

    if (dimensions.minimumY >= dimensions.maximumY)
        throw new Error(`The minimum X in a boundary box must be lower than the maximum X.`);

    // (a) If none of the |dimensions| have changed, then this game does not require boundaries.
    if (!changed)
        return null;

    // (b) Otherwise, return a Rect instance to represent the area.
    return new Rect(
        dimensions.minimumX, dimensions.minimumY, dimensions.maximumX, dimensions.maximumY);
}

// Validator function for ensuring that the rotation is in range of [0, 360].
function rotationAnglePropertyValidator(rotationAngle) {
    if (rotationAngle < 0 || rotationAngle >= 360)
        throw new Error('Rotation angles must be within [0, 360]');
}

// Validator function to be used for rotation vectors in a 3D space.
function rotationVectorPropertyValidator(rotationArray) {
    if (rotationArray.length !== 3)
        throw new Error('Rotation vectors must be indicated as [rx, ry, rz] arrays.');
    
    const rotation = new Vector(rotationArray[0], rotationArray[1], rotationArray[2]);
    if (rotation.x < 0 || rotation.x >= 360)
        throw new Error('Rotation among the x-axis must be within [0, 360]');
    if (rotation.y < 0 || rotation.y >= 360)
        throw new Error('Rotation among the y-axis must be within [0, 360]');
    if (rotation.z < 0 || rotation.z >= 360)
        throw new Error('Rotation among the z-axis must be within [0, 360]');

    return rotation;
}

// Validator function to make sure that at least a single spawn position is defined.
function spawnPositionValidator(spawnPositions) {
    if (!spawnPositions.length)
        throw new Error('At least a single spawn position must be defined.');
}

// Validator function to validate configured times.
function timePropertyValidator(timeArray) {
    if (!timeArray.length)
        return [ 12, 0 ];  // noon
    
    if (timeArray.length !== 2)
        throw new Error(`Times must be indicated as a [hour, minutes] array.`);
    
    if (timeArray[0] < 0 || timeArray[0] > 23)
        throw new Error(`The hour of a time array must be in range of [0, 23].`);
    if (timeArray[1] < 0 || timeArray[0] > 59)
        throw new Error(`The minutes of a time array must be in range of [0, 59].`);
    
    return timeArray;
}

// Validator for vehicle model Ids. Will translate "0" to NULL as well.
function vehicleModelIdValidator(vehicleModelId) {
    if (!vehicleModelId)
        return null;

    if (vehicleModelId < 400 || vehicleModelId > 611)
        throw new Error(`Vehicle model Ids must be between [400, 611].`);
}

// -------------------------------------------------------------------------------------------------

// Structured property definition for a three dimensional position array [x, y, z], with validation
// to make sure that each coordinate is in bounds of [-4500, 4500].
export const kPositionProperty = {
    type: StructuredGameDescription.kTypeArray,
    elementType: {
        type: StructuredGameDescription.kTypeNumber,
    },

    validator: positionPropertyValidator,
};

// Structured property definition for representing a portion of the map, as a rectangle in the order
// of [ minX, minY, maxX, maxY ]. Will be represented as a Rect instance.
export const kPositionRectangleProperty = {
    type: StructuredGameDescription.kTypeObject,
    structure: [
        {
            name: 'minimumX',
            type: StructuredGameDescription.kTypeNumber,
            defaultValue: -4096,
        },
        {
            name: 'maximumX',
            type: StructuredGameDescription.kTypeNumber,
            defaultValue: 4096,
        },
        {
            name: 'minimumY',
            type: StructuredGameDescription.kTypeNumber,
            defaultValue: -4096,
        },
        {
            name: 'maximumY',
            type: StructuredGameDescription.kTypeNumber,
            defaultValue: 4096,
        }
    ],

    validator: positionRectanglePropertyValidator,
};

// Structured property definition for a rotation angle, in range of [0, 360].
export const kRotationAngleProperty = {
    type: StructuredGameDescription.kTypeNumber,
    validator: rotationAnglePropertyValidator,
};

// Structured property definition for a rotation vector in three dimensional space, presented as an
// array of [rx, ry, rz]. Each of the angles must be in range of [0, 360].
export const kRotationVectorProperty = {
    type: StructuredGameDescription.kTypeArray,
    elementType: {
        type: StructuredGameDescription.kTypeNumber,
    },

    validator: rotationVectorPropertyValidator,
};

// -------------------------------------------------------------------------------------------------

// Structured way of expressing a checkpoint that's part of a game.
export const kGameCheckpoints = {
    name: 'checkpoints',
    type: StructuredGameDescription.kTypeArray,
    elementType: {
        type: StructuredGameDescription.kTypeObject,
        structure: [
            {
                name: 'position',
                ...kPositionProperty,
            },
            {
                name: 'size',
                type: StructuredGameDescription.kTypeNumber,
                defaultValue: 10,
            },
        ]
    }
};

// Structured way of expressing a game's environment settings.
export const kGameEnvironment = {
    name: 'environment',
    type: StructuredGameDescription.kTypeObject,
    structure: [
        {
            name: 'boundaries',
            ...kPositionRectangleProperty,
        },
        {
            name: 'interiorId',
            type: StructuredGameDescription.kTypeNumber,
            defaultValue: 0,  // main world
        },
        {
            name: 'time',
            type: StructuredGameDescription.kTypeArray,
            elementType: {
                type: StructuredGameDescription.kTypeNumber,
            },

            validator: timePropertyValidator,
        },
        {
            name: 'weather',
            type: StructuredGameDescription.kTypeNumber,
            defaultValue: 10,  // SUNNY_VEGAS
        }
    ],
};

// Structured way of expressing the objects that are part of a game's settings.
export const kGameObjects = {
    name: 'objects',
    type: StructuredGameDescription.kTypeArray,
    elementType: {
        type: StructuredGameDescription.kTypeObject,
        structure: [
            {
                name: 'modelId',
                type: StructuredGameDescription.kTypeNumber,
            },
            {
                name: 'position',
                ...kPositionProperty,
            },
            {
                name: 'rotation',
                ...kRotationVectorProperty,
            }
        ]
    },
};

// Structured way of expressing the pickups that should be part of the game's settings.
export const kGamePickups = {
    name: 'pickups',
    type: StructuredGameDescription.kTypeArray,
    elementType: {
        type: StructuredGameDescription.kTypeObject,
        structure: [
            {
                name: 'modelId',
                type: StructuredGameDescription.kTypeNumber,
            },
            {
                name: 'type',
                type: StructuredGameDescription.kTypeNumber,
                validator: pickupTypePropertyValidator,
            },
            {
                name: 'respawnTime',
                type: StructuredGameDescription.kTypeNumber,
                defaultValue: -1,
            },
            {
                name: 'position',
                ...kPositionProperty,
            },
        ]
    },
};

// Structured way of expressing the spawn positions for a game.
export const kGameSpawnPositions = {
    name: 'spawnPositions',
    type: StructuredGameDescription.kTypeArray,
    elementType: {
        type: StructuredGameDescription.kTypeObject,
        structure: [
            {
                name: 'position',
                ...kPositionProperty,
            },
            {
                name: 'facingAngle',
                ...kRotationAngleProperty,
            },
            {
                name: 'vehicleModelId',
                type: StructuredGameDescription.kTypeNumber,
                validator: vehicleModelIdValidator,
                defaultValue: 0,
            }
        ],
    },

    validator: spawnPositionValidator,
};
