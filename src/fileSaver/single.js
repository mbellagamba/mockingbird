/* jshint node: true */
"use strict";

/**
 * Node.js module that manages the file system. It provides simple wrappers around standard POSIX functions.
 */
var fs = require('fs');
/**
 * Returns the right sortable object. Sorting query string params and request body allows to generate the same md5 hash
 * for requests which have different params order.
 */
var getSortable = require('../sortable').getSortable;
/**
 * Allows the encryption of an arbitrary number of params.
 */
var encrypter = require('./../encrypter');
/**
 * The constructor for sortable query.
 */
var SortableQuery = require('../sortable').SortableQuery;
/**
 * It provides some simple utility functions.
 */
var utility = require('./../utility').getInstance();

function SingleFileSaver(conf, filename) {

  filename = filename + '.json';

  /**
   * It saves requests and responses in a single JSON file. Considering the JSON file as an object, the response to a
   * request is: {@code json[reqName][reqMethod.toLowerCase()][md5].response}, in which json is the JSON object, reqName
   * is the request name (e.g. '/user/login'), reqMethod is the request method (e.g. 'post'), md5 is the md5 hash code
   * generated from the concatenation of ordered query string and ordered request body.
   * @param {Object} req the request to save. e.g. {method:"GET", url:"/user/profile?user=1", headers: {accept:"application/json"}, body:"body"}
   * @param {Object} res the response to save, corresponding to req. e.g. {status:200, headers:{"content-type":"application/json"}, body:"body"}
   */
  this.save = function (req, res) {
    var requestName = utility.getRequestName(req.url);
    var query = utility.getQuery(req.url);
    var json;
    try {
      json = JSON.parse(fs.readFileSync(filename, 'utf-8'));
    } catch (e) {
      json = {protocol: conf.api.protocol, hostname: conf.api.hostname, port: conf.api.port, base: conf.api.base};
    }
    // Add the request to the json
    if (!json[requestName]) {
      json[requestName] = {};
    }
    if (!json[requestName][req.method.toLowerCase()]) {
      json[requestName][req.method.toLowerCase()] = {};
    }
    /**
     * The hash hexadecimal string generated from query params and request body.
     */
    var md5Query = encrypter.encrypt([new SortableQuery(query), getSortable(req.body, req.headers['content-type'])]);

    json[requestName][req.method.toLowerCase()][md5Query] = {
      headers: utility.filterHeaders(req.headers, ['accept', 'content-type', 'content-length', 'date']),
      response: res
    };
    fs.writeFile(filename, JSON.stringify(json, null, 2), function (err) {
      if (err) {
        console.log('An error occurred saving file:', err);
      } else {
        console.log('Request saved:', req.method, requestName, query, req.body, md5Query);
      }
    });
  };

  /**
   * Deletes the current stored response file and catch any error occurred trying to do that.
   */
  this.reset = function () {
    try {
      // Remove existing file
      fs.unlinkSync(filename);
    } catch (err) {
      console.log('The file does not exist, so it was not removed.');
    }
  };

  /**
   * Retrieves the response object for the specified request. If the file of saved responses is not fount or the
   * response is not available in the file, then it display the error on the console and return a response with a 404
   * status code and a response body describing the error.
   * @param {Object} req the request. e.g. {method:"GET", url:"/user/profile?user=1", headers: {accept:"application/json"}, body:"body"}
   * @returns {Object} the response for the specified request. e.g. {status: 200, headers: {"content-type": string}, body:"body"}
   */
  this.getResponse = function (req) {
    var method = req.method.toLowerCase();
    var requestName = utility.getRequestName(req.url);
    var query = utility.getQuery(req.url);
    var encryptedQuery =
      encrypter.encrypt([new SortableQuery(query), getSortable(req.body, req.headers['content-type'])]);
    var resBody = {
      error: true,
      message: "Invalid URI. Please correct the requested path.",
      errorCode: 404,
      uri: "http://localhost:" + conf.port + req.url
    };
    var response = {
      "status": 404,
      "headers": {"content-type": "application/json"},
      "body": JSON.stringify(resBody)
    };
    var file;
    try {
      file = JSON.parse(fs.readFileSync(filename));
      if (utility.isRequestStored(file, requestName, method, encryptedQuery)) {
        response = file[requestName][method][encryptedQuery].response;
      } else {
        console.log('The response was not found, maybe you forgot to record it.\nThe request is:',
          req.method, requestName, query, req.body);
      }
    } catch (e) {
      console.log('Did you forget to record responses? The file was not found.\nError: ', e);
    }
    return response;
  };
}

module.exports = SingleFileSaver;
