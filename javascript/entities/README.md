# Entities
Think of an _entity_ as anything you can see in San Andreas: players, vehicles, objects and so on.
Such entities can be created and controlled using JavaScript. This document explains how to create,
validate, modify and destroy entities.

The following categories of Entities are supported in JavaScript:
  - **[Actors](#actors)**, static, name-less pedestrians that stand at a given position.
  - Objects
  - Pickups
  - Players
  - Text Labels
  - Vehicles

Entities also have a **shared interface**: two methods that are available on each entity, regardless
of its type.
  - `entity.isConnected()`: Returns whether the entity still exists on the server.
  - `entity.dispose()`: Removes the entity from the server.

## Actors
Actors are static, name-less pedestrians that stand at a given position. They can be made
invulnerable, and can move according to an animation. Up to a thousand actors may be created.

They are represented by the [Actor](actor.js) object, managed by the [ActorManager]
(actor_manager.js). Tests use the [MockActor](test/mock_actor.js) instead.

#### Creating an actor
```javascript
const actor = server.actorManager.createActor({
    modelId: 0 /* CJ */,
    position: new Vector(2054.4636, 665.4705, 10.8209),
    rotation: 359.4669
});
```

#### The Actor interface
The following properties are available for actors:
  - `actor.modelId`: Gets the model representing the actor. _Immutable_
  - `actor.health`: Gets or sets the health of the actor. A number between 0 and 100.
  - `actor.position`: Gets or sets the position of the actor. Must be a vector.
  - `actor.rotation`: Gets or sets the rotation of the actor. A number between 0 and 360.
  - `actor.virtualWorld`: Gets or sets the virtual world the actor resides in.

The following methods are available for actors:
  - `actor.isConnected()`: Returns whether the actor still exists on the server.
  - `actor.isInvulnerable()`: Returns whether the actor is invulnerable.
  - `actor.setInvulnerable(invulnerable)`: Changes whether the actor is invulnerable.
  - `actor.applyAnimation({ library, name, loop = false, lock = false, freeze = false, time = 0})`:
     Applies an animation to the actor with the given options.
  - `actor.clearAnimations()`: Stops any animations currently applied to the actor.
  - `actor.dispose()`: Removes the actor from the server.

## Objects

## Pickups

## Players

## Text Labels

## Vehicles

