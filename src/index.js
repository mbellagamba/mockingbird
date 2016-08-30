/* jshint node: true */
"use strict";

module.exports.startMockingbird = function (conf, mockingbird) {
  var http = require('http');
  if (!conf) {
    conf = require('../mockingbird-conf.json');
  }
  /**
   * Arguments passed from the command line.
   */
  var option = process.argv[2];
  var filename = conf.dir + (process.argv[3] || 'response');
  if (!mockingbird) {
    var FileSaver;
    try {
      FileSaver = require('./fileSaver/' + conf.format);
    } catch (err) {
      FileSaver = require('./fileSaver/single');
      console.log('The specified file saver was not found! Mockingbird is starting with default file saver.');
    }
    var fileSaver = new FileSaver(conf, filename);
    var Client = require('./client');
    var client = new Client(conf.api.protocol);
    var Mockingbird = require('./mockingbird');
    mockingbird = new Mockingbird(client, fileSaver);
  }

  switch (option) {
    case '-s':
      http.createServer(mockingbird.serve).listen(conf.port, '127.0.0.1');
      console.log('Server running at http://127.0.0.1:' + conf.port + '/');
      break;
    case '-r':
      mockingbird.reset();
      break;
    case '-u':
      mockingbird.reset();
      var resolvedURL = conf.api.protocol + '://' + conf.api.hostname +
        (conf.api.port ? (':' + conf.api.port) : '') +
        (conf.api.base ? conf.api.base : '/');
      http.createServer(mockingbird.update).listen(conf.port, '127.0.0.1');
      console.log('Server running at http://127.0.0.1:' + conf.port + '/\nThe resolved URL is', resolvedURL);
      break;
    default:
      console.log('Unknown option. Please insert a valid option.');
  }
};

module.exports.startMockingbird(process.mb_conf, process.mockingbird);
