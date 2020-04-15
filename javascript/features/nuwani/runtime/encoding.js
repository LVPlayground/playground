export function stringToUtf8Buffer(string) {
    return ToUTF8(FromString(string));
}

export function utf8BufferToString(buffer) {
    return ToString(FromUTF8(buffer));
}

/**
 * @license
 * UTF.js
 * https://github.com/DesWurstes/utf.js
 * Copyright (c) 2018 DesWurstes MIT License
 */

function FromString(d){for(var f=d.length,c=new Uint16Array(f),a=0;a<f;a++)c[a]=d.charCodeAt(a);return FromUTF16(c)}
function FromUTF8(d){for(var f=d.length,c=new Uint32Array(f),a=0,e=0;e<f;e++,a++){var b=d[e];if(0==(b&128))c[a]=b;else{if(0==(b&64))return[];e++;var g=d[e];if(0==(b&32)){c[a]=(b&31)<<6|g&63;if(128==(g&192))continue;return[]}e++;var h=d[e];if(0==(b&16)){c[a]=(b&15)<<12|(g&63)<<6|h&63;if(128==(g&192)&&128==(h&192))continue;return[]}e++;var k=d[e];if(0==(b&8)&&(c[a]=(b&7)<<18|(g&63)<<12|(h&63)<<6|k&63,128==(g&192)&&128==(h&192)&&128==(k&192)))continue;return[]}}return c.slice(0,a)}
function FromUTF16(d){for(var f=d.length,c=new Uint32Array(f),a=0,e=0;e<f;e++,a++){var b=d[e];if(55296>b||57344<=b)c[a]=b;else{e++;var g=d[e];if(56320<=b||56320>g)return[];c[a]=(b-55296<<10)+g+9216}}return c.slice(0,a)}
function ToString(d){d=ToUTF16(d);for(var f=d.length,c="",a=0;a<f;a++)c+=String.fromCharCode(d[a]);return c}
function ToUTF8(d){for(var f=d.length,c=new Uint8Array(f<<2),a=0,e=0;e<f;e++,a++){var b=d[e];if(128>b)c[a]=b;else if(2048>b)c[a]=b>>>6|192,a++,c[a]=b&63|128;else if(65536>b)c[a]=b>>>12|224,a++,c[a]=b>>>6&63|128,a++,c[a]=b&63|128;else if(1114112>b)c[a]=b>>>18|240,a++,c[a]=b>>>12&63|128,a++,c[a]=b>>>6&63|128,a++,c[a]=b&63|128;else return[]}return c.slice(0,a)}
function ToUTF16(d){for(var f=d.length,c=new Uint16Array(f<<1),a=0,e=0;e<f;e++,a++){var b=d[e];if(55296>b||57344<=b&&65536>b)c[a]=b;else{if(55296<=b&&57344>b)return[];b-=65536;c[a]=(b>>>10)+55296;a++;c[a]=(b&1023)+56320}}return c.slice(0,a)};
