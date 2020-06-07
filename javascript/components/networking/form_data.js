// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { encode, generateBoundary, quote } from 'components/networking/html_encoding.js';
import { stringToUtf8Buffer } from 'components/networking/utf-8.js';

// Converts the given |formData| to an ArrayBuffer containing the encoded data for the fields stored
// in the |formData|. This will be recognised by servers, and populates e.g. PHP's $_POST and
// $_FILES array as you would expect.
export function formDataToArrayBuffer(formData) {
    const boundary = generateBoundary();
    const formDataArray = Array.from(formData);

    // Include all the uploaded files to the |formDataArray| as well, omitted during iteration.
    for (const [ name, fileInfo ] of formData.files)
        formDataArray.push([ name, fileInfo ]);

    let data = '';
    for (let index = 0; index < formDataArray.length; ++index) {
        const [ name, value ] = formDataArray[index];

        data += `--${boundary}\r\n`;
        data += `Content-Disposition: form-data; name="${quote(name)}"`;
        if (typeof value !== 'string') {
            data += `; filename="${encode(value.filename)}"`;
            data += `\r\nContent-Type: ${value.contentType}`;
        }

        data += `\r\n\r\n`;
        data += typeof value === 'string' ? value : value.content;
        data += `\r\n`;
    }

    data += `--${boundary}--\r\n`;

    return { boundary, data: stringToUtf8Buffer(data) };
}

// Implements the FormData Web interface. Note that, unlike `Headers`, names are case sensitive.
// https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData
export class FormData {
    #data_ = new Map();
    #files_ = new Map();

    // Appends the |value| to the data identified by the given |name|.
    append(name, value) {
        const data = this.#data_.get(name);
        if (!data)
            return this.set(name, value);
        
        data.add(String(value));
    }

    // Proprietary to LVP:
    // Appends the given |filename| with the given |content| to the form data. This will be sent
    // to the server, so that it perceives this data as a file upload.
    appendFile(name, filename, content, contentType = 'application/octet-stream') {
        this.#files_.set(name, { filename, content, contentType });
    }

    // Deletes all known data with the given |name|.
    delete(name) { this.#data_.delete(name); }

    // Returns the first value for entries with the given |name|.
    get(name) {
        const data = this.#data_.get(name);
        if (!data)
            return undefined;
        
        return Array.from(data).shift();
    }

    // Returns a sequence with all values for the given |name|.
    getAll(name) {
        const data = this.#data_.get(name);
        const result = [];
        
        if (!data)
            return result;
        
        for (const value of data)
            result.push(value);
        
        return result;
    }

    // Returns whether this object contains an entry with the given |name|.
    has(name) { return this.#data_.has(name); }

    // Sets the data with the given |name| to |value|.
    set(name, value) { this.#data_.set(name, new Set([ String(value) ])); }

    // Proprietary to LVP:
    // Gets an iterator to all the file information stored in this FormData instance.
    get files() { return this.#files_; }

    // Enables iteration over all of the FormData values.
    *[Symbol.iterator]() {
        for (const [ name, values ] of this.#data_) {
            for (const value of values)
                yield [ name, value ];
        }
    }
}
