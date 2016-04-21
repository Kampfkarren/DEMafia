"use strict";

const Role = require("./role.js").Role;

class Villager extends Role {
  constructor(game, player){
    super(game, player);
    this.id = "villager";
    this.name = "Villager";
    this.description = "Wins if there are no mafia remaining";
  }
}

module.exports = Villager;
