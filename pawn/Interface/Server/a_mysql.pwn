// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The Las Venturas Playground MySQL plugin is completely asynchronous, and uses callbacks as the
 * way to deliver the information retrieved from queries. To highlight some of the features:
 *
 * - Multiple simultaneous database connections.
 * - Query execution will not pause the gamemode.
 * - Queries will be queued until they can be properly executed.
 * - Detailed feedback for failed queries.
 *
 * The normal flow is slightly different from other MySQL plugins due to the asynchronous nature.
 * Establishing a connection and executing a simple query should be seen as follows:
 *
 * mysql_connect()
 *   --> OnConnectionAttempt() to report whether the connection was successful.
 * mysql_query()
 *   --> MyQueryCallback() if the query was executed successfully.
 *       --> mysql_free_result() the result!
 *   --> OnQueryError() if the query could not be executed.
 *
 * When the connection is lost, the plugin will automatically try to re-establish the connection and
 * will inform the gamemode of any progress through the OnConnectionAttempt callback. Any open
 * connections will automatically be closed when the gamemode exits.
 *
 * Any callback function used to handle your own queries should be defined using the following
 * forward. You must ALWAYS call mysql_free_result() as part of this function, unless you're storing
 * the result for later usage. If so, you must free it up at a later time.
 *
 *   --> forward MyQueryCallback(resultId, dataId);
 *       public MyQueryCallback(resultId, dataId) {
 *           // do processing...
 *           mysql_free_result(resultId);
 *       }
 *
 *
 * Version 2.0 of Las Venturas Playground's MySQL plugin introduced support for prepared statements.
 * This feature allows you to prepare queries beforehand, and then compose them with parameters of
 * your choice when wanting to execute the actual feature. There are two new methods:
 *
 * mysql_statement_prepare(query[], parameters[]) -- The query argument contains the query which
 *     you would like to prepare. You must use a question mark "?" to identify places where the
 *     parameters should be inserted later. The parameters argument is a string with the expected
 *     kinds of parameters which have to be inserted. There are three valid type modifiers: "i" for
 *     integers, "f" for floats (we use four decimals) and "s" for strings (which will be escaped).
 *
 * mysql_statement_execute(connectionHandle, statementId, callback[], dataId, ...) -- Executes a
 *     statement which has been introduced earlier on. The dataId argument is not optional here,
 *     and zero or more arguments may be added after the dataId argument which will be inserted in
 *     the query itself.
 *
 * The current implementation does *not* use MySQL's own prepared statement mechanism, and instead
 * just composes the queries itself. The reason behind this is that handing prepared statements for
 * long-running scripts introduces difficulties when the MySQL connection gets lost, or the database
 * structure changes while we've got a statement ready.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */

// Global functions.
native mysql_debug(enabled);

// Connection-level functions.
native mysql_connect(const hostname[], const username[], const password[], const database[], port = 3306);
native mysql_close(connectionId);
native mysql_query(connectionId, query[], callback[], dataId = 0);

// Prepared statement functions.
native mysql_statement_prepare(query[], parameters[]);
native mysql_statement_execute(connectionHandle, statementId, callback[], dataId, {Float,_}:...);

// Result-level functions.
native mysql_affected_rows(resultId);
native mysql_insert_id(resultId);
native mysql_free_result(resultId);

native mysql_num_rows(resultId);
native mysql_fetch_row(resultId);
native mysql_fetch_field_int(resultId, field[]);
native Float: mysql_fetch_field_float(resultId, field[]);
native mysql_fetch_field_string(resultId, field[], buffer[], bufferSize = sizeof(buffer));

// Callbacks.
forward OnConnectionAttempt(connectionId, bool: succeeded, server[], username[], errno, error[]);
forward OnQueryError(connectionId, query[], callback[], errno, error[]);
