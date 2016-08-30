/* jshint node: true */
"use strict";

/**
 * The crypto module offers a way of encapsulating secure credentials to be used as part of a secure HTTPS net or http
 * connection. Here it is used as a library to generate hash keys.
 */
var crypto = require('crypto');

/**
 * Return an object able to generate md5 hash string.
 * @type {{encrypt}}
 */
var encrypter = (function () {

  /**
   * Generate the md5 hash from concatenation of sortable objects passed as param. There's no limit to the number of
   * parameters. Before the concatenation, params are sorted.
   * @param {Array} sortableList an array of Sortable.
   * @returns {string} the md5 hash code generated from the concatenation of params.
   */
  function encrypt(sortableList) {
    var data = '';
    for (var i = 0; i < sortableList.length; i++) {
      var sortable = sortableList[i];
      if (sortable && sortable.hasOwnProperty('sortByKeys')) {
        // sortable is a sortable object
        data += sortable.sortByKeys();
      } else if (sortable) {
        // sortable is a string
        data += sortable;
      }
      else {
        // sortable is the empty string or undefined
        data += '';
      }
    }

    return crypto.createHash('md5').update(data).digest("hex");
  }

  return {
    encrypt: encrypt
  };
})();

module.exports = encrypter;
