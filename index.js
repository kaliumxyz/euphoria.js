#!/bin/env node
'use strict';
const Connection = require('euphoria-connection');
const EventEmitter = require('events');
const uuid = require('uuid/v4');

// TODO: filters for commands.

class Bot extends EventEmitter {
	constructor(
		nick = '><>',
		room = 'test',
		commands,
		options = {
			disconnect_on_kill: false, reconnect: true
		},
		defaults = {
			room: room,
			human: 0,
			host: 'wss://euphoria.io',
			options: { origin: 'https://euphoria.io' },
		}) {

		super();
		this.connection = new Connection(defaults.room, defaults.human, defaults.host, defaults.options, json => this._handle_snapshot(json));

		// properties
		this._room = defaults.room;
		this._human = defaults.human;
		this._host = defaults.host;
		this._connection_options = defaults.options;
		this._options = options;
		this._nick = nick;
		this._listing = [];
		this._log = [];
		this._config = {
			regex: false,
			disconnect_on_kill: options.disconnect_on_kill || false
		};
		this._reconnect = options.reconnect || false;
		// TODO: create an immutable way to refer to self and make this clear to any user
		this._id = uuid();

		this.commands = commands || [];
		this.commands['!help'] = this._make_reaction('I\'m a bot created using https://github.com/kaliumxyz/euphoria.js');
		this.commands[`!help ${this._id}`] = this._make_reaction('I\'m a bot created using https://github.com/kaliumxyz/euphoria.js');
		this.commands['!ping'] = this._make_reaction('pong!');
		this.commands[`!kill ${this._id}`] = id => {
			this.post('/me is exiting', id);
			if (!this._config.soft_kill)
				process.exit(0);
			else
				this.connection.close();
		};
		this.commands[`!ping ${this._id}`] = this._make_reaction('pong!');

		this.connection.once('open', () => {
			this.nick = nick;
			this.emit('open');
		});

		this.connection.on('close', () => {
			if(this._reconnect)
				this.reconnect();
		});

		this.connection.on('send-event', json => {
			this._handle_send_event(json);
		});

		this.connection.on('hello-event', json => {
			this._handle_hello_event(json);
		});

		this.connection.on('join-event', json => {
			this._handle_join_event(json);
		});

		this.connection.on('part-event', json => {
			this._handle_part_event(json);
		});

		process.on('beforeExit', () => {
			this._reconnect = false;
			this.connection.close();
		});
	}

	post(content, parent) {
		this.connection.post(content, parent);

		return this;
	}

	/* reply to the last post
	 *
	 */
	reply(content){
		this.post(content, this.log[ this.log.length - 1 ].id);

		return this;
	}

	_make_reaction(message) {
		return id => this.post(message, id);
	}

	_handle_send_event(json) {
		const data = json.data;

		// TODO limit log max size to prevent process from running out of memory
		this._log.push(data);

		// any functionality must come AFTER pushing to log, in case the log is needed
		if(data.content.startsWith('!')) {
			const content = data.content.replace(`@${this._nick}`, this._id);
			const reaction = this.commands[content];
			if(reaction)
				reaction(data.id);
		}

		this.emit('send-event', json);
		this.emit('post', data);
	}

	_handle_hello_event(json) {
		const data = json.data;
		this._listing.push(data.session);
		this.emit('hello-event', json);
	}

	_handle_join_event(json) {
		const data = json.data;
		this._listing.push(data);
		this.emit('join-event', json);
	}

	_handle_part_event(json) {
		const data = json.data;
		this._listing.splice(this._listing.findIndex(item => item.id === data.id), 1);
		this.emit('part-event', json);
	}

	_handle_snapshot(json) {
		const data = json.data;
		this._identity = data.identity;
		this._session_id = data.session_id;
		this._version = data.version;
		this._listing = this._listing.concat(data.listing);
		this._log = data.log;
		this.emit('ready');
	}

	reconnect() {
		this.connection = new Connection(this.room, this.human, this.host, this.connection_options);
		this.connection.once('open', () => {
			this.nick = this.nick;
			this.emit('reconnected');
		});

		return this;
	}

	set nick(nick) {
		this.connection.nick(nick);
		this._nick = nick;
		this.connection.once('nick-reply', () => {
			this._nick = nick;
			this.emit('nick-set', nick);
		});
	}

	get nick() {
		return this._nick;
	}

	get users() {
		return this._users;
	}

	set room(room) {
		this.connection = new Connection(room, this.human, this.host, this.connection_options);
		this._room = room;
		this.connection.once('open', () => {
			this._room = room;
			this.emit('reconnected');
		});
	}

	get room() {
		return this._room;
	}

	get human() {
		return this._human;
	}

	get connection_options() {
		return this._connection_options;
	}
	

	get host() {
		return this._host;
	}
	
	get log() {
		// slice creates a copy.
		return this._log.slice(0);
	}

	get version() {
		return this._version;
	}

	get listing() {
		// slice creates a copy.
		return this._listing.slice(0);
	}
	get identity() {
		return this._identity;
	}
}

// TODO include helper classes so the main object is not as bloated

module.exports = {Bot};
