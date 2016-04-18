"use strict";

const Role = require("./role.js").Role;

class Mafia extends Role {
  constructor(game){
    super(game);
    this.id = "mafia";
    this.name = "Mafia";
    this.description = "Chooses one person to kill every night\nWins when the mafia outnumber the village"
    this.alignment = "mafia";
    this.meetings.push("mafia");
  }
}

module.exports = Mafia;
