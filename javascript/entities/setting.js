// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Encapsulates an individual setting. Must be constructed with its category, name, type and default
// value. Only the actual value can be changed during run-time.
class Setting {
    constructor(category, name, type, value, description) {
        this.category_ = category;
        this.name_ = name;

        if (!Array.isArray(type)) {
            this.type_ = type;
            this.options_ = undefined;
        } else {
            this.type_ = Setting.TYPE_ENUM;
            this.options_ = type;
        }

        this.defaultValue_ = value;

        if (this.type_ == Setting.TYPE_ENUM && !this.options_.includes(this.defaultValue_))
            throw new Error(`The ${value} must be included in the valid option enumeration.`);

        this.value_ = value;

        this.description_ = description;
    }

    // Gets the category this setting is part of.
    get category() { return this.category_; }

    // Gets the name of the setting within the category.
    get name() { return this.name_; }

    // Gets an identifier for the setting that contains both its category and its name.
    get identifier() { return this.category_ + '/' + this.name_; }

    // Gets the type of the setting. This is one of the Setting.TYPE_ constants.
    get type() { return this.type_; }

    // Gets the valid options for an enumeration setting.
    get options() { return this.options_; }

    // Gets the default value of the setting.
    get defaultValue() { return this.defaultValue_; }

    // Gets the value of this setting. Must only be updated by the Settings class.
    get value() { return this.value_; }
    set value(value) { this.value_ = value; }

    // Gets the description of this setting. Only displayed in the UI.
    get description() { return this.description_; }
}

// Variable types of the settings that are known. Update the `/lvp settings` command display when
// adding or removing types from here as well.
Setting.TYPE_BOOLEAN = 0;
Setting.TYPE_NUMBER = 1;
Setting.TYPE_STRING = 2;
Setting.TYPE_ENUM = 3;

export default Setting;
