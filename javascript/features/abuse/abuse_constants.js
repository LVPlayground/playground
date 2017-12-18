// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

class AbuseConstants {}

// Converts the |number| to a string and makes sure that it has at least two digits.
function pad(number) {
    return ('0' + number).substr(-2);
}

// Formats the |time|, denoted in milliseconds, as a time span period.
function formatTimePeriod(time) {
    time = Math.floor(time / 1000);  // convert to seconds

    if (time == 1)
        return 'second';

    if (time < 60)
        return time + ' seconds';

    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    if (minutes == 1 && seconds == 0)
        return 'minute';

    if (minutes < 60) {
        if (seconds > 0)
            return minutes + ':' + pad(seconds) + ' minutes';

        return minutes + ' minutes';
    }

    const hours = Math.floor(minutes / 60);

    if (hours == 1)
        return 'hour';

    return hours + ' hours';
}

// Returns whether the |reason| is a time-limited abuse reason.
AbuseConstants.isTimeLimit = (reason) =>
    reason.includes('can only do so once per ');

// Textual descriptions about why an action has been denied.
AbuseConstants.REASON_FIRED_WEAPON = 'recently fired a weapon';
AbuseConstants.REASON_DAMAGE_ISSUED = 'recently hurt another player';
AbuseConstants.REASON_DAMAGE_TAKEN = 'recently got hurt by another player';
AbuseConstants.REASON_TIME_LIMIT = (limit) => {
    return 'can only do so once per ' + formatTimePeriod(limit);
};

export default AbuseConstants;
