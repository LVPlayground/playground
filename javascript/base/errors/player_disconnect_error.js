// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const NAME = 'PlayerDisconnectError';
const MESSAGE = 'The player has disconnected from the server.';

// The PlayerDisconnectError represents an exception that should be thrown when the player has
// disconnected from Las Venturas Playground while an asynchronous operation was in progress.
class PlayerDisconnectError extends Error {
  constructor() {
    super(MESSAGE);

    this.name = NAME;
    this.message = MESSAGE;
  }
};

exports = PlayerDisconnectError;
