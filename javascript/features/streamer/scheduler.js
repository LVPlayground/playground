// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const EntityStreamerGlobal = require('features/streamer/entity_streamer_global.js');

// Number of milliseconds between ticks for each of the global streamers.
const GlobalStreamerTickMs = 1000;

// The scheduler is responsible for scheduling streaming updates, both for the global entity
// streamers and for the per-player entity streamers, depending on a series of heuristics.
class Scheduler {
    constructor() {
        this.active_ = true;
        this.counter_ = 0;

        this.globalStreamers_ = new Set();
        // TODO: Support player entity streamers in the scheduler.
    }

    // Gets the number of iterations the scheduler has been through so far.
    get counter() { return this.counter_; }

    // Adds the |streamer| to the set of global streamers. 
    addStreamer(streamer) {
        if (streamer instanceof EntityStreamerGlobal)
            this.globalStreamers_.add(streamer);
        else
            throw new Error('Unexpected streamer type given.', streamer);
    }

    // Asynchronously starts running the scheduler. This method will never return, and will only
    // stop executing when the scheduler has been disposed of.
    async start() {
        while (this.active_) {
            ++this.counter_;

            if (!this.globalStreamers_.size) {
                await milliseconds(GlobalStreamerTickMs);
                continue;
            }

            // TODO: Make sure that the interval between invocation of the global streamers is
            // GlobalStreamerTickMs, not [GlobalStreamerTickMs + execution time].
            for (const streamer of this.globalStreamers_) {
                if (streamer.size > 0)
                    await this.safeStream(streamer);

                await milliseconds(GlobalStreamerTickMs / this.globalStreamers_.size);
            }

            // TODO: Make sure that we don't flood the server by continuously streaming.
            // TODO: Support per-player entity streamers in this method.
        }
    }

    // Safely streams the |streamer|. Will not break the entire streamer on an exception.
    async safeStream(streamer) {
        try {
            await streamer.stream();
        } catch (exception) {
            if (server.isTest())
                return;  // don't spam the console while running tests

            console.log('ERROR: Unexpected promise rejection by the |streamer|.', exception);
        }
    }

    dispose() {
        this.active_ = false;
    }
}

exports = Scheduler;
