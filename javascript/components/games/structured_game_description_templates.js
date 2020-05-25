// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

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

// Validator function for ensuring that the rotation is in range of [0, 360].
function rotationAnglePropertyValidator(rotationAngle) {
    if (rotationAngle < 0 || rotationAngle >= 360)
        throw new Error('Rotation angles must be within [0, 360]');
}

// Structured property definition for a three dimensional position array [x, y, z], with validation
// to make sure that each coordinate is in bounds of [-4500, 4500].
export const kPositionProperty = {
    type: StructuredGameDescription.kTypeArray,
    elementType: {
        type: StructuredGameDescription.kTypeNumber,
    },

    validator: positionPropertyValidator,
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

// Structured property definition for a rotation angle, in range of [0, 360].
export const kRotationAngleProperty = {
    type: StructuredGameDescription.kTypeNumber,
    validator: rotationAnglePropertyValidator,
};

