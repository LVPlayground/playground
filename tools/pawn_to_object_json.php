<?php
// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Live URL:
// https://crew.sa-mp.nl/russell/pawn_to_object_json.php

function formatfloat($value) {
  return sprintf('%.4f', floatval($value));
}

function floatlen($value) {
  return strlen(formatfloat($value));
}

if (!isset($_POST['data'])) {
?>

<!doctype html>
<title>Pawn to Object JSON</title>
<form method="post" action="">
  <textarea name="data"></textarea>
  <input type="submit" value="Submit" />
</form>

<?php
} else {
  // TODO: Remove multi-line comments.
  if (strpos($_POST['data'], "/*") !== false)
    die('Support for multi-line comments hasn\'t been implemented yet.');

  $lines = preg_split('/[\r\n]+/s', $_POST['data'], -1, PREG_SPLIT_NO_EMPTY);

  $objects_meta = [ 'modelId' => 0, 'position' => [ 0, 0, 0 ], 'rotation' => [ 0, 0, 0 ] ];
  $objects = [];

  foreach ($lines as $line) {
    $line = trim($line);

    // Skip comments
    if (substr($line, 0, 2) == '//')
      continue;

    // Objects
    if (substr($line, 0, 19) == 'CreateDynamicObject') {
      $line = str_replace('CreateDynamicObject', '', $line);
      $line = str_replace(['(', ')', ';'], '', $line);

      list($model, $posX, $posY, $posZ, $rotX, $rotY, $rotZ) =
          preg_split('/\s*,\s*/', trim($line));

      $object = [
          'modelId'   => intval($model),
          'position'  => [ floatval($posX), floatval($posY), floatval($posZ) ],
          'rotation'  => [ floatval($rotX), floatval($rotY), floatval($rotZ) ]
      ];

      $objects_meta['modelId'] = max($objects_meta['modelId'], strlen($model));
      for ($i = 0; $i < 3; ++$i) {
        $objects_meta['position'][$i] = max($objects_meta['position'][$i], floatlen($object['position'][$i]));
        $objects_meta['rotation'][$i] = max($objects_meta['rotation'][$i], floatlen($object['rotation'][$i]));
      }

      $objects[] = $object;
      continue;
    }

    die('Unrecognised line:' . PHP_EOL . $line);
  }

  echo '[' . PHP_EOL;

  $first = true;
  foreach ($objects as $object) {
    if (!$first)
      echo ',' . PHP_EOL;

    echo '    {';
    echo ' "modelId": ' . str_pad($object['modelId'] . ',', $objects_meta['modelId'] + 1);
    echo ' "position": [';

    echo ' ' . str_pad(formatfloat($object['position'][0]) . ',', $objects_meta['position'][0] + 1, ' ', STR_PAD_LEFT);
    echo ' ' . str_pad(formatfloat($object['position'][1]) . ',', $objects_meta['position'][1] + 1, ' ', STR_PAD_LEFT);
    echo ' ' . str_pad(formatfloat($object['position'][2]), $objects_meta['position'][2], ' ', STR_PAD_LEFT);

    echo ' ],';
    echo ' "rotation": [';

    echo ' ' . str_pad(formatfloat($object['rotation'][0]) . ',', $objects_meta['rotation'][0] + 1, ' ', STR_PAD_LEFT);
    echo ' ' . str_pad(formatfloat($object['rotation'][1]) . ',', $objects_meta['rotation'][1] + 1, ' ', STR_PAD_LEFT);
    echo ' ' . str_pad(formatfloat($object['rotation'][2]), $objects_meta['rotation'][2], ' ', STR_PAD_LEFT);

    echo ' ]';
    echo ' }';

    $first = false;
  }

  echo PHP_EOL . ']' . PHP_EOL;
}

//     { "modelId": 19127, "position": [ 1998.2459, 1556.6855, 14.0822 ], "rotation": [ 0.0000, 0.0000, 0.0000 ] },
