// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Rect } from 'base/rect.js';
import { StructuredGameDescription } from 'components/games/structured_game_description.js';
import { Vector } from 'base/vector.js';

// Validator function to be used for validating the |position|, including a boundary check.
function positionPropertyValidator(positionArray) {
    if (positionArray.length !== 3)
        throw new Error('Positions must be indicated as [x, y, z] arrays.');
    
    const position = new Vector(positionArray[0], positionArray[1], positionArray[2]);
    if (position.x < -4500 || position.x >= 4500)
        throw new Error('The x-coordinate of positions must be within [-4500, 4500]');
    if (position.y < -4500 || position.y >= 4500)
        throw new Error('The y-coordinate of positions must be within [-4500, 4500]');
    if (position.z < -100 || position.z >= 1850)
        throw new Error('The z-coordinate of positions must be within [-100, 1850');

    return position;
}

// Validator function for importing the given |rectangleArray|, which must be in the order of
// [ minX, minY, maxX, maxY ]. Will be returned as a new Rect instance.
function positionRectanglePropertyValidator(rectangleArray) {
    if (!rectangleArray.length)
        return null;  // empty rectangle

    if (rectangleArray.length !== 4)
        throw new Error('Rectangles must be indicated as [minX, minY, maxX, maxY] arrays.');
    
    const names = [ 'minX', 'minY', 'maxX', 'maxY' ];
    for (const [ index, name ] of Object.entries(names)) {
        if (rectangleArray[index] >= -4500 && rectangleArray[index] < 4500)
            continue;
        
        throw new Error(`The ${name} of a rectangle must be within [-4500, 4500].`);
    }

    if (rectangleArray[0] > rectangleArray[2])
        throw new Error('The minX in a rectangle must be lower than the maxX.');
    if (rectangleArray[1] > rectangleArray[3])
        throw new Error('The minY of a rectangle must be lower than the maxY.');

    return new Rect(rectangleArray[0], rectangleArray[1], rectangleArray[2], rectangleArray[3]);
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
    type: StructuredGameDescription.kTypeArray,
    elementType: {
        type: StructuredGameDescription.kTypeNumber,
    },

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

// Structured way of expressing a game's environment settings
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
