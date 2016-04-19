"use strict";

const _ = require("underscore");

class Role {
  constructor(game, player){
    this.id = "undefined"; //id used for !create
    this.name = "Undefined";
    this.description = "Lorem ipsum dolor sit amet";
    this.alignment = "town";
    this.items = [];
    this.meetings = ["lynch"];
    this.game = game;
    this.player = player;
  }

  can_kill(reason){
    let ret = true;

    _.each(this.items, function(item){
      if(!item.can_kill(reason)){
        ret = false;
        return;
      }
    })

    return ret;
  }

  on_kill(reason){
    _.each(this.items, function(item){
      item.on_kill(reason);
    });
  }

  on_day(){}

  on_night(){}

  on_init(){}

  on_lynch(voters){}

  get_meetings(){
    let meetings = require("../meetings/meeting.js").meetingsAsIds;

    return _.map(this.meetings, function(e){
      return meetings[e];
    });
  }
}

module.exports.Role = Role;
module.exports.roleList = [
  require("./villager.js"),
  require("./mafia.js")
];
module.exports.rolesAsIds = _.object(
  _.map(module.exports.roleList, (e) => new e().id),
  module.exports.roleList
);
