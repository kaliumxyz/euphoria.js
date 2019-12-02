#!/usr/bin/env node
'use strict';
const {Bot} = require('..');

// we do not want the bot to have a name as it is a spy
const bot = new Bot('', process.argv[2]);

// log any posts

bot.on('ready', () => {
  print(map_comments(bot.log));
});

bot.on('post', () => {
  console.log("...");
  print(map_comments(bot.log));
  process.exit(0);
});
// bot.on('ready', () => map_comments(bot.log));

function map_comments(list) {
  const map = [];
  const tree = [];

  function resolve(node){
    map[node.id] = node
    let parent = node.parent;
    if(parent) {
      if (map[parent]) {
        if (map[parent].children) {
           if (!map[node.parent].children.find(x => x.id === node.id))
              map[parent].children.push(node);
        } else {
          map[parent].children = [];
          map[parent].children.push(node);
        }
      } else { // node does not exist
        map[parent] = {
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


function print(tree, depth = 0, is_last_child_of_root = false) {
  tree.forEach((x, i) => {
    if (depth === 1)
        is_last_child_of_root = i == tree.length-1;
    let padding = "";
    for (let i=0; i < depth; i++) {
      padding += "─";
    }
    if (x.children) {
      console.log(`${depth>0?"├":"┌"}${padding}${x.sender.name} ${x.content}`);
      print(x.children, depth + 1, is_last_child_of_root);
    } else {
      let last = i == tree.length-1;
      console.log(`${depth>0?last?is_last_child_of_root?"└":"├":"├":"╶"}${padding}${x.sender.name} ${x.content}`);
    }
  });
}
