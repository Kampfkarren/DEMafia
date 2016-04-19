"use strict";

class Meeting {
  constructor(game){
    this.game = game;
    this.id = "undefined";
    this.name = "Undefined Meeting";
    this.description = "";
    this.channel = "";
    this.voted = {};
    this.can_nl = true;
  }

  can_vote_for(player){
    return true;
  }

  on_vote(voter, victim){
    this.voted[voter] = victim;
  }

  show(game){
    return true;
  }

  end(){}
}

module.exports.Meeting = Meeting;
module.exports.meetings = [
  require("./mafia_meeting.js")
];

module.exports.shortcuts = {
  nonmaf_only: (player) => return player.role.alignment !== "mafia",
  mafia_only: (player) => player.role.alignment === "mafia"
};

module.exports.majority = function(arr){
  let sorted = arr.slice().sort();
  let results = [];

  for(let i = 0; i < arr.length - 1; i++) {
    if(sorted_arr[i + 1] == sorted_arr[i]){
      results.push(sorted_arr[i]);
    }
  }

  return results;
}

module.exports.meetingsAsIds = _.object(
  _.map(module.exports.meetings, (e) => new e().id),
  module.exports.meetings
);
