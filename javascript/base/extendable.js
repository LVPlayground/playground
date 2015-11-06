// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let extendedProperties = {};
let extendedMethods = {};

// Extendables are classes which can have functionality provided by other components in the
// system. This allows the different modules to extend functionality on the core classes.
//
// One thing to keep in mind is that extendables are scoped by the name of their constructor. This
// means that having two classes named Player, both of which are extendables, will collide with each
// other. While this is preventable by accepting the intended object in the arguments of the
// providing methods, this functionality will be limited to a few of the core classes so simplicity
// of code using the extendables is prioritized over such potential colissions.
class Extendable {
  constructor() {
    let target = new.target;
    do {
      let targetName = target.name;
      if (!extendedProperties.hasOwnProperty(targetName))
        return;

      Object.defineProperties(this, extendedProperties[targetName]);
      target = Object.getPrototypeOf(target);

    } while (target !== null);
  }

  // Provides a property called |name| on the called object. The |getter| function will be invoked
  // when its value is requested, whereas the |setter|, when set, will be used for updating it.
  static provideProperty(name, getter, setter = null) {
    let extendableName = this.name;
    if (this.hasOwnProperty(name))
      throw new Error('A property named "' + name +'" already exists for "' + extendableName + '".');

    if (!extendedProperties.hasOwnProperty(extendableName))
      extendedProperties[extendableName] = {};

    if (extendedProperties[extendableName].hasOwnProperty(name))
      throw new Error('An extendable named "' + name + '" has already been created for "' + extendableName + '".');

    if (typeof getter !== 'function' || (setter !== null && typeof setter !== 'function'))
      throw new Error('The getter and setter of an extendable property must be a function.');

    extendedProperties[extendableName][name] = {
      configurable: false,
      enumerable: false,
      get: function() { return getter(this); },
      set: function(value) {
        if (typeof setter !== 'function')
          throw new Error(extendableName + '.' + name + ' is a read-only property.');

        return setter(this, value);
      }
    };
  }

  // Provides a method called |name| on the called object. The |fn| will be invoked with the current
  // instance of the extendable when the method is called.
  static provideMethod(name, fn) {
    let extendableName = this.name;
    if (name in this.prototype)
      throw new Error('A method named "' + name + '" already exists for "' + extendableName + '".');

    if (!extendedMethods.hasOwnProperty(extendableName))
      extendedMethods[extendableName] = {};

    if (extendedMethods[extendableName].hasOwnProperty(extendableName))
      throw new Error('An extendable named "' + name + '" has already been created for "' + extendableName + '".');

    if (typeof fn !== 'function')
      throw new Error('The handler of an extendable method must be a function.');

    extendedMethods[extendableName][name] = true;

    this.prototype[name] = function(...args) {
      return fn(this, ...args);
    };
  }

  // Clears all currently known extendables for the purposes of testing. It is important that tests
  // clean up after themselves, to avoid the wrong handling methods from being invoked.
  static clearExtendablesForTests() {
    let extendableName = this.name;

    delete extendedProperties[extendableName];
    if (!extendedMethods.hasOwnProperty(extendableName))
      return;

    Object.keys(extendedMethods[extendableName]).forEach(method =>
        delete this.prototype[method]);

    delete extendedMethods[extendableName];
  }
};

exports = Extendable;
