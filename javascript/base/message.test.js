// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Message from 'base/message.js';

describe('Message', it => {
  it('should apply formatting rules', assert => {
    // Not enough parameters will cause exceptions to be thrown.
    assert.throws(() => Message.format('%s'));
    assert.throws(() => Message.format('%s %s', 'foo'));

    // Literal percentage-sign pass-through.
    assert.equal(Message.format('%%'), '%');
    assert.equal(Message.format('%%%%'), '%%');

    // Null and undefined value handling.
    assert.equal(Message.format('%s', null), '[null]');
    assert.equal(Message.format('%s', undefined), '[undefined]');

    // String substitution.
    assert.equal(Message.format('%s', 'foo'), 'foo');
    assert.equal(Message.format('%s', 42), '42');
    assert.equal(Message.format('%s', []), '');
    assert.equal(Message.format('%s', {}), '[object Object]');
    assert.equal(Message.format('%s', ''), '');
  });

  it('should format numbers', assert => {
    assert.equal(Message.formatNumber(false), false);
    assert.deepEqual(Message.formatNumber({}), {});

    assert.equal(Message.formatNumber(42), '42');
    assert.equal(Message.formatNumber(4200), '4,200');
    assert.equal(Message.formatNumber(4200000), '4,200,000');

    assert.equal(Message.formatNumber(-42), '-42');
    assert.equal(Message.formatNumber(-4200), '-4,200');
    assert.equal(Message.formatNumber(-4200000), '-4,200,000');

    assert.equal(Message.formatNumber(42.12345), '42.12');
    assert.equal(Message.formatNumber(42.12567), '42.13');

    assert.equal(Message.formatNumber(-42.12345), '-42.12');
    assert.equal(Message.formatNumber(-42.12567), '-42.13');

    // The %d formatting rule of Message.format()
    assert.equal(Message.format('[%d]', 1337.42), '[1,337.42]');
  });

  it('should format prices', assert => {
    assert.equal(Message.formatPrice(false), '$0');
    assert.equal(Message.formatPrice({}), '$0');

    assert.equal(Message.formatPrice(2500), '$2,500');
    assert.equal(Message.formatPrice(-1337.23), '-$1,337');
    assert.equal(Message.formatPrice(42), '$42');
    assert.equal(Message.formatPrice(1000000), '$1,000,000');

    // The %$ formatting rule of Message.format()
    assert.equal(Message.format('[%$]', -1337.23), '[-$1,337]');
  });

  it('should format times', assert => {
    assert.equal(Message.formatTime(false), false);
    assert.equal(Message.formatTime('tomorrow'), 'tomorrow');
    assert.deepEqual(Message.formatTime({}), {});

    assert.equal(Message.formatTime(0), '00:00');
    assert.equal(Message.formatTime(42), '00:42');
    assert.equal(Message.formatTime(121), '02:01');
    assert.equal(Message.formatTime(1835), '30:35');

    assert.equal(Message.formatTime(3600), '01:00:00');
    assert.equal(Message.formatTime(3661), '01:01:01');
    assert.equal(Message.formatTime(7200), '02:00:00');
    assert.equal(Message.formatTime(36154), '10:02:34');

    // The %t formatting rule of Message.format()
    assert.equal(Message.format('[%t]', 36154), '[10:02:34]');
  });

  it('should filter colours from messages', assert => {
    assert.equal(Message.filter('{FFFFFF}color'), 'color');
    assert.equal(Message.filter('{FFFFFF}color{FFFFFF}'), 'color');
    assert.equal(Message.filter('color{FFFFFF}'), 'color');

    assert.equal(Message.filter('{FFFFFFF}color'), 'color');
    assert.equal(Message.filter('{FFFFFFFF}color'), 'color');

    assert.equal(Message.filter('{12345}color'), '{12345}color');
    assert.equal(Message.filter('{123456789}color'), '{123456789}color');

    assert.equal(Message.filter('{123456}color'), 'color');
    assert.equal(Message.filter('{abc123}color'), 'color');
  });
});
