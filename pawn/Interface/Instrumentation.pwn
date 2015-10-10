// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * What kind of data is being instrumented? Each individual type should have an entry in this enum.
 * It is expected the list to get rather big over time.
 *
 * APPEND NEW ENTRIES TO THE BOTTOM OF THIS LIST. The instrumentation types in the database will not
 * change when you change a value, so that could cause a lot of bugus data to be collected.
 */
enum InstrumentationType {
    PlayerConnectActivity = 1,              // When a player connects to the server.
    PlayerDisconnectActivity = 2,           // When a player disconnects from the server.
    PlayerLoginActivity = 3,                // When a player logs in to their account.
    FightClubInviteActivity = 4,            // When a player invites someone to a fight.
    FightClubAcceptActivity = 5,            // When a player accepted a fightclub invite.
    FightClubDenyActivity = 6,              // When a player denies a fightclub invite.
    FightClubWatchActivity = 7,             // When a player watches another fightclub.
    // [REMOVED] VehicleImportActivity = 8,
    VehicleExportActivity = 9,              // When a player exports a vehicle (data0: model id).
    ReactionTestCalculateActivity = 10,     // When a player answers a reaction test calculation.
    ReactionTestRepeatActivity = 11,        // When a player repeats a reaction test text.
    SpawnInfernusActivity = 12,             // When a player spawns an infernus through /inf.
    VehicleArmedWithBombActivity = 13,      // When a player arms a vehicle with a bomb.
    VehicleDetonateBombActivity = 14,       // When a vehicle armed with a bomb detonates.
    PropertyPayoutActivity = 15,            // When a player receives payout from a property.
    PropertyBoughtActivity = 16,            // When a player bought a new property.
    PropertySoldActivity = 17,              // When a player sold a property they previously owned.
    PropertiesRestoredActivity = 18,        // When a player's properties are restored on connect.
    PlayerStateRestoredActivity = 19,       // When a player's state gets restored upon connection.
    PlayerLoginAsGuestActivity = 20,        // When a player decides to log in as a guest.
    PlayerLoginAsModeratorActivity = 21,    // When a moderator logs in to their account under another name.
    GangCreatedActivity = 22,               // When a player creates a new gang.
    GangJoinedActivity = 23,                // When a player joins an existing gang.
    GangMessageActivity = 24,               // When a player sends a message to the gang.
    BankWithdrawActivity = 25,              // When a player withdraws money from their account.
    BankDepositActivity = 26,               // When a player deposits money into their account.
    GangCreatedPersistentActivity = 27,     // When a persistent gang has been loaded from the database.
    GangJoinedPersistentActivity = 28,      // When a player has joined a persistent gang.
    PlayerVipLoginActivity = 29,            // When a very important player logs in to their account.
    IgnorePlayerActivity = 30,              // When a player decides to ignore another player.
    CreatedVehicleActivity = 31,            // When an administrator creates a vehicle with /v create.
    DestroyedVehicleActivity = 32           // When an administrator destroyes a vehicle with /v destroy.
};

/**
 * In order to gather statistics about uses of certain features in Las Venturas Playground, we have
 * the ability to instrument them and store the data in the database. We do prefer gathered data
 * from instrumentation to stay anonymous, so avoid including any player-identifyable information.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class Instrumentation {
    // How big should the instrumentation queue be? We push instrumentation data to the database
    // when the queue is completely filled, so instrumentation times may be delayed when the queue
    // is too big. When the queue is too small, we could end up flooding the database with queries.
    const InstrumentationQueueSize = 20;

    // How many bytes do we expect a single instrumentation entry to be when writing it to the
    // database? Err a bit on the generous side to avoid any buffer overflows.
    const InstrumentationEntrySize = 32;

    // The current instrumentation queue. It contains the type of gathered data, a timestamp of when
    // it was queued, and the two (optional) data variables which were passed.
    new m_instrumentationQueue[InstrumentationQueueSize][4];

    // Current position in the instrumentation queue.
    new m_currentQueuePosition;

    // Buffer in which we'll write the instrumentation process query which will be offered to the
    // database. Because instrumentation may occur at any time, this needs to be optimized. A good
    // size estimation would be 86 (base query) + [entry size] * [queue size].
    new m_queryBuffer[825];

    /**
     * Records a certain activity in the gamemode and appends it to the instrumentation queue. If
     * desired, it is possible to give up to two additional (numeric) data variables as well. They
     * must be integers, and should not include any player identifyable information.
     *
     * @param activity Type of activity which is being instrumented.
     * @param data0 First additional piece of information which should be stored. Defaults to 0.
     * @param data1 Second additional piece of information which should be stored. Defaults to 0.
     */
    public recordActivity(InstrumentationType: activity, data0 = 0, data1 = 0) {
        m_instrumentationQueue[m_currentQueuePosition][0] = _: activity;
        m_instrumentationQueue[m_currentQueuePosition][1] = gettime();
        m_instrumentationQueue[m_currentQueuePosition][2] = data0;
        m_instrumentationQueue[m_currentQueuePosition][3] = data1;

        if (++m_currentQueuePosition >= InstrumentationQueueSize)
            this->processAndPurgeInstrumentationQueue();
    }

    /**
     * Writes the entire instrumentation queue to the database and then empties the queue so it can
     * be re-used by new activity recordings. May only be called from this class.
     */
    private processAndPurgeInstrumentationQueue() {
        m_queryBuffer = "INSERT INTO instrumentation (record_type, record_time, data0, data1) VALUES ";

        new entryBuffer[InstrumentationEntrySize];
        for (new index = 0; index < InstrumentationQueueSize; ++index) {
            format(entryBuffer, sizeof(entryBuffer), "(%d,%d,%d,%d),", m_instrumentationQueue[index][0],
                m_instrumentationQueue[index][1], m_instrumentationQueue[index][2], m_instrumentationQueue[index][3]);
            strcat(m_queryBuffer, entryBuffer, sizeof(m_queryBuffer));
        }

        m_queryBuffer[strlen(m_queryBuffer) - 1] = ';';
        Database->query(m_queryBuffer, "");

        m_currentQueuePosition = 0;
    }
};
