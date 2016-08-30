describe('Mockingbird', function () {

  var utility = require('../src/utility').getInstance();
  var Mockingbird = require('../src/mockingbird');
  var now = new Date();
  var mockingbird, client, fileSaver;
  var req, res;
  var dummyBody = "{\"body\":\"dummy json body\"}";

  beforeEach(function () {
    req = {method:"GET",url:"/events/1e9ba732", headers:{}};
    req.on = jasmine.createSpy('on').and.callFake(function(event,callback){
      callback('');
    });
    res = jasmine.createSpyObj('res', ['writeHead', 'end']);
    spyOn(utility, 'addCorsHeaders').and.callFake(function (headers) {
      return headers;
    });
    client = jasmine.createSpyObj('client', ['request']);
    fileSaver = jasmine.createSpyObj('fileSaver', ['save', 'getResponse', 'reset']);
    mockingbird = new Mockingbird(client, fileSaver, now);
  });

  it('should remove existing response file', function () {
    mockingbird.reset();
    expect(fileSaver.reset).toHaveBeenCalled();
  });

  it('should serve requests reading from file', function () {
    fileSaver.getResponse.and.returnValue({status:200, headers:{}, body: dummyBody});
    mockingbird.serve(req, res);
    expect(res.writeHead).toHaveBeenCalledWith(200, {});
    expect(res.end).toHaveBeenCalledWith(dummyBody);
  });

  it('should proxy requests and save them in the file system', function () {
    client.request.and.callFake(function (options, callback) {
      callback(200, {}, dummyBody);
    });
    mockingbird.update(req, res);
    var resHeaders = {"content-length":dummyBody.length, date:now.toString()};
    var reqToSave = {method: req.method, url: req.url, headers: {date:now.toString()}, body: ''};
    var resToSave = {status: 200, headers: resHeaders, body: dummyBody};
    expect(fileSaver.save).toHaveBeenCalledWith(reqToSave, resToSave);
    expect(res.writeHead).toHaveBeenCalledWith(200, resHeaders);
    expect(res.end).toHaveBeenCalledWith(dummyBody);
  });
});
