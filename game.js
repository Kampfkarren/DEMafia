"use strict";

const _ = require("underscore");
const debug = require("./debug.json");
const Player = require("./player.js");

class Game {
  constructor(bot, msg, setup, all_channels, gameCount, host){
    this.bot = bot;
    this.msg = msg;
    this.setup = setup;
    this.all_channels = all_channels;
    this.gameCount = gameCount;
    this.host = host;
    this.status = 0; //0 - Waiting for host
                     //1 - Waiting for other players
                     //2 - Waiting for ready up
                     //3 - Playing
                     //4 - Game end
    this.day = true;
    this.day_num = 0;
    this.channel = undefined;
    this.server = msg.channel.server;
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
    let gameCount = this.gameCount;
    let server = this.server;

    let self = this;

    gameCount.gameCount++;

    server.createChannel(`game-${gameCount.gameCount}`, "text", function(e, channel){
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
            _.each(self.channels, function(e){
              bot.overwritePermissions(e.id, server.id, {
                "readMessages": false
              }, function(er){
                bot.overwritePermissions(e.id, bot.user, {
                  "readMessages": true
                }, function(){
                  bot.sendMessage(msg.author.id, `Before your lobby becomes public, you must join it yourself by typing !join ${gameCount.gameCount}.`);
                  console.log(`Game ${gameCount.gameCount} created.`);
                  callback();
                });
              });
            });
          };

          if(meetings.length === 0){
            finish();
          }else{
            _.each(meetings, function(m){
              server.createChannel(`game-${gameCount.gameCount}-${m.channel}`, "text", function(e, channel){
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
            self.next();
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
        this.start_setup();
        this.status = 3;
        this.next();
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
    else{
      ret = `Ready: ${ret}`; //TODO: Fix commas at the end
    }

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

    _.each(this.players, function(e, i){
      let role = setup[i];
      role.player = e;
      role.game = this;

      e.role = role;
    });

    //call this after all the roles are set jic lol

    _.each(this.players, function(e){
      e.role.init();
    });
  }

  //TODO: make a name that doesnt suck
  next(){
    this.day = !this.day;

    if(!this.day)
      this.day_num++;

    if(this.check_win()[0]){
      this.bot.sendMessage(this.channel, `${this.check_win()[1][1] === 0 ? "Town wins" : "Mafia wins"}!`);
      this.status = 4;
      return;
    }

    this.bot.sendMessage(this.channel, `${this.day ? "Day" : "Night"} ${this.day_num}`);
  }

  check_win(){
    //TODO: Have some easy way to allow third party wins without hardcoding them here
    let mafia = 0;
    let town = 0;

    _.each(this.players, function(e){
      if(e.alive){
        if(e.role.alignment === mafia)
          mafia += 1;
        else
          town += 1;
      }
    });

    return [town - 1 <= mafia || mafia === 0, [town, mafia]];
  }
}

module.exports = Game;
