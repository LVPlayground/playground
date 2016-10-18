// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Encapsulates an individual setting. Must be constructed with its category, name, type and default
// value. Only the actual value can be changed during run-time.
class Setting {
    constructor(category, name, type, value, description) {
        this.category_ = category;
        this.name_ = name;
        this.type_ = type;

        this.defaultValue_ = value;
        this.value_ = value;

        this.description_ = description;
    }

    // Gets the category this setting is part of.
    get category() { return this.category_; }

    // Gets the name of the setting within the category.
    get name() { return this.name_; }

    // Gets the type of the setting. This is one of the Setting.TYPE_ constants.
    get type() { return this.type_; }

    // Gets the default value of the setting.
    get defaultValue() { return this.defaultValue_; }

    // Gets the value of this setting. Must only be updated by the Settings class.
    get value() { return this.value_; }
    set value(value) { this.value_ = value; }

    // Gets the description of this setting. Only displayed in the UI.
    get description() { return this.description_; }
}

// Variable types of the settings that are known.
Setting.TYPE_BOOLEAN = 0;
Setting.TYPE_NUMBER = 1;

exports = Setting;
