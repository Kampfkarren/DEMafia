"use strict";

const Role = require("./role.js").Role;

class Villager extends Role {
  constructor(game){
    super(game);
    this.id = "villager";
    this.name = "Villager";
    this.description = "Wins if there are no mafia remaining";
  }
}

module.exports = Villager;
