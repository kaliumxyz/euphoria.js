#!/usr/bin/env node
'use strict';
const {Bot} = require('..');

// we do not want the bot to have a name as it is a spy
const bot = new Bot('', process.argv[2]);

// log any posts
// bot.on('post', form_tree);

bot.on('ready', () => print(map_comments(bot.log)));

bot.tree = [];

function map_comments(list) {
  const map = [];
  list.forEach(x => map[x.id] = x);

  // function recurse(tree, list, i = 1){
  //   let children = list.filter(x => x.parent);
  //   children.forEach(child => {
  //     child.depth = i;
  //     if (child.children) {
  //       recurse(tree, children, i++);
  //     }
  //     if (map[child.parent]) {
  //       if (map[child.parent].children) {
  //         map[child.parent].children.push(child);
  //       } else {
  //         map[child.parent].children = [];
  //         map[child.parent].children.push(child);
  //       }
  //     } else {
  //       map[child.parent] = {
  //         children: [child]
  //       }
  //     }
  //   });
  // }
    //
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
      } else {
        map[node.parent] = {
          children: [node]
        }
      }
    }
  }

  function recurse(node, i = 0){
    node.depth = i;
    if (node.children) {
      node.children.forEach(child => {
        node.children.push(recurse(child, i+1));
      });
    }
    return node;
  }

  // mutates map
  list.forEach(x => resolve(x));

	Object.keys(map).forEach(key => {
    if(!map[key].parent && map[key].sender)
      console.log(map[key]);
      // console.log(JSON.stringify(recurse(map[key])));
  });

	// while (list.length) { 
	// 	const node = list.shift();
	// 	const parent = node.parent;
	// 	node.depth = 0;
	// 	if (parent) {
      // node.depth++;
      // if (tree[parent] !== void(0)) { // check if parent has a representation in our tree
        // tree[parent].children.push(node);
        // map[parent].children.push(node);
      // } else { // if it doesn't then it also has a parent
        // if (map[parent] === void(0)) {// if its not here, its not loaded at all.
          // tree[parent] = {
            // children: [node]
          // };
          // map[parent] = {
            // children: [node]
          // };
        // } else { 
          // let root = node;
          // // finding root
          // while (1) {
            // node.depth++;
            // if (root.parent) {
              // let last = root;
              // root = map[root.parent];
              // if (root.children){
                // root.children.push(last);
              // } else {
                // root.children = [];
                // root.children.push(last);
              // }
              // map[root.parent] = root;
            // } else {
              // break;
            // }
          // }

          // tree[root.id] = root;

          // // I hate javascript so much...

          // // function recurse (tree, current, node) {
          // //   if (current.children) {
          // //     target = current.children.find(x => node.id === x.id);
          // //   }
          // // }

          
          // // root = recurse(root, node);

          // // tree[root.id] = root;
          // // map[root.id] = root;
          // // while (ids.length) {
          // //   let id = ids.pop()
          // //   if (current.children) { 
          // //     let _current = current.children.find(x => id === x.id);
          // //     if (_current) 
          // //       current = _current;
          // //   } else {
          // //     current.children = [];
          // //   }
          // // }
          // // current.children.push(node)
        // }
      // }
	// 	} else {
      // if (tree[node.id]) {
        // let children = tree[node.id].children;
        // tree[node.id] = node;
        // tree[node.id].children = children;
        // map[node.id] = node;
        // map[node.id].children = children;
      // } else {
        // tree[node.id] = node;
        // tree[node.id].children = [];
        // map[node.id] = node;
        // map[node.id].children = [];
      // }
	// 	}
	// }
	// return {tree, map};
}

function print(tree, i = 0) {
	// console.log('aaa', i);
	Object.keys(tree).forEach(key => {
		const node = tree[key];
		// console.log(i, node.sender.name, node.content); 
		if(node.children)
			print(node.children, i + 2);
	});
}
