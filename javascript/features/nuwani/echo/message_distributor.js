// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { RuntimeObserver } from 'features/nuwani/runtime/runtime.js';

// Maximum command rate per bot, indicated in number of commands per second.
export const kMaximumCommandRateSlave = 1;
export const kMaximumCommandRateMaster = 0.5;

// Maximum number of messages in the distribution queue. The full queue will be dropped when the
// queue size exceeds this number, with a warning being sent to IRC instead.
export const kMaximumQueueSize = 10;

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
    // Maintains the status of an individual bot in regards to sending statistics, with some utility
    // methods to make interacting with a queue more obvious in the rest of the code.
    static BotDistributionStatus = class BotDistributionStatus {
        maximumCommandRate_ = null;
        currentCommandRate_ = null;

        constructor(maximumCommandRate) {
            this.maximumCommandRate_ = maximumCommandRate;
            this.currentCommandRate_ = 0;
        }

        // Returns whether the bot's current command rate allows for a write to the network.
        availableForWrite() { return this.currentCommandRate_ < this.maximumCommandRate_; }

        // Methods for increasing or decreasing the current command rate of this bot.
        increaseCommandRate() { this.currentCommandRate_++; }
        decreaseCommandRate() {
            this.currentCommandRate_ =
                Math.max(0, this.currentCommandRate_ - 1 * this.maximumCommandRate_);
        }
    };

    runtime_ = null;
    configuration_ = null;

    bots_ = null;
    queue_ = null;

    // Gets the number of messages currently stored in the distribution queue.
    get queueSize() { return this.queue_.length; }

    constructor(runtime, configuration) {
        super();

        this.runtime_ = runtime;
        this.runtime_.addObserver(this);

        this.configuration_ = configuration;

        this.bots_ = new Map();
        this.queue_ = [];
    }

    // Writes the |message| to the echo channel. The message will be sent immediately if any of the
    // bots have a zero command rate. Otherwise, it will be put in the queue for distribution soon.
    write(message) {
        for (const [bot, status] of this.bots_.entries()) {
            if (!status.availableForWrite())
                continue;
            
            status.increaseCommandRate();

            bot.write(message);
            return;
        }

        this.queue_.push(message);
    }

    // Runs the message distributor until it's been disposed of. This function will never return
    // until that happens, and will keep itself spinning once per second for that duration.
    async run() {
        while (this.runtime_) {
            await wait(/* 1 second= */ 1000);

            // (1) Decrease the current command rate on all bots, flush the queue where possible.
            for (const [bot, status] of this.bots_.entries()) {
                status.decreaseCommandRate();

                // Prune all pending messages while the |bot|'s command rate allows for that.
                while (this.queue_.length && status.availableForWrite()) {
                    bot.write(this.queue_.shift().toString());
                    status.increaseCommandRate();
                }
            }

            // (2) If there are too many messages left in the queue, declare bankruptcy on them.
            if (this.queue_.length > kMaximumQueueSize) {
                const echoChannel = this.configuration_.echoChannel;
                const overflowCount = (this.queue_.length - kMaximumQueueSize) + 2;
                const bankruptcyMessage =
                    `PRIVMSG ${echoChannel} :14(dropped ${overflowCount} pending messages)`;

                this.queue_ = this.queue_.slice(0, kMaximumQueueSize - 2);
                this.queue_.push(bankruptcyMessage);
            }
        }
    }

    // RuntimeObserver implementation:
    // ---------------------------------------------------------------------------------------------

    // Called when the given |bot| has connected. Registers it internally for message delivery, with
    // the configured command rate depending on whether it's a master or slave bot.
    onBotConnected(bot) {
        this.bots_.set(bot, new MessageDistributor.BotDistributionStatus(
                                    bot.config.master ? kMaximumCommandRateMaster
                                                      : kMaximumCommandRateSlave));
    }

    // Called when the given |bot| has disconnected. We immediately remove it from internal state
    // as it can no longer be used to distribute echo messages. This avoids messages getting lost.
    onBotDisconnected(bot) {
        this.bots_.delete(bot);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.runtime_.removeObserver(this);
        this.runtime_ = null;

        this.configuration_ = null;
        this.queue_ = null;

        this.bots_.clear();
        this.bots_ = null;
    }
}
