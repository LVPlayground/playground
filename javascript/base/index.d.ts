// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

declare module 'base/case_insensitive_map.js' {
    export class CaseInsensitiveMap {
        size: number;

        clear(): void;
        entries(): IterableIterator<[any, any]>;
        forEach(callbackFn, thisArg): void;
        keys(): Iterable<any>;
        values(): Iterable<any>;
        [Symbol.iterator]();

        delete(key): void;
        get(key): any;
        has(key): boolean;
        set(key, value): void;
    }
}

declare module 'base/color.js' {
    export default class Color {
        static BLUE: Color;
        static GREEN: Color;
        static RED: Color;
        static WHITE: Color;
        static YELLOW: Color;

        static fromRGB(r: number, g: number, b: number): Color;
        static fromRGBA(r: number, g: number, b: number, a: number): Color;
        static fromNumberRGB(number: number): Color;
        static fromNumberRGBA(number: number): Color;
        static fromHex(hex: string) : Color;

        private constructor(privateSymbol: never, r: number, g: number, b: number, a: number);

        r: number;
        g: number;
        b: number;
        a: number;

        toNumberRGB(): number;
        toNumberRGBA(): number;
        toHexRGB(): string;
        toHexRGBA(): string;
    }
}

declare module 'base/float.js' {
    export function toFloat(value: number): number;
}

declare module 'base/message.js' {
    export default class Message {
        // We need static indexes to support the messages we populate on the Message object.
        // https://github.com/microsoft/TypeScript/pull/37797

        static filter(message: string): string;
        static format(message: string, ...parameters: any): string;
        static loadMessages(): void;
        static reloadMessages(): void;
    }
}

declare module 'base/murmur3hash.js' {
    export function murmur3hash(input: string): number;
}

declare module 'base/priority_queue.js' {
    type ComperatorFunction = (left: any, right: any) => number;
    export default class PriorityQueue {
        constructor(comparator: ComperatorFunction);

        isEmpty(): boolean;

        sizeNew: number;

        push(...values: any): void;
        peek(): any;
        pop(): any;
        size(): number;
        delete(value: any): boolean;
        clear(): void;
    }
}

declare module 'base/rect.js' {
    export default class Rect {
        constructor(minX: number, minY: number, maxX: number, maxY: number);

        minX: number;
        minY: number;
        maxX: number;
        maxY: number;

        width: number;
        height: number;
        circumference: number;
        area: number;

        center: [ number, number ];
        topLeft: [ number, number ];
        topRight: [ number, number ];
        bottomLeft: [ number, number ];
        bottomRight: [ number, number ];

        extend(units: number, unitsVertical?: number): Rect;
        shrink(units: number, unitsVertical?: number): Rect;
    }
}

declare module 'base/scoped_callbacks.js' {
    export default class ScopedCallbacks {
        constructor();

        addEventListener(eventType: string, listener: Function): void;
        dispose(): void;
    }
}

declare module 'base/string_formatter.js' {
    export function format(message: string, ...parameters: any): string;
    export function formatNumber(value: number): string;
    export function formatPrice(value: number): string;
    export function formatTime(time: number): string;
}

declare module 'base/supplementable.js' {
    export class Supplement {}
    export class Supplementable {
        static provideSupplement(accessorName: string, supplementConstructor: Function, ...constructorArgs: any);
    }
}

declare module 'base/time.js' {
    type RelativeOptions = { date1: Date; date2: Date; suffix?: boolean; }
    type RelativeToNowOptions = { date: Date; suffix?: boolean; }

    export function fromNow(options: RelativeToNowOptions);
    export function from(options: RelativeOptions);
    export function toNow(options: RelativeToNowOptions);
    export function to(options: RelativeOptions);
    export function relativeTime(options: { date1: Date, date2: Date });
}

declare module 'base/vector.js' {
    interface VectorXYZ {
        x?: number;
        y?: number;
        z?: number;
    }

    export class Vector {
        constructor(x: number, y: number, z: number);

        x: number;
        y: number;
        z: number;

        closeTo(vector: Vector, maxDistance?: number);
        distanceTo2D(vector: Vector);
        squaredDistanceTo2D(vector: Vector);
        distanceTo(vector: Vector);
        squaredDistanceTo(vector: Vector);
        translateTo2D(distance: number, angle: number);
        translate(offset?: VectorXYZ);

        magnitude2D: number;
        magnitude: number;
        normalized2D: Vector;
        normalized: Vector;
    }
}
