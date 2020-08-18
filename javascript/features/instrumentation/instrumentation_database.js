// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Query to record five commands into the database. If performance impact is deemed too high, we can
// group together multiple commands into a single query, which might cause a bit of data loss.
const kRecordCommandsQuery = `
    INSERT INTO
        instrumentation_commands
        (instrumentation_user_id, command_name, command_result)
    VALUES
        (?, ?, ?)`;

// Provides the ability to persist instrumentation data in the database. Data is associated with a
// user id when known, but this will not generally be exposed on dashboards unless required.
export class InstrumentationDatabase {
    // Records that the |player| has executed the |commandName|. May be buffered to avoid running a
    // MySQL query every time a command is executed, which would inflate query volume.
    async recordCommand(player, commandName, commandSuccess) {
        const userId = player.account.isIdentified() ? player.account.userId
                                                     : /* unregistered= */ 0;

        return server.database.query(kRecordCommandsQuery, userId, commandName, commandSuccess);
    }
}
