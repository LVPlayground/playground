// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Provides native functions specific to the Limits value, enabling Pawn code to participate in the
// decisions. Natives should be proactively removed when there is no further need.
export class LimitsNatives {
    feature_ = null;

    constructor(feature) {
        this.feature_ = feature;
    }

    dispose() {}
}
