// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ActivityRecorder = require('features/activity_log/activity_recorder.js'),
      Feature = require('components/feature_manager/feature.js'),
      ScopedCallbacks = require('base/scoped_callbacks.js');

// The activity log feature keeps track of many in-game events and logs them to the database. This
// is part of an effort to gather more information with Las Venturas Playground, enabling analysis
// of area, vehicle and weapon usage among many other statistics.
class ActivityLog extends Feature {
  constructor(playground) {
    super(playground);

    this.recorder_ = new ActivityRecorder();

    this.callbacks_ = new ScopedCallbacks();
    // TODO: Listen to N relevant callbacks.
  }
};

exports = ActivityLog;
