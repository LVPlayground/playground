// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Clones the given |value|. Cloning in JavaScript can be tricky, particularly for more complicated
// objects, data types and symbols, hence this utility method.
export function clone(value) {
    return cloneValue(value);
}

const kTagArguments = '[object Arguments]';
const kTagArrayBuffer = '[object ArrayBuffer]';
const kTagBoolean = '[object Boolean]';
const kTagDataView = '[object DataView]';
const kTagDate = '[object Date]';
const kTagError = '[object Error]';
const kTagFloat32Array = '[object Float32Array]';
const kTagFloat64Array = '[object Float64Array]';
const kTagInt8Array = '[object Int8Array]';
const kTagInt16Array = '[object Int16Array]';
const kTagInt32Array = '[object Int32Array]';
const kTagMap = '[object Map]';
const kTagNumber = '[object Number]';
const kTagObject = '[object Object]';
const kTagRegExp = '[object RegExp]';
const kTagSet = '[object Set]';
const kTagString = '[object String]';
const kTagSymbol = '[object Symbol]';
const kTagUint8Array = '[object Uint8Array]';
const kTagUint8ClampedArray = '[object Uint8ClampedArray]';
const kTagUint16Array = '[object Uint16Array]';
const kTagUint32Array = '[object Uint32Array]';
const kTagWeakMap = '[object WeakMap]';

// Set of tags that cannot be cloned.
const kUncloneables = new Set([
    kTagError,
    kTagWeakMap,
]);

// Clones the given |value|. Will recursively call itself. Separated from |clone| to avoid leaking
// these details to the public API of this file. The implementation of this function is modelled
// after LoDash: https://lodash.com/docs/4.17.15#cloneDeep
function cloneValue(value, object = null, stack = null) {
    if (typeof value !== 'object' && typeof value !== 'function')
        return value;

    let result = {};
    let tag = null;

    if (value === null || value === undefined)
        return value;
    else
        tag = Object.prototype.toString.call(value);

    // Initialize the |result| as an array when |value| is one. Special case results assigned by
    // executing regular expressions, which further have `index` and `input` properties.
    if (Array.isArray(value)) {
        result = new Array(value.length);
        if (value.length > 0 && typeof value[0] === 'string' && value.hasOwnProperty('index')) {
            result.index = value.index;
            result.input = value.input;
        }
    } else {
        const isFunction = typeof value === 'function';

        if ([ kTagObject, kTagArguments ].includes(tag) && (isFunction && !object)) {
            const constructor = value.constructor;
            const prototype = typeof constructor === 'function' && constructor.prototype;

            if (isFunction && value !== (prototype || Object.prototype))
                result = Object.create(Object.getPrototypeOf(value));
        } else {
            if (isFunction || kUncloneables.has(tag))
                return object ? value : {};
            
            let buffer = null;

            switch (tag) {
                case kTagArrayBuffer:
                    result = cloneArrayBuffer(value);
                    break;

                case kTagBoolean:
                case kTagDate:
                    result = new value.constructor(+value);
                    break;

                case kTagDataView:
                    buffer = cloneArrayBuffer(value.buffer);
                    result = new value.constructor(buffer, value.byteOffset, value.byteLength);
                    break;
                
                case kTagFloat32Array:
                case kTagFloat64Array:
                case kTagInt8Array:
                case kTagInt16Array:
                case kTagInt32Array:
                case kTagUint8Array:
                case kTagUint8ClampedArray:
                case kTagUint16Array:
                case kTagUint32Array:
                    buffer = cloneArrayBuffer(value.buffer);
                    return new value.constructor(buffer, value.byteOffset, value.length);
                
                case kTagMap:
                case kTagSet:
                    result = new value.constructor();
                    break;
                
                case kTagNumber:
                case kTagString:
                    result = new value.constructor(value);
                    break;

                case kTagRegExp:
                    result = new value.constructor(value.source, /\w*$/.exec(value));
                    result.lastIndex = value.lastIndex;
                    break;
                
                case kTagSymbol:
                    result = Object(Symbol.prototype.valueOf.call(value));
                    break;
            }
        }
    }

    // Maintain a stack to avoid breaking on circular references. The JavaScript Map type works
    // based on instances, so that should work correctly.
    stack = stack ?? new Map();

    if (stack.has(value))
        return stack.get(value);
    
    stack.set(value, result);

    // If the given |value| is a Map, deep clone all values that are contained within the map.
    if (tag === kTagMap) {
        for (const [ k, v ] of value)
            result.set(k, cloneValue(v, /* object= */ value, stack));
        
        return result;
    }

    // If the given |value| is a Set, deep clone all values that are contained within the set.
    if (tag === kTagSet) {
        for (const v of value)
            result.add(cloneValue(v, /* object= */ value, stack));

        return result;
    }

    // Get the keys that are contained on the given |value| object. This is straightforward for an
    // array, but slightly more involved for array-like objects and generic objects.
    if (Array.isArray(value)) {
        for (const k in value)
            result[k] = cloneValue(value[k], value, stack);

    } else {
        const keys = isArrayLike(value) ? arrayLikeKeys(value) : Object.keys(Object(value));
        for (const k of keys)
            result[k] = cloneValue(value[k], value, stack);
    }

    return result;
}

// Creates an array of the enumerable property names on the given |value|.
function arrayLikeKeys(tag, value) {
    const skipIndexes = tag === kTagArguments;
    const length = value.length

    const result = new Array(skipIndexes ? length : 0);

    let index = skipIndexes ? -1 : length;
    while (++index < length)
        result[index] = `${index}`

    for (const key in value) {
        if (!Object.prototype.hasOwnProperty.call(value, key))
            continue;
        
        if (skipIndexes && (key === 'length' || isIndex(key, length)))
            continue;
        
        result.push(key);
    }
    return result
  }

// Returns a clone of the given |arrayBuffer|.
function cloneArrayBuffer(arrayBuffer) {
    const result = new arrayBuffer.constructor(arrayBuffer.byteLength)

    new Uint8Array(result).set(new Uint8Array(arrayBuffer))
    return result;
}

// Returns whether the given |value| is array-like.
function isArrayLike(value) {
    if (typeof value === 'function')
        return false;
    
    return typeof value.length === 'number' &&
           value.length > -1 && value.length % 1 == 0 && value.length <= Number.MAX_SAFE_INTEGER;
}

// Returns whether the given |value| is an index.
function isIndex(value, length) {
    const type = typeof value

    length = length == null ? Number.MAX_SAFE_INTEGER : length

    return !!length &&
           (type === 'number' || (type !== 'symbol' && reIsUint.test(value))) &&
           (value > -1 && value % 1 == 0 && value < length);
}
