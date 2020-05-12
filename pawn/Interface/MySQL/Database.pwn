// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// How many failed connection attempts have been made to the database?
new g_connectionAttemptFailedCount = 0;

/**
 * The MySQL plugin will invoke this method when a connection attempt has been made, and will inform
 * us of the outcome. If no connection could be established, we will inform developers about it.
 *
 * @param connectionId Id of the connection which just has been attempted.
 * @param succeeded Did the connection attempt succeed?
 * @param server Hostname or IP address of the server that we tried to connect to.
 * @param username Username that has been used to connect to the database server.
 * @param errno Error number to give more insight if the connection attempt failed.
 * @param error Textual representation of the error if we could not connect.
 */
public OnConnectionAttempt(connectionId, bool: succeeded, server[], username[], errno, error[]) {
    if (succeeded == true) {
        printf("[MySQL] The connection with the database has been (re-)established.");
        g_connectionAttemptFailedCount = 0;
        return;
    }

    // Don't spam #LVP.dev if the connection can't be established.
    if (g_connectionAttemptFailedCount++ > 10)
        return;

    new message[512];
    format(message, sizeof(message), "Could not connect to the database with '%s'@%s: %s (%d).",
        username, server, error, errno);

    printf("[MySQL] %s", message);
}

/**
 * When a query has been executed that resulted in an error, we'd also want to tell the developers
 * about it to make sure that we can properly fix the issue for subsequent releases.
 *
 * @param connectionId Id of the connection which ran into the error.
 * @param query The query which resulted in an error.
 * @param callback The callback function which was supposed to be invoked.
 * @param errno Error number that the MySQL server ran in to when executing this query.
 * @param error Textual representation of the error if the query couldn't be executed.
 */
public OnQueryError(connectionId, query[], callback[], errno, error[]) {}

/**
 * The database class provides the non-result specific interface to communicating with the database.
 * We use our own MySQL plugin, which abstracts many operations (such as pinging the connection and
 * making sure that a connection is established) away from the gamemode, so this interface is small.
 * 
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class Database {
    // In which file has the MySQL connection information been stored? The file must contain an
    // object with five keys: {hostname, username, password, database, port}.
    const DatabaseConfigFile = "database.json";

    // The connection Id which the gamemode uses for the database.
    new m_connectionId = -1;

    /**
     * Connect to the database. If another connection is still active, then close that one first
     * before opening a new connection. There is no need to worry about re-connecting, as the plugin
     * will do that for you. Debug information will be enabled for beta tests.
     */
    public __construct() {
        if (m_connectionId != -1)
            mysql_close(m_connectionId);

        new Node: databaseConfig = JSON->parse(DatabaseConfigFile);
        if (databaseConfig == JSON::InvalidNode) {
            printf("[Database] ERROR: Unable to read the database configuration file.");
            return;
        }

        new Node: hostnameNode = JSON->find(databaseConfig, "hostname"),
            Node: usernameNode = JSON->find(databaseConfig, "username"),
            Node: passwordNode = JSON->find(databaseConfig, "password"),
            Node: databaseNode = JSON->find(databaseConfig, "database"),
            Node: portNode = JSON->find(databaseConfig, "port");

        if (hostnameNode == JSON::InvalidNode || JSON->getType(hostnameNode) != JSONString ||
            usernameNode == JSON::InvalidNode || JSON->getType(usernameNode) != JSONString ||
            passwordNode == JSON::InvalidNode || JSON->getType(passwordNode) != JSONString ||
            databaseNode == JSON::InvalidNode || JSON->getType(databaseNode) != JSONString ||
            portNode == JSON::InvalidNode || JSON->getType(portNode) != JSONInteger) {
            printf("[Database] ERROR: The database configuration file is incomplete.");
            return;
        }

        new hostname[64], username[64], password[64], database[64];
        JSON->readString(hostnameNode, hostname, sizeof(hostname));
        JSON->readString(usernameNode, username, sizeof(username));
        JSON->readString(passwordNode, password, sizeof(password));
        JSON->readString(databaseNode, database, sizeof(database));

        new port = 3336;
        JSON->readInteger(portNode, port);

        mysql_debug(0);  // return to 1 to debug MySQL queries
        m_connectionId = mysql_connect(hostname, username, password, database, port);
    }

    /**
     * Asynchronously executes a MySQL query on the database server. This method will return
     * immediately, and the callback (if any) will be invoked when the query has finished.
     *
     * @param query The MySQL query that should be executed.
     * @param callback Callback to report results to. Leave empty if there aren't any results.
     * @param dataId Extra data Id to attach to the query.
     * @return integer The data Id passed on to this method.
     */
    public query(query[], callback[], dataId = -1) {
        mysql_query(m_connectionId, query, callback, dataId);
        return dataId;
    }

    /**
     * Prepares a query for later execution. The query parameter should contain question marks ("?")
     * in place of arguments which should be filled in later. The parameters argument should contain
     * the types of expected arguments, which can be one of "i" (integer), "f" (float) or "s"
     * (string). The number of question marks in your query should be equal to the parameter count.
     *
     * @param query The query which should be stored as a prepared statement.
     * @param parameters The parameters this query expects. Should be one of {i, f, s}.
     * @return integer Id of the prepared statement.
     */
    public prepare(query[], parameters[]) {
        return mysql_statement_prepare(query, parameters);
    }

    /**
     * Executes a statement which previously has been prepared using the Database::prepare() method.
     * You should add any parameter which needs to be included in your query after the dataId
     * parameter, so the MySQL plugin can include this in creating the actual query.
     *
     * Note that the _dataId parameter is prefixed with an underscore to tell the LVP PreCompiler to
     * not put it within parenthesis. This is necessary because mysql_statement_execute() takes an
     * arbitrary number of parameters, whereas putting the parameters in brackets would make it a
     * multi-statement single-parameter value. I sincerely apologize for this hack :-(.
     *
     * @param statementId Id of the statement which should be executed.
     * @param callback Name of the callback which should be invoked after data returns.
     * @param _dataId Extra data Id to attach to the query.
     * @param ... Any additional parameters which should be included in the query.
     */
    public inline execute(statementId, callback[], _dataId) {
        mysql_statement_execute(m_connectionId, statementId, callback, _dataId);
    }
};
