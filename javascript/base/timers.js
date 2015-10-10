// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let PriorityQueue = require('base/priority_queue.js');

// Structure representing the information associated with a pending timer. Timers which are
// repetitive will automatically be re-queued by the TimerManager.
class PendingTimer {
  constructor(id, fn, interval, repetitive) {
    this.id = id;
    this.fn = fn;
    this.interval = Math.max(interval, 1);
    this.repetitive = repetitive;
    this.nextInvocation = 0;

    this.updateNextInvocationTime();
  }

  updateNextInvocationTime() {
    this.nextInvocation = highResolutionTime() + this.interval;
  }

  // Comperator used to determine the ordering of two PendingTimer instances. The priority
  // queue should store them in ascending order based on the next invocation time.
  static comperator(lhs, rhs) {
    return lhs.nextInvocation - rhs.nextInvocation;
  }
};

// The timer manager provides the gamemode with the ability to delay or repeat execution of
// JavaScript code by setting (repetitive) timers.
class TimerManager {
  constructor() {
    this.id = 0;
    this.timers = new PriorityQueue(PendingTimer.comperator);
  }

  // Called every server frame. The |event| has a property named |now| which provides the
  // monotonically increasing time that can be compared against the top of the queue. Repetitive
  // timers will automatically be re-added to the priority queue again.
  OnFrame(event) {
    while (this.timers.size()) {
      let timer = this.timers.peek();
      if (timer.nextInvocation > event.now)
        return;

      this.timers.dequeue();
      try {
        timer.fn.call();
      } catch (exception) {
        throw exception;
      } finally {
        if (!timer.repetitive)
          continue;
    
        timer.updateNextInvocationTime();

        this.timers.enqueue(timer);
      }
    }
  }

  // Creates a new timer for |fn| to be invoked once after |time| milliseconds. Follows the syntax
  // and behavior of the window.setTimeout() function available on the Web.
  SetTimeout(fn, time) {
    this.timers.enqueue(new PendingTimer(this.id, fn, time, false));
    return this.id++;
  }

  // Creates a new repetitive timer for |fn| to be invoked each |interval| milliseconds. Follows the
  // syntax and behaviour of the window.setInterval() function available on the Web.
  SetInterval(fn, interval) {
    this.timers.enqueue(new PendingTimer(this.id, fn, interval, true));
    return this.id++;
  }

  // Removes the timer with Id |id| from the priority queue. Used for both the clearTimeout() and
  // clearInterval() functions as they share an Id pool.
  RemoveTimer(id) {
    this.timers.filter(entry => entry.id != id);
  }
};

// Global instance. Will be kept alive by the bounds on the global object.
let instance = new TimerManager();

// Listen to the server's frame event, in which timers will be handled.
addEventListener('frame', TimerManager.prototype.OnFrame.bind(instance));

// The timer methods should be available on the global object.
global.setTimeout = TimerManager.prototype.SetTimeout.bind(instance);
global.clearTimeout = TimerManager.prototype.RemoveTimer.bind(instance);
global.setInterval = TimerManager.prototype.SetInterval.bind(instance);
global.clearInterval = TimerManager.prototype.RemoveTimer.bind(instance);

// Expose a global wait(ms) function, that waits for a certain amount of time and then resolves
// the promise it returned. Useful for timeouts with Promise.race().
global.wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
