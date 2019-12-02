#!/usr/bin/env node
'use strict';
const {Bot} = require('..');

// we do not want the bot to have a name as it is a spy
const bot = new Bot('\u202e', process.argv[2]);

// log any posts
// bot.on('post', form_tree);

bot.on('ready', function() {
  this.post("imgs.xkcd.com/comics/.html#.png");
  process.exit();
});
