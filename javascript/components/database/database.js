// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Creates a string out of |number|. It must be a valid, non-infinite number in range of significand
// precision imposed by JavaScript, which uses doubles, so 53 bits.
function substituteNumber(number) {
  if (Number.isNaN(number) || !Number.isFinite(number))
    throw new Error('Numbers in substitution parameters must not be NaN or infinity.');

  if (number < Number.MIN_SAFE_INTEGER || number > Number.MAX_SAFE_INTEGER)
    throw new Error('Numbers in substitution parameters must be in range of a 53-bit signed integer.');

  return number.toString();
}

// Creates a safe representation of |string|. This follows the MySQL escaping guidelines as set by
// the OWASP organisation: https://www.owasp.org/index.php/SQL_Injection_Prevention_Cheat_Sheet
function substituteString(string) {
  return string.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, character => {
    switch (character) {
      case '\0':   return '\\0';
      case '\x08': return '\\b';
      case '\x09': return '\\t';
      case '\x1a': return '\\z';
      case '\n':   return '\\n';
      case '\r':   return '\\r';
      case '\"':   return '\\"';
      case '\'':   return '\\\'';
      case '\\':   return '\\\\';
      case '%':    return '\\%';
    }

    // All characters in the regular expression will be handled in the switch, so this code should
    // never actually run.
    return null;
  });
}

// Substitutes the |value|. Arrays will be treated as multiple values that will each have to be
// substituted individually, e.g. [25, 26, 27] => "25, 26, 27".
function substituteValue(prefix, value, index) {
  if (Array.isArray(value) && value.length)
    return prefix + value.map(entry => substituteValue('', entry, index)).join(', ');

  switch (typeof value) {
    case 'number':
      return prefix + substituteNumber(value);
    case 'string':
      return prefix + '"' + substituteString(value) + '"';
    case 'object':
      if (value === null)
        return prefix + 'NULL';

      /** deliberate fall-through for non-null values **/
    default:
      throw new Error('Invalid type ("' + typeof value + '") for substitution parameter #' + index);
  }
}

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
    let substitutionIndex = 0;
    return this.connection_.query(query.replace(/(^|[^\?])\?(?!\?)/g, (_, prefix) => {
      if (substitutionIndex >= parameters.length)
        throw new Error('Not enough substitution parameters were provided for this query.');

      return substituteValue(prefix, parameters[substitutionIndex], substitutionIndex++);
    }));
  }
};
