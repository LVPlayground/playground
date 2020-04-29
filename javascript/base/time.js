// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Various utility methods (global) for making the `wait()` function easier to deal with.
global.milliseconds = milliseconds => wait(milliseconds);
global.seconds = seconds => wait(seconds * 1000);
global.minutes = minutes => wait(minutes * 60 * 1000);
global.hours = hours => wait(hours * 60 * 60 * 1000);

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
    const isCurrent = difference === 0;

    // Whether |date1| happened before |date2|.
    const isPast = difference < 0;

    // (1) Current time and seconds of difference
    if (absoluteDifferenceSeconds === 0)
        return { isCurrent, isPast, text: 'now' };
    else if (absoluteDifferenceSeconds === 1)
        return { isCurrent, isPast, text: '1 second' };
    else if (absoluteDifferenceSeconds < 60)
        return { isCurrent, isPast, text: `${absoluteDifferenceSeconds} seconds` };

    const absoluteDifferenceMinutes = Math.floor(absoluteDifferenceSeconds / 60);

    // (2) Difference in minutes
    if (absoluteDifferenceMinutes === 1)
        return { isCurrent, isPast, text: '1 minute' };
    else if (absoluteDifferenceMinutes < 60)
        return { isCurrent, isPast, text: `${absoluteDifferenceMinutes} minutes` };
    
    const absoluteDifferenceHours = Math.floor(absoluteDifferenceMinutes / 60);

    // (3) Difference in hours
    if (absoluteDifferenceHours === 1)
        return { isCurrent, isPast, text: '1 hour' };
    else if (absoluteDifferenceHours < 24)
        return { isCurrent, isPast, text: `${absoluteDifferenceHours} hours` };
    
    const absoluteDifferenceDays = absoluteDifferenceHours / 24;

    // (4) Difference in days
    if (absoluteDifferenceDays < 1.5)
        return { isCurrent, isPast, text: '1 day' };
    else if (absoluteDifferenceDays <= 30)
        return { isCurrent, isPast, text: `${Math.round(absoluteDifferenceDays)} days` };
    
    const absoluteDifferenceMonths = Math.max(1, Math.floor(absoluteDifferenceDays / 30.41));

    // (5) Difference in months
    if (absoluteDifferenceMonths === 1)
        return { isCurrent, isPast, text: '1 month' };
    else if (absoluteDifferenceMonths < 12)
        return { isCurrent, isPast, text: `${absoluteDifferenceMonths} months` };

    const absoluteDifferenceYears = Math.max(1, Math.floor(absoluteDifferenceDays / 365));

    // (6) Difference in years
    if (absoluteDifferenceYears === 1)
        return { isCurrent, isPast, text: '1 year' };
    
    return { isCurrent, isPast, text: `${absoluteDifferenceYears} years` };
}
