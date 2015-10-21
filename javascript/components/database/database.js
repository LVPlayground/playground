// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The Database class provides access to the MySQL database which contains all information that
// Las Venturas Playground persists. The access details are stored in the data/database.json.
//
// Executing a query requires the SQL to be passed, optionally with any number of parameters that
// should safely be substituted within the query.
class Database {
  constructor() {
    let configuration = JSON.parse(readFile('database.json'));

    // Establish a connection with the MySQL server using the configuration.
    this.connection_ = new MySQL(configuration.hostname, configuration.username,
                                 configuration.password, configuration.database,
                                 configuration.port);

    // Announce the result of the connection attempt once its known.
    this.connection_.ready.then(
      () => console.log('[Database] The connection with the database has been established.'),
      error => console.log('[Database] Unable to connect to the database:', error));
  }

  // Returns the total number of queries that have been executed on the connection.
  getTotalQueryCount() {
    return this.connection_.totalQueryCount;
  }

  // Returns the number of queries which are still unresolved.
  getUnresolvedQueryCount() {
    return this.connection_.unresolvedQueryCount;
  }

  // Executes |query| on the MySQL connection. Returns a promise that will be resolved when the
  // query either has finished executing, or reject when the query cannot be executed.
  //
  // Rather than including parameters directly in the |query|, consider using question marks and
  // passing the substitutions as additional parameters. They will be substituted within the |query|
  // safely, in order, reducing the possibility of running unwanted queries by accident.
  query(query, ...parameters) {
    // TODO(Russell): Substutute |parameters|.

    return this.connection_.query(query);
  }
};

exports = Database;
