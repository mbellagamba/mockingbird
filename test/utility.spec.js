describe('Utility', function () {

  var utility = require('../src/utility').getInstance();

  it('should be defined', function () {
    expect(utility).toBeDefined();
  });

  it('should create a clone object', function() {
    var origin = {dummy:"property", another: "dummy"};
    var cloned = utility.cloneObject(origin);
    expect(cloned).not.toBe(origin);
  });

  it('should get the request name given the complete path and the base path', function () {
    var url1 = '/user/login';
    var url2 = '/user/login?user=1&email=demo@example.com';
    expect(utility.getRequestName(url1)).toEqual('/user/login');
    expect(utility.getRequestName(url2)).toEqual('/user/login');
  });

  it('should get the request GET query given the complete path and the base path', function () {
    var url1 = '/api/v1/user/login';
    var url2 = '/api/v1/user/login?user=1&email=demo@example.com';
    expect(utility.getQuery(url1)).toEqual('');
    expect(utility.getQuery(url2)).toEqual('?user=1&email=demo@example.com');
  });

  it('should add the specified base path to the request path', function () {
    var base = '/api/v1';
    var url = 'user/login';
    expect(utility.getCompletePath(url, base)).toEqual(base + url);
    expect(utility.getCompletePath(url)).toEqual(url);
  });

  it('should filter the headers object, removing useless headers', function () {
    var headers = {
      "origin": "localhost",
      "content-type": "application/json",
      "connection": "keep-alive",
      "content-length": 123,
      "accept": "application/json, text/plain; charset=utf8",
      "server": "Apache",
      "date": "2015-09-14T09:10:02.172Z",
      "content-encoding": "gzip"
    };
    var result = {
      "content-type": "application/json",
      "content-length": 123,
      "accept": "application/json, text/plain; charset=utf8",
      "date": "2015-09-14T09:10:02.172Z"
    };
    expect(utility.filterHeaders(headers, ['accept', 'content-type', 'content-length', 'date'])).toEqual(result);
  });

  it('should check if a nested property is in the json', function () {
    var json = {
      name: {
        method: {
          md5: {}
        }
      }
    };
    expect(utility.isRequestStored(json, 'name', 'method', 'md5')).toBe(true);
  });

  it('should merge properties of 2 different object', function () {
    var obj1 = {a: 1, b: 2},
      obj2 = {c: 3, b: 4},
      result = {a: 1, b: 2, c: 3};
    expect(utility.mergeObjects(obj1, obj2)).toEqual(result);
  });

  it('should add CORS headers merging 2 headers objects', function () {
    spyOn(utility, 'mergeObjects');
    utility.addCorsHeaders({}, 'localhost:8100');
    expect(utility.mergeObjects).toHaveBeenCalled();
  });

  it('should allow CORS access to * origins', function () {
    spyOn(utility, 'mergeObjects').and.callFake(function (o1, o2) {
      return o2;
    });
    expect(utility.addCorsHeaders({})['access-control-allow-origin']).toEqual('*');
  });

  it('should get query string params in JSON format', function () {
    var url1 = '/api/v1/user/login';
    var url2 = '/api/v1/user/login?user=1&email=demo@example.com';
    var expected = {user:'1', email:"demo@example.com"};
    expect(utility.getParams(url1)).toBeUndefined();
    expect(utility.getParams(url2)).toEqual(expected);
  });

  it('should throw an exception parsing a wrong query string', function() {
    expect(function() {utility.getParams('?just a string');}).toThrow('PARSE_ERROR');
  });
});
