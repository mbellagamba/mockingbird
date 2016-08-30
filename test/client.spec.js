describe('Client', function () {

  var Client = require('../src/client');
  var http = require('http');
  var client, req, res;
  var responseBody = "{\"dummy\":\"body\"}";

  beforeEach(function () {
    client = new Client('http');
    req = jasmine.createSpyObj('req',['on', 'write', 'end']);
    res = {statusCode:200, headers:{}};
    res.on = jasmine.createSpy('on').and.callFake(function(event, callback) {
      callback(responseBody);
    });
    res.pipe = jasmine.createSpy('on').and.callFake(function (dest) {
      dest.write(responseBody);
      return dest;
    });
  });

  it('should call the callback on response received', function () {
    var finalCallback = jasmine.createSpy('finalCallback');
    spyOn(http, 'request').and.callFake(function (options, responseCallBack) {
      responseCallBack(res);
      return req;
    });
    client.request({}, finalCallback);
    expect(http.request).toHaveBeenCalled();
    expect(finalCallback).toHaveBeenCalledWith(200, {}, responseBody);
  });

  it('should write the request body if options object has \'body\' property', function () {
    var finalCallback = jasmine.createSpy('finalCallback');
    spyOn(http, 'request').and.returnValue(req);
    var reqBody = 'a body';
    client.request({body: reqBody}, finalCallback);
    expect(http.request).toHaveBeenCalled();
    expect(req.write).toHaveBeenCalledWith(reqBody);
  });

  it('should call the callback with error parameters in case of error', function () {
    var finalCallback = jasmine.createSpy('finalCallback');
    var e = new Error('test error');
    var result = {message: "An error occurred", error: e};
    req.on.and.callFake(function (event, callback) {
      callback(e);
    });
    spyOn(http, 'request').and.returnValue(req);
    client.request({body: "a body"}, finalCallback);
    expect(http.request).toHaveBeenCalled();
    expect(finalCallback).toHaveBeenCalledWith(400, {'Content-Type': 'application/json'}, JSON.stringify(result));
  });

  it('should decompress gzip response data', function () {
    var dummyData = "{\"dummy\": \"data\"}";
    var encoding = {"content-encoding": "gzip"};
    var zlib = require('zlib');
    var mockGzip = jasmine.createSpyObj('gzip',['on', 'write']);
    var finalCallback = jasmine.createSpy('finalCallback');
    mockGzip.on.and.callFake(function (e, c) {
      c(dummyData);
    });
    spyOn(zlib, 'createGunzip').and.returnValue(mockGzip);
    spyOn(http, 'request').and.callFake(function (options, responseCallBack) {
      res.headers = encoding;
      responseCallBack(res);
      return req;
    });
    client.request({}, finalCallback);
    expect(finalCallback).toHaveBeenCalledWith(200, encoding, dummyData);
  });

});
