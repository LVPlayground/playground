// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const AdministratorChannels = require('features/communication/administrator_channels.js');

// NEW CHANNELS MUST ALWAYS BE ADDED TO THE BOTTOM OF THIS ARRAY. THEY WILL BE SORTED AUTOMATICALLY.
exports = [
    { value: 'houses/change_name', description: 'Changes to house names', verbosity: AdministratorChannels.VERBOSITY_HIGH },
    { value: 'houses/change_welcome', description: 'Changes to house welcome messages', verbosity: AdministratorChannels.VERBOSITY_HIGH },
    { value: 'houses/change_color', description: 'Changes to house entrance colors', verbosity: AdministratorChannels.VERBOSITY_HIGH },
    { value: 'houses/change_spawn', description: 'Changes to house spawn settings', verbosity: AdministratorChannels.VERBOSITY_HIGH }
];
