"use strict";

var mqtt = require("mqtt");
var async = require("async");
var ascoltatori = require("ascoltatori");
var EventEmitter = require("events").EventEmitter;
var bunyan = require("bunyan");
var extend = require("extend");
var Client = require("./client");
var defaults = {
  port: 1883,
  backend: {
    json: false
  },
  baseRetryTimeout: 1000,
  logger: {
    name: "mosca",
    level: 40,
    serializers: {
      client: clientSerializer,
      packet: packetSerializer
    }
  }
};

/**
 * The Mosca Server is a very simple MQTT server that
 * provides a simple event-based API to craft your own MQTT logic
 * It supports QoS 0 & 1, without external storage.
 * It is backed by Ascoltatori, and it descends from
 * EventEmitter.
 *
 * Options:
 *  - `port`, the port where to create the server.
 *  - `backend`, all the options for creating the Ascoltatore
 *    that will power this server.
 *  - `baseRetryTimeout`, the retry timeout for the exponential
 *    backoff algorithm (default is 1s).
 *  - `logger`, the options for Bunyan.
 *  - `persitance`, the options for the persistence.
 *     A sub-key `factory` is used to specify what persitance
 *     to use.
 *
 * Events:
 *  - `clientConnected`, when a client is connected;
 *    the client is passed as a parameter.
 *  - `clientDisconnecting`, when a client is being disconnected;
 *    the client is passed as a parameter.
 *  - `clientDisconnected`, when a client is disconnected;
 *    the client is passed as a parameter.
 *  - `published`, when a new message is published;
 *    the packet and the client are passed as parameters.
 *  - `subscribed`, when a new client is subscribed to a pattern;
 *    the pattern and the client are passed as parameters.
 *
 * @param {Object} opts The option object
 * @param {Function} callback The ready callback
 * @api public
 */
function Server(opts, callback) {
  EventEmitter.call(this);

  this.opts = extend(true, {}, defaults, opts);

  if (this.opts.persistence && this.opts.persistence.factory) {
    this.opts.persistence.factory(this.opts.persistence).wire(this);
  }

  callback = callback || function() {};

  this.clients = {};
  this.logger = bunyan.createLogger(this.opts.logger);

  var that = this;

  var serveWrap = function(connection) {
    // disable Nagle algorithm
    connection.stream.setNoDelay(true);
    new Client(connection, that);
  };

  this.ascoltatore = ascoltatori.build(this.opts.backend);
  this.ascoltatore.on("error", this.emit.bind(this));

  that.once("ready", callback);

  async.series([
    function(cb) {
      that.ascoltatore.on("ready", cb);
    },
    function(cb) {
      that.server = mqtt.createServer(serveWrap);
      that.server.listen(that.opts.port, cb);
    }, function(cb) {
      that.server.maxConnections = 100000;
      that.emit("ready");
      that.logger.info({ port: that.opts.port }, "server started");
    }
  ]);

  that.on("clientConnected", function(client) {
    that.clients[client.id] = client;
  });

  that.on("clientDisconnected", function(client) {
    delete that.clients[client.id];
  });
}

module.exports = Server;

Server.prototype = Object.create(EventEmitter.prototype);

/**
 * Utility function to call a callback in the next tick
 * if it was there.
 *
 * @api private
 * @param {Function} callback
 */
function next(callback) {
  if (callback) {
    process.nextTick(callback);
  }
}

/**
 * The function that will be used to authenticate users.
 * This default implementation authenticate everybody.
 * Override at will.
 *
 * @api public
 * @param {Object} client The MQTTConnection that is a client
 * @param {String} username The username
 * @param {String} password The password
 * @param {Function} callback The callback to return the verdict
 */
Server.prototype.authenticate = function(client, username, password, callback) {
  callback(null, true);
};

/**
 * The function that will be used to authorize clients to publish to topics.
 * This default implementation authorize everybody.
 * Override at will
 *
 * @api public
 * @param {Object} client The MQTTConnection that is a client
 * @param {String} topic The topic
 * @param {String} paylod The paylod
 * @param {Function} callback The callback to return the verdict
 */
Server.prototype.authorizePublish = function(client, topic, payload, callback) {
  callback(null, true);
};

/**
 * The function that will be used to authorize clients to subscribe to topics.
 * This default implementation authorize everybody.
 * Override at will
 *
 * @api public
 * @param {Object} client The MQTTConnection that is a client
 * @param {String} topic The topic
 * @param {Function} callback The callback to return the verdict
 */
Server.prototype.authorizeSubscribe = function(client, topic, callback) {
  callback(null, true);
};

/**
 * Store a packet for future usage, if needed.
 * Only packets with the retained flag are setted, or for which
 * there is an "offline" subscription".
 * This is a NOP, override at will.
 *
 * @api public
 * @param {Object} packet The MQTT packet to store
 * @param {Function} callback
 */
Server.prototype.storePacket = function(packet, callback) {
  if (callback) {
    callback();
  }
};

/**
 * Forward all the retained messages of the specified pattern to
 * the client.
 * This is a NOP, override at will.
 *
 * @api public
 * @param {String} pattern The topic pattern.
 * @param {MoscaClient} client The client to forward the packet's to.
 * @param {Function} callback
 */
Server.prototype.forwardRetained = function(pattern, client, callback) {
  if (callback) {
    callback();
  }
};

/**
 * Restores the previous subscriptions in the client and forward all
 * the offline messages it has received in the meanwhile.
 * This is a NOP, override at will.
 *
 * @param {MoscaClient} client
 * @param {Function} callback
 */
Server.prototype.restoreClient = function(client, callback) {
  if (callback) {
    callback();
  }
};

/**
 * Persist a client.
 * This is a NOP, override at will.
 *
 * @param {MoscaClient} client
 * @param {Function} callback
 */
Server.prototype.persistClient = function(client, callback) {
  if (callback) {
    callback();
  }
};

/**
 * Closes the server.
 *
 * @api public
 * @param {Function} callback The closed callback function
 */
Server.prototype.close = function(callback) {
  var that = this;

  callback = callback || function() {};

  async.parallel(Object.keys(that.clients).map(function(id) {
    return function(cb) {
      that.clients[id].close(cb);
    };
  }), function() {
    that.ascoltatore.close(function () {
      that.once("closed", callback);
      try {
        that.server.close(function() {
          that.logger.info("closed");
          that.emit("closed");
        });
      } catch (exception) {
        callback(exception);
      }
    });
  });
};

/**
 * Serializises a client for Bunyan.
 *
 * @api private
 */
function clientSerializer(client) {
  return client.id;
}

/**
 * Serializises a packet for Bunyan.
 *
 * @api private
 */
function packetSerializer(packet) {
  var result = {};

  if (packet.messageId) {
    result.messageId = packet.messageId;
  }

  if (packet.topic) {
    result.topic = packet.topic;
  }

  if (packet.qos) {
    result.qos = packet.qos;
  }

  if (packet.unsubscriptions) {
    result.unsubscriptions = packet.unsubscriptions;
  }

  if (packet.subscriptions) {
    result.subscriptions = packet.subscriptions;
  }

  return result;
}
