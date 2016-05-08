"use strict";

class Player {
  constructor(game, client, role){
    this.game = game;
    this.client = client;
    this.role = role;
    this.alive = true;
  }

  kill(reason){
    let die = true;

    if(this.role.can_kill(reason))
      this.role.on_kill(reason);
  }
}

module.exports = Player;
