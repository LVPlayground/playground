// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let StringParser = require('base/string_parser.js');

describe('StringParser', it => {
  let wordMatch = /^\s*(.+?)(?!\S)/;

  // Parser that returns the length of the passed argument.
  let wordLengthParser = argumentString => {
    let result = wordMatch.exec(argumentString);
    if (!result)
      return [argumentString, null];

    return [argumentString.substr(result[0].length), result[1].length];
  };

  it('validates the parameters', assert => {
    assert.throws(() => new StringParser({}));
    assert.throws(() => new StringParser([{ noType: true }]));

    assert.doesNotThrow(() => new StringParser(null));
    assert.doesNotThrow(() => new StringParser([]));
    assert.doesNotThrow(() => new StringParser([ StringParser.PARAM_TYPE_NUMBER ]));

    // Using an invalid parameter type should throw an exception.
    assert.throws(() => new StringParser([ 42 ]));

    // Using a custom parameter type requires a `parser` constructor to be set.
    assert.throws(() => new StringParser([ StringParser.PARAM_TYPE_CUSTOM ]));
    assert.doesNotThrow(() =>
        new StringParser([{ type: StringParser.PARAM_TYPE_CUSTOM, parser: function MyParser() {} }]));

    // It's not allowed for there to be any parameters after a SENTENCE one.
    assert.throws(() => new StringParser([ StringParser.PARAM_TYPE_SENTENCE,
                                           StringParser.PARAM_TYPE_NUMBER ]));

    // It's not allowed for required parameters to follow optional ones.
    assert.throws(() => new StringParser([{ type: StringParser.PARAM_TYPE_NUMBER, required: false },
                                          StringParser.PARAM_TYPE_NUMBER ]));
  });

  it('validates and parses number parameters', assert => {
    let parser = null;
    
    parser = new StringParser([ StringParser.PARAM_TYPE_NUMBER ]);

    assert.deepEqual(parser.parse('42'), [42]);
    assert.deepEqual(parser.parse('-42'), [-42]);
    assert.deepEqual(parser.parse('42.50'), [42.50]);
    assert.deepEqual(parser.parse('-42.50'), [-42.50]);
    assert.deepEqual(parser.parse('   52   '), [52]);
    assert.deepEqual(parser.parse('0'), [0]);

    assert.isNull(parser.parse());
    assert.isNull(parser.parse(null));
    assert.isNull(parser.parse(''));
    assert.isNull(parser.parse('10w'));
    assert.isNull(parser.parse('fifty'));

    parser = new StringParser([ StringParser.PARAM_TYPE_NUMBER,
                                StringParser.PARAM_TYPE_NUMBER ]);

    assert.deepEqual(parser.parse('50 62'), [50, 62]);
    assert.deepEqual(parser.parse('50 62 trailing text'), [50, 62]);
    assert.deepEqual(parser.parse('   62   72'), [62, 72]);
    assert.deepEqual(parser.parse('81  12  '), [81, 12]);
    assert.deepEqual(parser.parse('  80.12  -52.12  '), [80.12, -52.12]);

    assert.isNull(parser.parse('50 word'));
    assert.isNull(parser.parse('word 50'));
  });

  it('validates and parses word parameters', assert => {
    let parser = null;

    parser = new StringParser([ StringParser.PARAM_TYPE_WORD ]);

    assert.deepEqual(parser.parse('Hello world!'), ['Hello']);
    assert.deepEqual(parser.parse('ლ,ᔑ•ﺪ͟͠•ᔐ.ლ'), ['ლ,ᔑ•ﺪ͟͠•ᔐ.ლ']);
    assert.deepEqual(parser.parse('  42  '), ['42']);
    assert.deepEqual(parser.parse('some'), ['some']);
    assert.deepEqual(parser.parse('52.12'), ['52.12']);
    assert.deepEqual(parser.parse('_'), ['_']);

    assert.isNull(parser.parse());
    assert.isNull(parser.parse(null));
    assert.isNull(parser.parse(''));

    parser = new StringParser([ StringParser.PARAM_TYPE_WORD,
                                StringParser.PARAM_TYPE_WORD ]);

    assert.deepEqual(parser.parse('Hello world!'), ['Hello', 'world!']);
    assert.deepEqual(parser.parse(' 42  52'), ['42', '52']);
    assert.deepEqual(parser.parse('~today    rain~'), ['~today', 'rain~']);
    assert.deepEqual(parser.parse('12.5 world'), ['12.5', 'world']);

    assert.isNull(parser.parse('word'));
  });

  it('validates and parses sentence parameters', assert => {
    let parser = null;

    parser = new StringParser([ StringParser.PARAM_TYPE_SENTENCE ]);

    assert.deepEqual(parser.parse('Las'), ['Las']);
    assert.deepEqual(parser.parse(' Las Venturas '), ['Las Venturas']);
    assert.deepEqual(parser.parse('  Las  Venturas  Playground  '), ['Las  Venturas  Playground']);

    assert.isNull(parser.parse());
    assert.isNull(parser.parse(null));
    assert.isNull(parser.parse(' '));
  });

  it('validates and parses custom parameters', assert => {
    let parser = null;

    parser = new StringParser([
        { type: StringParser.PARAM_TYPE_CUSTOM, parser: wordLengthParser }
    ]);

    assert.deepEqual(parser.parse('foo'), [3]);
    assert.deepEqual(parser.parse('Russell'), [7]);
    assert.deepEqual(parser.parse('Venturas Playground'), [8]);

    assert.isNull(parser.parse());
    assert.isNull(parser.parse(null));
    assert.isNull(parser.parse(''));
  });

  it('validates and parses mixed parameters', assert => {
    let parser = null;

    parser = new StringParser([
        { type: StringParser.PARAM_TYPE_NUMBER },
        { type: StringParser.PARAM_TYPE_WORD },
        { type: StringParser.PARAM_TYPE_CUSTOM, parser: wordLengthParser },
        { type: StringParser.PARAM_TYPE_SENTENCE }
    ]);

    assert.deepEqual(parser.parse('42 word value more text'), [42, 'word', 5, 'more text']);
    assert.deepEqual(parser.parse(' 24  text  Venturas  some more'), [24, 'text', 8, 'some more']);
    assert.deepEqual(parser.parse('-41.41  _  _  hi'), [-41.41, '_', 1, 'hi']);

    assert.isNull(parser.parse());
    assert.isNull(parser.parse('text'));
    assert.isNull(parser.parse('42 41 40'));
    assert.isNull(parser.parse('text text text hello world'));
  });

  it('allows missing optional arguments', assert => {
    let parser = null;

    parser = new StringParser([
        { type: StringParser.PARAM_TYPE_NUMBER },
        { type: StringParser.PARAM_TYPE_SENTENCE, required: false }
    ]);

    assert.deepEqual(parser.parse('42 foo'), [42, 'foo']);
    assert.deepEqual(parser.parse('42'), [42]);

    assert.isNull(parser.parse(''));
    assert.isNull(parser.parse('word'));
    assert.isNull(parser.parse('word foo'));
  });
});
