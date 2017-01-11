// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Menu = require('components/menu/menu.js');

const DIALOG_STYLE_LIST = 2;
const DIALOG_STYLE_TABLIST_HEADERS = 5;

describe('Menu', it => {
    it('should support up to four columns', assert => {
        assert.doesNotThrow(() => new Menu('My Menu'));
        assert.doesNotThrow(() => new Menu('My Menu', ['Foo']));
        assert.doesNotThrow(() => new Menu('My Menu', ['Foo', 'Bar']));
        assert.doesNotThrow(() => new Menu('My Menu', ['Foo', 'Bar', 'Baz']));
        assert.doesNotThrow(() => new Menu('My Menu', ['Foo', 'Bar', 'Baz', 'Qux']));
        assert.throws(() => {
            new Menu('My Menu', ['Foo', 'Bar', 'Baz', 'Qux', 'Moo']);
        });
    });

    it('should support page sizes between 1 and 100 rows', assert => {
        assert.doesNotThrow(() => new Menu('My Menu', [], { pageSize:   1 }));
        assert.doesNotThrow(() => new Menu('My Menu', [], { pageSize:  50 }));
        assert.doesNotThrow(() => new Menu('My Menu', [], { pageSize: 100 }));

        assert.throws(() => {
            new Menu('My Menu', [], { pageSize: 0 });
        });

        assert.throws(() => {
            new Menu('My Menu', [], { pageSize: 101 });
        });
    });

    it('should throw for invalid user input', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        const menu = new Menu('My Menu');
        menu.addItem('Foo');

        // The menu only has one option, selecting the 43rd is not valid.
        gunther.respondToDialog({ response: 1, listitem: 42 /* Invalid item */ });

        try {
            const result = await menu.displayForPlayer(gunther);
            assert.notReached();  // the function is expected to throw.

        } catch (exception) {}
    });

    it('should resolve with NULL when the menu is dismissed', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        const menu = new Menu('My Menu');
        menu.addItem('Foo');

        // A response of zero indicates that the player has dismissed the dialog.
        gunther.respondToDialog({ response: 0 /* dismissed */, listitem: 0 });

        assert.isNull(await menu.displayForPlayer(gunther));
    });

    it('should support single-column lists without a header', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        // To test the functionality of the listener as well.
        let listenerResult = null;

        const menu = new Menu('My Menu');
        menu.addItem('Foo', player => listenerResult = 0);
        menu.addItem('Bar', player => listenerResult = 1);
        menu.addItem('Baz', player => listenerResult = 2);

        gunther.respondToDialog({ response: 1, listitem: 0 /* First item */ });

        const result = await menu.displayForPlayer(gunther);

        assert.equal(gunther.lastDialogTitle, 'My Menu');
        assert.equal(gunther.lastDialogStyle, DIALOG_STYLE_LIST);
        assert.equal(gunther.lastDialog, 'Foo\nBar\nBaz');

        assert.deepEqual(result, { player: gunther, item: ['Foo'] });
        assert.strictEqual(listenerResult, 0);
    });

    it('should support single-column lists with a header', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        // To test the functionality of the listener as well.
        let listenerResult = null;

        const menu = new Menu('My Menu', ['Item']);
        menu.addItem('Foo', player => listenerResult = 0);
        menu.addItem('Bar', player => listenerResult = 1);
        menu.addItem('Baz', player => listenerResult = 2);

        gunther.respondToDialog({ response: 1, listitem: 0 /* First item */ });

        const result = await menu.displayForPlayer(gunther);

        assert.equal(gunther.lastDialogTitle, 'My Menu');
        assert.equal(gunther.lastDialogStyle, DIALOG_STYLE_TABLIST_HEADERS);
        assert.equal(gunther.lastDialog, 'Item\nFoo\nBar\nBaz');

        assert.deepEqual(result, { player: gunther, item: ['Foo'] });
        assert.strictEqual(listenerResult, 0);
    });

    it('should support multi-column lists with a header', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        // To test the functionality of the listener as well.
        let listenerResult = null;

        const menu = new Menu('My Menu', ['Item', 'Price']);
        menu.addItem('Foo', '$10', player => listenerResult = 0);
        menu.addItem('Bar', '$20', player => listenerResult = 1);
        menu.addItem('Baz', '$30', player => listenerResult = 2);

        gunther.respondToDialog({ response: 1, listitem: 1 /* First item */ });

        const result = await menu.displayForPlayer(gunther);

        assert.equal(gunther.lastDialogTitle, 'My Menu');
        assert.equal(gunther.lastDialogStyle, DIALOG_STYLE_TABLIST_HEADERS);
        assert.equal(gunther.lastDialog, 'Item\tPrice\nFoo\t$10\nBar\t$20\nBaz\t$30');

        assert.deepEqual(result, { player: gunther, item: ['Bar', '$20'] });
        assert.strictEqual(listenerResult, 1);
    });

    it('should automatically paginate menus with more items than the page size', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        // To test the functionality of the listener as well.
        let listenerResult = null;

        const menu = new Menu('My Menu', ['Item', 'Price'], { pageSize: 2 });
        menu.addItem('Foo', '$10', player => listenerResult = 0);
        menu.addItem('Bar', '$20', player => listenerResult = 1);

        menu.addItem('Baz', '$30', player => listenerResult = 2);
        menu.addItem('Qux', '$40', player => listenerResult = 3);

        menu.addItem('Corge', '$50', player => listenerResult = 4);
        menu.addItem('Grault', '$60', player => listenerResult = 5);

        const resultPromise = menu.displayForPlayer(gunther);

        // Page 1 (Foo, Bar)
        {
            assert.equal(gunther.lastDialogTitle, 'My Menu (page 1 of 3)');
            assert.equal(gunther.lastDialogStyle, DIALOG_STYLE_TABLIST_HEADERS);
            assert.equal(gunther.lastDialogLabel, '>>>');
            assert.equal(gunther.lastDialog, 'Item\tPrice\nFoo\t$10\nBar\t$20');

            await gunther.respondToDialog({ response: 0 /* next page */, listitem: 0 });
        }

        // Page 2 (Baz, Qux)
        {
            assert.equal(gunther.lastDialogTitle, 'My Menu (page 2 of 3)');
            assert.equal(gunther.lastDialogStyle, DIALOG_STYLE_TABLIST_HEADERS);
            assert.equal(gunther.lastDialogLabel, '>>>');
            assert.equal(gunther.lastDialog, 'Item\tPrice\nBaz\t$30\nQux\t$40');

            await gunther.respondToDialog({ response: 0 /* next page */, listitem: 0 });
        }

        // Page 3 (Corge, Grault)
        {
            assert.equal(gunther.lastDialogTitle, 'My Menu (page 3 of 3)');
            assert.equal(gunther.lastDialogStyle, DIALOG_STYLE_TABLIST_HEADERS);
            assert.equal(gunther.lastDialogLabel, 'Cancel');
            assert.equal(gunther.lastDialog, 'Item\tPrice\nCorge\t$50\nGrault\t$60');

            gunther.respondToDialog({ response: 1, listitem: 1 /* Grault */ });
        }

        const result = await resultPromise;

        assert.deepEqual(result, { player: gunther, item: ['Grault', '$60'] });
        assert.strictEqual(listenerResult, 5);
    });
});
