# Entities
Think of an _entity_ as anything you can see in San Andreas: players, vehicles, objects and so on.
Such entities can be created and controlled using JavaScript. This document explains how to create,
validate, modify and destroy entities.

The following categories of Entities are supported in JavaScript:
  - **[Actors](#actors)**, static, name-less pedestrians that stand at a given position.
  - Objects
  - Pickups
  - Players
  - **[Text Labels](#text-labels)**, arbitrary text attached to an entity, or static at a given
    position.
  - Vehicles

Entities also have a **shared interface**: two methods that are available on each entity, regardless
of its type.
  - `entity.dispose()`: Removes the entity from the server.
  - `entity.isConnected()`: Returns whether the entity still exists on the server.

Tests are welcome to create entities as they please: they will be represented using mocked versions
instead, which have additional functionality available to them to fake certain events.

Entities created in tests are especially pedantic and validate every possible value, throwing
exceptions when a bug might occur during the regular gamemode. This adds to the importance of having
test coverage for the features you develop.

## Actors
Actors are static, name-less pedestrians that stand at a given position. They can be made
vulnerable, and can move according to an animation. Up to a thousand actors may be created.

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
  - `actor.health`: Gets or sets the health of the actor. A number between 0 and 100.
  - `actor.modelId`: Gets the model representing the actor. _Immutable._
  - `actor.position`: Gets or sets the position of the actor. Must be a vector.
  - `actor.rotation`: Gets or sets the rotation of the actor. A number between 0 and 360.
  - `actor.virtualWorld`: Gets or sets the virtual world the actor resides in.

The following methods are available for actors:
  - `actor.animate({ library, name, loop = false, lock = false, freeze = false, time = 0})`: Applies
     an animation to the actor with the given options.
  - `actor.clearAnimations()`: Stops any animations currently applied to the actor.
  - `actor.dispose()`: Removes the actor from the server.
  - `actor.isConnected()`: Returns whether the actor still exists on the server.
  - `actor.isVulnerable()`: Returns whether the actor is vulnerable to offense.
  - `actor.setVulnerable(vulnerable)`: Changes whether the actor is vulnerable to offense.

## Objects

## Pickups

## Players

## Text Labels
Text labels render either at a given position in the world, or at an offset when attached to another
entity. They can convey small amounts of information to a player without them having to type a
command.

They are represented by the [TextLabel](text_label.js) object, managed by the [TextLabelManager]
(text_label_manager.js). Tests use the [MockTextLabel](test/mock_text_label.js) instead.

#### Creating a text label
```javascript
const textLabel = server.textLabelManager.createTextLabel({
    text: 'Hello, world!',
    color: Color.fromRGB(255, 192, 203) /* pink */,
    position: new Vector(2000.56, 1567.98, 15.31)
});
```

#### The TextLabel interface
The following properties are available for text labels:
  - `textLabel.color`: Gets or sets the color in which the text is being drawn.
  - `textLabel.drawDistance`: Gets the draw distance for the text label. _Immutable._
  - `textLabel.position`: Gets the position of the text label. _Immutable._
  - `textLabel.text`: Gets or sets text the label is currently displaying.
  - `textLabel.virtualWorld`: Gets the virtual world where the text label is visible. _Immutable._

The following methods are available for text labels:
  - `textLabel.attachToPlayer(player, offset)`: Attaches the label to the player at the given
    offset, which must be a vector.
  - `textLabel.attachToVehicle(vehicle, offset)`: Attaches the label to the vehicle at the given
    offset, which must be a vector.
  - `textLabel.dispose()`: Removes the text label from the server.
  - `textLabel.isAttached()`: Returns whether the text label is attached to an entity.
  - `textLabel.isConnected()`: Returns whether the text label still exists on the server.
  - `textLabel.testsLineOfSight()`: Returns whether the text label tests the line-of-sight.

## Vehicles

