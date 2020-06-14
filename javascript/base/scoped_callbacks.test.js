// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ScopedCallbacks } from 'base/scoped_callbacks.js';

describe('ScopedCallbacks', it => {
  it('should unbind the events', assert => {
    assert.isFalse(global.hasEventListener('testevent'));

    let invoked = false;

    let callbacks = new ScopedCallbacks();
    callbacks.addEventListener('testevent', event => invoked = true);

    assert.isTrue(global.hasEventListener('testevent'));

    global.dispatchEvent('testevent', {});

    assert.isTrue(invoked);

    callbacks.dispose();

    assert.isFalse(global.hasEventListener('testevent'));
  });

  it('should allow multiple listeners', assert => {
    let invoked = 0;

    let callbacks = new ScopedCallbacks();
    callbacks.addEventListener('testevent', event => ++invoked);
    callbacks.addEventListener('testevent', event => ++invoked);

    global.dispatchEvent('testevent');

    assert.equal(invoked, 2);

    callbacks.dispose();
  });
});
