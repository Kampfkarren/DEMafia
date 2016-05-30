"use strict";

const _ = require("underscore");
const debug = require("../debug.json");

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

  init(){
    if(debug.announceroles)
      console.log(`I'm ${this.player.client.name}, and I'm a ${this.id}`);
  }

  can_kill(reason){
    let ret = true;

    _.each(this.items, function(item){
      if(!item.can_kill(reason)){
        ret = false;
        return;
      }
    });

    return ret;
  }

  on_kill(reason){
    _.each(this.items, function(item){
      item.on_kill(reason);
    });

    this.game.bot.overwritePermissions(this.game.channel, this.player.client, {
      "sendMessages": false
    }, () => {
      for(let channel of this.game.channels){
        this.game.bot.overwritePermissions(channel, this.player.client, {
          "sendMessages": false
        });
      }
    });
  }

  on_day(){}

  on_night(){}

  on_init(){}

  on_lynch(voters){}

  get_meetings(){
    let meetingsList = require("../meetings/meeting.js").meetingsAsIds;

    return _.map(this.meetings, function(e){
      return new meetingsList[e]();
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
