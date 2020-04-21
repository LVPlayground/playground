// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MessageDistributor, kMaximumCommandRateMaster, kMaximumCommandRateSlave,
         kMaximumQueueSize } from 'features/nuwani/echo/message_distributor.js';

import { TestBot } from 'features/nuwani/test/test_bot.js';

describe('MessageDistributor', (it, beforeEach, afterEach) => {
    // Fake implementation of the Runtime class that implements sufficient functionality to test the
    // message distributor, and provides access to calls for spinning up or turning down a bot.
    class FakeRuntime {
        addObserver(observer) {}
        removeObserver(observer) {}
    }

    let runtime = null;
    let distributor = null;

    beforeEach(() => {
        runtime = new FakeRuntime();
        distributor = new MessageDistributor(runtime);
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
                distributor.write('PRIVMSG #echo :Hello, world!');
            
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
                distributor.write('PRIVMSG #echo :Hello, world!');
            
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
});
