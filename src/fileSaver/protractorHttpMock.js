/* jshint node: true */
"use strict";

/**
 * Node.js module that manages the file system. It provides simple wrappers around standard POSIX functions.
 */
var fs = require('fs');
/**
 * It provides some simple utility functions.
 */
var utility = require('./../utility').getInstance();

function ProtractorHttpMockFileSaver(conf, filename) {

  // Adds the file extension
  filename = filename + '.js';

  /**
   * Returns the request in the format defined by the protractor-http-mock module.
   * @param {Object} req the request. e.g. {method:"GET", url:"/user/profile?user=1", headers: {accept:"application/json"}, body:"body"}
   * @returns {Object} the request in protractor-http-mock format.
   */
  this.formatRequest = function (req) {
    var requestName = utility.getRequestName(req.url);
    var request = {
      path: requestName,
      method: req.method
    };
    var queryString = utility.getQuery(req.url).replace('?', '');
    request.queryString = queryString !== '' ? queryString : undefined;
    try {
      request.params = req.body ? JSON.parse(req.body) : undefined;
    } catch (e) {
      request.queryString = req.body;
    }
    return request;
  };

  /**
   * Format the response in protractor-http-mock format. If the response has a JSON body, it is parsed and saved as an
   * object.
   * @param {Object} res the response to transform.
   * @returns {Object} the response in protractor-http-mock format.
   */
  this.formatResponse = function (res) {
    var resData;
    try {
      resData = JSON.parse(res.body);
    } catch (e) {
      resData = res.body;
    }
    return {
      data: resData,
      status: res.status
    };
  };

  /**
   * Saves requests and corresponding requests in the JavaScript file specified in the constructor.
   * @param {Object} req the request to save. e.g. {method:"GET", url:"/user/profile?user=1", headers: {accept:"application/json"}, body:"body"}
   * @param {Object} res the response to save, corresponding to req. e.g. {status:200, headers:{"content-type":"application/json"}, body:"body"}
   */
  this.save = function (req, res) {
    var requests, file;
    try {
      // Removes the 'module.exports =' and the final ';' found using the regular expression
      file = fs.readFileSync(filename, 'utf-8').replace('module.exports =', '').replace(/;([^;]*)$/, '');
      requests = JSON.parse(file);
    } catch (e) {
      requests = [];
    }

    var entry = {
      request: this.formatRequest(req),
      response: this.formatResponse(res)
    };

    requests.push(entry);
    var jsonToSave = requests.length !== 1 ? requests : requests[0];
    console.log(requests.length);
    var fileContent = 'module.exports = ' + JSON.stringify(jsonToSave, null, 2) + ';';
    fs.writeFile(filename, fileContent, function (err) {
      if (err) {
        console.log('An error occurred saving file:', err);
      } else {
        console.log('Request saved:', req.method, req.url, req.body);
      }
    });
  };

  /**
   * Checks if 2 requests matches. The 'headers' property is excluded from the comparison.
   * @param {Object} req1 the first request to compare.
   * @param {Object} req2 the second request to compare.
   * @returns {boolean} true if the first request is equal the second one.
   */
  this.requestsMatch = function (req1, req2) {
    var isEqual = true;
    if (!req1 || !req2) {
      isEqual = false;
    }
    var keys = Object.keys(req1);
    var propertyIndex = keys.length;
    while (propertyIndex-- && isEqual) {
      if (typeof req1[keys[propertyIndex]] !== 'object' && req1[keys[propertyIndex]] !== req2[keys[propertyIndex]]) {
        isEqual = false;
      } else if (typeof req1[keys[propertyIndex]] === 'object' && keys[propertyIndex] !== 'headers') {
        isEqual = JSON.stringify(req1[keys[propertyIndex]]) === JSON.stringify(req2[keys[propertyIndex]]);
      }
    }
    return isEqual;
  };

  /**
   * Retrieves the response for the corresponding request.
   * @param {Object} req the request required. e.g. {method:"GET", url:"/user/profile?user=1", headers: {accept:"application/json"}, body:"body"}
   * @returns {Object} res the response corresponding to req. e.g. {status:200, headers:{"content-type":"application/json"}, body:"body"}
   */
  this.getResponse = function (req) {
    var request = this.formatRequest(req);
    var requests, file;
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
    var isResponseUnknown = true;
    try {
      file = fs.readFileSync(filename, 'utf-8').replace('module.exports =', '').replace(/;([^;]*)$/, '' + '$1');
      requests = JSON.parse(file);
      for (var i = 0; i < requests.length; i++) {
        var entry = requests[i];

        if (this.requestsMatch(entry.request, request)) {
          isResponseUnknown = false;
          response = {
            status: entry.response.status,
            headers: {"content-type": "application/json"},
            body: JSON.stringify(entry.response.data)
          };
        }
      }
      if (isResponseUnknown) {
        console.log('The response was not found, maybe you forgot to record it.\nThe request is:',
          req.method, req.url, req.body);
      }
    } catch (e) {
      console.log('Did you forget to record responses? The file was not found.\nError: ', e);
    }
    return response;
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
}

module.exports = ProtractorHttpMockFileSaver;
