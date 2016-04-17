"use strict";

const _ = require("underscore");

class Role {
  constructor(game){
    this.id = "undefined"; //id used for !create
    this.name = "Undefined"; //name
    this.alignment = "town";
    this.items = [];
    this.meetings = [];
    this.can_lynch = true;
    this.game = game;
  }

  on_kill(reason){
    let ret = true;

    _.each(this.items, function(item){
      if(!item.on_kill(reason)){
        ret = false;
        return;
      }
    });

    return ret;
  }

  on_day(){}

  on_night(){}

  on_init(){}

  on_lynch(voters){}
}

module.exports.Role = Role;
module.exports.roleList = [
  require("./villager.js"),
  require("./mafia.js")
];