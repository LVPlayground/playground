// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MessageDistributor, kMaximumCommandRateMaster, kMaximumCommandRateSlave,
         kMaximumQueueSize, kRequestSlaveOnQueueOverflowCount,
         kRequestSlaveOnQueueOverflowMs } from 'features/nuwani/echo/message_distributor.js';

import { Configuration } from 'features/nuwani/configuration.js';
import { TestBot } from 'features/nuwani/test/test_bot.js';

describe('MessageDistributor', (it, beforeEach, afterEach) => {
    // Fake implementation of the Runtime class that implements sufficient functionality to test the
    // message distributor, and provides access to calls for spinning up or turning down a bot.
    class FakeRuntime {
        requestSlaveIncreaseCallCount_ = 0;
        requestSlaveDecreaseCallCount_ = 0;

        get requestSlaveIncreaseCallCount() { return this.requestSlaveIncreaseCallCount_; }
        get requestSlaveDecreaseCallCount() { return this.requestSlaveDecreaseCallCount_; }

        addObserver(observer) {}
        removeObserver(observer) {}

        requestSlaveIncrease() { this.requestSlaveIncreaseCallCount_++; }
        requestSlaveDecrease() { this.requestSlaveDecreaseCallCount_++; }
    }

    let runtime = null;
    let distributor = null;

    beforeEach(() => {
        runtime = new FakeRuntime();
        distributor = new MessageDistributor(runtime, new Configuration());
    });

    afterEach(() => {
        distributor.dispose();
        distributor = null;
    });

    it('should maintain different command rates for master and slave bots', async(assert) => {
        assert.notEqual(kMaximumCommandRateMaster, kMaximumCommandRateSlave);
        assert.isTrue(Number.isInteger((1000 / kMaximumCommandRateMaster) / 1000));
        assert.isTrue(Number.isInteger((1000 / kMaximumCommandRateSlave) / 1000));

        const master = new TestBot();
        const slave = new TestBot({ slave: true });

        let masterWaits = 0;
        let slaveWaits = 0;

        distributor.run();

        // (1) Send 20 messages to the MASTER bot at the maximum rate, while ensuring that none of
        //     them hit the queue, and then verify that this took the expected amount of time.
        {
            distributor.onBotConnected(master);

            const expectedWait = 1000 / kMaximumCommandRateMaster;
            for (let messageId = 0; messageId < 20; ++messageId) {
                distributor.write('PRIVMSG #echo :Hello, world');
                assert.strictEqual(distributor.queueSize, 0);

                for (let wait = 0; wait < Math.ceil(expectedWait / 1000); ++wait, ++masterWaits)
                    await server.clock.advance(/* 1 second= */ 1000);
            }

            assert.equal(master.messagesForTesting.length, 20);

            distributor.onBotDisconnected(master);
        }

        // (2) Send 20 messages to the SLAVE bot at the maximum rate, while ensuring that none of
        //     them hit the queue, and then verify that this took the expected amount of time.
        {
            distributor.onBotConnected(slave);

            const expectedWait = 1000 / kMaximumCommandRateSlave;
            for (let messageId = 0; messageId < 20; ++messageId) {
                distributor.write('PRIVMSG #echo :Hello, world');
                assert.strictEqual(distributor.queueSize, 0);

                for (let wait = 0; wait < Math.ceil(expectedWait / 1000); ++wait, ++slaveWaits)
                    await server.clock.advance(/* 1 second= */ 1000);
            }

            assert.equal(master.messagesForTesting.length, 20);

            distributor.onBotDisconnected(slave);
        }

        // (3) Ensure that throughput for the slaves is proportional to each other in the same way
        //     the command rates are. This strongly assumes that masters are penalized by 50%.
        assert.isBelow(slaveWaits, masterWaits);
        assert.equal(masterWaits / 2, slaveWaits);
    });

    it('should flush the message queue at a rate expected for the command rate', async (assert) => {
        assert.isBelow(kMaximumCommandRateMaster, kMaximumQueueSize);
        assert.isBelow(kMaximumCommandRateSlave, kMaximumQueueSize);

        const master = new TestBot();
        const slave = new TestBot({ slave: true });

        let masterWaits = 0;
        let slaveWaits = 0;

        distributor.run();

        // (1) Run the test with a master bot.
        {
            distributor.onBotConnected(master);

            for (let messageId = 0; messageId < kMaximumQueueSize; ++messageId)
                distributor.write('PRIVMSG #LVP.DevJS :Hello, world!');
            
            assert.isAbove(distributor.queueSize, 1);
            while (distributor.queueSize) {
                await server.clock.advance(/* 1 second = */ 1000);
                masterWaits++;
            }

            distributor.onBotDisconnected(master);
        }

        // (2) Run the test with a slave bot.
        {
            distributor.onBotConnected(slave);

            for (let messageId = 0; messageId < kMaximumQueueSize; ++messageId)
                distributor.write('PRIVMSG #LVP.DevJS :Hello, world!');
            
            assert.isAbove(distributor.queueSize, 1);
            while (distributor.queueSize) {
                await server.clock.advance(/* 1 second = */ 1000);
                slaveWaits++;
            }

            distributor.onBotDisconnected(slave);
        }

        // (3) Confirm that the messages could be sent in N-1 seconds. This, too, has a strong
        //     assumption that masters operate at 50% throughput compared to slaves.
        assert.closeTo(masterWaits, kMaximumQueueSize / kMaximumCommandRateMaster - 1, 2);
        assert.closeTo(slaveWaits, kMaximumQueueSize / kMaximumCommandRateSlave - 1, 2);

        assert.isBelow(slaveWaits, masterWaits);
        assert.equal(masterWaits / 2, slaveWaits);        
    });

    it('should dispose of messages when the queue size has been exceeded', async (assert) => {
        const slave = new TestBot({ slave: true });

        distributor.run();
        distributor.onBotConnected(slave);

        for (let messageId = 0; messageId < kMaximumQueueSize * 2; ++messageId)
            distributor.write('PRIVMSG #LVP.DevJS :Hello, world!');
        
        assert.isAbove(distributor.queueSize, kMaximumQueueSize);

        while (distributor.queueSize)
            await server.clock.advance(/* 1 second = */ 1000);

        assert.equal(slave.messagesForTesting.length, kMaximumQueueSize + kMaximumCommandRateSlave);
        assert.isTrue(/dropped (\d+) pending messages/.test(slave.messagesForTesting.pop()));
    });

    it('should repeatedly drop messages if the queue keeps growing', async (assert) => {
        const slave = new TestBot({ slave: true });
        const iterations = 3;

        distributor.run();
        distributor.onBotConnected(slave);
        
        for (let cycle = 0; cycle < iterations; ++cycle) {
            for (let messageId = 0; messageId < kMaximumQueueSize * 2; ++messageId)
                distributor.write('PRIVMSG #LVP.DevJS :Hello, world!');

            await server.clock.advance(/* 1 second = */ 1000);
        }

        while (distributor.queueSize)
            await server.clock.advance(/* 1 second = */ 1000);

        assert.equal(slave.messagesForTesting.length, kMaximumQueueSize + iterations);
        for (let cycle = 0; cycle < iterations; ++cycle)
            assert.isTrue(/dropped (\d+) pending messages/.test(slave.messagesForTesting.pop()));
    });

    it('should request another bot to connect if the message load is high', async (assert) => {
        const master = new TestBot();
        const iterations = kRequestSlaveOnQueueOverflowCount;

        distributor.run();
        distributor.onBotConnected(master);

        assert.equal(runtime.requestSlaveIncreaseCallCount, 0);

        // (1) Create |kRequestSlaveOnQueueOverflowCount| overflows, which will request a slave.
        for (let cycle = 0; cycle < iterations; ++cycle) {
            for (let messageId = 0; messageId < kMaximumQueueSize * 2; ++messageId)
                distributor.write('PRIVMSG #LVP.DevJS :Hello, world!');

            await server.clock.advance(/* 1 second = */ 1000);
        }

        assert.equal(runtime.requestSlaveIncreaseCallCount, 1);

        // (2) Create that many overflows again. This SHOULD NOT create a slave because not
        // enough time has passed since the last slave that was created.
        for (let cycle = 0; cycle < iterations; ++cycle) {
            for (let messageId = 0; messageId < kMaximumQueueSize * 2; ++messageId)
                distributor.write('PRIVMSG #LVP.DevJS :Hello, world!');

            await server.clock.advance(/* 1 second = */ 1000);
        }

        assert.equal(runtime.requestSlaveIncreaseCallCount, 1);

        // (3) Do the exact same thing again, but now after waiting |kRequestSlaveOnQueueOverflowMs|
        // which means that another bot can be requested if needed.
        server.clock.advance(kRequestSlaveOnQueueOverflowMs);

        for (let cycle = 0; cycle < iterations; ++cycle) {
            for (let messageId = 0; messageId < kMaximumQueueSize * 2; ++messageId)
                distributor.write('PRIVMSG #LVP.DevJS :Hello, world!');

            await server.clock.advance(/* 1 second = */ 1000);
        }

        assert.equal(runtime.requestSlaveIncreaseCallCount, 2);
    });

    // TODO: Request slave decreases if the load allows for that.
    // TODO: Do not request slave decreases if requested recently.
});
