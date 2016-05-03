# Feature: Gangs
A gang is a group of players that have declared an alliance and fight together for their common
benefit. Gangs on the server are persistent. That means that you create or join them once, and you
will automatically be part of them in following playing sessions.

Gangs have the following properties:
  - A **tag**, which is a one-to-five character identifier for the gang, for example _HKO_.
  - A **name**, which is the full name the gang is known by, for example _Hello Kitty Online_.
  - A **goal**, which is a single sentence defining what the gang intends to do.
  - One or more **members** that represent the gang.

Gangs have three levels of members available to them:
  - **Leaders**, who have full authority over the gang's settings, managers and settings.
  - **Managers**, who can add and remove members to the gang.
  - **Members**, who participate on behalf of the gang.

All levels have the ability to use collaborative features such as the gang chat.

## Commands
The following commands are available as part of the feature:

  - **/gang create**: Create a new gang.
  - **/gang invite [player]**: Invite the player to your gang. They must be registered.
  - **/gang join**: Join the gang of whom you received the most recent invitation.
  - **/gang kick [member]**: Enables leaders and managers to kick members from their gang.
  - **/gang leave**: Leave the gang that you're currently part of.
  - **/gang members**: Display the gang's members, including those who aren't currently online.
  - **/gang settings**: Allows leaders to change settings of their gang.
  - **/gangs**: Display the gangs currently represented on Las Venturas Playground.

## Features
The following features are available to gang members:

  - **[Gang chat](/javascript/features/gang_chat/)**: A private-ish group chat scoped to the
    members of the gang.

## FAQ: Can I only kick online players from my gang?
No. As the leader or manager of a gang, you can kick any member of the gang regardless of whether
they are online or offline. You can see a full list of your gang's members by using the
`/gang members` command.

## FAQ: What happens when the gang's leader leaves?
Every gang must have at least one leader. When the leader leaves the gang by using the `/gang leave`
command, the following line of succession will apply:

  1. If there is more than one leader, we're good.
  2. Otherwise, if there are managers, the manager with the longest tenure will be chosen.
  3. Otherwise, if there are members, the member with the longest tenure will be chosen.

Unless the leader is the only person in the gang, it is not possible to completely remove a gang
through this command. Instead, one of the leaders should open a
[help request](https://forum.sa-mp.nl/forumdisplay.php?fid=13) on the forums.

## FAQ: How do I transfer leadership to another player?
Transferring leadership of a gang is a two-step process that requires both of you to be online. The
current leader has to type `/gang settings` and promote the other player to _Leader_. The newly
appointed leader then has to type `/gang settings` and demote the former leader to another level.

However, keep in mind that it's fine for a gang to have multiple leaders. Why not share the joy? :)
