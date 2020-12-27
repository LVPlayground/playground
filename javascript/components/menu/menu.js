// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Dialog } from 'components/dialogs/dialog.js';

// The menu class represents a user-visible dialog from which they can choose an option. Optionally,
// the menu can have up to four columns, each of which must have a set header. The width of columns
// will be decided by SA-MP.
//
// Each item added to the menu either should have an associated event listener, or the user's
// selection should be observed by waiting for the promise to displayForPlayer() to settle.
//
// There is no limit to the number of items that can be added to a menu, as this component will
// automatically split a dialog up in multiple dialogs when it doesn't fit in a single box. However,
// keep in mind that this does not provide a great user experience.
export class Menu {
    constructor(title, columns = [], { pageSize = 50 } = {}) {
        if (!Array.isArray(columns) || columns.length > Menu.MAX_COLUMN_COUNT)
            throw new Error('Menus cannot have more than ' + Menu.MAX_COLUMN_COUNT + ' columns.');

        if (pageSize < 1 || pageSize > Menu.MAX_ROW_COUNT)
            throw new Error('Menu pages must have between 1 and ' + Menu.MAX_ROW_COUNT + ' rows.');

        this.title_ = String(title);
        this.columns_ = columns;
        this.items_ = [];

        this.pageSize_ = pageSize;
        this.pageCount_ = 1;
    }

    // ---------------------------------------------------------------------------------------------

    // Adds a new item to the menu. One argument must be passed for each of the columns in the menu,
    // and optionally one more for the event listener associated with this menu item.
    addItem() {
        const columnCount = Math.max(1, this.columns_.length);

        if (arguments.length < columnCount)
            throw new Error('Expected ' + columnCount + ' labels, got ' + arguments.length);

        let listener = null;
        if (arguments.length >= columnCount && typeof arguments[columnCount] == 'function')
            listener = arguments[columnCount];

        this.items_.push({
            labels: Array.prototype.slice.call(arguments, 0, columnCount),
            listener: listener
        });

        // Recompute the number of pages that this menu exists of.
        this.pageCount_ = Math.ceil(this.items_.length / this.pageSize_);
    }

    // Returns whether the built menu currently has items in it.
    hasItems() { return this.items_.length > 0; }

    // Displays the menu to |player|. A promise will be returned that will resolve when the dialog
    // has dismissed from their screen, even when they didn't make a selection. The promise will be
    // resolved with NULL when the player disconnects before submitting a response. The |page|
    // argument is one-based -- optimised for display as opposed to array indices.
    async displayForPlayer(player, page = 1) {
        for (; page <= this.pageCount_; ++page) {
            const title = this.buildTitle(page);
            const label = this.buildButtonLabel(page);
            const content = this.buildContent(page);

            const result = await Dialog.displayMenu(
                player, !this.includeHeader(), title, content, 'Select', label);

            if (!result)
                return null;  // the player has disconnected

            if (result.response != Dialog.PRIMARY_BUTTON)
                continue;  // proceed to the next page

            if (result.item < 0 || result.item >= this.pageSize_)
                throw new Error('An out-of-bounds menu item has been selected by the player.');

            const selectedItem = this.items_[((page - 1) * this.pageSize_) + result.item];
            if (selectedItem.listener)
                await selectedItem.listener(player);

            return { player, item: selectedItem.labels };
        }

        // We're out of pages that can be displayed to the player.
        return null;
    }

    // ---------------------------------------------------------------------------------------------
    // Methods private to the Menu class.

    // Returns whether the menu should be displayed with a header indicating the columns.
    includeHeader() {
        return this.columns_.length > 0;
    }

    // Builds the title for the menu at the given |page|. Menus having multiple pages will have an
    // indicator appended to the title to identify where the player is.
    buildTitle(page) {
        if (this.pageCount_ == 1)
            return this.title_;

        return this.title_ + ' (page ' + page + ' of ' + this.pageCount_ + ')';
    }

    // Builds the label for the right-side button. For menus that do not utilize pagination this
    // will simply be "Cancel", for menus with pagination it may be ">>>" (next) instead.
    buildButtonLabel(page) {
        if (this.pageCount_ == page)
            return 'Cancel';

        return '>>>';
    }

    // Builds the content for the menu at the given |page|. Headers will be repeated on every page,
    // whereas a page only displays the relevant items. The string accords to the following syntax:
    // http://wiki.sa-mp.com/wiki/Dialog_Styles#5_-_DIALOG_STYLE_TABLIST_HEADERS
    buildContent(page) {
        const offset = (page - 1) * this.pageSize_;
        const rows = [];

        if (this.includeHeader())
            rows.push(this.columns_.join('\t'));

        for (const item of this.items_.slice(offset, offset + this.pageSize_))
            rows.push(item.labels.join('\t'));

        return rows.join('\n');
    }
};

// Maximum number of columns that can be added to a menu.
Menu.MAX_COLUMN_COUNT = 4;

// Maximum number of rows that can be displayed on a single menu page.
Menu.MAX_ROW_COUNT = 100;
