# Entities
Think of an _entity_ as anything you can see in San Andreas: players, vehicles, objects and so on.
Such entities can be created and controlled using JavaScript. This document explains how to create,
validate, modify and destroy entities.

The following categories of Entities are supported in JavaScript:
  - **[Actors](#actors)**, static, name-less pedestrians that stand at a given position.
  - Objects
  - **[Pickups](#pickups)**, static objects that can be picked up by players.
  - Players
  - **[Text Labels](#text-labels)**, arbitrary text attached to an entity, or static at a given
    position.
  - Vehicles
  - **[Virtual Worlds](#virtual-worlds)**, identifiers for isolated dimensions on the server.

Entities also have a **shared interface**: two methods that are available on each entity, regardless
of its type.
  - `entity.dispose()`: Removes the entity from the server.
  - `entity.isConnected()`: Returns whether the entity still exists on the server.

Tests are welcome to create entities as they please: they will be represented using mocked versions
instead, which have additional functionality available to them to fake certain events.

Entities created in tests are especially pedantic and validate every possible value, throwing
exceptions when a bug might occur during the regular gamemode. This adds to the importance of having
test coverage for the features you develop.

In addition, there are a few utility classes that are also defined here:
  - **[ObjectGroup](#utility-objectgroup)**, a class allows loading a series of objects from a file
    or array, allowing them to be removed together.
  - **[ScopedEntities](#utility-scopedentities)**, a class that creates objects for a shared owner,
    allowing them to be removed together.

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
TO BE DOCUMENTED


## Pickups
Pickups are static objects that can be picked up by players, optionally in a vehicle, by walking in
to them. An event will be triggered when they do. There can be up to 4,096 pickups on the server.

They are represented by the [Pickup](pickup.js) object, managed by the [PickupManager]
(pickup_manager.js). Tests use the [MockPickup](test/mock_pickup.js) instead.

#### Creating a pickup
```javascript
const pickup = server.pickupManager.createPickup({
    modelId: 1254,
    position: new Vector(2080.5310, 2151.2712, 19.1455),
    type: Pickup.TYPE_PERSISTENT
});
```

#### The Pickup interface
The following properties are available for pickups:
  - `pickup.id`: Gets the internal Id assigned to the pickup. _Immutable._
  - `pickup.modelId`: Gets the model Id that's representing the pickup. _Immutable._
  - `pickup.position`: Gets the position of the pickup as a vector. _Immutable._
  - `pickup.type`: Gets the behavioural type of the pickup. _Immutable._
  - `pickup.virtualWorld`: Gets the virtual world the pickup resides in. _Immutable._

The following methods are available for pickups:
  - `pickup.dispose()`: Removes the pickup from the server.
  - `pickup.isConnected()`: Returns whether the pickup still exists on the server.

The following constants are available for pickups:
  - `Pickup.TYPE_PERSISTENT`: Pickup _type_ that will trigger the event when a player walks in to
    it. The pickup will not disappear, nor will trigger default effects.
  - `Pickup.TYPE_VEHICLE`: Pickup _type_ that will only trigger when the player drives in to it with
    a vehicle. The pickup will disappear afterwards.

#### Observing pickup events
Your feature can observe the [PickupManager](pickup_manager.js) to be notified when players enter or
leave pickups. The following two events are available:

  - `onPlayerEnterPickup(player, pickup)`: Called when a player stands on a pickup.
  - `onPlayerLeavePickup(player, pickup)`: Called when a player no longer stands in a pickup.

You can assume sensible behaviour for these events. The [PickupManager](pickup_manager.js) abstracts
away the peculiar behaviour of the OnPlayerPickUpPickup event you may be familiar with.

When changing the position of an entity in a test, the pickup events will be fired if their new
position is in range of a pickup.


## Players
TO BE DOCUMENTED


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
TO BE DOCUMENTED


## Virtual Worlds
Virtual Worlds are unique dimensions on the server that have their own set of entities of all sorts—
players located in one Virtual World cannot entities living in another. They are controlled by the
server, so not sensitive to the actions of cheaters.

Virtual Worlds are not strictly _entities_, but we do treat them as _something that can be handed
out_. For example, a feature that needs to be isolated will allocate Virtual Worlds for its own use.

Features can allocate a block of virtual worlds for its own use. Within this block, it's free to
allocate and release worlds as it pleases. The worlds within the block are guaranteed to be private
to the feature, and will not be handed out to other parts of Las Venturas Playground.

#### Allocating a block of worlds
```javascript
const block = server.virtualWorldManager.allocateBlock(1000);
console.log(block.size);  // 1000

const virtualWorld = block.allocate();

// ... later, when |virtualWorld| is not needed anymore ...

block.release(virtualWorld);

block.dispose();  // releases all owned Virtual Worlds
```

You should dispose a block of Virtual Worlds just like you would dispose other resource.


## Utility: ObjectGroup
TO BE DOCUMENTED


## Utility: ScopedEntities
There are many scenarios in which a set of entities should be created for a particular reason: a
race, a set of decorations or a feature implemented in JavaScript. In those cases it's convenient to
be able to remove all associated entities in one go as well.

It is defined in the [ScopedEntities](scoped_entities.js) class. Each individual _create_ method
takes the same arguments as those accepted by the managers in charge of the entity type.

#### Creating scoped entities 
```javascript
const entities = new ScopedEntities();

const actor = entities.createActor(...);
const object = entities.createObject(...);
const pickup = entities.createPickup(...);
const textLabel = entities.createTextLabel(...);
const vehicle = entities.createVehicle(...);

entities.dispose();  // removes all entities created by |entities|
```

#### Creating scoped entities for a defined environment
If all created entities must be part of a specific virtual world or be tied to a specific interior,
you can identify those in the constructor. All entities will then automatically be tied to them.

```javascript
const entities = new ScopedEntities({ interior: 7, virtualWorld: 42 });
const infernus = entities.createVehicle({
    modelId: 411 /* Infernus */,
    position: new Vector(12, 13, 14)
});

infernus.interiorId;  // 7
pickup.virtualWorld;  // 42
```

#### The ScopedEntities interface
The following methods are available on a ScopedEntities instance:
  - `entities.createActor(options)`: Creates an actor with the given _options_, per the
    [ActorManager](actor_manager.js).
  - `entities.createObject(options)`: Creates an object with the given _options_, per the
    [ObjectManager](object_manager.js).
  - `entities.createPickup(options)`: Creates a pickup with the given _options_, per the
    [PickupManager](pickup_manager.js).
  - `entities.createTextLabel(options)`: Creates a text label with the given _options_, per the
    [TextLabelManager](text_label_manager.js).
  - `entities.createVehicle(options)`: Creates a vehicle with the given _options_, per the
    [VehicleManager](vehicle_manager.js).
  - `entities.dispose()`: Removes all entities that were created using this object.
  - `entities.hasActor(actor)`: Returns whether the _actor_ is owned by the object.
  - `entities.hasObject(object)`: Returns whether the _object_ is owned by the object.
  - `entities.hasPickup(pickup)`: Returns whether the _pickup_ is owned by the object.
  - `entities.hasTextLabel(textLabel)`: Returns whether the _textLabel_ is owned by the object.
  - `entities.hasVehicle(vehicle)`: Returns whether the _vehicle_ is owned by the object.
