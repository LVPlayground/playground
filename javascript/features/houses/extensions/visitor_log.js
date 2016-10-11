// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const HouseExtension = require('features/houses/house_extension.js');
const Menu = require('components/menu/menu.js');
const MessageBox = require('components/dialogs/message_box.js');

// Time, in milliseconds, to ignore players re-entering a house.
const REENTRY_IGNORE_TIME_MS = 5 * 60 * 1000;

// All visitors to houses are logged, and VIPs have the ability to display a log with the most
// recent visitors to their houses. This extension implements that functionality.
class VisitorLog extends HouseExtension {
    constructor(manager) {
        super();

        this.manager_ = manager;

        // Map of players to a weak set of locations they've visited in the past five minutes. Will
        // be automagically pruned by the onPlayerEnterHouse observer.
        this.recentVisitors_ = new WeakMap();
    }

    // Adds a Visitor Log option to the `/house settings` menu if the |player| is a VIP.
    onHouseSettingsCommand(player, location, menu) {
        if (!player.isVip())
            return;

        menu.addItem('Recent visitors {FFFF00}**', '-', async(player) => {
            const logs = await this.manager_.database.readVisitorLogs(location, 20 /* count */,
                                                                      true /* ignoreOwner */);

            // Bail out if nobody has visited this |location| yet, except for the owner.
            if (!logs.length) {
                return await MessageBox.display(player, {
                    title: 'You haven\'t had any visitors yet!',
                    message: Message.HOUSE_SETTINGS_NO_VISITORS
                });
            }

            const visitorMenu = new Menu('List of most recent visitors', ['Name', 'Visited']);

            logs.forEach(entry =>
                visitorMenu.addItem(entry.name, this.formatVisitDate(entry.date)));

            await visitorMenu.displayForPlayer(player);
        });
    }

    // Formats the |date|, which is a UNIX timetamp in second granularity, in a representation that
    // is relative to the server's current time.
    formatVisitDate(date) {
        const seconds = Math.floor(server.clock.currentTime() / 1000) - date;

        // Handle clock skew by the server, which isn't likely, but may happen.
        if (seconds < 0)
            return 'In the future!';

        // Handle visits that have occurred less than two minutes ago, which we consider to be now.
        if (seconds < 60)
            return "Just now!";

        // Otherwise, create separate buckets for minutes, hours, days, weeks, months and years.
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60)
            return minutes + ' minute' + (minutes == 1 ? '' : 's') + ' ago';

        const hours = Math.floor(minutes / 60);
        if (hours < 24)
            return hours + ' hour' + (hours == 1 ? '' : 's') + ' ago';

        const days = Math.floor(hours / 24);
        if (days < 7)
            return days + ' day' + (days == 1 ? '' : 's') + ' ago';

        const weeks = Math.floor(days / 7);
        if (weeks <= 4 && days < 30.25)
            return weeks + ' week' + (weeks == 1 ? '' : 's') + ' ago';

        const months = Math.floor(days / 30.25);
        if (months < 12)
            return months + ' month' + (months == 1 ? '' : 's') + ' ago';

        const years = Math.floor(months / 12);
        return years + ' year' + (years == 1 ? '' : 's') + ' ago';
    }

    // Called when the |player| has visited the |location|. Will be logged in the database. In order
    // to avoid somebody spamming a visitor log, re-entries will be ignored for a period of time.
    onPlayerEnterHouse(player, location) {
        if (!player.isRegistered())
            return;  // unregistered players should not be able to enter houses

        if (player.isUndercover())
            return;  // undercover administrators won't be logged

        if (!this.recentVisitors_.has(player))
            this.recentVisitors_.set(player, new WeakSet());

        const entries = this.recentVisitors_.get(player);
        if (entries.has(location))
            return;  // the |player| visited the |location| recently

        entries.add(location);

        // Automatically remove the |location| after |REENTRY_IGNORE_TIME_MS| milliseconds.
        wait(REENTRY_IGNORE_TIME_MS).then(() => entries.delete(location));

        this.manager_.database.createHouseVisitorLog(location, player);
    }
}

exports = VisitorLog;
