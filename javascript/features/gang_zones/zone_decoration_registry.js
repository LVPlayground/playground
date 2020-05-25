// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

// Data file in which the available gang zone decorations have been stored.
const kZoneDecorationDataFile = 'data/gang_zone_decorations.json';

// Maintains and tracks all the objects that are available for gangs to purchase as decoration
// within their zones. Data will be lazily loaded based on need.
export class ZoneDecorationRegistry {
    categories_ = null;
    objects_ = null;
    prices_ = null;

    // ---------------------------------------------------------------------------------------------

    // Gets the categories & individual objects of decorations that gangs are allowed to place.
    get categories() { this.ensureInitialized(); return Object.entries(this.categories_); }

    // Returns the name for decoration with the given |modelId|.
    getNameForModelId(modelId) {
        this.ensureInitialized();

        return this.objects_.get(modelId) ?? 'Unknown';
    }

    // Returns the price for decoration with the given |modelId|.
    getPriceForModelId(modelId) {
        this.ensureInitialized();

        return this.prices_.get(modelId) ?? 0;
    }

    // ---------------------------------------------------------------------------------------------

    // Makes sure that the zone decoration registry has been initialized.
    ensureInitialized() {
        if (this.categories_ !== null)
            return;  // initialized
        
        this.objects_ = new Map();
        this.prices_ = new Map();

        this.categories_ = JSON.parse(readFile(kZoneDecorationDataFile));
        for (const objects of Object.values(this.categories_)) {
            for (const object of objects) {
                this.objects_.set(object.model, object.name);
                this.prices_.set(object.model, object.price);
            }
        }
    }

    // Clears our caches and reloads all information from disk.
    reload() {
        this.categories_ = null;

        this.ensureInitialized();
    }
}
