// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Dialog = require('components/dialogs/dialog.js');

// A confirmation box is a very simple box that asks the player to confirm a sentence, and has two
// buttons corresponding to Yes and No. The `display` function returns a boolean indicating whether
// the player confirmed the action, or not. 
exports = async(player, { title = 'Las Venturas Playground', message } = {}) => {
    const result = await Dialog.displayMessage(player, title, message, 'Yes', 'No');
    return !!result.response;
};
