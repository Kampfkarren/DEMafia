const Meeting = require("./meeting.js").Meeting;
const _ = require("underscore");

class MafiaMeeting extends Meeting {
  constructor(game){
    super(game);
    this.id = "mafia";
    this.name = "Mafia Meeting";
    this.description = "Choose someone to kill over the night";
  }

  can_vote_for(player){
    return require("./meeting.js").shortcuts.nonmaf_only;
  }

  show(game){
    return !game.day;
  }

  end(){
    _.each(this.votes, function(victim, voter){
      voter.visit(victim, "mafia");
    });

    let victims = require("./meeting.js").majority(this.votes);

    if(victims.length === 1){
      let victim = victims[0];

      victim.kill("mafia");
    }
  }
}

module.exports = MafiaMeeting;
