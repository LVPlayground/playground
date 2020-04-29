// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Validates the |text| as a valid IP address, and converts it to a number.
export function ip2long(text) {
    const parts = text.split('.');
    if (parts.length !== 4)
        throw new Error(`"${text}" is not a valid IP address.`);
    
    let numericParts = [];
    for (const part of parts) {
        if (!/^([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])$/.test(part))
            throw new Error(`"${text}" is not a valid IP address.`);
        
        numericParts.push(parseInt(part, 10));
    }

    return numericParts[0] * 16777216 +
           numericParts[1] * 65536 +
           numericParts[2] * 256 +
           numericParts[3];
}

// Converts the |value|, which must be a number, to an IP address.
export function long2ip(value) {
    if (typeof value !== 'number')
        throw new Error(`Expected a number, got a ${typeof value} instead.`);

    return [
        value >>> 24 & 0xFF,
        value >>> 16 & 0xFF,
        value >>>  8 & 0xFF,
        value        & 0xFF
    ].join('.');
}

// Returns whether the |value| describes a valid IP address.
export function isIpAddress(value) {
    return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value);
}

// Returns whether the |value| describes a valid IP range.
export function isIpRange(value) {
    return /^(\*|25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(\*|25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(\*|25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.\*$/.test(value);
}

// Converts the difference between |firstIp| and |lastIp| to a range ("8.8.*.*"). This requires
// that |firstIp| is in the format of "8.8.0.0", and |lastIp| is in the format of "8.8.255.255".
export function rangeToText(firstIp, lastIp) {
    let firstOctets = firstIp.split('.');
    let lastOctets = lastIp.split('.');

    if (firstOctets.length !== 4)
        throw new Error(`Invalid IP address given: ${firstIp}.`);
    if (lastOctets.length !== 4)
        throw new Error(`Invalid IP address given: ${lastIp}.`);

    let result = firstOctets.slice(0, 4);
    for (let octet = 0; octet < 4; ++octet) {
        if (firstOctets[octet] === lastOctets[octet])
            continue;  // already in |result|
        else if (firstOctets[octet] === '0' && lastOctets[octet] === '255')
            result[octet] = '*';  // a range
        else
            throw new Error(`Unable to determine range between ${firstIp} and ${lastIp}.`);
    }

    return result.join('.');
}

// Determines whether the given |ip| would be subject to a ban on the |range|.
export function isPartOfRangeBan(ip, range) {
    const firstWildcard = range.indexOf('*');

    if (firstWildcard === -1)
        throw new Error('The |range| must include a wildcard.');
    
    const rangePrefix = range.substring(0, firstWildcard);
    return ip.startsWith(rangePrefix);
}
