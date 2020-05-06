// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import 'base/index.d.ts';

declare global {
    // Global functions provided by PlaygroundJS.
    function addEventListener(event: string, listener: Function): void;
    function highResolutionTime(): number;
    function readFile(filename: string): string;
    function removeEventListener(event: string, listener: Function): void;
    function wait(milliseconds: number): Promise<void>;

    interface Server {
        isTest(): boolean;
    }

    let server: Server;
}

export { };
