# Contribution guide
This guide will explain the process of contributing code to the Las Venturas Playground gamemode.
Please read and follow it carefully, and file bugs for anything that's unclear or doesn't work.

## Preparing your checkout
Before proceeding, please ensure that you have
[Visual C++ Redistributable 209](https://support.microsoft.com/en-gb/kb/2977003) installed on your
local machine. This is required for some of the plugins that we use.

Some of our repositories depend on [git-lfs](https://www.atlassian.com/git/tutorials/git-lfs) to
store binary files. Unless you've got prior experience with using this, we suggest that you use the
[GitHub Desktop](https://help.github.com/desktop/guides/getting-started/installing-github-desktop/)
client as it's able to do this on your behalf.

## Check out the required repositories
Two repositories are required to contribute to Las Venturas Playground.

  1. [LVPlayground/playground](https://github.com/LVPlayground/playground), which contains the code,
  1. [LVPlayground/server-staging](https://github.com/LVPlayground/server-staging), which is the
     server, including the necessary plugins, to run the code.

These must be checked out in the same directory. We recommend that you make a `LVP` directory
somewhere on your machine, which will then have the aforementioned `playground` and `server-staging`
directories within them.

Finally, you must install the LVP Pawn Editor, which you can
[download directly from GitHub](https://github.com/LVPlayground/pawn-editor/releases). Sadly we've
lost the source code for the editor, and are therefore not able to make any further changes.

## Initializing the environment
There are three steps that you have to do in order to get your environment up-and-running.

### 1. Compile lvp.amx on your local machine
Launch the LVP Pawn Editor, and open the `playground\pawn\lvp.ppr` file in it. Start the compile
by pressing `F5`, or by clicking on `Build > Compile` in the app's menu.

It should take approximately 15–20 seconds for the compile to finish.

### 2. Initialize the server environment
You must run the following script **as an Administrator** to initialize the server:

   server-staging/dev-init.bat

This will create symbolic links from the server to the `playground` repository. You may now
start the server by executing `samp-server.exe` in the `server-staging\server` directory and
connect to `127.0.0.1:1337`.

### 3. Create the necessary configuration in the server folder.
Now browse to the `staging-server\server\` folder and create two files.

#### database.json
**Please send a message to [Russell](https://forum.sa-mp.nl/user-11417.html) on the LVP Forums to
obtain a copy of this file.**

#### nuwani.json
```json
{
    "bots": [
        { "nickname": "NuwaniYourName", "master": true }
    ],
    "servers": [
        { "ip": "37.48.87.211", "port": 6697, "ssl": true },
        { "ip": "81.17.60.167", "port": 6697, "ssl": true }
    ],
    "channels": [
        { "channel": "#LVP.Dev", "echo": true }
    ],
    "levels": [
        { "mode": "Y", "level": "management" },
        { "mode": "q", "level": "management" },
        { "mode": "a", "level": "management" },
        { "mode": "o", "level": "administrator" },
        { "mode": "h", "level": "administrator" }
    ],
    "commandPrefix": "?",
    "owners": [],
    "passwordSalt": "^&lvp__@"
}
```

All the options from the NuwaniJS IRC bot can be used in this file, see the
[configuration](https://github.com/LVPlayground/playground/tree/master/javascript/features/nuwani)
for details.

**We strongly encourage you to change the bot's nickname, and register it on the IRC network to give
it a password. This will stop other people from impersonating your bot.**

## Launching the server
Now start `server-staging\server\samp-server.exe`, and everything should work just fine. The server
will launch, connect to the database, connect a bot to IRC, and enable you to join it using your
test server credentials.

All tests are run when the server is started, and even a single failing test will prevent the server
from starting completely: we require them all to pass.

Please file bugs if you have any issues at this stage.

## Contributing a change
You are invited to contribute changes to Las Venturas Playground—we appreciate it!

The GitHub desktop client has an excellent interface for creating issues or pull requests, see the
[following guide](https://help.github.com/en/desktop/contributing-to-projects/creating-an-issue-or-pull-request).
We strongly encourage you to create an issue for changes that involve more than a hundred lines of
code, or touch on policy (such as rules and guidelines), as those usually require some discussion.
This is not necessary for simple bug fixes.

When making a pull request, you'll get a template asking you a few quick questions about the change
that you are proposing. Please fill these in truthfully, at it helps our developers to quickly
review and approve your proposed changes.

## Details of the Las Venturas Playground code
The Las Venturas Playground code base is split in two parts: Pawn and JavaScript. Both have full
access to the server, players, other entities and all other infrastructure. We strongly prefer
use of JavaScript for new functionality, as it is less error prone and fully tested.

### Making changes in our Pawn code
Changes in Pawn are generally not covered by unit tests, so we expect you to test changes on your
local server. There is no inherent structure or architecture to the code.

### Making changes in our JavaScript code
The architecture and design of our JavaScript code is far more mature, and follows a few rules in
regards to layering and testability.

#### a) Layering of the code
There are [four key directories](https://github.com/LVPlayground/playground/tree/master/javascript)
in our code:

  * `base/`, which contains basic functionality that has little to do with SA-MP. How to represent
    a color, a rectangle, or how to format a moment in time.
  * `entities/`, which are the players, vehicles, objects, pickups and so on on the server. We wrap
    them in JavaScript objects to make them more idiomatic to work with.
  * `components/`, which provide some common infrastructure that isn't tied to a feature. Think of
    dialogs, checkpoints, as well as the ability to display text on the screen.
  * `features/`, which contains most of the functionality. Each feature is located in its own
    directory, and some, more advanced features, are split up in multiple directories.

They are layered, which means the following:

  * Code in `base/` may only use other code in `base/`.
  * Code in `entities/` may only use code in `base/`, and other code in `entitites/`.
  * Code in `components/` may only use code in `base/`, `entities/` and other code in `components/`.
  * Code in `features/` may use code in `base/`, `entities/` and `components/`, and other code in
    `features/` as long as it calls `this.defineDependency()` in the feature's constructor.

This is important because it keeps our code clear, easy to maintain, and enables us to reload code
without having to restart the server. (This is how we apply bug fixes without you noticing!)

#### b) Testability of the code
We strongly encourage all our JavaScript code to be tested. We use a [Mocha](https://mochajs.org/)
based testing interface, with [Chai](https://www.chaijs.com/)-based asserts.

Adding a test is easy: if your normal file is called `my_commands.js`, your tests would be called
`my_commands.test.js`, which will be loaded automatically by the test runner. A basic test could
look as follows:

```javascript
describe('MyCommands', (it, beforeEach) => {
    beforeEach(() => {
        server.featureManager.loadFeature('my_feature');
    });

    it('says hello when a player uses the /hello command', async (assert) => {
        const gunther = server.playerManager.getById(/* Gunther= */ 0);

        assert.isTrue(await gunther.issueCommand('/hello'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], 'Hello!');
    });
});
```

This tests does the following:
  1. Before each test, it loads the "my_feature" feature on the server. This is the feature that
     you're working on, and makes sure that its functionality is available.
  1. It finds _Gunther_ on the server. Each test runs under the pretence that it's a full server
     that has players, vehicles and other features. Three fake players are connected by default:
     _Gunther_ with Id 0, _Russell_ with Id 1, and _Lucy_ with Id 2.
  1. It makes _Gunther_ execute the `/hello` command, and checks that this was successful.
  1. It verifies that _Gunther_ has received one message.
  1. It verifies that the received message it "Hello!".
