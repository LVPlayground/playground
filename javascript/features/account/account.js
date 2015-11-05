// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Encapsulates the information known about a player's account.
class Account {
  constructor(userId) {
    this.userId_ = userId;
  }

  // Returns the user Id associated with the account.
  get userId() { return this.userId_; }
};

exports = Account;
