#!/usr/bin/env node
'use strict';
const {Bot} = require('..');

const bot = new Bot('yellbot', 'test');
const store = [];

bot.once('ready', () => {
  console.log(bot.identity, bot._cookie)
  bot.on('send-event', json => {
    if(!(json.data.sender.id === bot.identity)) {
      const match = json.data.content.match(/^!yell (@[\S]*\b) (.*)$/);
      if(match) {
        bot.reply(`/me will yell at ${match[1]}`);
      }
    }
  });
});


