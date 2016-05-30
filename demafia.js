"use strict";

const Discord = require("discord.js");
const chalk = require("chalk");
const didyoumean = require("didyoumean");
const _ = require("underscore");
const bot = new Discord.Client();
const Game = require("./game.js");
const account_info = require("./account.json");
const debug = require("./debug.json");
const roles = require("./roles/role.js");

let all_channels = [];
let games = [];

//TODO: should these be put somewhere else?
function gracefulShutdown(){
  console.log("Going down, deleting all channels.");

  let count = all_channels.length;

  if(count !== 0){
    _.each(all_channels, function(e){
      bot.deleteChannel(e, function(){
        count--;

        if(count === 0){
          console.log("Disconnected");
          process.exit();
        }
      });
    });
  }else{
    console.log("Disconnected");
    process.exit();
  }
}

process.stdin.resume();

process.on("SIGINT", gracefulShutdown); //ctrl+c
process.on("SIGUSR2", gracefulShutdown); //nodemon
process.on("SIGTERM", gracefulShutdown); //nodemon when it crashes i think
process.on("uncaughtException", function(err){
  console.error(`Caught exception: ${err}`);
});

bot.on("ready", function(){
  console.log(chalk.green("Ready"));

  bot.setStatus("online", "EpicMafia in Discord");

  if(debug.createdebugsetup.length !== 0){
    let setup = [];

    _.each(debug.createdebugsetup, function(e){
      const result = didyoumean(e, _.keys(roles.rolesAsIds));

      if(result === null){
        console.error(chalk.red.bold("Invalid role in createdebugsetup, exiting."));
        process.exit();
      }else{
        setup.push(new roles.rolesAsIds[result]());
      }
    });

    let game = new Game(
      bot,
      ["system", bot.servers[bot.servers.length - 1]], //TODO: find a better way cause this is fucking trash lmfao
      setup,
      {
        all_channels: all_channels
      },
      null
    );

    game.init(() => {
      games.push(game);
    });
  }
});

bot.on("message", function(msg){
  if(msg.user === bot.user)
    return;

  if(msg.content[0] === "!"){
    const split = msg.content.slice(1).split(" ");
    let cont;

    switch(split[0]){
      case "role":
        const arg = split[1];
        const result = didyoumean(arg, _.keys(roles.rolesAsIds));

        if(result === null)
          bot.sendMessage(msg.channel, "Unknown role. Are you sure you spelled it right? Please don't use shorthand like \"blue\" or \"maf\"");
        else{
          const role = new roles.rolesAsIds[result]();

          bot.sendMessage(msg.channel, `${role.name}\nAligned with the ${_(role.alignment)}\n${role.description}`);
        }

        break;
      case "create":
        split.shift();

        cont = true;
        let setup = [];

        _.each(split, function(e){
          if(!cont)
            return;

          const result = didyoumean(e, _.keys(roles.rolesAsIds));

          if(result === null){
            bot.sendMessage(msg.channel, `Unknown role ${e}. Are you sure you spelled it right? Please don't use shorthand like "blue" or "maf"`);
            cont = false;
          }else{
            setup.push(new roles.rolesAsIds[result]());
          }
        });

        if(!cont)
          break;

        let maf = 0;
        let town = 0;

        _.each(setup, function(e){
          if(e.alignment === "mafia")
            maf++;
          else
            town++;
        });

        if((town - 1 <= maf && !debug.allowautosetup) || (town === 0 && maf === 0)){
          bot.sendMessage(msg.channel, "Invalid setup, mafia and town aren't balanced.");
        }else{
          let game = new Game(
            bot,
            msg,
            setup,
            {
              all_channels: all_channels
            },
            msg.author.id
          );

          game.init(function(){
            games.push(game);
          });
        }

        break;
      case "join":
        let gameId = parseInt(split[1]);

        if(isNaN(gameId))
          bot.sendMessage(msg.channel, "Invalid game ID");
        else{
          gameId--;

          let ingame = false;
          let owner_of = null;

          _.each(games, function(g){
            _.each(g.players, function(ply){
              if(ply.client === msg.author)
                ingame = true;
            });
          });

          if(ingame){
            bot.sendMessage(msg.channel, "You are already in a game.");
            break;
          }

          const game = games[gameId];

          if(game === undefined){
            bot.sendMessage(msg.channel, "That game does not exist.");
          }else{
            switch(game.status){
              case 0:
                if(msg.author.id === game.host || game.host === null){
                  game.join(msg.author);
                  game.status = 1;
                }else{
                  bot.sendMessage(msg.channel, "This game is waiting for its host to join");
                }

                break;
              case 1:
                game.join(msg.author);
                break;
              default:
                bot.sendMessage(msg.channel, "This game is either waiting for everyone to ready up, is playing, or is done");
                break;
            }
          }
        }

        break;
      case "lobbies":
        let output = "";

        _.each(games, function(game, i){
          if(game.status === 1){
            output += `!join ${i} - ${game.players.length}/${game.setup.length} - ${game.get_setup()}`;
          }
        });

        if(output === "")
          output = "There are currently no lobbies.";

        bot.sendMessage(msg.channel, output);

        break;
      case "ready":
        const ready_channel = msg.channel;
        cont = true;

        _.each(games, function(game){
          if(!cont)
            return;

          if(game.channel === ready_channel){
            game.ready_up(msg.author);
            cont = false;
          }
        });

        if(cont)
          bot.sendMessage(msg.channel, "You must use !ready in the game's lobby chat, not the main chat.");

        break;
      case "whosready":
        const whosready_channel = msg.channel;
        cont = true;

        _.each(games, function(game){
          if(!cont)
            return;

          if(game.channel === whosready_channel){
            game.whos_ready();
            cont = false;
          }
        });

        if(cont)
          bot.sendMessage(msg.channel, "You must use !ready in the game's lobby chat, not the main chat.");

        break;
      case "choose":
        //oh god what the fuck
        const choose_channel = msg.channel;
        cont = true;

        _.each(games, function(game){
          if(!cont)
            return;

          if(game.channels.indexOf(choose_channel) !== -1){
            game.choose(choose_channel, msg.content.split(" ")[1], msg.author);
            cont = false;
          }
        });

        break;
    }
  }
});

bot.on("error", function(err){
  console.log(chalk.red.bold(`Error: ${err}`));
});

console.log(chalk.green.bold(`==DEMafia v${require("./package.json").version} (${require("./package.json").demafia_version})==`));

bot.gameCount = 0;

bot.loginWithToken(account_info.token);
