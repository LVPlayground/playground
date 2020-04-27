// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// MySQL query to execute when adding an entry to the database.
const ADD_ENTRY_QUERY = `
    INSERT INTO
        logs
        (log_date, log_type, ban_ip_range_start, ban_ip_range_end, gpci_hash,
         ban_expiration_date,
         user_nickname, user_id, source_nickname, source_user_id, description)
    VALUES
        (NOW(), ?, ?, ?, ?,
         IF(? = 0, '1970-01-01 01:00:00', DATE_ADD(NOW(), INTERVAL ? DAY)),
         ?, ?, ?, ?, ?)`;

// Responsible for actually executing ban-related operations on the MySQL database.
export class BanDatabase {
    // Corresponds to the `log_type` column in the database.
    static kTypeBan = 'ban';
    static kTypeBanIp = 'banip';
    static kTypeKick = 'kick';
    static kTypeNote = 'note';
    static kTypeUnban = 'unban';
    
    // Adds an entry to the user log table. The |type|, |sourceNickname|, |subjectNickname| and
    // |note| fields are required. When known, the |sourceUserId| and |subjectUserId| fields are
    // accepted for all types as well. Type specific fields are as follows:
    //
    // ** kTypeNote
    //    No additional parameters have to be given.
    //
    // Returns whether the log entry that has been written to the database, as a boolean.
    async addEntry({ type, sourceUserId = null, sourceNickname,
                     subjectUserId = null, subjectNickname, note } = {}) {
        switch (type) {
            case BanDatabase.kTypeKick:
            case BanDatabase.kTypeNote:
                return this.addEntryInternal({
                    type,
                    banIpRangeStart: 0,
                    banIpRangeEnd: 0,
                    banSerial: 0,
                    banDurationDays: 0,
                    sourceUserId: sourceUserId ?? 0,
                    sourceNickname,
                    subjectUserId: subjectUserId ?? 0,
                    subjectNickname,
                    note
                });
            
            default:
                throw new Error(`Support for the given ${type} has not been implemented yet.`);
        }
    }

    // Internal, low-level routine for adding a log entry to the database. All fields are required
    // for this call, in order to be explicit about _what_ is being added to the logs.
    //
    // In order to validate consistency of the data, this method does low-level validation to ensure
    // that mutually exclude fields are not both set, and bans are not written for non-ban types.
    async addEntryInternal({ type, banIpRangeStart, banIpRangeEnd, banSerial, banDurationDays,
                             sourceUserId, sourceNickname, subjectUserId, subjectNickname, note }) {
        if (![BanDatabase.kTypeBan, BanDatabase.kTypeBanIp].includes(type)) {
            if (banIpRangeStart !== 0 || banIpRangeEnd !== 0)
                throw new Error('Cannot add IP bans for types other than "ban" and "banip".');
            
            if (banSerial !== 0)
                throw new Error('Cannot add serial bans for types other than "ban" and "banip".');
            
            if (banDurationDays !== 0)
                throw new Error('Cannot set a ban expiration date on non-ban types.');

        } else {
            if (banIpRangeEnd < banIpRangeStart)
                throw new Error('Cannot ban IP ranges that end before they start.');
        }

        if (!sourceNickname.length)
            throw new Error('The nickname who is responsible for this log item must be known.');
        
        if (!subjectNickname.length)
            throw new Error('The nickname whom this log item is for must be known.');
        
        if (!note.length)
            throw new Error('The note to add to the log item must be known.');

        if (note.length > 128)
            throw new Error('The length of a note cannot exceed 128 characters.');

        return this._addEntryQuery(
            { type, banIpRangeStart, banIpRangeEnd, banSerial, banDurationDays, sourceUserId,
              sourceNickname, subjectUserId, subjectNickname, note });
    }

    // Actually executes a MySQL query for adding a log item to the database. All fields must have
    // been validated by this point. Returns whether the entry could be written to the database.
    async _addEntryQuery({ type, banIpRangeStart, banIpRangeEnd, banSerial, banDurationDays,
                           sourceUserId, sourceNickname, subjectUserId, subjectNickname, note }) {
        const result = await server.database.query(
            ADD_ENTRY_QUERY, type, banIpRangeStart, banIpRangeEnd, banSerial, banDurationDays,
            banDurationDays, sourceNickname, sourceUserId, subjectNickname, subjectUserId, note);

        return result && result.insertId !== 0;
    }
}
