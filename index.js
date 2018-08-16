#!/bin/env node
'use strict';
const Connection = require('euphoria-connection');
const EventEmitter = require('events');


class Bot extends EventEmitter {
	constructor(nick = '><>', room = 'test', commands, defaults) {
		defaults = {
			room: room,
			human: 0,
			host: 'wss://euphoria.io',
			options: { origin: 'https://euphoria.io' },
		};

		super();
		this.connection = new Connection(defaults.room, defaults.human, defaults.host, defaults.options, raw => this._handle_snapshot(raw));

		// properties
		this._room = defaults.room;
		this._human = defaults.human;
		this._host = defaults.host;
		this._options = defaults.options;
		this._nick = nick;
		this._listing = [];
		this._log = [];

		this.commands = {
			kill: '/me is exiting',
			help: 'I\'m a bot created using https://github.com/kaliumxyz/euphoria.js',
			long_help: 'I\'m a bot created using https://github.com/kaliumxyz/euphoria.js',
			ping: 'pong!',
		};
		this.commands[`ping ${nick}`] = 'pong!';

		this.connection.once('open', () => {
			this.nick = nick;
			this.emit('open');
		});

		this.connection.on('send-event', raw => {
			this._handle_send_event(raw);
		});

		this.connection.on('join-event', raw => {
			this._handle_join_event(raw);
		});
	}

	send(content, parent) {
		this.connection.post(content, parent);
	}

	reply(content){
		this.send(content, this.log[ this.log.length - 1 ].id);
	}

	_handle_send_event(raw) {
		const data = raw.data;
		this._log.push(data);
		this.emit('send-event', raw);
	}

	_handle_join_event(raw) {
		const data = raw.data;
		this._listing.push(data);
		this.emit('join-event', raw);
	}

	_handle_snapshot(json) {
		const data = json.data;
		this._identity = data.identity;
		this._session_id = data.session_id;
		this._version = data.version;
		this._listing = data.listing;
		this._log = data.log;
		this.emit('ready');
	}

	set nick(nick) {
		this.connection.nick(nick);
		this._nick = nick;
		this.connection.once('nick-reply', () => {
			this._nick = nick;
		});
	}

	get nick() {
		return this._nick;
	}

	get users() {
		return this._users;
	}

	set room(room) {
		this.connection = new Connection(room, this.human, this.host, this.options);
		this._room = room;
		this.connection.once('open', () => {
			this._room = room;
		});
	}

	get room() {
		return this._room;
	}

	get human() {
		return this._human;
	}

	get host() {
		return this._host;
	}
	
	get log() {
		return this._log.slice(0);
	}

	get version() {
		return this._version;
	}

	get listing() {
		return this._listing.slice(0);
	}
	get identity() {
		return this._identity;
	}
}

module.exports = {Bot};
