// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Database = require('components/database/database.js');

const unresolvedPromise = new Promise(resolve => {});

// Fake MySQL driver that implements the same interface as the MySQL interface on the global object,
// used for testing purposes to avoid tests from creating database connections.
class FakeMySQL {
  constructor() {
    this.lastQuery_ = null;
  }

  get ready() { return unresolvedPromise; }

  get totalQueryCount() { return 0; }
  get getUnresolvedQueryCount() { return 0; }
  get lastQuery() { return this.lastQuery_; }

  query(query) {
    this.lastQuery_ = query;
  }
};

describe('Database', it => {
  it('substitutes query parameters', assert => {
    let database = new Database(FakeMySQL);
    let substitute = (...args) => {
      database.query(...args);
      return database.connectionForTests.lastQuery;
    };

    assert.equal(substitute('pass-through'), 'pass-through');

    // Not enough substitution parameters.
    assert.throws(() => substitute('?'));
    assert.throws(() => substitute('? ?', 42));
    assert.throws(() => substitute(' ? ? ', 42));

    // Double question-mark pass-through.
    assert.equal(substitute('??'), '??');

    // Number substitutions.
    assert.equal(substitute('[?]', 42), '[42]');
    assert.equal(substitute('[?]', 42.31415), '[42.31415]');
    assert.equal(substitute('[?]', -42), '[-42]');

    assert.equal(substitute('[?]', Number.MIN_SAFE_INTEGER), '[' + Number.MIN_SAFE_INTEGER + ']');
    assert.equal(substitute('[?]', Number.MAX_SAFE_INTEGER), '[' + Number.MAX_SAFE_INTEGER + ']');

    assert.throws(() => substitute('?', Number.NEGATIVE_INFINITY));
    assert.throws(() => substitute('?', Number.POSITIVE_INFINITY));
    assert.throws(() => substitute('?', Number.NaN));

    // Number array substitutions.
    assert.equal(substitute('[?]', [1, 42]), '[1, 42]');
    assert.equal(substitute('[?]', [2, 42.31415, 2]), '[2, 42.31415, 2]');
    assert.equal(substitute('[?]', [-42, 3]), '[-42, 3]');

    // String substitutions.
    assert.equal(substitute('[?]', '\b'), '["\\b"]');
    assert.equal(substitute('[?]', '\t'), '["\\t"]');
    assert.equal(substitute('[?]', '\x1a'), '["\\z"]');
    assert.equal(substitute('[?]', '\n'), '["\\n"]');
    assert.equal(substitute('[?]', '\r'), '["\\r"]');
    assert.equal(substitute('[?]', '\"'), '["\\""]');
    assert.equal(substitute('[?]', '\''), '["\\\'"]');
    assert.equal(substitute('[?]', '\\'), '["\\\\"]');
    assert.equal(substitute('[?]', '%'), '["\\%"]');

    // NULL value substitution
    assert.equal(substitute('[?]', null), '[NULL]');

    // Other substitution types.
    assert.throws(() => substitute('?', undefined));
    assert.throws(() => substitute('?', {}));
    assert.throws(() => substitute('?', []));
    assert.throws(() => substitute('?', () => false));

    // Multiple parameters in the substitution.
    assert.equal(substitute('? ?', 40, 42), '40 42');
    assert.equal(substitute('? ?', 42.34, 'Russell'), '42.34 "Russell"');

    // Example query test-cases.
    assert.equal(substitute('SELECT * FROM users WHERE nickname = ?', '%\n";Russell'),
                 'SELECT * FROM users WHERE nickname = "\\%\\n\\\";Russell"');

    assert.equal(substitute('INSERT INTO table (a, b) VALUES (?, ?)', 'Russell', 10000000000),
                 'INSERT INTO table (a, b) VALUES ("Russell", 10000000000)');
  });
});
