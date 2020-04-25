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
// |kRequestSlaveOnQueueOverflowCount| times in the last |kRequestSlaveOnQueueOverflowMs| ms.
export const kRequestSlaveOnQueueOverflowCount = 3;
export const kRequestSlaveOnQueueOverflowMs = 180 * 1000;

// The last number of command rate samples that has to be considered to see whether the number of
// bots can be decreased. We deliberately want to introduce recency bias here.
export const kDecreaseSlaveRequestSampleCount = 120;

// The rate difference between the perceived average rate in the |kDecreaseSlaveRequestSampleCount|
// most recent samples, and the maximum throughput, in order to request turning down a slave.
export const kDecreaseSlaveRequestRateDifference = kMaximumCommandRateSlave * 1.33;

// Intervals, in milliseconds, which will be the minimum intervals between requesting an increased
// number of slaves and/or requesting existing slaves to disconnect.
export const kIncreaseSlaveRequestIntervalMs = 30 * 1000;
export const kDecreaseSlaveRequestIntervalMs = 600 * 1000;

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

        // Gets the current command rate for this bot.
        get currentCommandRate() { return this.currentCommandRate_; }

        // Gets the maximum command rate for this bot.
        get maximumCommandRate() { return this.maximumCommandRate_; }

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

    // Millisecond timestamps of the last time we requested a bot to connect or disconnect.
    lastIncreaseSlaveRequestTime_ = null;
    lastDecreaseSlaveRequestTime_ = null;

    // Array with aggregated command rates for each second, to periodically determine whether
    // the number of bots could be decreased.
    commandRateTracking_ = null;
    commandRate_ = null;

    // Array with the |kRequestSlaveOnQueueExceedCount| latest overflows that happened.
    overflowTracking_ = null;

    bots_ = null;
    queue_ = null;

    // Gets the number of messages currently stored in the distribution queue.
    get queueSize() { return this.queue_.length; }

    // Returns the command rate for the bot identified by the given |nickname|, or null when the bot
    // is not currently connected to the network.
    getCommandRateForBot(bot) {
        if (this.bots_.has(bot))
            return this.bots_.get(bot).currentCommandRate;
        
        return null;
    }

    constructor(runtime, configuration) {
        super();

        this.runtime_ = runtime;
        this.runtime_.addObserver(this);

        this.configuration_ = configuration;

        this.commandRateTracking_ = [];
        this.commandRate_ = 0;

        this.overflowTracking_ = [];

        this.bots_ = new Map();
        this.queue_ = [];
    }

    // Writes the |message| to the echo channel. The message will be sent immediately if any of the
    // bots have a zero command rate. Otherwise, it will be put in the queue for distribution soon.
    write(message) {
        this.commandRate_++;

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

            const timestamp = server.clock.currentTime();

            // (1) Decrease the current command rate on all bots, flush the queue where possible.
            for (const [bot, status] of this.bots_.entries()) {
                status.decreaseCommandRate();

                // Prune all pending messages while the |bot|'s command rate allows for that.
                while (this.queue_.length && status.availableForWrite()) {
                    status.increaseCommandRate();
                    bot.write(this.queue_.shift());                    
                }
            }

            // (2) Capture an aggregated command rate capturing how busy the bots are.
            this.commandRateTracking_.push(this.commandRate_);
            this.commandRate_ = 0;

            // (3) If there are too many messages left in the queue, declare bankruptcy on them.
            if (this.queue_.length > kMaximumQueueSize) {
                this.coalesceQueueOverflow();
                this.recordQueueOverflow(timestamp);
                
                if (this.queue_.length > kMaximumQueueSize)
                    throw new Error('Queue is still too long after coalescing messages.');

                if (this.recentQueueOverflowCount(timestamp) >= kRequestSlaveOnQueueOverflowCount) {
                    const lastIncreaseSlaveRequestTime = this.lastIncreaseSlaveRequestTime_ ?? 0;
                    if (lastIncreaseSlaveRequestTime < (timestamp - kIncreaseSlaveRequestIntervalMs))
                        this.requestSlaveIncrease(timestamp);
                }
            }

            // (4) Periodically check whether there might be too many bots running.
            if (this.commandRateTracking_.length >= kDecreaseSlaveRequestSampleCount) {
                const throughputCapacity = this.calculateThroughputCapacity();
                const throughputAverage = this.calculateThroughputAverage();

                if ((throughputCapacity - kDecreaseSlaveRequestRateDifference) > throughputAverage) {
                    const lastDecreaseSlaveRequestTime = this.lastDecreaseSlaveRequestTime_ ?? 0;
                    if (lastDecreaseSlaveRequestTime < (timestamp - kDecreaseSlaveRequestIntervalMs))
                        this.requestSlaveDecrease(timestamp);
                }

                // Clear the samples and start over.
                this.commandRateTracking_ = [];
            }
        }
    }

    // Coalesces the queue overflow in a single message that indicates how many messages have
    // been dropped. This message will be placed at the end of the new queue.
    coalesceQueueOverflow() {
        const echoChannel = this.configuration_.echoChannel;
        const overflowCount = (this.queue_.length - kMaximumQueueSize) + 2;
        const bankruptcyMessage =
            `PRIVMSG ${echoChannel} :14(dropped ${overflowCount} pending messages)`;

        this.queue_ = this.queue_.slice(0, kMaximumQueueSize - 2);
        this.queue_.push(bankruptcyMessage);
    }

    // Records an overflow in the message queue by logging the instance. The queue will never
    // exceed |kRequestSlaveOnQueueOverflowCount| entries, which will be the most recent ones.
    recordQueueOverflow(timestamp) {
        this.overflowTracking_.push(timestamp);

        if (this.overflowTracking_.length > kRequestSlaveOnQueueOverflowCount)
            this.overflowTracking_.shift();
    }

    // Calculates the number of recent message queue overflows based on the defined thresholds.
    recentQueueOverflowCount(timestamp) {
        let count = 0;

        for (const overflowTime of this.overflowTracking_) {
            if (overflowTime > (timestamp - kRequestSlaveOnQueueOverflowMs))
                ++count;
        }

        return count;
    }

    // Requests the runtime to launch a new slave as the system is seeing increased load. This is
    // not a guarantee that the slave will join, just that it's been requested.
    requestSlaveIncrease(timestamp) {
        this.lastIncreaseSlaveRequestTime_ = timestamp;
        this.runtime_.requestSlaveIncrease();
    }

    // Calculates the throughput capacity based on the bots that have been added to the system. This
    // is the theoretical maximum that we're willing to send to the network.
    calculateThroughputCapacity() {
        let capacity = 0;

        for (const status of this.bots_.values())
            capacity += status.maximumCommandRate;

        return capacity;
    }

    // Calculates the average command rate that has been seen by the bots in the past period of
    // time. Statistics will be re-set when the number of bots changes.
    calculateThroughputAverage() {
        let total = 0;

        for (const commandRate of this.commandRateTracking_)
            total += commandRate;

        return total / this.commandRateTracking_.length;
    }

    // Requests the runtime to decrease the number of slave bots that are running, as there is too
    // much capacity. The runtime may decide to keep the number of slaves constant.
    requestSlaveDecrease(timestamp) {
        this.lastDecreaseSlaveRequestTime_ = timestamp;
        this.runtime_.requestSlaveDecrease();
    }

    // RuntimeObserver implementation:
    // ---------------------------------------------------------------------------------------------

    // Called when the given |bot| has connected. Registers it internally for message delivery, with
    // the configured command rate depending on whether it's a master or slave bot.
    onBotConnected(bot) {
        this.bots_.set(bot, new MessageDistributor.BotDistributionStatus(
                                    bot.config.master ? kMaximumCommandRateMaster
                                                      : kMaximumCommandRateSlave));

        // Reset the command rate tracking as it's been invalidated with the change in bot count.
        this.commandRateTracking_ = [];
    }

    // Called when the given |bot| has disconnected. We immediately remove it from internal state
    // as it can no longer be used to distribute echo messages. This avoids messages getting lost.
    onBotDisconnected(bot) {
        this.bots_.delete(bot);

        // Reset the command rate tracking as it's been invalidated with the change in bot count.
        this.commandRateTracking_ = [];
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
