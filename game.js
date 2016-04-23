"use strict";

const _ = require("underscore");
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
    this.day = false;
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
                  gameCount.gameCount++;
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

          _.each(self.players, function(ply){
            self.ready[ply.client] = false;
          });

          self.bot.sendMessage(self.channel, "Type !ready in this chat to ready up, type !unready in this chat to unready up");
        }
      });
    });
  }

  ready_up(user){
    if(this.status !== 2){
      this.bot.sendMessage(this.channel, "You must wait until all player slots are filled before you can ready up.");
    }else{
      this.ready[user] = !this.ready[user];

      this.bot.sendMessage(this.channel, `${user.name} is ${this.ready[user] ? "ready" : "not ready"}`);
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
      ret = `Ready: ${ret.substring(0, ret.length - 1)}`;
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
}

module.exports = Game;
