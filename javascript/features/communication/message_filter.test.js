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

    });

    it('should be able to completely recapitalize a sentence', assert => {
        // (1) Remove excess exclamation and question marks
        assert.equal(filter.recapitalize('HUH??!!'), 'Huh?!');
        assert.equal(filter.recapitalize('HUH?!??!?!?!!!!'), 'Huh?!');

        // (2) Recapitalize regular sentences
        assert.equal(filter.recapitalize('WHAT IS HAPPENING?'), 'What is happening?');
        assert.equal(filter.recapitalize('WHAT. IS! HAPPENING? NOW'), 'What. Is! Happening? Now');

        // (3) Allow for some frequent initialisms.
        assert.equal(filter.recapitalize('HEYY WTF FYI GG GGM8.......'), 'Heyy WTF FYI GG ggm8...');
        
        assert.isNotNull(server.playerManager.getByName('Gunther'));
        assert.isNotNull(server.playerManager.getByName('Russell'));
        assert.isNotNull(server.playerManager.getByName('Lucy'));

        // (4) Fix player capitalization.
        assert.equal(filter.recapitalize('WTF IS A GUNTHER?!`!!'), 'WTF is a Gunther?!');
        assert.equal(filter.recapitalize('GUNTHER RUSSELL LUCYYY'), 'Gunther Russell Lucyyy');
    });
});
