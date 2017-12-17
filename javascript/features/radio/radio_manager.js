// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

//
class RadioManager {
    constructor(selection, settings) {
        this.selection_ = selection;
        this.settings_ = settings;
    }

    // Returns whether the radio feature should be enabled at all.
    isEnabled() { return this.settings_().getValue('radio/enabled'); }

    dispose() {}
}

exports = RadioManager;
