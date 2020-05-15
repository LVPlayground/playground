// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MessageFilter } from 'features/communication/message_filter.js';

describe('MessageFilter', (it, beforeEach) => {
    let filter = null;
    let gunther = null;

    beforeEach(() => {
        filter = new MessageFilter();
        gunther = server.playerManager.getById(/* Gunther= */ 0);
    });

    it('should be able to remove excess capitals from a message', assert => {
        assert.equal(filter.filter(gunther, 'WHAT?!!!?!!'), 'What?!'),
        assert.equal(filter.filter(gunther, 'HELLO WORLD'), 'Hello world.');
        assert.equal(filter.filter(gunther, '123456789'), '123456789');
    });

    it('should be able to maintain a list of replacements', async (assert) => {
        assert.equal(Array.from(filter.replacements).length, 2);
        assert.equal(filter.filter(gunther, 'George'), 'Geroge'),

        await filter.addReplacement(gunther, 'Lucy', 'Luce');
        assert.equal(Array.from(filter.replacements).length, 3);
        assert.equal(filter.filter(gunther, 'hey lucy!'), 'hey luce!');

        await filter.removeReplacement('george');
        assert.equal(Array.from(filter.replacements).length, 2);
        assert.equal(filter.filter(gunther, 'George'), 'George');
    });

    it('should be able to maintain a list of blocked words', async (assert) => {
        assert.equal(filter.filter(gunther, 'Hey Luce!'), 'Hey Luce!');

        await filter.addReplacement(gunther, 'Luce');
        assert.isNull(filter.filter(gunther, 'Hey Luce!'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.COMMUNICATION_FILTER_BLOCKED));

        await filter.removeReplacement('Luce');
        assert.equal(filter.filter(gunther, 'Hey Luce!'), 'Hey Luce!');
    });

    it('should be able to completely recapitalize a sentence', assert => {
        // (1) Remove excess exclamation and question marks
        assert.equal(filter.recapitalize('HUH??!!'), 'Huh?!');
        assert.equal(filter.recapitalize('HUH?!??!?!?!!!!'), 'Huh?!');

        // (2) Recapitalize regular sentences
        assert.equal(filter.recapitalize('WHAT IS HAPPENING?'), 'What is happening?');
        assert.equal(filter.recapitalize('WHAT. IS! HAPPENING? NOW'), 'What. Is! Happening? Now.');

        // (3) Allow for some frequent initialisms.
        assert.equal(filter.recapitalize('HEYY WTF FYI GG GGM8.......'), 'Heyy WTF FYI GG ggm8...');
        
        assert.isNotNull(server.playerManager.getByName('Gunther'));
        assert.isNotNull(server.playerManager.getByName('Russell'));
        assert.isNotNull(server.playerManager.getByName('Lucy'));

        // (4) Fix player capitalization.
        assert.equal(filter.recapitalize('WTF IS A GUNTHER?!`!!'), 'WTF is a Gunther?!');
        assert.equal(filter.recapitalize('GUNTHER RUSSELL LUCYYY'), 'Gunther Russell Lucyyy.');

        // (5) Finish sentence with proper punctuation.
        assert.equal(filter.recapitalize('why am i doing that'), 'Why am I doing that?');
        assert.equal(filter.recapitalize('Hum... what is that'), 'Hum... what is that?');
        assert.equal(filter.recapitalize('i dont get it'), 'I dont get it.');
    });

    it('should be able to apply a replacement while maintaining case', assert => {
        const replacement = {
            before: 'George',
            after: 'Geroge',
            expression: /(George)/gi,
        };

        assert.equal(filter.applyReplacement('George', replacement), 'Geroge');
        assert.equal(filter.applyReplacement('GEORGE', replacement), 'GEROGE');
        assert.equal(filter.applyReplacement('gEoRgE', replacement), 'gErOgE');

        assert.equal(filter.applyReplacement('George George', replacement), 'Geroge Geroge');
        assert.equal(filter.applyReplacement('GEORGE george', replacement), 'GEROGE geroge');
        assert.equal(filter.applyReplacement('a GeOrge b', replacement), 'a GeRoge b');

        const shorter = {
            before: 'Cake',
            after: 'Pie',
            expression: /(Cake)/gi,
        }

        assert.equal(filter.applyReplacement('Cake', shorter), 'Pie');
        assert.equal(filter.applyReplacement('CaKe', shorter), 'PiE');
        assert.equal(filter.applyReplacement('CAKE', shorter), 'PIE');
        assert.equal(filter.applyReplacement('cake', shorter), 'pie');

        const longer = {
            before: 'Pie',
            after: 'Cake',
            expression: /(Pie)/gi,
        }

        assert.equal(filter.applyReplacement('Pie', longer), 'Cake');
        assert.equal(filter.applyReplacement('PiE', longer), 'CaKe');
        assert.equal(filter.applyReplacement('PIE', longer), 'CAKe');
        assert.equal(filter.applyReplacement('pie', longer), 'cake');
    });
});
