// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import HouseExtension from 'features/houses/house_extension.js';
import Menu from 'components/menu/menu.js';
import MessageBox from 'components/dialogs/message_box.js';

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
                visitorMenu.addItem(
                    entry.name,
                    server.clock.formatRelativeTime(entry.date, { allowFutureTimes: false })
                ));

            await visitorMenu.displayForPlayer(player);
        });
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

export default VisitorLog;
