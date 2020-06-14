// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { formatDate, from, fromNow, to, toNow } from 'base/time.js';

describe('Time', it => {
    it('is able to format dates for display', async (assert) => {
        assert.equal(formatDate(new Date('xxx')), '[invalid date]');
        assert.equal(formatDate(new Date('2020-05-01 14:12:15')), 'May 1, 2020');
        assert.equal(formatDate(new Date('2020-01-11 10:01:12')), 'January 11, 2020');
        assert.equal(formatDate(new Date('2019-12-30 22:15:11')), 'December 30, 2019');

        assert.equal(formatDate(new Date('2020-05-01 14:12:15'), true),
                     'May 1, 2020 at 2:12 PM');
        assert.equal(formatDate(new Date('2020-01-11 10:01:12'), true),
                     'January 11, 2020 at 10:01 AM');
        assert.equal(formatDate(new Date('2019-12-30 22:15:11'), true),
                     'December 30, 2019 at 10:15 PM');
    });

    it('should be able to format relative times', assert => {
        const baseDate = new Date();
        const baseTime = baseDate.getTime();

        function futureSeconds(sec) { return new Date(baseTime + sec * 1000); }
        function futureMinutes(min) { return futureSeconds(min * 60); }
        function futureHours(hours) { return futureMinutes(hours * 60); }
        function futureDays(days) { return futureHours(days * 24); }
        function futureMonths(months) { return futureDays(months * 30.42); }
        function futureYears(years) { return futureDays(years * 365); }

        function pastSeconds(sec) { return new Date(baseTime - sec * 1000); }
        function pastMinutes(min) { return pastSeconds(min * 60); }
        function pastHours(hours) { return pastMinutes(hours * 60); }
        function pastDays(days) { return pastHours(days * 24); }
        function pastMonths(months) { return pastDays(months * 30.42); }
        function pastYears(years) { return pastDays(years * 365); }

        assert.throws(() => toNow({ date: futureHours(1) }));
        assert.throws(() => fromNow({ date: futureHours(1) }));

        assert.equal(to({ date1: baseDate, date2: baseDate }), 'now');
        assert.equal(to({ date1: baseDate, date2: futureSeconds(1) }), 'in 1 second');
        assert.equal(to({ date1: baseDate, date2: futureSeconds(2) }), 'in 2 seconds');
        assert.equal(to({ date1: baseDate, date2: futureSeconds(59) }), 'in 59 seconds');
        assert.equal(to({ date1: baseDate, date2: futureMinutes(1) }), 'in 1 minute');
        assert.equal(to({ date1: baseDate, date2: futureMinutes(2) }), 'in 2 minutes');
        assert.equal(to({ date1: baseDate, date2: futureMinutes(59) }), 'in 59 minutes');
        assert.equal(to({ date1: baseDate, date2: futureHours(1) }), 'in 1 hour');
        assert.equal(to({ date1: baseDate, date2: futureHours(2) }), 'in 2 hours');
        assert.equal(to({ date1: baseDate, date2: futureHours(23) }), 'in 23 hours');
        assert.equal(to({ date1: baseDate, date2: futureDays(1) }), 'in 1 day');
        assert.equal(to({ date1: baseDate, date2: futureDays(2) }), 'in 2 days');
        assert.equal(to({ date1: baseDate, date2: futureDays(30) }), 'in 30 days');
        assert.equal(to({ date1: baseDate, date2: futureMonths(1) }), 'in 1 month');
        assert.equal(to({ date1: baseDate, date2: futureMonths(2) }), 'in 2 months');
        assert.equal(to({ date1: baseDate, date2: futureMonths(11) }), 'in 11 months');
        assert.equal(to({ date1: baseDate, date2: futureYears(1) }), 'in 1 year');
        assert.equal(to({ date1: baseDate, date2: futureYears(2) }), 'in 2 years');

        assert.equal(from({ date1: baseDate, date2: baseDate }), 'now');
        assert.equal(from({ date1: baseDate, date2: pastSeconds(1) }), '1 second ago');
        assert.equal(from({ date1: baseDate, date2: pastSeconds(2) }), '2 seconds ago');
        assert.equal(from({ date1: baseDate, date2: pastSeconds(59) }), '59 seconds ago');
        assert.equal(from({ date1: baseDate, date2: pastMinutes(1) }), '1 minute ago');
        assert.equal(from({ date1: baseDate, date2: pastMinutes(2) }), '2 minutes ago');
        assert.equal(from({ date1: baseDate, date2: pastMinutes(59) }), '59 minutes ago');
        assert.equal(from({ date1: baseDate, date2: pastHours(1) }), '1 hour ago');
        assert.equal(from({ date1: baseDate, date2: pastHours(2) }), '2 hours ago');
        assert.equal(from({ date1: baseDate, date2: pastHours(23) }), '23 hours ago');
        assert.equal(from({ date1: baseDate, date2: pastDays(1) }), '1 day ago');
        assert.equal(from({ date1: baseDate, date2: pastDays(2) }), '2 days ago');
        assert.equal(from({ date1: baseDate, date2: pastDays(30) }), '30 days ago');
        assert.equal(from({ date1: baseDate, date2: pastMonths(1) }), '1 month ago');
        assert.equal(from({ date1: baseDate, date2: pastMonths(2) }), '2 months ago');
        assert.equal(from({ date1: baseDate, date2: pastMonths(11) }), '11 months ago');
        assert.equal(from({ date1: baseDate, date2: pastYears(1) }), '1 year ago');
        assert.equal(from({ date1: baseDate, date2: pastYears(2) }), '2 years ago');
    });
});
