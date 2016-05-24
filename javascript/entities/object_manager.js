// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The object manager maintains and owns all objects that have been created on the server. It also
// powers the events required for the promises on the GameObject instances to work.
class ObjectManager {
    constructor(objectConstructor = GameObject) {
        this.objectConstructor_ = objectConstructor;
        this.objects_ = new Set();
    }

    // Gets the number of objects currently created on the server.
    get count() { return this.objects_.size; }

    // Creates a new object with the given options. The options are based on the available settings
    // as part of the Object Streamer, and can be changed after the object's creation.
    createObject() {
        // TODO(Russell): Make it possible to create objects.
    }

    // Removes the |object| from the maintained set of objects. Should only be used by the
    // GameObject implementation to inform the manager about their disposal.
    didDisposeObject(object) {
        if (!this.objects_.has(object))
            throw new Error('Attempting to dispose an invalid object: ' + object);

        this.objects_.delete(object);
    }

    // Removes all ramaining objects from the server.
    dispose() {
        this.objects_.forEach(object => object.dispose());

        if (this.objects_.size != 0)
            throw new Error('There are remaining objects after disposing all of them.');
    }
}

exports = ObjectManager;
