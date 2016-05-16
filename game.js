"use strict";

const _ = require("underscore");
const debug = require("./debug.json");
const Player = require("./player.js");

class Game {
  constructor(bot, msg, setup, all_channels, host){
    this.bot = bot;
    this.msg = msg;
    this.setup = setup;
    this.all_channels = all_channels;
    this.host = host;
    this.status = 0; //0 - Waiting for host
                     //1 - Waiting for other players
                     //2 - Waiting for ready up
                     //3 - Playing
                     //4 - Game end
    this.day = true;
    this.day_num = 0;
    this.channel = null;
    this.server = (msg[0] === "system") ? msg[1] : msg.channel.server;
    this.channels = [];
    this.players = [];
    this.ready = {};
  }

  init(callback){
    //i wont lie, this is definitely me when i copy and paste code from demafia.js because i forgot to put it in game.js because im a fucking idiot and dont want to find and replace to add this. to all the variables
    let bot = this.bot;
    let msg = this.msg;
    let setup = this.setup;
    let all_channels = this.all_channels;
    let server = this.server;

    let self = this;

    this.bot.gameCount++;

    server.createChannel(`game-${this.bot.gameCount}`, "text", function(e, channel){
      self.channel = channel;

      bot.overwritePermissions(channel.id, server.id, {
        "readMessages": false
      }, function(err){
        bot.overwritePermissions(channel.id, bot.user, {
          "readMessages": true
        }, function(){
          let meetings = {};
          all_channels.all_channels.push(channel);

          _.each(_.uniq(setup), function(role){
            _.each(role.get_meetings(), function(meeting){
              if(meeting.channel !== ""){
                meetings[meeting.channel] = meeting;
              }
            });
          });

          let done = [];
          let finish = function(){
            if(self.channels.length !== 0){ //this usually only happens with debugging or all non maf meet
              _.each(self.channels, function(e){
                bot.overwritePermissions(e.id, server.id, {
                  "readMessages": false
                }, function(er){
                  bot.overwritePermissions(e.id, bot.user, {
                    "readMessages": true
                  }, function(e){
                    if(msg[0] !== "system")
                      bot.sendMessage(msg.author.id, `Before your lobby becomes public, you must join it yourself by typing !join ${self.bot.gameCount}.`);

                    console.log(`Game ${self.bot.gameCount} created.`);
                    callback();
                  });
                });
              });
            }else{
              if(msg[0] !== "system")
                bot.sendMessage(msg.author.id, `Before your lobby becomes public, you must join it yourself by typing !join ${self.bot.gameCount}.`);

              console.log(`Game ${self.bot.gameCount} created.`);
              callback();
            }
          };

          if(_.keys(meetings).length === 0){
            finish();
          }else{
            _.each(meetings, function(m){
              server.createChannel(`game-${self.bot.gameCount}-${m.channel}`, "text", function(e, channel){
                channel.meeting = m;
                bot.overwritePermissions(channel.id, bot.user, {
                  "readMessages": true
                }, function(){
                  self.channels.push(channel);
                  all_channels.all_channels.push(channel);
                  done.push(m);

                  if(_.isEqual(_.values(meetings), done)){
                    finish();
                  }
                });
              });
            });
          }
        });
      });
    });
  }

  join(user){
    let self = this;

    this.players.push(new Player(this, user, null));

    this.bot.overwritePermissions(this.channel, user, {
      "readMessages": true
    }, function(){
      self.bot.sendMessage(self.channel, `${user.name} joined the lobby.`, function(){
        if(self.players.length === self.setup.length){
          self.status = 2;

          if(debug.autoready){
            self.start_setup();
            self.status = 3;
          }else{
            _.each(self.players, function(ply){
              self.ready[ply.client] = false;
            });

            self.bot.sendMessage(self.channel, "Type !ready in this chat to toggle readying up.");
          }
        }
      });
    });
  }

  ready_up(user){
    if(this.status === 1){
      this.bot.sendMessage(this.channel, "You must wait until all player slots are filled before you can ready up.");
    }else if(this.status === 2){
      this.bot.sendMessage(this.channel, "The game already started.");
    }else{
      this.ready[user] = !this.ready[user];

      this.bot.sendMessage(this.channel, `${user.name} is ${this.ready[user] ? "ready" : "not ready"}`);

      if(_.every(this.ready, (ready) => ready)){
        this.status = 3;
        this.start_setup();
      }
    }
  }

  whos_ready(){
    let self = this;
    let ret = "";

    _.each(this.ready, function(val, ply){
      if(val){
        ret += `${ply}, `;
      }
    });

    if(ret === "")
      ret = "Nobody is ready";
    else
      ret = `Ready: ${ret}`; //TODO: Fix commas at the end

    this.bot.sendMessage(this.channel, ret);
  }

  get_setup(){
    let setup = this.setup;
    let ret = "";

    _.each(setup, function(role, i){
      ret += `${role.id}${i === setup.length - 1 ? "" : " "}`;
    });

    return ret;
  }

