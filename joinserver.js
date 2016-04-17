"use strict";

const Discord = require("discord.js");
const chalk = require("chalk");
const bot = new Discord.Client();
const account_info = require("./account.json");

bot.on("ready", function(){
  const url = process.argv[2];

  console.log(chalk.blue(`Joining server ${url}`));

  bot.joinServer(url, function(e){
    if(e !== null){
      console.log(chalk.red.bold("An error occured"));
      console.log(chalk.red.bold(e));
    }else{
      console.log(chalk.green("Joined!"));
    }

    bot.logout();
  });
});

console.log(chalk.blue.bold("DEMafia - Join Server"));

bot.login(account_info["email"], account_info["password"]);
