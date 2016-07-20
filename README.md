# Las Venturas Playground
Hi!

  * [Contribution guide](/CONTRIBUTE.md)

## Running Las Venturas Playground yourself
The following steps will help you compile and run Las Venturas Playground on your own computer.
Please do read the [contribution guide](CONTRIBUTE.md) if you're considering contributing!

**Prerequisites**:
  - A computer running Windows 8 or later with the latest [Visual C++ redistributable]
    (https://www.microsoft.com/en-gb/download/details.aspx?id=48145) installed.
  - [GitHub for desktop](https://desktop.github.com/) or another GitHub client must be installed.
  - The [LVP Pawn Editor](https://github.com/LVPlayground/pawn-editor/releases) must be installed.
  - The ability to execute a batch file _as administrator_.

**Las Venturas Playground installation**:
  1. Create a folder named `LVP` somewhere on your computer.
  2. Check out the [server-staging](https://github.com/LVPlayground/server-staging) repository in
     the `LVP\server-staging` directory.
  3. Check out the [playground](https://github.com/LVPlayground/playground) repository in the
     `LVP\playground` directory.
  4. Go to `LVP\playground\pawn\`.
    1. Create a new file called `AUTHOR` with a single line noting your e-mail address.
    2. Open `lvp.ppr` with the _LVP Pawn Editor_ and click _F5_ to compile.
    3. You should now have a file called `lvp.amx` in this directory.
  5. Go to `LVP\server-staging\`.
    1. Run `dev-init.bat` as an administrator. This will create some symbolic links.
  6. Go to `LVP\server-staging\server\`.
    1. Create a new file called `database.json` in this directory, and paste the contents of
       [this gist](https://gist.github.com/RussellLVP/17920662fc96dda0b26d5f8e2506f647). It grants
       you read-only access to the test server database.
    2. Run `samp-server.exe`. You are now running Las Venturas Playground.

Developers having made some larger contributions to Las Venturas Playground will be granted write
access to the test server database, enabling them to test features more comprehensively.
