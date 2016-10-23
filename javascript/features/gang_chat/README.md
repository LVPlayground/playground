# Feature: Gang Chat
The gang chat is a feature available for [Gangs](/javascript/features/gangs/) that gives them a
private-ish place to discuss their plans. Members can send messages to the group chat of their gang
by prefixing their message with an exclamation mark (`!`). 

```
!This message will be send to your gang.
```

## FAQ: Who can read these messages?
Messages sent to the group chat of a gang can be read by all members of the gang, administrators
and the owner of the Seti@Home property, who has the ability to spy on you.

Ownership changes to the Seti@Home property will be clearly announced to all players that
participate in a gang.

Gangs have the ability to purchase encryption for their gang chat through `/gang settings`. When
they do so, messages will on longer be visible to Seti@Home property owners.

## FAQ: I'm an admin, can I send a message to a gang?
Administrators can send messages to any gang represented on Las Venturas Playground by prefixing
their message with two exclamation marks (`!!`), followed by the tag of the targetted gang.

```
!!HKO Hello, members of the HKO gang!
```

Such remote messages will be visually distinct from normal messages.
