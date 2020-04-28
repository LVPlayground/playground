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

// Determines whether the given |ip| would be subject to a ban on the |range|.
export function isPartOfRangeBan(ip, range) {
    const firstWildcard = range.indexOf('*');

    if (firstWildcard === -1)
        throw new Error('The |range| must include a wildcard.');
    
    const rangePrefix = range.substring(0, firstWildcard);
    return ip.startsWith(rangePrefix);
}
