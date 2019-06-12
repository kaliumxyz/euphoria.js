#!/usr/bin/env node
'use strict';
const {Bot} = require('..');

// we do not want the bot to have a name as it is a spy
const bot = new Bot('', process.argv[2]);

// log any posts
// bot.on('post', form_tree);

bot.on('ready', () => print(map_comments(bot.log)));
// bot.on('ready', () => map_comments(bot.log));

bot.tree = [];

function map_comments(list) {
  const map = [];
  const tree = [];
  list.forEach(x => map[x.id] = x);

  function resolve(node){
    if(node.parent) {
      if (map[node.parent]) {
        if (map[node.parent].children) {
          if (!map[node.parent].children.find(x => x.id === node.id))
            map[node.parent].children.push(node);
        } else {
          map[node.parent].children = [];
          map[node.parent].children.push(node);
        }
      } else { // node does not exist
        map[node.parent] = {
          children: [node]
        }
      }
    }
  }

  // mutates map
  list.forEach(x => resolve(x));

	Object.keys(map).forEach(key => {
    if(!map[key].parent && map[key].sender)
      tree.push(map[key]);
  });
  return tree;
}


function print(tree, depth = 0) {
  tree.forEach((x, i) => {
    let padding = "";
    for (let i=0; i < depth; i++) {
      padding += "─";
    }
    if (x.children) {
      console.log(`${depth>0?"├":"┌"}${padding}${x.sender.name} ${x.content}`);
      print(x.children, depth + 1);
    } else {
      let last = i == tree.length-1;
      console.log(`${depth>0?last?"└":"├":"╶"}${padding}${x.sender.name} ${x.content}`);
    }
  });
}
