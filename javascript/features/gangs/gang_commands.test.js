// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Gang from 'features/gangs/gang.js';
import GangDatabase from 'features/gangs/gang_database.js';
import { GangFinance } from 'features/gangs/gang_finance.js';
import Gangs from 'features/gangs/gangs.js';

describe('GangCommands', (it, beforeEach) => {
    let commands = null;
    let manager = null;
    let player = null;

    beforeEach(() => {
        server.featureManager.registerFeaturesForTests({
            gangs: Gangs
        });

        const gangs = server.featureManager.loadFeature('gangs');

        commands = gangs.commands_;
        manager = gangs.manager_;
        player = server.playerManager.getById(0 /* Gunther */);
    });

    // Utility function to create a gang with the given information.
    function createGang({tag = 'HKO', name = 'Hello Kitty Online', goal = '', color = null} = {}) {
        const gangId = Math.floor(Math.random() * 1000000);

        manager.gangs_.set(gangId, new Gang({
            id: gangId,
            tag: tag,
            name: name,
            goal: goal || 'Testing gang',
            color: color,
            balance: 0,
            balanceAccess: GangDatabase.kAccessLeaderAndManagers,
            chatEncryptionExpiry: 0,
            skinId: null,
        }));

        return manager.gangs_.get(gangId);
    }

    // Utility function for adding a given player to a given gang.
    function addPlayerToGang(player, gang, role) {
        manager.gangPlayers_.set(player, gang);
        gang.addPlayer(player, role);
    }

    // Utility function for removing a player from a given gang.
    function removePlayerFromGang(player, gang) {
        manager.gangPlayers_.delete(player);
        gang.removePlayer(player);
    }

    it('should only allow registered players to create a gang', async (assert) => {
        assert.isTrue(await player.issueCommand('/gang create'));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANGS_NOT_REGISTERED);
    });

    it('should not allow players already part of a gang to create a new one', async (assert) => {
        await player.identify();

        addPlayerToGang(player, createGang(), Gang.ROLE_MEMBER);

        assert.isTrue(await player.issueCommand('/gang create'));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANGS_ALREADY_SET);
    });

    it('should not allow players to create a gang that already exists', async(assert) => {
        await player.identify();

        // Three questions will be asked: the name, tag and goal of the gang.
        player.respondToDialog({ inputtext: 'Homely Kitchen Olives' }).then(() =>
            player.respondToDialog({ inputtext: 'HKO' })).then(() =>
            player.respondToDialog({ inputtext: 'Eating Italian food' })).then(() =>
            player.respondToDialog({ response: 0 }));

        assert.isTrue(await player.issueCommand('/gang create'));
        assert.equal(player.messages.length, 0);

        assert.isNull(manager.gangForPlayer(player));
        assert.equal(player.lastDialog, 'The gang is too similar to [HKO] Hello Kitty Online');
    });

    it('should allow players to create a new gang', async(assert) => {
        await player.identify();

        // Three questions will be asked: the name, tag and goal of the gang.
        player.respondToDialog({ inputtext: 'Creative Creatures' }).then(() =>
            player.respondToDialog({ inputtext: 'CC' })).then(() =>
            player.respondToDialog({ inputtext: 'Creating my own gang' }));

        assert.isTrue(await player.issueCommand('/gang create'));
        assert.equal(player.messages.length, 2);

        const gang = manager.gangForPlayer(player);

        assert.isNotNull(gang);
        assert.equal(gang.tag, 'CC');
        assert.equal(gang.name, 'Creative Creatures');
        assert.equal(gang.goal, 'Creating my own gang');

        assert.isTrue(gang.hasPlayer(player));
    });

    it('should not allow invitations when the player is not in a gang', async (assert) => {
        await player.identify();

        assert.isTrue(await player.issueCommand('/gang invite Russell'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANG_NOT_IN_GANG);
    });

    it('should not allow invitations when the player is not a manager or up', async (assert) => {
        await player.identify();

        addPlayerToGang(player, createGang(), Gang.ROLE_MEMBER);

        assert.isTrue(await player.issueCommand('/gang invite Russell'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANG_INVITE_NO_MANAGER);
    });

    it('should not allow invitations to oneself', async (assert) => {
        await player.identify();

        addPlayerToGang(player, createGang(), Gang.ROLE_MANAGER);

        assert.isTrue(await player.issueCommand('/gang invite ' + player.name));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANG_INVITE_SELF);
    });

    it('should not allow invitations to unregistered players', async (assert) => {
        await player.identify();

        addPlayerToGang(player, createGang(), Gang.ROLE_MANAGER);

        assert.isTrue(await player.issueCommand('/gang invite Russell'));
        assert.equal(player.messages.length, 1);
        assert.equal(
            player.messages[0], Message.format(Message.GANG_INVITE_NOT_REGISTERED, 'Russell'));
    });

    it('should not allow invitations to unregistered players', async (assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);
        const gang = createGang();

        await player.identify();
        await russell.identify();

        addPlayerToGang(player, gang, Gang.ROLE_MANAGER);
        addPlayerToGang(russell, gang, Gang.ROLE_MEMBER);

        assert.isTrue(await player.issueCommand('/gang invite Russell'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.format(Message.GANG_INVITE_IS_MEMBER, 'Russell'));
    });

    it('should not allow people to hammer others with invitations', async (assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);

        await player.identify();
        await russell.identify();

        addPlayerToGang(player, createGang(), Gang.ROLE_MANAGER);

        assert.isTrue(await player.issueCommand('/gang invite ' + russell.name));
        assert.equal(player.messages.length, 1);
        assert.equal(
            player.messages[0], Message.format(Message.GANG_DID_INVITE, russell.name, russell.id));

        assert.equal(russell.messages.length, 1);

        player.clearMessages();

        assert.isTrue(await player.issueCommand('/gang invite ' + russell.name));
        assert.equal(player.messages.length, 1);
        assert.equal(
            player.messages[0], Message.format(Message.GANG_INVITE_NO_HAMMER, russell.name));
    });

    it('should not allow players to join a gang uninvited', async (assert) => {
        assert.isTrue(await player.issueCommand('/gang join'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANG_JOIN_NO_INVITATION);
    });

    it('should not allow players who in a gang to accept an invitation', async (assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);
        const russellGang = createGang();

        russell.level = Player.LEVEL_ADMINISTRATOR;

        await player.identify();
        await russell.identify();

        addPlayerToGang(player, createGang(), Gang.ROLE_MANAGER);
        addPlayerToGang(russell, russellGang, Gang.ROLE_MEMBER);

        assert.isTrue(await player.issueCommand('/gang invite Russell'));
        assert.equal(russell.messages.length, 2);
        assert.equal(player.messages.length, 1);
        assert.equal(
            player.messages[0], Message.format(Message.GANG_DID_INVITE, russell.name, russell.id));

        russell.clearMessages();

        assert.isTrue(await russell.issueCommand('/gang join'));
        assert.equal(russell.messages.length, 1);
        assert.equal(
            russell.messages[0], Message.format(Message.GANG_JOIN_IN_GANG, russellGang.name));
    });

    it('should allow registered players not in a gang to accept an invitation', async(assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);
        russell.level = Player.LEVEL_ADMINISTRATOR;

        await player.identify();
        await russell.identify();

        addPlayerToGang(player, createGang(), Gang.ROLE_MANAGER);

        assert.isTrue(await player.issueCommand('/gang invite Russell'));
        assert.isAboveOrEqual(russell.messages.length, 1);
        assert.isAboveOrEqual(player.messages.length, 1);

        russell.clearMessages();

        assert.isTrue(await russell.issueCommand('/gang join'));

        const gang = manager.gangForPlayer(russell);

        assert.isNotNull(gang);
        assert.isTrue(gang.hasPlayer(russell));
        assert.isTrue(gang.hasPlayer(player));

        assert.isAboveOrEqual(russell.messages.length, 1);
        assert.equal(russell.messages[0], Message.format(Message.GANG_DID_JOIN, gang.name));
    });

    it('should not allow people not in a gang to kick people', async (assert) => {
        assert.isTrue(await player.issueCommand('/gang kick nickname'));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANG_NOT_IN_GANG);
    });

    it('should not allow members to kick other members', async (assert) => {
        await player.identify();

        addPlayerToGang(player, createGang(), Gang.ROLE_MEMBER);

        assert.isTrue(await player.issueCommand('/gang kick nickname'));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANG_KICK_NO_MANAGER);
    });

    it('should not allow managers to kick leaders or other managers', async(assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);
        const gang = createGang({ tag: 'HKO' });

        await player.identify();

        addPlayerToGang(russell, gang, Gang.ROLE_MANAGER);
        addPlayerToGang(player, gang, Gang.ROLE_MANAGER);

        assert.isTrue(await player.issueCommand('/gang kick ' + russell.name));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANG_KICK_NOT_ALLOWED);

        assert.isTrue(gang.hasPlayer(russell));
    });

    it('should not allow managers and leaders to kick themselves', async(assert) => {
        const gang = createGang({ tag: 'HKO2' });

        await player.identify();

        addPlayerToGang(player, gang, Gang.ROLE_LEADER);

        assert.isTrue(await player.issueCommand('/gang kick ' + player.name));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANG_KICK_SELF_NOT_ALLOWED);

        assert.isTrue(gang.hasPlayer(player));
    });

    it('should allow managers and leaders to kick people from the gang', async(assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);
        const gang = createGang({ tag: 'HKO2' });

        await player.identify();
        await russell.identify({ userId: 1337 });

        addPlayerToGang(russell, gang, Gang.ROLE_LEADER);
        addPlayerToGang(player, gang, Gang.ROLE_LEADER);

        assert.isTrue(await player.issueCommand('/gang kick ' + russell.name));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0],
                     Message.format(Message.GANG_KICK_REMOVED, russell.name, gang.name));

        assert.isFalse(gang.hasPlayer(russell));
    });

    it('should allow managers to kick online people by id from the gang', async(assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);
        const gang = createGang({ tag: 'HKO2' });

        await player.identify();
        await russell.identify({ userId: 1337 });

        addPlayerToGang(russell, gang, Gang.ROLE_LEADER);
        addPlayerToGang(player, gang, Gang.ROLE_LEADER);

        assert.isTrue(await player.issueCommand('/gang kick ' + russell.id));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0],
                     Message.format(Message.GANG_KICK_REMOVED, russell.name, gang.name));

        assert.isFalse(gang.hasPlayer(russell));
    });

    it('should allow managers and leaders to kick offline people from the gang', async(assert) => {
        const gang = createGang({ tag: 'HKO3' });

        await player.identify();

        addPlayerToGang(player, gang, Gang.ROLE_LEADER);

        assert.isTrue(await player.issueCommand('/gang kick fflineplaye'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0],
                     Message.format(Message.GANG_KICK_REMOVED, 'OfflinePlayer', gang.name));
    });

    it('should not allow players to leave a gang if they aren\'t in one', async (assert) => {
        assert.isTrue(await player.issueCommand('/gang leave'));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANG_NOT_IN_GANG);
    });

    it('should allow players to leave the gang as members', async(assert) => {
        await player.identify();

        addPlayerToGang(player, createGang(), Gang.ROLE_MEMBER);

        const gang = manager.gangForPlayer(player);
        assert.isNotNull(gang);

        player.respondToDialog({ response: 1 /* Yes */ });

        assert.isTrue(await player.issueCommand('/gang leave'));

        assert.isNull(manager.gangForPlayer(player));
        assert.isFalse(gang.hasPlayer(player));
    });

    it('should allow players to abort leaving their gang', async(assert) => {
        await player.identify();

        addPlayerToGang(player, createGang(), Gang.ROLE_MEMBER);

        const gang = manager.gangForPlayer(player);
        assert.isNotNull(gang);

        player.respondToDialog({ response: 0 /* No */ });

        assert.isTrue(await player.issueCommand('/gang leave'));

        assert.strictEqual(manager.gangForPlayer(player), gang);
    });

    it('should allow leaders to leave their gang if they are the only member', async(assert) => {
        await player.identify();

        addPlayerToGang(player, createGang(), Gang.ROLE_LEADER);

        const gang = manager.gangForPlayer(player);
        assert.isNotNull(gang);

        player.respondToDialog({ response: 1 /* Yes */ });

        assert.isTrue(await player.issueCommand('/gang leave'));

        assert.isNull(manager.gangForPlayer(player));
        assert.isFalse(gang.hasPlayer(player));
    });

    it('should allow leaders to leave their gang after confirming succession', async(assert) => {
        await player.identify();

        addPlayerToGang(player, createGang({ tag: 'CC' }), Gang.ROLE_LEADER);

        const gang = manager.gangForPlayer(player);
        assert.isNotNull(gang);

        player.respondToDialog({ response: 1 /* Yes */ });

        assert.isTrue(await player.issueCommand('/gang leave'));

        assert.isTrue(player.lastDialog.includes('MrNextLeader'));
        assert.isTrue(player.lastDialog.includes('Manager'));

        assert.isNull(manager.gangForPlayer(player));
        assert.isFalse(gang.hasPlayer(player));
    });

    it('should allow leaders to cancel leaving their gang', async(assert) => {
        await player.identify();

        addPlayerToGang(player, createGang({ tag: 'CC' }), Gang.ROLE_LEADER);

        const gang = manager.gangForPlayer(player);
        assert.isNotNull(gang);

        player.respondToDialog({ response: 0 /* No */ });

        assert.isTrue(await player.issueCommand('/gang leave'));

        assert.strictEqual(manager.gangForPlayer(player), gang);
    });

    it('should enable players to list the members of their gang', async(assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);
        const gang = createGang({ tag: 'CC' });

        await player.identify();
        await russell.identify({ userId: 1337 });

        addPlayerToGang(player, gang, Gang.ROLE_LEADER);
        addPlayerToGang(russell, gang, Gang.ROLE_MEMBER);

        player.respondToDialog({ response: 0 /* Dismiss */ });

        assert.isTrue(await player.issueCommand('/gang members'));

        assert.equal(player.messages.length, 0);
        assert.deepEqual(player.getLastDialogAsTable(/* hasColumn= */ true).rows, [
            [
                '{FFFF00}Leader',
                '{FFFF00}Gunther',
                'now',
            ],
            [
                'Member',
                '{505078}Harry',
                '14 days ago',
            ],
            [
                'Member',
                'Russell',
                'now',
            ],
            [
                'Member',
                'Sander',
                '{9E9E9E}1 year ago',
            ]
        ]);
    });

    it('should only allow leaders to see and amend the gang settings', async (assert) => {
        assert.isTrue(await player.issueCommand('/gang settings'));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANG_NOT_IN_GANG);

        player.clearMessages();

        addPlayerToGang(player, createGang(), Gang.ROLE_MANAGER);

        player.respondToDialog({ response: 0 /* dismiss */ });
        assert.isTrue(await player.issueCommand('/gang settings'));

        assert.equal(player.messages.length, 0);

        assert.isFalse(player.lastDialog.includes('Gang name'));  // Leader-only option
        assert.isTrue(player.lastDialog.includes('My color'));  // Member option
    });

    it('should enable leaders to change gang balance access settings', async (assert) => {
        assert.isTrue(await player.issueCommand('/gang settings'));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANG_NOT_IN_GANG);

        player.clearMessages();

        const gang = createGang();

        addPlayerToGang(player, gang, Gang.ROLE_LEADER);

        assert.equal(gang.balanceAccess, GangDatabase.kAccessLeaderAndManagers);

        player.respondToDialog({ listitem: 7 /* Gang balance access */ }).then(() =>
            player.respondToDialog({ listitem: 0 /* Leader only */ })).then(() =>
            player.respondToDialog({ response: 0 /* Ok */}));
        
        assert.isTrue(await player.issueCommand('/gang settings'));

        assert.equal(player.messages.length, 0);
        assert.equal(gang.balanceAccess, GangDatabase.kAccessLeader);
    });

    it('should not enable leaders to edit their own settings', async(assert) => {
        await player.identify();

        addPlayerToGang(player, createGang(), Gang.ROLE_LEADER);

        player.respondToDialog({ listitem: 0 /* Gang members */ }).then(() =>
            player.respondToDialog({ listitem: 0 /* The |player| */ })).then(() =>
            player.respondToDialog({ response: 0 /* Ok */}));

        assert.isTrue(await player.issueCommand('/gang settings'));

        assert.equal(player.messages.length, 0);
        assert.equal(player.lastDialog, Message.GANG_SETTINGS_SELF_CHANGE);
    });

    it('should enable leaders to change the role of other members', async(assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);
        const gang = createGang();

        await player.identify();
        await russell.identify({ userId: 1337 });

        addPlayerToGang(player, gang, Gang.ROLE_LEADER);
        addPlayerToGang(russell, gang, Gang.ROLE_MANAGER);

        player.respondToDialog({ listitem: 0 /* Gang members */ }).then(() =>
            player.respondToDialog({ listitem: 1 /* The |russell| */ })).then(() =>
            player.respondToDialog({ listitem: 0 /* Promote to leader */})).then(() =>
            player.respondToDialog({ response: 0 /* Ok */}));

        assert.isTrue(await player.issueCommand('/gang settings'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.lastDialog,
            Message.format(Message.GANG_SETTINGS_ROLE_UPDATED, russell.name, 'leader'));

        assert.equal(gang.getPlayerRole(russell), Gang.ROLE_LEADER);
    });
    it('should enable leaders to kick other members from the gang', async(assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);
        const gang = createGang();

        await player.identify();
        await russell.identify({ userId: 1337 });

        addPlayerToGang(player, gang, Gang.ROLE_LEADER);
        addPlayerToGang(russell, gang, Gang.ROLE_MANAGER);

        player.respondToDialog({ listitem: 0 /* Gang members */ }).then(() =>
            player.respondToDialog({ listitem: 1 /* The |russell| */ })).then(() =>
            player.respondToDialog({ listitem: 2 /* Kick from gang */})).then(() =>
            player.respondToDialog({ response: 0 /* Ok */}));

        assert.isTrue(await player.issueCommand('/gang settings'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.lastDialog,
            Message.format(Message.GANG_SETTINGS_MEMBER_KICKED, russell.name));

        assert.isFalse(gang.hasPlayer(russell));
    });

    it('should enable leaders to change the skin of their gang', async(assert) => {
        const gang = createGang();

        await player.identify();

        addPlayerToGang(player, gang, Gang.ROLE_LEADER);

        assert.equal(gang.skinId, null);

        player.respondToDialog({ listitem: 2 /* Member skin */ }).then(() =>
            player.respondToDialog({ inputtext: '11' })).then(() =>
            player.respondToDialog({ response: 0 /* Ok */}));

        assert.isTrue(await player.issueCommand('/gang settings'));

        assert.deepEqual(gang.skinId, 11);

        assert.equal(player.messages.length, 1);
        assert.equal(player.lastDialog,
            Message.format(Message.GANG_SETTINGS_NEW_SKIN, 11));
    });

    it('should not allow leaders to change the skin into an unavailable skin', async(assert) => {
        const gang = createGang();

        await player.identify();

        addPlayerToGang(player, gang, Gang.ROLE_LEADER);

        assert.equal(gang.skinId, null);

        player.respondToDialog({ listitem: 2 /* Member skin */ }).then(() =>
            player.respondToDialog({ inputtext: '1' })).then(() =>
            player.respondToDialog({ response: 0 /* Ok */}));

        assert.isTrue(await player.issueCommand('/gang settings'));

        assert.deepEqual(gang.skinId, null);
    });

    it('should enable leaders to change the color of their gang', async(assert) => {
        const gang = createGang();

        await player.identify();

        addPlayerToGang(player, gang, Gang.ROLE_LEADER);

        assert.equal(gang.color, null);

        player.respondToDialog({ listitem: 1 /* Member color */ }).then(() =>
            player.respondToDialog({ response: 0 /* Ok */}));

        assert.isTrue(await player.issueCommand('/gang settings'));

        assert.deepEqual(gang.color, Color.fromRGBA(255, 255, 0, 0x80));

        assert.equal(player.messages.length, 1);
        assert.equal(player.lastDialog,
            Message.format(Message.GANG_SETTINGS_NEW_COLOR, '#' + gang.color.toHexRGB()));
    });

    it('should enable managers to purchase gang chat encryption time', async(assert) => {
        const gang = createGang();

        await player.identify({ userId: 1337 });

        addPlayerToGang(player, gang, Gang.ROLE_MANAGER);

        // Give the |player| 25 million dollars to buy the encryption.
        await server.featureManager.loadFeature('finance').depositToPlayerAccount(player, 25000000);

        assert.equal(gang.chatEncryptionExpiry, 0);

        for (let days = 1; days < 3; ++days) {
            player.respondToDialog({ listitem: 0 /* Gang Chat Encryption */ }).then(() =>
                player.respondToDialog({ response: 1, listitem: 1 /* one day */ })).then(() =>
                player.respondToDialog({ response: 1 /* Yeah I got it */}));

            assert.isTrue(await player.issueCommand('/gang settings'));
            assert.equal(player.messages.length, 0);

            // Verify that the |chatEncryptionExpiry| property has been updated with a day.
            assert.closeTo(
                gang.chatEncryptionExpiry, (server.clock.currentTime() / 1000) + 86400 * days, 5);
        }
    });

    it('should do balance checks when purchasing gang chat encryption time', async(assert) => {
        const gang = createGang();

        await player.identify({ userId: 1337 });

        addPlayerToGang(player, gang, Gang.ROLE_MANAGER);

        // Make sure that the |player| does not have sufficient money available.
        await server.featureManager.loadFeature('finance').depositToPlayerAccount(player, 12500);

        assert.equal(gang.chatEncryptionExpiry, 0);

        player.respondToDialog({ listitem: 0 /* Gang Chat Encryption */ }).then(() =>
            player.respondToDialog({ response: 1, listitem: 1 /* one day */ })).then(() =>
            player.respondToDialog({ response: 1 /* Yeah I got it */}));

        assert.isTrue(await player.issueCommand('/gang settings'));
        assert.equal(player.messages.length, 0);

        assert.equal(gang.chatEncryptionExpiry, 0);
        assert.equal(
            player.lastDialog, Message.format(Message.GANG_SETTINGS_ENC_TIME_MONEY, 1500000, 12500))
    });

    it('should not enable leaders to change the name to an existing one', async(assert) => {
        const gang = createGang({ name: 'Candy Crush' });

        await player.identify();

        addPlayerToGang(player, gang, Gang.ROLE_LEADER);

        assert.equal(gang.name, 'Candy Crush');

        player.respondToDialog({ listitem: 4 /* Gang name */ }).then(() =>
            player.respondToDialog({ inputtext: 'Hello Kitty Online' })).then(() =>
            player.respondToDialog({ response: 0 /* Ok */}));

        assert.isTrue(await player.issueCommand('/gang settings'));
        assert.equal(player.messages.length, 0);

        assert.equal(player.lastDialog, Message.GANG_SETTINGS_NAME_TAKEN);

        assert.equal(gang.name, 'Candy Crush');
    });

    it('should enable leaders to change the name of their gang', async(assert) => {
        const gang = createGang({ name: 'Candy Crush' });

        await player.identify();

        addPlayerToGang(player, gang, Gang.ROLE_LEADER);

        assert.equal(gang.name, 'Candy Crush');

        player.respondToDialog({ listitem: 4 /* Gang name */ }).then(() =>
            player.respondToDialog({ inputtext: 'Thundering Offline Kittens' })).then(() =>
            player.respondToDialog({ response: 0 /* Ok */}));

        assert.isTrue(await player.issueCommand('/gang settings'));
        assert.equal(player.messages.length, 1);

        assert.equal(player.lastDialog,
            Message.format(Message.GANG_SETTINGS_NEW_NAME, 'Thundering Offline Kittens'));

        assert.equal(gang.name, 'Thundering Offline Kittens');
    });

    it('should not enable leaders to change the tag to an existing one', async(assert) => {
        const gang = createGang({ tag: 'CC' });

        await player.identify();

        addPlayerToGang(player, gang, Gang.ROLE_LEADER);

        assert.equal(gang.tag, 'CC');

        player.respondToDialog({ listitem: 5 /* Gang tag */ }).then(() =>
            player.respondToDialog({ inputtext: 'HKO' })).then(() =>
            player.respondToDialog({ response: 0 /* Ok */}));

        assert.isTrue(await player.issueCommand('/gang settings'));
        assert.equal(player.messages.length, 0);

        assert.equal(player.lastDialog, Message.GANG_SETTINGS_TAG_TAKEN);

        assert.equal(gang.tag, 'CC');
    });

    it('should not enable leaders to change the tag to an invalid one', async(assert) => {
        const gang = createGang({ tag: 'CC' });

        await player.identify();

        addPlayerToGang(player, gang, Gang.ROLE_LEADER);

        assert.equal(gang.tag, 'CC');

        // Duplicated from gang_commands.js
        const errorMessage = 'The tag of your gang must be between 1 and 5 characters long ' +
            '(without the brackets) and be a valid username.';

        // List of tags that should not be accepted by the filter.
        const invalidTags = [
            'GEORGETESTEDTHIS',
            '$',
        ];

        for (const tag of invalidTags) {
            player.respondToDialog({ listitem: 5 /* Gang tag */ }).then(() =>
                player.respondToDialog({ inputtext: tag })).then(() =>
                player.respondToDialog({ response: 0 /* Ok */}));

            assert.isTrue(await player.issueCommand('/gang settings'));
            assert.equal(player.messages.length, 0);

            assert.equal(player.lastDialog, errorMessage);
            assert.equal(gang.tag, 'CC');
        }
    });

    it('should enable leaders to change the tag of their gang', async(assert) => {
        const gang = createGang({ tag: 'CC' });

        await player.identify();

        addPlayerToGang(player, gang, Gang.ROLE_LEADER);

        assert.equal(gang.tag, 'CC');

        player.respondToDialog({ listitem: 5 /* Gang tag */ }).then(() =>
            player.respondToDialog({ inputtext: 'GG' })).then(() =>
            player.respondToDialog({ response: 0 /* Ok */}));

        assert.isTrue(await player.issueCommand('/gang settings'));
        assert.equal(player.messages.length, 1);

        assert.equal(player.lastDialog, Message.format(Message.GANG_SETTINGS_NEW_TAG, 'GG'));

        assert.equal(gang.tag, 'GG');
    });

    it('should enable leaders to change the goal of their gang', async(assert) => {
        const gang = createGang({ tag: 'CC', goal: 'We rule!' });

        await player.identify();

        addPlayerToGang(player, gang, Gang.ROLE_LEADER);

        assert.equal(gang.goal, 'We rule!');

        player.respondToDialog({ listitem: 6 /* Gang goal */ }).then(() =>
            player.respondToDialog({ inputtext: 'We rule more!' })).then(() =>
            player.respondToDialog({ response: 0 /* Ok */}));

        assert.isTrue(await player.issueCommand('/gang settings'));
        assert.equal(player.messages.length, 1);

        assert.equal(player.lastDialog,
                     Message.format(Message.GANG_SETTINGS_NEW_GOAL, 'We rule more!'));

        assert.equal(gang.goal, 'We rule more!');
    });

    it('should enable members to choose whether to use the gang color', async(assert) => {
        const gang = createGang({ tag: 'CC', goal: 'We rule!' });

        await player.identify();

        addPlayerToGang(player, gang, Gang.ROLE_MEMBER);

        assert.isTrue(gang.usesGangColor(player));

        player.respondToDialog({ listitem: 0 /* Gang goal */ }).then(() =>
            player.respondToDialog({ listitem: 1 /* use personal color */ })).then(() =>
            player.respondToDialog({ response: 0 /* Ok */}));

        assert.isTrue(await player.issueCommand('/gang settings'));
        assert.equal(player.messages.length, 0);

        assert.isFalse(gang.usesGangColor(player));
    });
    
        it('should enable members to choose whether to use the gang skin', async(assert) => {
            const gang = createGang({ tag: 'EZ', goal: 'Be the easiest to kill.' });
    
            player.identify();
    
            addPlayerToGang(player, gang, Gang.ROLE_MEMBER);
    
            assert.isTrue(gang.usesGangSkin(player));
    
            player.respondToDialog({ listitem: 1 /* Gang skin */ }).then(() =>
                player.respondToDialog({ listitem: 1 /* use personal skin */ })).then(() =>
                player.respondToDialog({ response: 0 /* Ok */}));
    
            assert.isTrue(await player.issueCommand('/gang settings'));
            assert.equal(player.messages.length, 0);
    
            assert.isFalse(gang.usesGangSkin(player));
        });

    it('should be able to display information about the gang command', async (assert) => {
        assert.isTrue(await player.issueCommand('/gang'));
        assert.isAboveOrEqual(player.messages.length, 1);
    });

    it('should error out when getting gang information about a gangless player', async (assert) => {
        assert.isTrue(await player.issueCommand('/gangs ' + player.name));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0],
                     Message.format(Message.GANGS_INFO_PLAYER_NONE, player.name, player.id));
    });

    it('should share gang information when a player is in a gang', async (assert) => {
        const gang = createGang({ tag: 'CC', name: 'Creative Cows', goal: 'We rule!' });

        addPlayerToGang(player, gang, Gang.ROLE_MANAGER);

        assert.isTrue(await player.issueCommand('/gangs ' + player.name));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0],
                     Message.format(Message.GANGS_INFO_PLAYER, player.name, player.id, 'Manager',
                                    gang.name));
    });

    it('should be able to list the local gangs on the server', async (assert) => {
        assert.isTrue(await player.issueCommand('/gangs'));

        assert.equal(player.messages.length, 2);
        assert.equal(player.messages[1], Message.GANGS_NONE_ONLINE);

        player.clearMessages();

        const gangColor = Color.fromRGB(255, 13, 255);
        createGang({ color: gangColor });

        assert.equal(manager.gangs.length, 1);

        assert.isTrue(await player.issueCommand('/gangs'));

        assert.equal(player.messages.length, 2);
        assert.isTrue(player.messages[1].includes(gangColor.toHexRGB()));
        assert.isTrue(player.messages[1].includes('HKO'));
        assert.isTrue(player.messages[1].includes('Hello Kitty Online'));
    });

    it('should be possible for players to interact with their gang bank account', async(assert) => {
        const finance = server.featureManager.loadFeature('finance');
        const gang = createGang({ tag: 'CC', name: 'Creative Cows', goal: 'We rule!' });
        const russell = server.playerManager.getById(/* Russell= */ 1);

        addPlayerToGang(russell, gang, Gang.ROLE_LEADER);

        finance.givePlayerCash(player, 1000000);

        assert.equal(gang.balance, 0);

        // (1) Players need to be in a gang in order to deposit money.
        assert.isTrue(await player.issueCommand('/gbank all'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.format(Message.GBANK_NOT_IN_GANG));

        assert.equal(finance.getPlayerCash(player), 1000000);

        // (2) Players need to be in a gang in order to withdraw money.
        assert.isTrue(await player.issueCommand('/gwithdraw 2500'));
        assert.equal(player.messages.length, 2);
        assert.equal(player.messages[1], Message.format(Message.GBANK_NOT_IN_GANG));

        // (3) Players need to be in a gang in order to see the current balance.
        assert.isTrue(await player.issueCommand('/gbalance'));
        assert.equal(player.messages.length, 3);
        assert.equal(player.messages[2], Message.format(Message.GBANK_NOT_IN_GANG));

        addPlayerToGang(player, gang, Gang.ROLE_MANAGER);

        // (4) When in a gang, they can see the gang's current balance.
        assert.isTrue(await player.issueCommand('/gbalance'));
        assert.equal(player.messages.length, 4);
        assert.equal(
            player.messages[3],
            Message.format(Message.GBANK_BALANCE, gang.name, gang.balance,
                           GangFinance.kMaximumBankAmount));

        // (5) Players can deposit money into the bank account.
        assert.isTrue(await player.issueCommand('/gbank 2500000'));
        assert.equal(player.messages.length, 5);
        assert.equal(
            player.messages[4], Message.format(Message.GBANK_NOT_ENOUGH_CASH, 2500000));

        assert.isTrue(await player.issueCommand('/gbank 250000'));
        assert.equal(player.messages.length, 6);
        assert.equal(
            player.messages[5],
            Message.format(Message.GBANK_STORED, 250000, gang.name, gang.balance));

        assert.equal(finance.getPlayerCash(player), 750000);
        assert.equal(gang.balance, 250000);

        assert.equal(russell.messages.length, 1);
        assert.includes(
            russell.messages[0],
            Message.format(Message.GBANK_ANNOUNCE_DEPOSIT, player.name, player.id, 250000));

        // (6) Players cannot deposit more money than gang bank accounts allow.
        gang.balance = GangFinance.kMaximumBankAmount;

        assert.isTrue(await player.issueCommand('/gbank 10'));
        assert.equal(player.messages.length, 7);
        assert.equal(
            player.messages[6],
            Message.format(Message.GBANK_NO_AVAILABLE_BALANCE, GangFinance.kMaximumBankAmount));

        assert.equal(finance.getPlayerCash(player), 750000);
        assert.equal(gang.balance, GangFinance.kMaximumBankAmount);

        gang.balance = 250000;  // reset their account to something reasonable
        gang.balanceAccess = GangDatabase.kAccessLeader;

        // (7) Gang members can be restricted from withdrawing money.
        assert.isTrue(await player.issueCommand('/gwithdraw 2500'));
        assert.equal(player.messages.length, 8);
        assert.equal(player.messages[7], Message.format(Message.GBANK_NOT_ALLOWED));

        gang.balanceAccess = GangDatabase.kAccessLeaderAndManagers;

        // (8) When allowed, gang members are able to withdraw money from the account.
        assert.isTrue(await player.issueCommand('/gwithdraw 2500000'));
        assert.equal(player.messages.length, 9);
        assert.equal(
            player.messages[8], Message.format(Message.GBANK_NOT_ENOUGH_FUNDS, gang.name, 2500000));
        
        assert.isTrue(await player.issueCommand('/gwithdraw 100000'));
        assert.equal(player.messages.length, 10);
        assert.equal(
            player.messages[9],
            Message.format(Message.GBANK_WITHDRAWN, 100000, gang.name, gang.balance));
        
        assert.equal(finance.getPlayerCash(player), 850000);
        assert.equal(gang.balance, 150000);

        assert.equal(russell.messages.length, 2);
        assert.includes(
            russell.messages[1],
            Message.format(Message.GBANK_ANNOUNCE_WITHDRAWAL, player.name, player.id, 100000));
    });

    it('should enable gang members to see their account transaction logs', async (assert) => {
        const gang = createGang({ tag: 'CC', name: 'Creative Cows', goal: 'We rule!' });

        addPlayerToGang(player, gang, Gang.ROLE_MEMBER);

        player.respondToDialog({ response: 0 /* Ok */});

        assert.isTrue(await player.issueCommand('/gang transactions'));
        
        const data = await player.getLastDialogAsTable(/* hasColumn= */ true);
        assert.deepEqual(data.rows, [
            [
                'May 24, 2020',
                'LVP',
                '{F4511E}-$215,000',
                'Daily maintenance fee',
            ],
            [
                'May 23, 2020',
                'Russell',
                '{F4511E}-$1,000,000',
                'Personal withdrawal',
            ],
            [
                'May 21, 2020',
                'Russell',
                '{43A047}$25,000,000',
                'Personal contribution',
            ]
        ]);
    });
});
