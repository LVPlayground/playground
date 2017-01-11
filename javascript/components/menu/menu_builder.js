// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The menu builder transforms the structured data in a Menu object instance to the garbage string
// that needs to be passed to SA-MP's ShowPlayerDialog().
class MenuBuilder {
  constructor(menu) {
    this.menu_ = menu;
  }

  // Determines whether the menu is a list rather than a tabbed menu. This is the case when a menu
  // only has a single (nameless) column.
  isList() {
    return this.menu_.columns_.length == 0;
  }

  // Builds the caption for the menu. The title will include page numbers when the menu has been
  // paginated over several pages in case there are more than N items.
  buildCaption() {
    // TODO(Russell): Include the page number when pagination is supported.
    return this.menu_.title_;
  }

  // Builds the content string for the menu in accordance with the syntax required for SA-MP's
  // DIALOG_STYLE_{LIST, TABLIST_HEADERS} dialog display styles.
  // http://wiki.sa-mp.com/wiki/Dialog_Styles#5_-_DIALOG_STYLE_TABLIST_HEADERS
  buildContent() {
    const rows = [];

    if (!this.isList())
      rows.push(this.menu_.columns_.join('\t'));

    // Append each of the items to the rows to print.
    this.menu_.items_.forEach(item =>
        rows.push(item.labels.join('\t')));

    return rows.join('\n');
  }
};

exports = MenuBuilder;
