describe('Single File Saver', function () {

  var conf = {
    "port": 1337,
    "format": "single",
    "dir": "mocks/",
    "api": {"protocol": "http", "hostname": "example.com", "base": "/api/v1"}
  };
  var filename = conf.dir + 'file.json';
  var fs = require('fs');
  var SingleFileSaver = require('../src/fileSaver/single');
  var encrypter = require('../src/encrypter');
  var utility = require('../src/utility').getInstance();
  var fileSaver;
  var EMPTY_STRING_MD5 = 'd41d8cd98f00b204e9800998ecf8427e';
  var req = {method: "POST", url: "/user/login", headers: {accept: "application/json"}, body: ""};
  var res = {status: 200, headers: {"content-type": "application/json"}, body: "{\"dummy\":\"body\"}"};
  var responseJSON;
  var errorResponseBody = {
    error: true,
    message: "Invalid URI. Please correct the requested path.",
    errorCode: 404,
    uri: "http://localhost:" + conf.port + req.url
  };
  var errorResponse = {
    "status": 404,
    "headers": {"content-type": "application/json"},
    "body": JSON.stringify(errorResponseBody)
  };

  beforeEach(function () {
    responseJSON = {};
    responseJSON[req.url] = {};
    responseJSON[req.url][req.method.toLowerCase()] = {};
    responseJSON[req.url][req.method.toLowerCase()][EMPTY_STRING_MD5] = {headers: req.headers, response: res};
    fileSaver = new SingleFileSaver(conf, conf.dir + 'file');
    spyOn(encrypter, 'encrypt').and.returnValue(EMPTY_STRING_MD5);
    spyOn(utility, 'getRequestName').and.returnValue(req.url);
    spyOn(utility, 'getQuery').and.returnValue('');
    spyOn(utility, 'filterHeaders').and.callFake(function (headers) {
      return headers;
    });
  });

  it('should save new requests', function () {
    var formattedJson = JSON.stringify(responseJSON, null, 2);
    spyOn(fs, 'readFileSync').and.returnValue('{}');
    spyOn(fs, 'writeFile').and.callFake(function (filename, json, callback) {
      callback(false);
    });
    spyOn(console, 'log');
    fileSaver.save(req, res);

    expect(fs.writeFile).toHaveBeenCalledWith(filename, formattedJson, jasmine.any(Function));
    expect(console.log).toHaveBeenCalledWith('Request saved:', req.method, req.url, '', '', EMPTY_STRING_MD5);
  });

  it('should create a new request file if file was not found during the update', function () {
    spyOn(fs, 'readFileSync').and.throwError('FileNotFound');
    spyOn(fs, 'writeFile').and.callFake(function (filename, json) {
      var jsonObject = JSON.parse(json);
      expect(jsonObject.protocol).toEqual(conf.api.protocol);
      expect(jsonObject.hostname).toEqual(conf.api.hostname);
      expect(jsonObject.base).toEqual(conf.api.base);
    });
    fileSaver.save(req,res);
  });

  it('should not overwrite existing saved requests', function () {
    spyOn(fs, 'readFileSync').and.returnValue(JSON.stringify(responseJSON));
    spyOn(fs, 'writeFile');
    var result = responseJSON;
    var req2 =  {method: "POST", url: "/user/login", headers: {accept: "application/json"}, body: "user=user&pass=pass"};
    var SORTED_BODY_MD5 = '6c2513599d2445b8c4e8a178c106e21f';
    result[req2.url][req2.method.toLowerCase()][SORTED_BODY_MD5] = responseJSON[req.url][req.method.toLowerCase()][EMPTY_STRING_MD5];
    encrypter.encrypt.and.returnValue(SORTED_BODY_MD5);
    fileSaver.save(req2, res);
    expect(fs.writeFile).toHaveBeenCalledWith(filename, JSON.stringify(result, null, 2), jasmine.any(Function));
  });

  it('should log any error occurred saving file', function () {
    var e = new Error('File cannot be written');
    spyOn(fs, 'readFileSync').and.returnValue({});
    spyOn(fs, 'writeFile').and.callFake(function (filename, json, callback) {
      callback(e);
    });
    spyOn(console, 'log');
    fileSaver.save(req,res);
    expect(console.log).toHaveBeenCalledWith('An error occurred saving file:', e);
  });

  it('should catch file not found exception trying to reset', function () {
    spyOn(fs, 'unlinkSync').and.throwError('FileNotFound');
    spyOn(console, 'log');
    fileSaver.reset();
    expect(console.log).toHaveBeenCalled();
  });

  it('should return the response reading from the file', function() {
    var responseBody = JSON.stringify(responseJSON);
    spyOn(fs, 'readFileSync').and.returnValue(responseBody);
    spyOn(utility, 'isRequestStored').and.returnValue(true);
    var response = fileSaver.getResponse(req);
    expect(response).toEqual(res);
  });

  it('should catch an error trying to reading a missing file', function () {
    var e = 'FileNotFound';
    spyOn(fs, 'readFileSync').and.throwError(e);
    spyOn(console, 'log');
    var response = fileSaver.getResponse(req);
    expect(console.log).toHaveBeenCalledWith(jasmine.any(String), new Error(e));
    expect(response).toEqual(errorResponse);
  });

  it('should respond with 404 if request is not stored in the request file', function () {
    spyOn(fs, 'readFileSync').and.returnValue('{}');
    spyOn(utility, 'isRequestStored').and.returnValue(false);
    spyOn(console, 'log');
    var response = fileSaver.getResponse(req);
    expect(console.log).toHaveBeenCalledWith(jasmine.any(String), req.method, req.url, '', '');
    expect(response).toEqual(errorResponse);
  });

});