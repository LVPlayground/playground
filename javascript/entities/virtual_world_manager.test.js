// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('VirtualWorldManager', (it, beforeEach) => {
    let manager = null;

    beforeEach(() => manager = server.virtualWorldManager);

    it('should assign 0 to the main world', assert => {
        assert.equal(manager.mainWorld, 0);
    });

    it('should allocate blocks having exactly the right size', assert => {
        const firstBlock = manager.allocateBlock(1000);
        assert.equal(firstBlock.size, 1000);

        const secondBlock = manager.allocateBlock(500);
        assert.equal(secondBlock.size, 500);

        assert.equal(secondBlock.allocate() - firstBlock.allocate(), firstBlock.size);
    });

    it('should allocate unique virtual worlds for each player', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        assert.notEqual(manager.worldForPlayer(gunther), manager.worldForPlayer(russell));
    });

    it('should throw when a block of virtual worlds has been filled up', assert => {
        const block = manager.allocateBlock(1000);

        for (let i = 0; i < block.size; ++i)
            block.allocate();

        assert.throws(() => block.allocate());
    });

    it('should reallocate released virtual worlds in FIFO order', assert => {
        const block = manager.allocateBlock(1000);

        const firstVirtualWorlds = [
            block.allocate(),
            block.allocate(),
            block.allocate()
        ];

        block.allocate();
        block.allocate();

        firstVirtualWorlds.forEach(virtualWorld => block.release(virtualWorld));

        const secondVirtualWorlds = [
            block.allocate(),
            block.allocate(),
            block.allocate()
        ];

        assert.deepEqual(firstVirtualWorlds, secondVirtualWorlds);
    });
});
