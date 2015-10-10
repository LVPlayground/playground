// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * 
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class DatabaseResult <resultId (1)> {
    /**
     *
     */
    public inline affectedRows() {
        return (mysql_affected_rows(resultId));
    }

    /**
     *
     */
    public inline insertId() {
        return (mysql_insert_id(resultId));
    }

    /**
     *
     */
    public inline free() {
        return (mysql_free_result(resultId));
    }

    /**
     *
     */
    public inline count() {
        return (mysql_num_rows(resultId));
    }

    /**
     *
     */
    public inline bool: next() {
        return (mysql_fetch_row(resultId));
    }

    /**
     *
     */
    public inline readInteger(fieldName[]) {
        mysql_fetch_field_int(resultId, fieldName);
    }

    /**
     *
     */
    public inline readFloat(fieldName[]) {
        mysql_fetch_field_float(resultId, fieldName);
    }

    /**
     *
     */
    public inline readString(fieldName[], buffer[]) {
        mysql_fetch_field_string(resultId, fieldName, buffer, sizeof(buffer));
    }
};
