// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The EventTarget class mimics the DOM interface available in Web browsers, as documented on MDN:
// http://mdn.beonex.com/en/DOM/EventTarget.html
//
// It allows any object to become a target for listening to events on, allowing multiple listeners
// to listen to events of the same type with convenience. Event listeners may be added by calling
// addEventListener(), which will automatically remove duplicates. They can be removed by calling
// removeEventListener(), and triggered by calling dispatchEvent().
class EventTarget {
  constructor() {
    this.listeners = {};
  }

  // Adds |listener| as an event listener for events of type |type|. If the |listener| is already
  // included for the given event, it will not be added again.
  addEventListener(type, listener) {
    if (!this.listeners.hasOwnProperty(type))
      this.listeners[type] = new Set();

    this.listeners[type].add(listener);
  }

  // Removes |listener| from the set of events listening to events of type |type|.
  removeEventListener(type, listener) {
    if (!this.listeners.hasOwnProperty(type))
      return;

    this.listeners[type].delete(listener);
  }

  // Dispatches the event of type |type|, optionally passing |event| as the event object.
  dispatchEvent(type, event) {
    if (!this.listeners.hasOwnProperty(type))
      return;

    this.listeners.forEach(listener => listener(event));
  }
};

exports = EventTarget;
