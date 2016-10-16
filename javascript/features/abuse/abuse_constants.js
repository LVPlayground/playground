// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

class AbuseConstants {}

// Textual descriptions about why an action has been denied.
AbuseConstants.REASON_FIRED_WEAPON = 'recently fired a weapon';
AbuseConstants.REASON_DAMAGE_ISSUED = 'recently hurt another player';
AbuseConstants.REASON_DAMAGE_TAKEN = 'recently got hurt by another player';
AbuseConstants.REASON_TIME_LIMIT = 'can only teleport once three minutes';

exports = AbuseConstants;
