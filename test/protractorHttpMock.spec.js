describe('Protractor HTTP Mock File saver', function () {

  var conf = {
    "port": 1337,
    "format": "single",
    "dir": "mocks/",
    "api": {"protocol": "http", "hostname": "example.com", "base": "/api/v1"}
  };
  var filename = conf.dir + 'file';
  var fs = require('fs');
  var utility = require('../src/utility').getInstance();
  var ProtractorHttpMockFileSaver = require('../src/fileSaver/protractorHttpMock');
  var fileSaver, req, res;
  var errorResponseBody = {
    error: true,
    message: "Invalid URI. Please correct the requested path.",
    errorCode: 404,
    uri: "http://localhost:1337/user/login"
  };
  var errorResponse = {
    "status": 404,
    "headers": {"content-type": "application/json"},
    "body": JSON.stringify(errorResponseBody)
  };

  beforeEach(function () {
    req = {method: "POST", url: "/user/login", headers: {accept: "application/json"}, body: ""};
    res = {status: 200, headers: {"content-type": "application/json"}, body: "{\"dummy\":\"body\"}"};
    fileSaver = new ProtractorHttpMockFileSaver(conf, filename);
    spyOn(utility, 'getRequestName').and.returnValue(req.url);
    spyOn(utility, 'getQuery').and.returnValue('');
  });

  describe('format', function () {
    it('should transform the request object without params and request body in protractor-http-mock format', function () {
      var expectedRequest = {
        path: req.url,
        method: req.method,
        queryString: undefined,
        params: undefined
      };
      expect(fileSaver.formatRequest(req)).toEqual(expectedRequest);
    });

    it('should transform the request object with a query in protractor-http-mock format', function () {
      var query = '?user=1&post=1';
      utility.getQuery.and.returnValue(query);
      var expectedRequest = {
        path: req.url,
        method: req.method,
        queryString: query.replace('?',''),
        params: undefined
      };
      expect(fileSaver.formatRequest(req)).toEqual(expectedRequest);
    });

    it('should transform the request object with JSON body in protractor-http-mock format', function () {
      var body = {dummy: "body"};
      req.body = JSON.stringify(body);
      req.headers = {};
      var expectedRequest = {
        path: req.url,
        method: req.method,
        queryString: undefined,
        params: body
      };
      expect(fileSaver.formatRequest(req)).toEqual(expectedRequest);
    });

    it('should transform the request object with x-www-form-urlencoded body in protractor-http-mock format', function () {
      req.body = 'content=format&x=www&form=urlencoded';
      var expectedRequest = {
        path: req.url,
        method: req.method,
        queryString: req.body
      };
      expect(fileSaver.formatRequest(req)).toEqual(expectedRequest);
    });

    it('should transform a JSON response in protractor-http-mock format', function () {
      var expectedResponse = {
        data: JSON.parse(res.body),
        status: res.status
      };
      expect(fileSaver.formatResponse(res)).toEqual(expectedResponse);
    });

    it('should transform a raw response in protractor-http-mock format', function () {
      res.body = 'just a string';
      var expectedResponse = {
        data: res.body,
        status: res.status
      };
      expect(fileSaver.formatResponse(res)).toEqual(expectedResponse);
    });
  });

  describe('request and response management', function () {

    var request, response;

    beforeEach(function() {
      request = {path: req.url, method: req.method, headers: {accept: "application/json"}};
      response = {data: JSON.parse(res.body), status: res.status};
      spyOn(console, 'log');
      spyOn(fileSaver, 'formatRequest').and.returnValue(request);
      spyOn(fileSaver, 'formatResponse').and.returnValue(response);
    });

    it('should find matching requests', function() {
      var matchingRequest = {path: req.url, method: req.method, headers: {}};
      var notMatchingRequest = {path: 'some/other/path', method: req.method, headers: {}};
      var requestWithData = {path: req.url, method: req.method, headers: {}, data: {dummy:"data"}};
      var requestWithData2 = {path: req.url, method: req.method, headers: {}, data: {dummy:"data", other:"data"}};
      expect(fileSaver.requestsMatch({})).toBe(false);
      expect(fileSaver.requestsMatch(request, matchingRequest)).toBe(true);
      expect(fileSaver.requestsMatch(request, notMatchingRequest)).toBe(false);
      expect(fileSaver.requestsMatch(requestWithData, requestWithData2)).toBe(false);
    });

    it('should save request and response', function () {
      var savedRequest = {request:"dummy request", response:"dummy response"};
      var fileContent = [savedRequest, {request: request, response: response}];
      var expectedContent = 'module.exports = ' + JSON.stringify(fileContent, null, 2) + ';';
      spyOn(fs, 'readFileSync').and.returnValue('module.exports = ' + JSON.stringify([savedRequest]) + ';');
      spyOn(fs, 'writeFile').and.callFake(function (filename, fileContent, callback) {
        callback(false);
      });
      fileSaver.save(req, res);
      expect(fs.writeFile).toHaveBeenCalledWith(filename + '.js', expectedContent, jasmine.any(Function));
      expect(console.log).toHaveBeenCalledWith(jasmine.any(String), req.method, req.url, req.body);
    });

    it('should display the error if the request can not be saved', function () {
      var e = new Error('Write file error');
      spyOn(fs, 'writeFile').and.callFake(function (filename, fileContent, callback) {
        callback(e);
      });
      fileSaver.save(req, res);
      expect(console.log).toHaveBeenCalledWith(jasmine.any(String), e);
    });

    it('should get the right response', function () {
      var entry = {request: request, response: response};
      var matchHelper = 0;
      spyOn(fileSaver, 'requestsMatch').and.callFake(function(){
        return matchHelper++;
      });
      spyOn(fs, 'readFileSync').and.returnValue('module.exports = ' + JSON.stringify([{request:{}, response:{}},entry]) + ';');
      expect(fileSaver.getResponse(req)).toEqual(res);
    });

    it('should get the right response', function () {
      spyOn(fileSaver, 'requestsMatch').and.returnValue(false);
      spyOn(fs, 'readFileSync').and.returnValue('module.exports = ' + JSON.stringify([{request:{}, response:{}}]) + ';');
      expect(fileSaver.getResponse(req)).toEqual(errorResponse);
      expect(console.log).toHaveBeenCalledWith(jasmine.any(String), req.method, req.url, req.body);
    });

    it('should catch an exception trying to read a missing file', function () {
      spyOn(fs, 'readFileSync').and.throwError('File not found');
      expect(fileSaver.getResponse(req)).toEqual(errorResponse);
      expect(console.log).toHaveBeenCalled();
    });

  });

  describe('get response', function () {
    var request, response;

    beforeEach(function() {
      request = {path: req.url, method: req.method, headers: req.headers};
      response = {data: JSON.parse(res.body), status: res.status};
      spyOn(console, 'log');
      spyOn(fileSaver, 'formatRequest').and.returnValue(request);
      spyOn(fileSaver, 'formatResponse').and.returnValue(response);
    });


  });


  describe('reset', function () {

    it('should remove file', function () {
      spyOn(fs, 'unlinkSync');
      fileSaver.reset();
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('should catch file not found exception trying to reset', function () {
      spyOn(fs, 'unlinkSync').and.throwError('FileNotFound');
      spyOn(console, 'log');
      fileSaver.reset();
      expect(console.log).toHaveBeenCalled();
    });

  });

});
