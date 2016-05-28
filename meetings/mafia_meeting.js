"use strict";

const Meeting = require("./meeting.js").Meeting;
const _ = require("underscore");

class MafiaMeeting extends Meeting {
  constructor(){
    super();
    this.id = "mafia";
    this.name = "Mafia Meeting";
    this.description = "Choose someone to kill over the night";
    this.channel = "mafia";
  }

  can_vote_for(player){
    return require("./meeting.js").shortcuts.nonmaf_only(player);
  }

  show(game){
    return !game.day;
  }

  end(){
    super.end();

    _.each(this.voted, (victim, voter) => {
      let v = this.game.players[voter];

      if(v === undefined)
        return;

      v.visit(this.game.players[voter], "mafia");
    });

    let victims = require("./meeting.js").majority(this.voted);

    if(victims.length === 1){
      let victim = victims[0];

      if(victim === null || victim === undefined)
        return;

      victim.kill("mafia");
    }
  }
}

module.exports = MafiaMeeting;
