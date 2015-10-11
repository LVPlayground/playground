# Contribution guide
This guide will explain the process of contributing code to the Las Venturas Playground gamemode.
Please read and follow it carefully, and file bugs for anything that's unclear or doesn't work.

## Preparing your checkout
At least repositories are necessary in order to be able to contribute code. If you are unsure
about how to clone repositories, read [GitHub's guide]
(https://help.github.com/articles/cloning-a-repository/) first. You may also be interested in
[GitHub Desktop](https://help.github.com/desktop/guides/getting-started/installing-github-desktop/).

Note that you must have installed [git-lfs](https://git-lfs.github.com/) as well.

1. Create a directory for the LVP-related repositories on your computer.
2. Clone [LVPlayground/playground](https://github.com/LVPlayground/playground) in that directory.
3. Clone [LVPlayground/server-staging](https://github.com/LVPlayground/server-staging) in that directory.

## Initialize the environment
The `server-staging` repository doubles as the public staging server, and your local one. In
order to set it up for local use, execute the following script **as an Administrator**:

    server-staging\dev-init.bat
    
This will create symbolic links from the server to the `playground` repository. You may now
start the server by executing `samp-server.exe` in the `server-staging\server` directory and
connect to `127.0.0.1:1337`.

#### Connecting to the staging database
Las Venturas Playground will default to not establishing a database connection. After you
have contributed a few patches, we're happy to allow your local server to connect to the
staging database directly. Just ping us! :-)

## Pushing your changes
When you're satisfied, commit your changes on your computer and push them to this repository.
If you do not have write access, or would like someone to look at your code before pushing
it, please submit a pull request instead.

We do not maintain a reviewing requirement.

## Deploying to staging
When you're satisfied with your local testing and have pushed your changes to this repository,
you can deploy them to the staging server by updating the [REVISION]
(https://github.com/LVPlayground/server-staging/blob/master/REVISION) file in the
`server-staging` repository with the current revision hash.

The staging server will automatically deploy your change, and you can request a restart
of the staging server in `#LVP.dev` on IRC to activate them immediately.

## Deploying to production
Lead developers will occasionally deploy a new version of Las Venturas Playground to the
production server, by changing the revision file in the `server-production` repository.
