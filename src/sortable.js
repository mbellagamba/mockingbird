/* jshint node: true */
"use strict";

/**
 * Returns the right Sortable object which wraps the body.
 * @param {string} body the original content.
 * @param {string} type the body mime/type.
 * @returns {SortableQuery|SortableJson|string} the sortable object.
 */
function getSortable(body, type) {
  var sortable;
  if (type && type.indexOf('application/x-www-form-urlencoded') !== -1) {
    sortable = new SortableQuery(body);
  } else if (type && type.indexOf('application/json') !== -1) {
    sortable = new SortableJson(body);
  } else {
    sortable = body;
  }
  return sortable;
}
/**
 * A sortable object for query string. It can be used for application/x-www-form-urlencoded contents.
 * @param {string} query the original query.
 * @constructor
 */
function SortableQuery(query) {
  /**
   * The query string without the question mark. It is a list of key-value pairs separated by the '&' character.
   * @type {string}
   * @private
   */
  this._data = query.indexOf('?') === -1 ? query : query.slice(query.indexOf('?') + 1);
  /**
   * Sorts query params by key. e.g. user=aaa&pass=zzz -> pass=zzz&user=aaa.
   * @returns {string} the sorted query string.
   */
  this.sortByKeys = function () {
    var pairs = this._data.split('&');
    pairs.sort();
    return pairs.join('&');

  };
}

/**
 * A sortable object for JSON body.
 * @param {string} json the JSON body in string format.
 * @constructor
 */
function SortableJson(json) {
  var object = JSON.parse(json);
  /**
   * Sorts object properties. It sorts recursively also inner objects properties. Also arrays will be sorted.
   * @returns {Object} the sorted JSON object.
   * @private
   */
  this._sortByKeys = function () {
    var sorted = {},
      index, keys = Object.keys(object);

    keys.sort();

    for (index = 0; index < keys.length; index++) {
      var entry = object[keys[index]];
      if (entry instanceof Array) {
        sorted[keys[index]] = entry.slice().sort();
      } else if (entry instanceof Object && !(entry instanceof Function)) {
        var innerObject = new SortableJson(JSON.stringify(entry));
        sorted[keys[index]] = innerObject._sortByKeys();
      } else {
        sorted[keys[index]] = entry;
      }
    }
    return sorted;
  };
  /**
   * It simply stringify the result of the {@_sortByKeys} which works with objects.
   */
  this.sortByKeys = function () {
    return JSON.stringify(this._sortByKeys());
  };
}

module.exports.SortableQuery = SortableQuery;
module.exports.SortableJson = SortableJson;
module.exports.getSortable = getSortable;
