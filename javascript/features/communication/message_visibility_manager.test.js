// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('MessageVisibilityManager', (it, beforeEach) => {
    let gunther = null;
    let manager = null;
    let russell = null;

    beforeEach(() => {
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        manager = server.featureManager.loadFeature('communication').visibilityManager_;
        russell = server.playerManager.getById(/* Russell= */ 1);
    });

    it('considers visibility across virtual words', assert => {
        const localMessage = Symbol('local message');
        const remoteMessage = Symbol('remote message');

        // (1) Gunther and Russell are in the same virtual world.
        gunther.virtualWorld = 0;
        russell.virtualWorld = 0;

        assert.equal(
            manager.selectMessageForPlayer(gunther, gunther.virtualWorld, russell,
                                           { localMessage, remoteMessage }), localMessage);

        // (2) Gunther and Russell are both in the main world.
        gunther.virtualWorld = 2500;  // an interior
        russell.virtualWorld = 3500;  // a house

        assert.equal(
            manager.selectMessageForPlayer(gunther, gunther.virtualWorld, russell,
                                           { localMessage, remoteMessage }), localMessage);

        // (3) Gunther and Russell are in different worlds.
        gunther.virtualWorld = 80500;
        russell.virtualWorld = 0;

        assert.isNull(
            manager.selectMessageForPlayer(gunther, gunther.virtualWorld, russell,
                                           { localMessage, remoteMessage }));

        // (4) Gunther and Russell are in different worlds, but Russell is an admin.
        russell.level = Player.LEVEL_ADMINISTRATOR;

        assert.equal(
            manager.selectMessageForPlayer(gunther, gunther.virtualWorld, russell,
                                           { localMessage, remoteMessage }), remoteMessage);
    });

    it('considers the personal ignore lists owned by players', assert => {
        const localMessage = Symbol('local message');
        const remoteMessage = Symbol('remote message');

        gunther.virtualWorld = 0;
        russell.virtualWorld = 0;

        // (1) Gunther and Russell can talk to each other.
        assert.doesNotInclude(manager.getIgnoredPlayers(gunther), russell);
        assert.doesNotInclude(manager.getIgnoredPlayers(russell), gunther);

        assert.equal(
            manager.selectMessageForPlayer(gunther, gunther.virtualWorld, russell,
                                           { localMessage, remoteMessage }), localMessage);

        assert.equal(
            manager.selectMessageForPlayer(russell, russell.virtualWorld, gunther,
                                           { localMessage, remoteMessage }), localMessage);

        // (2) Gunther has ignored Russell.
        manager.addPlayerToIgnoreList(gunther, russell);

        assert.includes(manager.getIgnoredPlayers(gunther), russell);
        assert.doesNotInclude(manager.getIgnoredPlayers(russell), gunther);

        assert.equal(
            manager.selectMessageForPlayer(gunther, gunther.virtualWorld, russell,
                                           { localMessage, remoteMessage }), localMessage);
                                        
        assert.isNull(
            manager.selectMessageForPlayer(russell, russell.virtualWorld, gunther,
                                          { localMessage, remoteMessage }));

        // (3) Russell has ignored Gunther.
        manager.addPlayerToIgnoreList(russell, gunther);

        assert.includes(manager.getIgnoredPlayers(gunther), russell);
        assert.includes(manager.getIgnoredPlayers(russell), gunther);

        assert.isNull(
            manager.selectMessageForPlayer(gunther, gunther.virtualWorld, russell,
                                          { localMessage, remoteMessage }));

        assert.isNull(
            manager.selectMessageForPlayer(gunther, gunther.virtualWorld, russell,
                                          { localMessage, remoteMessage }));

        // (4) They can unignore each other again.
        manager.removePlayerFromIgnoreList(gunther, russell);
        manager.removePlayerFromIgnoreList(russell, gunther);

        assert.doesNotInclude(manager.getIgnoredPlayers(gunther), russell);
        assert.doesNotInclude(manager.getIgnoredPlayers(russell), gunther);

        assert.equal(
            manager.selectMessageForPlayer(gunther, gunther.virtualWorld, russell,
                                           { localMessage, remoteMessage }), localMessage);

        assert.equal(
            manager.selectMessageForPlayer(russell, russell.virtualWorld, gunther,
                                           { localMessage, remoteMessage }), localMessage);
    });
});
