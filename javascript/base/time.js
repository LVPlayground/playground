// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Returns a formatted version of the given |date|. If |includeTime| is given, the time will be
// included in the output as well.
//
//   January 9, 2020
//   January 9, 2020 at 1:51 PM
export function formatDate(date, includeTime = false) {
    const kMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
                        'September', 'October', 'November', 'December'];

    if (Number.isNaN(date.getTime()))
        return '[invalid date]';

    let formattedDate = `${kMonths[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    if (includeTime) {
        let hour, suffix;
        if (date.getHours() === 0)
            [hour, suffix] = [12, 'AM'];
        else if (date.getHours() < 12)
            [hour, suffix] = [date.getHours(), 'AM'];
        else if (date.getHours() === 12)
            [hour, suffix] = [12, 'PM'];
        else
            [hour, suffix] = [date.getHours() - 12, 'PM'];

        formattedDate += ` at ${hour}:${('0' + date.getMinutes()).substr(-2)} ${suffix}`
    }

    return formattedDate;
}

// Utility function for formatting "time since", e.g. a difference of 60 seconds ending up being a
// string that says "1 minute ago". The |suffix| is optional, but included by default.
export function fromNow({ date, suffix = true } = {}) {
    return from({ date1: new Date(), date2: date, suffix });
}

// Utility function that formats the "time since" between |date1| and |date2|. If |date1| happened
// after |date2|, an exception will be thrown. Use `relativeTime` if you don't care.
export function from({ date1, date2, suffix = true } = {}) {
    const relative = relativeTime({ date1, date2 });
    if (!relative.isPast && !relative.isCurrent)
        throw new Error('Cannot use `from` and `fromNow` for dates in the future.');
    
    if (suffix && !relative.isCurrent)
        return relative.text + ' ago';
    else
        return relative.text;
}

// Utility function for formatting "time to", e.g. a difference of 60 seconds ending up being a
// string that says "in 1 minute". The |prefix| is optional, but included by default.
export function toNow({ date, prefix = true } = {}) {
    return to({ date1: date, date2: new Date(), prefix });
}

// Utility function that formats the "time to" between |date1| and |date2|. If |date1| happened
// before |date2|, an exception will be thrown. Use `relativeTime` if you don't care.
export function to({ date1, date2, prefix = true } = {}) {
    const relative = relativeTime({ date1, date2 });
    if (relative.isPast && !relative.isCurrent)
        throw new Error('Cannot use `to` and `toNow` for dates in the past.');

    if (prefix && !relative.isCurrent)
        return 'in ' + relative.text;
    else
        return relative.text;
}

// Calculates the relative time between |date1| and |date2| in textual format. Both of the date
// arguments should be instances of the JavaScript Date object.
export function relativeTime({ date1, date2 }) {
    if (!(date1 instanceof Date) || !(date2 instanceof Date))
        throw new Error('Input dates must be instances of the JavaScript Date object.');

    const difference = date2.getTime() - date1.getTime();
    const absoluteDifference = Math.abs(difference);
    const absoluteDifferenceSeconds = Math.floor(absoluteDifference / 1000);

    // Whether |date1| and |date2| happened at the same moment.
    const isCurrent = absoluteDifferenceSeconds === 0;

    // Whether |date1| happened before |date2|.
    const isPast = difference < 0;

    return { isCurrent, isPast, text: timeDifferenceToString(absoluteDifferenceSeconds) };
}

// Converts the |difference|, in seconds, to a string representing that value.
export function timeDifferenceToString(difference) {
    const absoluteDifferenceSeconds = Math.abs(difference);

    if (absoluteDifferenceSeconds === 0)
        return 'now';
    else if (absoluteDifferenceSeconds === 1)
        return '1 second';
    else if (absoluteDifferenceSeconds < 60)
        return `${absoluteDifferenceSeconds} seconds`;

    const absoluteDifferenceMinutes = Math.floor(absoluteDifferenceSeconds / 60);

    // (2) Difference in minutes
    if (absoluteDifferenceMinutes === 1)
        return '1 minute';
    else if (absoluteDifferenceMinutes < 60)
        return `${absoluteDifferenceMinutes} minutes`;
    
    const absoluteDifferenceHours = Math.floor(absoluteDifferenceMinutes / 60);

    // (3) Difference in hours
    if (absoluteDifferenceHours === 1)
        return '1 hour';
    else if (absoluteDifferenceHours < 24)
        return `${absoluteDifferenceHours} hours`;
    
    const absoluteDifferenceDays = absoluteDifferenceHours / 24;

    // (4) Difference in days
    if (absoluteDifferenceDays < 1.5)
        return '1 day';
    else if (absoluteDifferenceDays <= 30)
        return `${Math.round(absoluteDifferenceDays)} days`;
    
    const absoluteDifferenceMonths = Math.max(1, Math.floor(absoluteDifferenceDays / 30.41));

    // (5) Difference in months
    if (absoluteDifferenceMonths === 1)
        return '1 month';
    else if (absoluteDifferenceMonths < 12)
        return `${absoluteDifferenceMonths} months`;

    const absoluteDifferenceYears = Math.max(1, Math.floor(absoluteDifferenceDays / 365));

    // (6) Difference in years
    if (absoluteDifferenceYears === 1)
        return '1 year';
    
    return `${absoluteDifferenceYears} years`;
}

// Formats |time|. Anything under an hour will be formatted as MM:SS, whereas values over an hour
// will be formatted as HH:MM:SS instead. Non-numeric values will be returned as-is.
export function formatTime(time) {
    if (typeof time !== 'number')
        return time;

    let seconds = Math.floor(time % 60);
    let minutes = Math.floor(time / 60) % 60;
    let hours = Math.floor(time / 3600);

    let representation = '';

    if (hours > 0)
        representation += (hours < 10 ? '0' : '') + hours + ':';

    representation += (minutes < 10 ? '0' : '') + minutes + ':';
    representation += (seconds < 10 ? '0' : '') + seconds;

    return representation;
}
