/* jshint node: true */
"use strict";

/**
 * It provides some simple utility functions.
 */
var utility = require('./utility').getInstance();
/**
 * The configuration for the API service. Properties of retrieved object are after extracted in variables.
 * @type {Object}
 */
var config = require('../mockingbird-conf.json').api;
/**
/**
 * The API hostname.
 * @type {string}
 */
var hostname = config.hostname;
/**
 * The API port.
 * @type {number|undefined}
 */
var port = config.port;
/**
 * The API base path.
 * @type {string|undefined}
 */
var base = config.base;
/**
 * Mockingbird constructor. Only the client is a required param. The default filename is 'response.json' and the
 * default date is a new Date().
 * @param {Client} client in update mode, it redirects requests to real REST service and receives responses.
 * @param {Object} fileSaver an object responsible to save requests and responses. It must have the save method.
 * @param {Date} now (optional) the date when the all requests are done.
 * @returns {{serve: serve, update: update, reset: reset}} an instance of Mockingbird.
 * @constructor
 */
function Mockingbird(client, fileSaver, now) {
  /**
   * In update mode, Mockingbird assume all requests are done in this moment. For each response the date header has
   * this value. The client application could use this value to mock the date for testing purposes.
   * @type {Date} The moment when the server is started.
   */
  now = now || new Date();

  /**
   * SERVE MODE.  Mockingbird reads responses in the stored responses file and sends them to the client.
   * @param {http.IncomingMessage} req the request received from the client application.
   * @param {http.ServerResponse} res the response served to the client application.
   */
  function serve(req, res) {
    var requestBody = '';
    req.on('data', function (chunk) {
      requestBody += chunk;
    });
    req.on('end', function () {
      var request = {method:req.method, url: req.url, headers: req.headers, body:requestBody};
      var response = fileSaver.getResponse(request);
      // CORS headers are not saved in the json file because are the same for each request. So they are statically
      // added to each request in order to respect the CORS protocol.
      response.headers = utility.addCorsHeaders(response.headers, req.headers.origin);
      res.writeHead(response.status, response.headers);
      res.end(response.body);
    });
  }

  /**
   * UPDATE MODE. Mockingbird works as a proxy: it redirects requests to the real service and saves responses in
   * the stored responses file.
   * @param {http.IncomingMessage} req the request received from the client application.
   * @param {http.ServerResponse} res the response served to the client application.
   */
  function update(req, res) {
    // Get request body
    var requestBody = '';
    req.on('data', function (chunk) {
      requestBody += chunk;
    });
    req.on('end', function () {
      var reqHeaders = utility.cloneObject(req.headers);
      // the host is not the same as the client application so the host header is removed
      delete reqHeaders.host;
      reqHeaders.date = now.toString();
      var options = {
        method: req.method,
        hostname: hostname,
        port: port || null,
        path: utility.getCompletePath(req.url, base),
        headers: reqHeaders,
        rejectUnauthorized: false,
        body: requestBody
      };
      client.request(options, function (status, headers, body) {
        var resHeaders = utility.cloneObject(headers);
        resHeaders = utility.filterHeaders(resHeaders, ['accept', 'content-type', 'content-length', 'date', 'apitoken', 'set-cookie']);
        resHeaders['content-length'] = body.length;
        resHeaders.date = now.toString();
        delete resHeaders['content-encoding'];
        var reqToSave = {method: req.method, url: req.url, headers: reqHeaders, body: requestBody};
        var resToSave = {status: status, headers: resHeaders, body: body};
        fileSaver.save(reqToSave, resToSave);
        resHeaders = utility.addCorsHeaders(resHeaders, req.headers.origin);
        res.writeHead(status, resHeaders);
        res.end(body);
      });
    });
  }

  /**
   * Deletes the current stored response file.
   */
  function reset() {
    fileSaver.reset();
  }

  return {
    serve: serve,
    update: update,
    reset: reset
  };
}

module.exports = Mockingbird;
