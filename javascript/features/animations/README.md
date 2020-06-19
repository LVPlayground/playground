# Animations
This feature contains a series of commands that power the player animations available on the server.
The actual animations are defined in [animation.json](../../../data/animations.json), for each of
which a command will be generated automatically.

There are two kinds of animations we currently support:

  1. [Special Action](https://wiki.sa-mp.com/wiki/SpecialActions)-based animations,
  1. [GTA Animation](https://wiki.sa-mp.com/wiki/AnimationsTable)-based animations.

All animations are subject to anti-abuse checks, particularly to disallow starting them when a
player has recently been involved in a fight. Administrators have the ability to apply animations to
other players, and this will inform both the targetted player and other administrators with an
attribuetd message.

Furthermore, this feature also provides the `/animations` command for an overview of all available
animations. Each of the rows can be clicked on to immediately apply the animation.
