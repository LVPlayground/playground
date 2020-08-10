// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Registry for containing information about all vehicle-absed games available on the server. The
// ganes themselves are contained in JSON configuration files, which can be imported using the a
// StructuredGameDescription class which follows the canonical structured game description syntax.
export class VehicleGameRegistry {
    #descriptionConstructor_ = null;
    #descriptionDirectory_ = null;
    #descriptions_ = null;
    #type_ = null;

    constructor(type, descriptionDirectory, descriptionConstructor) {
        this.#descriptionConstructor_ = descriptionConstructor;
        this.#descriptionDirectory_ = descriptionDirectory;
        this.#type_ = type;
    }

    // Ensures that the registry has been initialized. This will happen the first time any game
    // data has to be accessed by one of the methods in the registry.
    ensureInitialized() {
        if (this.#descriptions_)
            return;

        this.#descriptions_ = new Map();
        for (const filename of glob(this.#descriptionDirectory_, '.*\.json')) {
            const description =
                new this.#descriptionConstructor_(this.#descriptionDirectory_ + filename);

            if (this.#descriptions_.has(description.id))
                throw new Error(`${description}: duplicate ${this.#type_}: ${description.id}.`);

            this.#descriptions_.set(description.id, description);
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Provides access to a description with the given |id|, or NULL when it cannot be found.
    getDescription(id) { this.ensureInitialized(); return this.#descriptions_.get(id) ?? null; }

    // Provides an iterator through which all of the games can be accessed.
    descriptions() { this.ensureInitialized(); return this.#descriptions_.values(); }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        if (this.#descriptions_)
            this.#descriptions_.clear();

        this.#descriptions_ = null;
    }
}
