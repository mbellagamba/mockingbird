/* jshint node: true */
"use strict";

var utility = (function () {

  var instance;

  function Utility() {
    /**
     * The request name is the request path without the specified base path and the query. The {@code requestPath}
     * includes the complete request path including the eventual query, instead protocol, hostname and port are excluded.
     * e.g. If the request path is  '/user/profile?user=1', the request name will be '/user/profile'.
     * @param {string} path the request path, including the query.
     * @returns {string} the request name.
     */
    this.getRequestName = function (path) {
      return path.indexOf('?') === -1 ? path : path.slice(0, path.indexOf('?'));
    };

    /**
     * Return the query string from a complete request path. e.g. If the request path is  '/api/v1/user/profile?user=1'
     * the query will be '?user=1'.
     * @param {string} requestPath the request path, including the query.
     * @returns {string} the query string including the question mark.
     */
    this.getQuery = function (requestPath) {
      return requestPath.indexOf('?') === -1 ? '' : requestPath.slice(requestPath.indexOf('?'));
    };

    /**
     *
     * @param {string} path the request path, including the query.
     * @returns {Object} query string params in JSON format.
     */
    this.getParams = function (path) {
      var queryString = path.indexOf('?') === -1 ? '' : path.slice(path.indexOf('?') + 1);
      var params;
      if(queryString){
        params = {};
        queryString.split('&').forEach(function(pairs) {
          var parts = pairs.split('=');
          if(!parts[1]){
            throw "PARSE_ERROR";
          }
          params[parts[0]] = parts[1];
        });
      }
      return params;
    };

    /**
     * Return the request path concatenated to the endpoint base path.
     * @param {string} path the request path.
     * @param {string} base the endpoint base path.
     * @returns {string} the path concatenated to the base.
     */
    this.getCompletePath = function (path, base) {
      return base ? base + path : path;
    };

    /**
     * The filtered headers object will have only 'accept', 'content-type', 'content-length' and 'date' properties.
     * @param {Object} headers the headers object, each header is a key-value couple.
     * @param {Array} filter the array which indicates the headers to save.
     * @returns {Object} an headers object.
     */
    this.filterHeaders = function (headers, filter) {
      var result = {};
      for (var header in headers) {
        if (headers.hasOwnProperty(header) && filter.indexOf(header.toLowerCase()) !== -1) {
          result[header] = headers[header];
        }
      }
      return result;
    };

    /**
     * Check if the request is in the json. A request is identified by the name, the method and the md5 hash of the query
     * and the request body concatenated.
     * @param {Object} json the json where the request is searched.
     * @param {string} name the request name.
     * @param {string} method the request method.
     * @param {string} md5 the md5 hash or query + requestBody.
     * @returns {boolean} true, if the response for the specified request is found.
     */
    this.isRequestStored = function (json, name, method, md5) {
      return json && json.hasOwnProperty(name) && json[name].hasOwnProperty(method) && json[name][method].hasOwnProperty(md5);
    };

    /**
     * Add {@code obj1} properties to {@code obj2}. If the 2 objects have a property with the same key, the value of
     * {@code obj1} is prevailing. Return the merged object.
     * @param {Object} obj1 the first object.
     * @param {Object} obj2 the second object.
     * @returns {Object} an object with properties of both parameters object
     */
    this.mergeObjects = function (obj1, obj2) {
      var merged = {};
      var keys = Object.keys(obj2);
      var i = keys.length;
      while (i--) {
        merged[keys[i]] = obj2[keys[i]];
      }
      keys = Object.keys(obj1);
      i = keys.length;
      while (i--) {
        merged[keys[i]] = obj1[keys[i]];
      }
      return merged;
    };

    /**
     * Create a new object with the same properties of the param object. It does not work if param object properties are
     * objects or arrays. In that case nested objects or arrays are still passed as a reference.
     * @param {Object} origin a object.
     * @returns {Object} a clone of the object passed as param.
     */
    this.cloneObject = function (origin){
      return this.mergeObjects({},origin);
    };

    /**
     * Add Cross Origin Resource Sharing headers to the existing headers object. The origin parameter define the host to
     * which give access.
     * @param {Object} headers the original headers object.
     * @param {string} origin the host which sends the request.
     * @returns {Object} an headers object with original and CORS properties.
     */
    this.addCorsHeaders = function (headers, origin) {
      var corsHeaders = {
        "access-control-allow-credentials": true,
        "access-control-allow-origin": origin || "*",
        "access-control-allow-headers": "Content-Type, Authorization, apitoken, Origin, X-Requested-With",
        "access-control-allow-methods": "GET, POST, OPTIONS, PUT, PATCH, DELETE",
        "access-control-max-age": 1728000
      };
      return this.mergeObjects(headers, corsHeaders);
    };
  }

  return {
    // Get the Singleton instance if one exists or create one if it doesn't
    getInstance: function () {
      {
        if (!instance) {
          instance = new Utility();
        }
        return instance;
      }
    }
  };

})();

module.exports = utility;
