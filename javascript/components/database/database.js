// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { substitute } from 'components/database/substitute.js';

// The Database class provides access to the MySQL database which contains all information that
// Las Venturas Playground persists. The access details are stored in the data/database.json.
//
// Executing a query requires the SQL to be passed, optionally with any number of parameters that
// should safely be substituted within the query.
export class Database {
  constructor(driver = MySQL) {
    let configuration = JSON.parse(readFile('database.json'));

    // Establish a connection with the MySQL server using the configuration.
    this.connection_ = new driver(configuration.hostname, configuration.username,
                                  configuration.password, configuration.database,
                                  configuration.port);

    // Announce the result of the connection attempt once its known.
    this.connection_.ready.then(
        () => console.log('[Database] The connection with the database has been established.'),
        error => console.log('[Database] Unable to connect to the database:', error));
  }

  // Returns the total number of queries that have been executed on the connection.
  get totalQueryCount() {
    return this.connection_.totalQueryCount;
  }

  // Returns the number of queries which are still unresolved.
  get unresolvedQueryCount() {
    return this.connection_.unresolvedQueryCount;
  }

  // Returns the connection that's powering the Database instance. Should only be used for tests.
  get connectionForTests() {
    return this.connection_;
  }

  // Closes the MySQL connection. Further use of the Database class will yield errors.
  dispose() {
    this.connection_.close();
    this.connection_ = null;
  }

  // Executes |query| on the MySQL connection. Returns a promise that will be resolved when the
  // query either has finished executing, or reject when the query cannot be executed.
  //
  // Rather than including parameters directly in the |query|, consider using question marks and
  // passing the substitutions as additional parameters. They will be substituted within the |query|
  // safely, in order, reducing the possibility of running unwanted queries by accident.
  query(query, ...parameters) {
    return this.connection_.query(substitute(query, ...parameters));
  }
};
