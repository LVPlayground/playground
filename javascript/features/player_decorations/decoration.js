// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Color } from 'base/color.js';
import { Vector } from 'base/vector.js';

import { murmur3hash } from 'base/murmur3hash.js';

// Describes information about an individual decoration, such as its unique identifier, model ID,
// offsets and other data. Strictly imported from JSON.
export class Decoration {
    // Bones on which a decoration could be attached.
    static kBoneCalfLeft = 12;
    static kBoneCalfRight = 11;
    static kBoneFootLeft = 9;
    static kBoneFootRight = 10;
    static kBoneForearmLeft = 13;
    static kBoneForearmRight = 14;
    static kBoneHandLeft = 5;
    static kBoneHandRight = 6;
    static kBoneHead = 2;
    static kBoneJaw = 18;
    static kBoneNeck = 17;
    static kBoneShoulderLeft = 15;
    static kBoneShoulderRight = 16;
    static kBoneSpine = 1;
    static kBoneThighLeft = 7;
    static kBoneThighRight = 8;
    static kBoneUpperArmLeft = 3;
    static kBoneUpperArmRight = 4;

    #uniqueId_ = null;

    #name_ = null;
    #modelId_ = null;
    #bone_ = null;
    #offset_ = null;
    #rotation_ = null;
    #scale_ = null;
    #primaryColor_ = null;
    #secondaryColor_ = null;

    // Gets the unique Id that has been assigned to this decoration.
    get uniqueId() { return this.#uniqueId_; }

    // Gets the name through which this decoration can be represented.
    get name() { return this.#name_; }

    // Gets the model Id that should be used when displaying this model.
    get modelId() { return this.#modelId_; }

    // Gets the bone on which this decoration should be attached, one of the constants above.
    get bone() { return this.#bone_; }

    // Gets the offset from the bone at which this decoration should be attached, as a Vector.
    get offset() { return this.#offset_; }

    // Gets the rotation based on which this decoration should be attached, as a Vector.
    get rotation() { return this.#rotation_; }

    // Gets the scale at which this decoration should be attached, as a Vector.
    get scale() { return this.#scale_; }

    // Gets the primary colour of this decoration. May be NULL, which means it will be ignored.
    get primaryColor() { return this.#primaryColor_; }

    // Gets the secondary colour of this decoration. May be NULL, which means it will be ignored.
    get secondaryColor() { return this.#secondaryColor_; }

    constructor(configuration) {
        if (!configuration.hasOwnProperty('name') || typeof configuration.name !== 'string')
            throw new Error(`Each model configuration must specify its name.`);

        if (!configuration.hasOwnProperty('modelId') || typeof configuration.modelId !== 'number')
            throw new Error(`Each model configuration must specify its model ID.`);

        this.#name_ = configuration.name;
        this.#modelId_ = configuration.modelId;

        if (!configuration.hasOwnProperty('bone') || typeof configuration.bone !== 'number')
            throw new Error(`${this}: the decoration's bone must be specified.`);

        this.#bone_ = configuration.bone;

        if (!Array.isArray(configuration.offset) || configuration.offset.length != 3)
            throw new Error(`${this}: the decoration offset must be an [x, y, z] array.`);

        this.#offset_ = new Vector(...configuration.offset);

        if (!Array.isArray(configuration.rotation) || configuration.rotation.length != 3)
            throw new Error(`${this}: the decoration rotation must be an [x, y, z] array.`);

        this.#rotation_ = new Vector(...configuration.rotation);

        if (!Array.isArray(configuration.scale) || configuration.scale.length != 3)
            throw new Error(`${this}: the decoration scale must be an [x, y, z] array.`);

        this.#scale_ = new Vector(...configuration.scale);

        if (configuration.hasOwnProperty('primaryColor')) {
            if (typeof configuration.primaryColor !== 'string')
                throw new Error(`${this}: The primary color must be in RRGGBB color format.`);

            this.#primaryColor_ = Color.fromHex(configuration.primaryColor);
        }

        if (configuration.hasOwnProperty('secondaryColor')) {
            if (typeof configuration.secondaryColor !== 'string')
                throw new Error(`${this}: The secondary color must be in RRGGBB color format.`);

            this.#secondaryColor_ = Color.fromHex(configuration.secondaryColor);
        }

        this.#uniqueId_ = computeUniqueId(this);
    }

    toString() { return `[object Decoration(${this.#modelId_}, "${this.#name_}")]`; }
}

// Computes a unique Id for the given |decoration|, which has been mostly initialized at this point.
// The short version is that we join all the relevant information together in a strong, and compute
// a murmur3hash for it. This is not fool-proof, but good enough for the ~100s we'll support.
function computeUniqueId(decoration) {
    return murmur3hash(`${decoration.name}:${decoration.modelId}`);
}
