// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Dialog } from 'components/dialogs/dialog.js';

// An alert box that displays a message, and optionally a title. Does not return a value to the
// caller, because the operation should be finished after either action got activated.
export async function alert(player, { title = 'Las Venturas Playground', message } = {}) {
    await Dialog.displayMessage(player, title, String(message), 'Close', '');
}
