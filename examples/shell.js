#!/usr/bin/env node
'use strict';
const {Bot} = require('..');
const { spawn } = require('child_process');

const bot = new Bot('nix', process.argv[2]);

let shell;

let owner = 'agent:3UMrD2rM_40=';

let lock = true;

bot.on('ready', () => {

    bot.on('post', data => {
        if(!lock || data.sender.id === owner) {
            if(data.bot.parsed.startsWith('.unlock')) {
                lock = false;
            } else
                if(data.bot.parsed.startsWith('.lock')) {
                    lock = true;
                } else
                    if(data.bot.parsed.startsWith('.room') && data.bot.parsed.match(/&\w*/) && data.sender.id === owner) {
                        spawn("node", [process.argv[1], data.bot.parsed.match(/&(\w+)/)[1]],
                            {
                                stdio: ['inherit', 'inherit', 'inherit']
                            })
                    process.exit(0);
                } else
                    if(data.bot.parsed.startsWith('.spawn bash') && data.sender.id === owner) {
                        if (shell)
                            shell.kill();

                        shell = spawn("bash",
                                      {
                                          stdio: ['pipe', 'pipe', 'pipe']
                                      })

                        bot.nick = "nix - bash";
                        bot.reply(`bash started`);
                        shell.stdout.on('data', (data) => {
                            let output = data.toString().replace(/\[[\d;]+m/g, "");
                            bot.reply(`${output}`);
                            console.log(`stdout: ${data}`)
                        });

                        shell.stderr.on('data', (data) => {
                            let output = data.toString().replace(/\[[\d;]+m/g, "");
                            bot.reply(`${output}`);
                            console.log(`stderr: ${data}`)
                        });

                        shell.on('exit', _ => {
                            bot.nick = "nix";
                            shell = false;
                        })

                    } else
                        if(data.bot.parsed.startsWith('.spawn python') && data.sender.id === owner) {
                        if (shell)
                            shell.kill();

                        shell = spawn("python", 
                                      {
                                          stdio: ['pipe', 'pipe', 'pipe']
                                      })

                        bot.nick = "nix - python";
                        bot.reply(`python started`);
                        shell.stdout.on('data', (data) => {
                            let output = data.toString().replace(/\[[\d;]+m/g, "");
                            bot.reply(`${output}`);
                            console.log(`stdout: ${data}`)
                        });

                        shell.stderr.on('data', (data) => {
                            let output = data.toString().replace(/\[[\d;]+m/g, "");
                            bot.reply(`${output}`);
                            console.log(`stderr: ${data}`)
                        });

                        shell.on('exit', _ => {
                            bot.nick = "nix";
                            shell = false;
                        })

                    } else
                        if(data.bot.parsed.startsWith('.spawn nix') && data.sender.id === owner) {
                            if (shell)
                                shell.kill();
                            shell = spawn("nix", ["repl"],
                                          {
                                              stdio: ['pipe', 'pipe', 'pipe']
                                          })

                            bot.nick = "nix - nix";

                            shell.stdout.on('data', (data) => {
                                let output = data.toString().replace(/\[[\d;]+m/g, "");
                                bot.reply(`${output}`);
                                console.log(`stdout: ${data}`)
                            });

                            shell.stderr.on('data', (data) => {
                                let output = data.toString().replace(/\[[\d;]+m/g, "");
                                bot.reply(`${output}`);
                                console.log(`stderr: ${data}`)
                            });

                            shell.on('exit', _ => {
                                bot.nick = "nix";
                                shell = false;
                            })

                        } else
                            if(data.bot.parsed.startsWith('.kill') && data.sender.id === owner) {
                            if (shell) {
                                shell = false;
                            }
                        } else
                            if(data.bot.parsed.startsWith('.restart') && data.sender.id === owner) {
                                spawn("node", [process.argv[1], bot.room],
                                  {
                                      stdio: ['inherit', 'inherit', 'inherit']
                                  })
                            process.exit(0);
                        } else
                        if(data.bot.parsed.startsWith('.')) {
                            let input = data.bot.parsed.slice(1);
                            console.log(`${data.sender.name}: ${input}`)
                            if (shell) {
                                shell.stdin.write(`${input}\n`);
                            } else {
                                try {
                                    bot.reply(`${eval(input)}`);
                                } catch (e) {
                                    bot.reply(`${e}`);
                                }
                            }
                        }
        }
    });
});
