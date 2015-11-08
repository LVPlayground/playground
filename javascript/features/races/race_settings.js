// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

exports = {
  // Price (in dollars) required in order to participate in a race. This value is used both for the
  // command to join a race, as well as for race challenge desks.
  RACE_SIGNUP_PRICE: 1000,

  // Number of milliseconds to wait before races advance from the sign-up to the loading state. This
  // could happen earlier if enough players have signed up for participating in the race.
  RACE_SIGNUP_WAIT_DURATION: 20000,

  // Number of milliseconds to wait before races advance from the loading to the countdown state.
  RACE_LOADING_WAIT_DURATION: 1500,
};