  start_setup(){
    let setup = _.shuffle(this.setup);

    this.bot.sendMessage(this.channel, "Player IDs:", () => {
      let ids = "";
      let i = 0;

      for(let player of this.players){
        let role = setup[i];
        role.player = player;
        role.game = this;
        ids += `${player.client.name} - ${i}\n`;

        this.bot.sendMessage(player.client.id, `You are a ${role.name}.\n${role.description}`);

        player.role = role;
        i++;
      }

      //call this after all the roles are set jic lol
      i = this.players.length;

      for(let e of this.players){
        if(e.role.meetings.length === 1){
          i--;
          e.role.init();

          if(i === 0){
            this.bot.sendMessage(this.channel, ids);
            this.next();
            break;
          }

          continue;
        }

        for(let meeting of e.role.meetings){
          let channel = this.get_meeting_channel(meeting);

          if(channel === null)
            continue;

          channel.meeting.game = this;
          channel.meeting.on_vote(e, undefined, false);

          this.bot.overwritePermissions(channel, e.client, {
            "readMessages": true,
            "sendMessages": true
          }, () => {
            i--;
            e.role.init();

            if(i === 0){
              this.bot.sendMessage(this.channel, ids);
              this.next();
            }
          });
        }
      }
    });
  }

  //TODO: make a name that doesnt suck
  next(){
    this.day = !this.day;

    if(!this.day)
      this.day_num++;
    /*
    if(this.check_win()[0]){
      this.bot.sendMessage(this.channel, `${this.check_win()[1][1] === 0 ? "Town wins" : "Mafia wins"}!`);
      this.status = 4;
      this.players = [];
      return;
    }
    */

    for(let meeting of _.map(this.channels, (channel) => {
      return channel.meeting;
    })){
      if(meeting !== undefined){
        meeting.end();

        for(let key of _.keys(meeting.voted)){
          meeting.voted[key] = undefined;
        }
      }
    }

    for(let player of this.players){
      if(this.day)
        player.role.on_day();
      else
        player.role.on_night();
    }

    this.bot.sendMessage(this.channel, `${this.day ? "Day" : "Night"} ${this.day_num}`);

    this.tell_meetings();
  }

  check_win(){
    //TODO: Have some easy way to allow third party wins without hardcoding them here
    let mafia = 0;
    let town = 0;

    _.each(this.players, function(e){
      if(e.alive){
        if(e.role.alignment === "mafia")
          mafia += 1;
        else
          town += 1;
      }
    });

    return [town <= mafia || mafia === 0, [town, mafia]];
  }

  get_meeting_channel(meeting_id){
    let ret = null;

    _.each(this.channels, function(channel){
      if(ret !== null)
        return;

      if(channel.meeting.id === meeting_id)
        ret = channel;
    });

    return ret;
  }

  tell_meetings(){
    let self = this;
    let channels_notified = [];

    _.each(this.players, function(e){
      _.each(e.role.meetings, function(meeting){
        let channel = self.get_meeting_channel(meeting);

        if(channel === null)
          return;

        if(channel.meeting.show(self)){
          if(channels_notified.indexOf(channel) === -1){
            self.bot.sendMessage(channel, `Type !choose YOUR TARGET'S DISCORD ID`);
            channels_notified.push(channel);
          }

          if(channel.meeting.notify)
            self.bot.sendMessage(channel, `${e.client.name}, the ${e.role.name}, joined the meeting.`);
        }
      });
    });
  }

  choose(channel, victim_id, voter_client){
    let victim = this.players[victim_id];
    let meeting = channel.meeting;
    let voter = null;

    for(let player of this.players){
      if(player.client === voter_client){
        voter = player;
        break;
      }
    }

    if(!meeting.show(this) || voter === null) //voter === null should never happen but jic
      return;

    let voted_for = null;

    try{
      if(victim === undefined && !meeting.can_nl)
        throw "Can't vote no one. If you didn't vote no one, check the Player ID.";

      if(victim === undefined){
        voted_for = "no one";
        return;
      }else
        voted_for = victim.client.name;

      if(!meeting.can_vote_for(victim))
        throw "Can't vote for that target.";
    }catch(e){
      this.bot.sendMessage(channel, `Error voting: ${e}`);
    }finally{
      if(voted_for !== null){
        meeting.on_vote(voter, victim === undefined ? null : victim);
        this.bot.sendMessage(channel, `${voter_client.name} voted for ${voted_for}`);

        let reset = () => { //theres prob a better way to do this
          for(meeting of _.map(this.channels, (channel) => { //there was probably other places i could put this
                                                             //should i really redefine meeting
            return channel.meeting;
          })){
            if(meeting !== undefined){
              if(_.values(meeting.voted).indexOf(undefined) !== -1){
                return;
              }
            }
          }

          this.next();
        };

        reset();
      }
    }
  }
}

module.exports = Game;
