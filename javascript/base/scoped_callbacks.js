// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Scoped callbacks provide a convenient way for ephemeral classes to listen to server-wide events.
// When the callbacks are no longer necessary, the |dispose()| method can be called which will
// remove all associated event listeners from the state.
class ScopedCallbacks {
  constructor() {
    this.events_ = {};
    this.eventListeners_ = {};
  }

  // Adds |listener| as an event listener for |eventType|. If no other listeners exist for the given
  // |eventType|, a global listener will be created automatically.
  addEventListener(eventType, listener) {
    if (!this.events_.hasOwnProperty(eventType)) {
      this.events_[eventType] = ScopedCallbacks.prototype.onEvent.bind(this, eventType);

      // Create the global event listener for |eventType|.
      addEventListener(eventType, this.events_[eventType]);
    }

    if (!this.eventListeners_.hasOwnProperty(eventType))
      this.eventListeners_[eventType] = [];

    this.eventListeners_[eventType].push(listener);
  }

  // Called when an |event| of |eventType| has been dispatched. All listeners will be invoked.
  onEvent(eventType, event) {
    this.eventListeners_[eventType].forEach(listener => listener(event));
  }

  // Removes all event listeners created by this instance from the global listener list.
  dispose() {
    Object.keys(this.events_).forEach(eventType =>
        removeEventListener(eventType, this.events_[eventType]));

    this.events_ = {};
    this.eventListeners_ = {};
  }
};

export default ScopedCallbacks;
