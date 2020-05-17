// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { TextLabel } from 'entities/text_label.js';

// Global counter for creating a unique mocked text label ID.
let globalMockTextLabelId = 0;

// Mocked version of the TextLabel class that supports the same API, but won't interact with the
// SA-MP server in order to do its actions.
export class MockTextLabel extends TextLabel {
    // Overridden to avoid creating a real object on the server.
    createInternal(options) { return ++globalMockTextLabelId; }

    // Overridden to avoid destroying a real text label on the server.
    destroyInternal() {}

    // Overridden to avoid updating a real text label on the server.
    updateInternal(color, text) {}
}
