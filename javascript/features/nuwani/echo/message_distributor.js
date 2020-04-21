// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { RuntimeObserver } from 'features/nuwani/runtime/runtime.js';

// Maximum command rate per bot, indicated in number of commands per second.
const kMaximumCommandRate = 1;

// Maximum number of messages in the distribution queue. The full queue will be dropped when the
// queue size exceeds this number, with a warning being sent to IRC instead.
const kMaximumQueueSize = 10;

// Request a new slave bot to be started when the distribution queue has been exceeded
// |kRequestSlaveOnQueueExceedCount| times in the last |kRequestSlaveOnQueueExceedSec| seconds.
const kRequestSlaveOnQueueExceedCount = 3;
const kRequestSlaveOnQueueExceedSec = 180;

// Disconnect a slave bot when the distribution queue has been at safe capacity for N-1 bots for
// the past |kDisconnectSlaveOnSafeReducedCapacitySec| seconds.
const kDisconnectSlaveOnSafeReducedCapacitySec = 600;

// The message distributor is a key component in NuwaniJS' echo system that makes sure messages are
// well balanced between the available bots, we don't exceed the server's allowance, and we can
// dynamically spin up and turn down more bots as demand changes.
//
// Most IRC daemons handle incoming messages based on two principles: RecvQ (with soft and hard
// limits) and a maximum command rate. A user's RecvQ is based on the amount of data received, in
// bytes, and is usually configured between 4 KiB and 10 KiB. Data will be drained from the queue
// at the allowed command rate, which is defined in commands per second. Most commands count as
// one, but popular IRCds penalize actions like heavy commands (/list, /who) and potentially
// abusive behaviour (/oper with invalid credentials) by artificially inflating this.
//
// The message distributor implements this by aggregating all messages that should be echoed to the
// IRC network, and evenly distributing them among the connected bots based on their individual
// queues. If there are more than ten messages in the queue, they will be dropped with a visible
// warning sent to the echo channel instead. If this happens three times, the distributor will
// request for a new slave bot to be connected to the network to handle the additional load. Slave
// bots will automatically disconnect again when they haven't been required for ten minutes.
//
// For simplicity's sake, this implementation assumes that no penalties will be given to the bots.
// Their primary job is to send PRIVMSG commands, and other commands are only possible with the
// intervention of bot owners. The master bot, however, does have its maximum command rate lowered
// by 50%. The reason behind this is that its responsible for responding to commands as well,
// which should still not trigger fakelag on the server.
export class MessageDistributor extends RuntimeObserver {
    runtime_ = null;

    constructor(runtime) {
        super();

        this.runtime_ = runtime;

        if (this.runtime_)
            this.runtime_.addObserver(this);
    }

    // RuntimeObserver implementation:
    // ---------------------------------------------------------------------------------------------

    onBotConnected(bot) {}
    onBotDisconnected(bot) {}

    // ---------------------------------------------------------------------------------------------

    dispose() {
        if (this.runtime_) {
            this.runtime_.removeObserver(this);
            this.runtime_ = null;
        }
    }
}
