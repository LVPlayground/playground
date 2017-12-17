// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Represents a radio channel that players are able to listen to whilst ingame.
class Channel {
    constructor(configuration) {
        if (!configuration.hasOwnProperty('name') || typeof configuration.name !== 'string')
            throw new Error('The name of a radio channel must be set as a string.');

        if (!configuration.hasOwnProperty('stream') || typeof configuration.stream !== 'string')
            throw new Error('The stream of a radio channel must be set as a string.');

        if (!configuration.stream.startsWith('http'))
            throw new Error('The stream of a radio channel must be a URL.');

        this.name_ = configuration.name;
        this.stream_ = configuration.stream;
    }

    // Gets the name of this radio channel.
    get name() { return this.name_; }

    // Gets the stream URL of this radio channel.
    get stream() { return this.stream_; }
}

exports = Channel;
