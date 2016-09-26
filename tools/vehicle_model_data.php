<?php
// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// This script can be used to generate vehicle_models.json. Editing the file 212 times whenever a
// new property is added will become too tedious rather quickly.

$modelInfos = [];

$modelNames = [
    'Landstalker', 'Bravura', 'Buffalo', 'Linerunner', 'Pereniel', 'Sentinel', 'Dumper', 'Firetruck',
    'Trashmaster', 'Stretch', 'Manana', 'Infernus', 'Voodoo', 'Pony', 'Mule', 'Cheetah', 'Ambulance',
    'Leviathan', 'Moonbeam', 'Esperanto', 'Taxi', 'Washington', 'Bobcat', 'Mr Whoopee', 'BF Injection',
    'Hunter', 'Premier', 'Enforcer', 'Securicar', 'Banshee', 'Predator', 'Bus', 'Rhino', 'Barracks',
    'Hotknife', 'Trailer', 'Previon', 'Coach', 'Cabbie', 'Stallion', 'Rumpo', 'RC Bandit', 'Romero',
    'Packer', 'Monster Truck', 'Admiral', 'Squalo', 'Seasparrow', 'Pizzaboy', 'Tram', 'Trailer',
    'Turismo', 'Speeder', 'Reefer', 'Tropic', 'Flatbed', 'Yankee', 'Caddy', 'Solair', 'Berkley\'s RC Van',
    'Skimmer', 'PCJ-600', 'Faggio', 'Freeway', 'RC Baron', 'RC Raider', 'Glendale', 'Oceanic', 'Sanchez',
    'Sparrow', 'Patriot', 'Quad', 'Coastguard', 'Dinghy', 'Hermes', 'Sabre', 'Rustler', 'ZR-350',
    'Walton', 'Regina', 'Comet', 'BMX', 'Burrito', 'Camper', 'Marquis', 'Baggage', 'Dozer', 'Maverick',
    'News Chopper', 'Rancher', 'FBI Rancher', 'Virgo', 'Greenwood', 'Jetmax', 'Hotring', 'Sandking',
    'Blista Compact', 'Police Maverick', 'Boxville', 'Benson', 'Mesa', 'RC Goblin', 'Hotring Racer',
    'Hotring Racer', 'Bloodring Banger', 'Rancher', 'Super GT', 'Elegant', 'Journey', 'Bike',
    'Mountain Bike', 'Beagle', 'Cropdust', 'Stunt', 'Tanker', 'RoadTrain', 'Nebula', 'Majestic',
    'Buccaneer', 'Shamal', 'Hydra', 'FCR-900', 'NRG-500', 'HPV1000', 'Cement Truck', 'Tow Truck',
    'Fortune', 'Cadrona', 'FBI Truck', 'Willard', 'Forklift', 'Tractor', 'Combine', 'Feltzer',
    'Remington', 'Slamvan', 'Blade', 'Freight', 'Streak', 'Vortex', 'Vincent', 'Bullet', 'Clover',
    'Sadler', 'Firetruck', 'Hustler', 'Intruder', 'Primo', 'Cargobob', 'Tampa', 'Sunrise', 'Merit',
    'Utility', 'Nevada', 'Yosemite', 'Windsor', 'Monster Truck', 'Monster Truck', 'Uranus', 'Jester',
    'Sultan', 'Stratum', 'Elegy', 'Raindance', 'RC Tiger', 'Flash', 'Tahoma', 'Savanna', 'Bandito',
    'Freight', 'Trailer', 'Kart', 'Mower', 'Duneride', 'Sweeper', 'Broadway', 'Tornado', 'AT-400',
    'DFT-30', 'Huntley', 'Stafford', 'BF-400', 'Newsvan', 'Tug', 'Trailer', 'Emperor', 'Wayfarer',
    'Euros', 'Hotdog', 'Club', 'Trailer', 'Trailer', 'Andromada', 'Dodo', 'RC Cam', 'Launch', 'LSPD',
    'SFPD', 'LVPD', 'Police Ranger', 'Picador', 'S.W.A.T. Van', 'Alpha', 'Phoenix', 'Glendale',
    'Sadler', 'Luggage Trailer', 'Luggage Trailer', 'Stair Trailer', 'Boxville', 'Farm Plow',
    'Utility Trailer'
];

$modelCategories = [
    'RC Vehicles'   => [ 441, 464, 465, 501, 564, 594 ],
    'Trailers'      => [ 435, 450, 584, 591, 606, 607, 608, 610, 611 ],
    'Trains'        => [ 537, 538, 569, 570, 590 ]
];

// -------------------------------------------------------------------------------------------------

$modelId = 400;

$seenNames = [];
foreach ($modelNames as $name) {
    if (array_key_exists($name, $seenNames))
        $name = $name . ' ' . ++$seenNames[$name];
    else
        $seenNames[$name] = 1;

    $categories = [];
    foreach ($modelCategories as $categoryName => $category) {
        if (in_array($modelId, $category))
            $categories[] = $categoryName;
    }

    if (!count($categories))
        $categories[] = 'Unknown';

    $modelInfos[$modelId++] = [
        'name' => $name,
        'categories' => $categories
    ];
}

// -------------------------------------------------------------------------------------------------

echo '[' . PHP_EOL;

foreach ($modelInfos as $modelId => $modelInfo) {
    $continuationComma = $modelId == 611 ? '' : ',';  // no comma for the last entry

    echo '    {' . PHP_EOL;
    echo '        "id": ' . $modelId . ',' . PHP_EOL;
    echo '        "name": "' . $modelInfo['name'] . '",' . PHP_EOL;
    echo '        "categories": [ "' . implode('", "', $modelInfo['categories']) . '" ]' . PHP_EOL;
    echo '    }' . $continuationComma . PHP_EOL;
}

echo ']' . PHP_EOL;
