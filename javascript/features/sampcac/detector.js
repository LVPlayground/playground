// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Represents a SAMPCAC detector as defined in our private JSON file. Detectors can either be based
// on expected readings, or on unexpected reasons. Immutable after construction.
export class Detector {
    // Type of supported detectors.
    static kTypeAllowList = 0;
    static kTypeBlockList = 1;

    #address_ = null;
    #bytes_ = null;
    #name_ = null;
    #type_ = null;

    #resultBytes_ = null;
    #resultChecksum_ = null;

    constructor(detector) {
        if (!detector.hasOwnProperty('name') || typeof detector.name !== 'string')
            throw new Error(`Each detector must have a human readable name.`);

        this.#name_ = detector.name;

        if (!detector.hasOwnProperty('address') || typeof detector.address !== 'number')
            throw new Error(`${this}: Non-numeric address specified in configuration.`);

        if (!detector.hasOwnProperty('bytes') || typeof detector.bytes !== 'number')
            throw new Error(`${this}: Non-numeric byte length specified in configuration.`);

        this.#address_ = detector.address;
        this.#bytes_ = detector.bytes;

        if (detector.hasOwnProperty('blocked')) {
            this.#type_ = Detector.kTypeBlockList;

            this.#resultBytes_ = detector.blocked.bytes ?? null;
            this.#resultChecksum_ = detector.blocked.checksum ?? null;

        } else if (detector.hasOwnProperty('expected')) {
            this.#type_ = Detector.kTypeAllowList;

            this.#resultBytes_ = detector.expected.bytes ?? null;
            this.#resultChecksum_ = detector.expected.checksum ?? null;

        } else {
            throw new Error(`${this}: Detector either has to be a blocked or allowed type.`);
        }

        if (this.#resultBytes_ !== null && !Array.isArray(this.#resultBytes_))
            throw new Error(`${this}: Result bytes must be specified as an array.`);

        if (this.#resultChecksum_ !== null && typeof this.#resultChecksum_ !== 'number')
            throw new Error(`${this}: Result checksum must be specified as a number.`);

        if (this.#resultBytes_ === null && this.#resultChecksum_ === null)
            throw new Error(`${this}: Either the result bytes or checksum must be specified.`);
    }

    // Gets the name for this detector, will be shown in the dialogs.
    get name() { return this.#name_; }

    // Gets the address at which memory has to be read.
    get address() { return this.#address_; }

    // Gets the number of bytes that have to be read from the given address.
    get bytes() { return this.#bytes_; }

    // Gets the expected result of the Detector. The polarity might have to be negated depending
    // on the |type| of detector this instance represents.
    get resultBytes() { return this.#resultBytes_; }
    get resultChecksum() { return this.#resultChecksum_; }

    // Gets the type of detector this instance represents.
    get type() { return this.#type_; }

    // Returns a textual representation of this detector.
    toString() { return `[object Detector("${this.#name_}")]`; }
}
