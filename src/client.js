/* jshint node: true */
"use strict";

var http, zlib = require('zlib');

/**
 * The client constructor. The protocol can be http or https.
 * @param protocol the REST service protocol.
 * @returns the client object.
 * @constructor
 */
function Client(protocol) {
  http = require(protocol);

  /**
   * Makes an HTTP/HTTPS request and calls the callback on response. Options properties are the same required by Node.JS
   * {@code http.request} with an extra body field. e.g.
   * {
   *   method: 'POST',
   *   hostname: 'api.example.com',
   *   port: null,
   *   path: 'api/v1/user/login,
   *   headers: {'Content-Type': 'application/x-www-form-urlencoded'},
   *   rejectUnauthorized: false,
   *   body: 'user=user%40example.com&password=password'
   * };
   * @param {Object} options the request options.
   * @param {Function} callback the callback called on response received.
   */
  function request(options, callback) {

    var req = http.request(options, function (res) {
      var body = "";
      var output;

      if (res.headers['content-encoding'] === 'gzip') {
        // Parse gzip content
        var gzip = zlib.createGunzip();
        res.pipe(gzip);
        output = gzip;
      } else {
        output = res;
      }

      output.on('data', function (data) {
        //TODO Make sure the response encoding is UTF-8. The format can be retrieved from headers?
        data = data.toString('utf-8');
        body += data;
      });

      // The response is completely received
      output.on('end', function () {
        callback(res.statusCode, res.headers, body);
      });
    });

    req.on('error', function (e) {
      var errorResponse = {message: "An error occurred", error: e};
      callback(400, {'Content-Type': 'application/json'}, JSON.stringify(errorResponse));
    });

    if (options.body) {
      // Add the body to request (e.g. POST, PATCH)
      req.write(options.body);
    }

    req.end();
  }

  return {
    request: request
  };
}

module.exports = Client;
