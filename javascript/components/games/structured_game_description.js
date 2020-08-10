// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Many of our games follow a very similar syntax when loaded from a JSON file. The structured game
// description base class helps to provide a parser, enabling easy importing of such files.
//
// Usage is as follows. When calling the constructor, provide a |type| (textual description of the
// category of game that's being imported), the |filename| from which the JSON data has to be
// loaded, and a |structure| that's an array with the fields in the structure itself.
//
// Each field in the structure can have the following properties:
//
//   * `name` (required)    Name of the property, as it would be found in the JSON file.
//   * `type` (required)    Type of the property's value, one of the kType* constants.
//   * `defaultValue`       Default value, which further implies that this property is optional.
//
// Properties will be defined as formal properties on the description's prototype, with getters, but
// not with setters, are descriptions are intended to be immutable.
export class StructuredGameDescription {
    // Types of property values recognized by the description.
    static kTypeNumber = 0;
    static kTypeBoolean = 1;
    static kTypeString = 2;
    static kTypeEnumeration = 3;
    static kTypeArray = 4;
    static kTypeObject = 5;

    // ---------------------------------------------------------------------------------------------

    #type_ = null;
    #filename_ = null;

    // Gets the type of description that this is describing.
    get descriptionType() { return this.#type_; }

    // Gets the filename from which the description is being loaded.
    get descriptionFilename() { return this.#filename_; }

    constructor(type, filename, structure) {
        this.#type_ = type;
        this.#filename_ = String(filename).replace(/^.*[/\\]([^/\\]+)$/, '$1');

        if (!Array.isArray(structure))
            throw new Error(`The structure for the given ${type} must be an array.`);
        
        let contents = null;
        try {
            if (server.isTest() && typeof filename === 'object')
                contents = filename;
            else
                contents = JSON.parse(readFile(filename));

            if (typeof contents !== 'object')
                throw new Error('The JSON file must have an object at the top-level.');

            this.loadStructure(this, contents, structure);

        } catch (exception) {
            throw new Error(`Unable to load the ${type} from "${filename}": ${exception}`);
        }
    }

    // Loads the given |structure| from the given |contents|. Will recursively call itself in case
    // a child object should be present in the |structure|.
    loadStructure(object, contents, structure) {
        for (const property of structure) {
            if (!property.hasOwnProperty('name') || typeof property.name !== 'string')
                throw new Error(`Found a property in the structure without a required name.`);
            
            const name = property.name;
            const value = this.loadProperty(name, contents[name], property);
            
            Object.defineProperty(object, name, {
                configurable: false,
                writable: true,
                value
            });
        }
    }

    // Loads and validates the given |value| based on the |property|, which describes what data is
    // expected to be contained within the |value|.
    loadProperty(name, value, property) {
        const kTypes = new Map([
            [ StructuredGameDescription.kTypeNumber,      'number'  ],
            [ StructuredGameDescription.kTypeBoolean,     'boolean' ],
            [ StructuredGameDescription.kTypeString,      'string'  ],
            [ StructuredGameDescription.kTypeEnumeration, 'string' ],
            [ StructuredGameDescription.kTypeArray,       'array'   ],
            [ StructuredGameDescription.kTypeObject,      'object'  ],
        ]);

        if (!property.hasOwnProperty('type') || !kTypes.has(property.type))
            throw new Error(`Property "${name}" has an undefined or invalid property type.`);

        const type = property.type;
        const typeName = kTypes.get(property.type);

        let validator = (value) => {};  // validator that does nothing

        if (property.hasOwnProperty('validator')) {
            if (typeof property.validator !== 'function')
                throw new Error(`Validator for the property "${name}" must be a function.`);
            
            validator = property.validator;
        }
        
        switch (type) {
            case StructuredGameDescription.kTypeNumber:
            case StructuredGameDescription.kTypeBoolean:
            case StructuredGameDescription.kTypeString:
            case StructuredGameDescription.kTypeEnumeration:
                const optional = property.hasOwnProperty('defaultValue');
                if (!optional && ['null', 'undefined'].includes(typeof value)) {
                    throw new Error(
                        `Property "${name}" is required, but not present in the file.`);
                }

                const propertyValue = value ?? property.defaultValue;
                if (typeof propertyValue !== typeName) {
                    throw new Error(`Property "${name}" must be a ${typeName}, but actually ` +
                                    `is a ${typeof propertyValue}.`);
                }

                // For enumerations, which are strings, we validate that the |propertyValue| is one
                // of the defined `options` of the property. This is an implicit validation.
                if (type === StructuredGameDescription.kTypeEnumeration) {
                    if (!property.hasOwnProperty('options') || !Array.isArray(property.options)) {
                        throw new Error(`Enumeration property "${name}" must have an "options" ` +
                                        `array given, to indicate the enumeration's values.`);
                    }

                    const nonTextualFields = property.options.filter(x => typeof x !== 'string');
                    if (nonTextualFields.length > 0) {
                        throw new Error(`Enumeration property "${name}" must have an "options" ` +
                                        `array given that only contains strings.`);
                    }

                    if (!property.options.includes(propertyValue)) {
                        throw new Error(`Value "${propertyValue}" is not a valid value for the ` +
                                        `enumeration "${name}".`);
                    }
                }

                const validatedValue = validator(propertyValue);
                return validatedValue !== undefined ? validatedValue
                                                    : propertyValue;

            case StructuredGameDescription.kTypeArray:
                if (value !== undefined && !Array.isArray(value)) {
                    throw new Error(`Property "${name}" must be an array, but actually is a ` +
                                    `${typeof value}.`);
                }
            
                const childArray = new Array();
                if (!property.hasOwnProperty('elementType') ||
                        typeof property.elementType !== 'object') {
                    throw new Error(`Array "${name}" must define typing of child elements.`);
                }
                
                if (Array.isArray(value)) {
                    for (const element of value)
                        childArray.push(this.loadProperty(name, element, property.elementType));
                }

                const validatedArray = validator(childArray);
                return validatedArray !== undefined ? validatedArray
                                                    : childArray;

            case StructuredGameDescription.kTypeObject:
                if (value !== undefined && typeof value !== 'object') {
                    throw new Error(`Property "${name}" must be an object, but actually is a ` +
                                    `${typeof value}.`);
                }

                const childObject = new Object;
                if (!property.hasOwnProperty('structure'))
                    throw new Error(`Object "${name}" must define structure of properties.`);

                if (!Array.isArray(property.structure))
                    throw new Error(`Structure of "${name}" must be given as an array.`);
                    
                this.loadStructure(childObject, value ?? {}, property.structure);

                const validatedObject = validator(childObject);
                return validatedObject !== undefined ? validatedObject
                                                     : childObject;
        }
    }

    // Called when requesting a string representation of this description.
    toString() {
        return `[StructuredGameDescription: ${this.#type_} from "${this.#filename_}"]`;
    }
}
