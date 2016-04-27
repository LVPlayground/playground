// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedCallbacks = require('base/scoped_callbacks.js');

// Many features have a need to listen to global events, for which proper binding and unbinding of
// the listeners is a tedious thing to do. Additionally, there is a frequent need for error checking
// which can better be done centralized, and thus is provided by this class.
//
// This class builds upon the ScopedCallbacks class in //base, adding functionality specific to the
// event types and using information from the different entities (which are unavailable in //base).
class EventListener extends ScopedCallbacks {
  constructor() { super(); }

  // Adds |listener| as an event listener for |eventType|. Known event types will be decorated to
  // translate the raw SA-MP event to the appropriate types within the Las Venturas Playground code.
  addEventListener(eventType, listener) {
    let decoratedListener = null;
    switch (eventType) {
      // PlayerConnectEvent { playerid }
      case 'playerconnect':
        decoratedListener = this.decorate(listener, [
            { playerid: EventListener.PARAM_TYPE_PLAYER }]);
        break;

      // PlayerDisconnectEvent { playerid, reason }
      case 'playerdisconnect':
        decoratedListener = this.decorate(listener, [
            { playerid: EventListener.PARAM_TYPE_PLAYER },
            { reason: EventListener.PARAM_TYPE_INTEGER }]);
        break;

      // PlayerLoginEvent { playerid, userid }
      case 'playerlogin':
        decoratedListener = this.decorate(listener, [
            { playerid: EventListener.PARAM_TYPE_PLAYER },
            { userid: EventListener.PARAM_TYPE_INTEGER }]);
        break;

      default:
        decoratedListener = listener;
        break;
    }

    super.addEventListener(eventType, decoratedListener);
  }

  // TODO: Introduce removeEventListener(). We'll need some mapping between

  // Decorates |listener| to validate and receive the |parameters| and returns a function that can
  // be listened to rather than the original |listener|.
  decorate(listener, parameters) {
    const argumentParsers = [];

    parameters.forEach(parameter => {
      const parameterNames = Object.keys(parameter);
      if (parameterNames.length != 1)
        throw new TypeError('Only a single parameter may be given in the definition.');

      const parameterName = parameterNames[0];
      const parameterType = parameter[parameterName];

      let parser = null;

      switch (parameterType) {
        case EventListener.PARAM_TYPE_PLAYER:
          parser = event => {
            if (!event.hasOwnProperty(parameterName))
              return false;  // the event doesn't know about the parameter.

            const parameterValue = event[parameterName];
            const player = server.playerManager.getById(parameterValue);

            if (!player)
              return false;  // the player indicated by the event doesn't exist.

            return player;
          };
          break;
        case EventListener.PARAM_TYPE_INTEGER:
          parser = event => {
            if (!event.hasOwnProperty(parameterName))
              return false;  // the event doesn't know about the parameter.

            const parameterValue = Number(event[parameterName]);
            if (!Number.isInteger(parameterValue))
              return false;  // the number isn't a valid integer.

            return parameterValue;
          };
          break;
        default:
          throw new TypeError('Invalid type given for parameter `' + parameterName + '`.');
      }

      argumentParsers.push(parser);
    });

    return function(event) {
      let args = [];

      for (let parser of argumentParsers) {
        const value = parser(event);
        if (value === false) {
          console.log('WARNING: Dropped invalid event: ' + String(event));
          return;
        }

        args.push(value);
      }

      // TODO: Support cancelable events in the EventListener class.
      listener(...args);
    };
  }
};

// Parameter types that can be handled by the EventListener infrastructure.
EventListener.PARAM_TYPE_PLAYER = 0;
EventListener.PARAM_TYPE_INTEGER = 1;

exports = EventListener;
