# Feature: Gangs
A gang is a group of players that have declared an alliance and fight together for their common
benefit. Gangs on the server are persistent. That means that you create or join them once, and you
will automatically be part of them in following playing sessions.

Gangs have the following properties:
  - A **tag**, which is a one-to-five character identifier for the gang, for example _HKO_.
  - A **name**, which is the full name the gang is known by, for example _Hello Kitty Online_.
  - A **goal**, which is a single sentence defining what the gang intends to do.

All three must be known when creating the gang, but can be changed at any time by the gang's leaders
by using the `/gang set [option]` command.

Gangs have three levels of members available to them:
  - **Leaders**, who have full authority over the gang's settings, managers and settings.
  - **Managers**, who can add and remove members to the gang.
  - **Members**, who participate on behalf of the gang.

All levels have the ability to use collaborative features such as the gang chat.

## Commands
The following commands are available as part of the feature:

  - **/gang create**: Create a new gang.
  - **/gang leave**: Leave the gang that you're currently part of.
  - **/gangs**: Display the gangs currently represented on Las Venturas Playground.

_This feature is still under development, these commands are currently only available to admins._

## TODO
The following list contains a number of items that have to be done before this feature can be
launched on the server. Items may be added or removed whenever appropriate.

  - Implement the **/gang leave** command.
  - Implement the **/gang invite** command.
  - Implement the **/gang kick** command.
  - Implement the **/gang set tag** command.
  - Implement the **/gang set name** command.
  - Implement the **/gang set goal** command.
  - Implement the **/gang set color** command.
  - Implement the **/gangs top** command.
  - Implement support for gang chats based on the persistent gang system.
