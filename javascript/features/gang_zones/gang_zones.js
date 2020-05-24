// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';
import { MockZoneDatabase } from 'features/gang_zones/test/mock_zone_database.js';
import { ZoneCalculator } from 'features/gang_zones/zone_calculator.js';
import { ZoneCommands } from 'features/gang_zones/zone_commands.js';
import { ZoneDataAggregator } from 'features/gang_zones/zone_data_aggregator.js';
import { ZoneDatabase } from 'features/gang_zones/zone_database.js';
import { ZoneManager } from 'features/gang_zones/zone_manager.js';

// The gang zones feature users information about the in-game gangs, their members, behaviour and
// activity of their members, as well as their houses, to dynamically create gang zones on the map.
export default class GangZones extends Feature {
    calculator_ = null;
    commands_ = null;
    dataAggregator_ = null;
    manager_ = null;

    constructor() {
        super();

        // The zone database which handles all our own interactions with the database.
        const database = server.isTest() ? new MockZoneDatabase()
                                         : new ZoneDatabase();

        // Depend on the announcement feature to tell admins about purchases and changes.
        const announce = this.defineDependency('announce');

        // The GangZones feature depends on gangs because, well, we work for gangs.
        const gangs = this.defineDependency('gangs');

        // The GangZones feature depends on houses, as they influence the zone dominance algorithm.
        const houses = this.defineDependency('houses');

        // The Playground feature is able to restrict access to the "/zone" command.
        const playground = this.defineDependency('playground');

        // Various behaviour related to gang zones is configurable through settings.
        const settings = this.defineDependency('settings');

        // The ZoneManager is responsible for actually creating and destroying the zones on the map,
        // and keepnig track of which players are in them.
        this.manager_ = new ZoneManager();

        // Responsible for taking knowledge from the ZoneDataAggregator and using it to determine
        // which and how large the to-be-created gang zones should be.
        this.calculator_ = new ZoneCalculator(this.manager_, settings);

        // Responsible for aggregating all member and house data of gangs and their members, to
        // pass to the ZoneCalculator for determining applicability of a zone, and at which size.
        this.dataAggregator_ = new ZoneDataAggregator(database, gangs, houses, this.calculator_);

        // Implements the commands that are exposed to players in order to manage gang zones.
        this.commands_ = new ZoneCommands(this.manager_, announce, gangs, playground);

        // Begin initializing the data aggregator, which will build our initial state.
        this.dataAggregator_.initialize();
    }

    dispose() {
        this.dataAggregator_.dispose();
        this.dataAggregator_ = null;

        this.commands_.dispose();
        this.commands_ = null;

        this.calculator_.dispose();
        this.calculator_ = null;

        this.manager_.dispose();
        this.manager_ = null;
    }
}
