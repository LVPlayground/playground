// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { arrayBufferToFormData } from 'components/networking/form_data.js';
import { utf8BufferToString } from 'components/networking/utf-8.js';

// Implementation of the Body mixin of the Fetch API. We don't support mixins in our environment,
// so therefore use this as a base class instead.
// https://fetch.spec.whatwg.org/#body
export class Body {
    #body_ = null;

    constructor(data = null) {
        if (!data) {
            this.#body_ = new ArrayBuffer();
        } else {
            if (typeof data === 'ArrayBuffer')
                this.#body_ = data;
            else if (ArrayBuffer.isView(data))
                this.#body_ = data.buffer;
            else
                throw new Error(`Expecting an ArrayBuffer/View when constructing data.`);
        }
    }

    // Body.body accessor
    get body() {
        throw new Error(`Please use one of the following methods instead: arrayBuffer(), ` +
                        `blob(), formData(), json() or text().`);
    }

    // Body.bodyUsed accessor
    // Note that we allow a body to be consumed multiple times because streams are not supported, so
    // this accessor will always return false.
    get bodyUsed() { return false; }

    async arrayBuffer() { return this.#body_.slice(); }

    async blob() { throw new Error(`Blobs are not supported in LVP code.`); }

    async formData() { return arrayBufferToFormData(this.#body_); }

    async json() { return JSON.parse(await this.text()); }

    async text() { return utf8BufferToString(this.#body_); }
}
