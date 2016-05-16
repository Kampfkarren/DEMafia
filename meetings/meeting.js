"use strict";

const _ = require("underscore");

class Meeting {
  constructor(){
    this.game = null;
    this.id = "undefined";
    this.name = "Undefined Meeting";
    this.description = "";
    this.channel = "";
    this.voted = {};
    this.can_nl = true;
    this.notify = true;
  }

  can_vote_for(player){
    return true;
  }

  on_vote(voter, victim, trigger=true){
    this.voted[_.keys(this.game.players).indexOf(voter)] = victim;
  }

  show(game){
    return true;
  }

  end(){}
}

module.exports.Meeting = Meeting;
module.exports.meetings = [
  new require("./mafia_meeting.js"),
  new require("./lynch_meeting.js")
];

module.exports.shortcuts = {
  nonmaf_only: (player) => player.role.alignment !== "mafia",
  mafia_only: (player) => player.role.alignment === "mafia"
};

module.exports.majority = function(arr){
  if(typeof arr === "object")
    arr = _.values(arr);

  let rates = {};

  //dont use for of, it turns undefined to 0
  _.each(arr, function(entry){
    let i = _.values(arr).indexOf(entry);
    if(i === -1)
      i = _.values(rates).length;

    rates[i] = rates[i] === undefined ? 1 : rates[i] + 1;
  });

  let results = [];
  let sorted = _.values(rates).sort().reverse();

  _.each(rates, function(entry, i){
    if(entry === sorted[0])
      results.push(arr[i]);
  });

  return results;
};

module.exports.meetingsAsIds = _.object(
  _.map(module.exports.meetings, (e) => new e().id),
  module.exports.meetings
);
