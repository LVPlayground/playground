// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import AdministratorChannels from 'features/communication/administrator_channels.js';

describe('AdministratorChannels', it => {
    it('should store categories and channels in alphabetized order', assert => {
        const administratorChannels = new AdministratorChannels();
        assert.isAbove(administratorChannels.count, 0);

        let previousCategory = '00000';
        for (const [category, channels] of administratorChannels.categories) {
            assert.isAbove(category.localeCompare(previousCategory), 0);
            previousCategory = category;
        }

        let previousChannel = '00000';
        for (const channel of administratorChannels.getChannels('houses')) {
            assert.isAbove(channel.localeCompare(previousChannel), 0);
            previousChannel = channel;
        }
    });

    it('should be able to quickly return the verbosity of a channel', assert => {
        const administratorChannels = new AdministratorChannels();
        assert.isAbove(administratorChannels.count, 0);

        assert.equal(administratorChannels.getVerbosity('houses/change_name'),
                     AdministratorChannels.VERBOSITY_HIGH);

        // Invalid channels will *always* be displayed to administrators.
        assert.equal(administratorChannels.getVerbosity('random/invalid_channel'),
                     AdministratorChannels.VERBOSITY_ALL);
    });
});
