describe('Index', function () {
  var http = require('http');
  var Mockingbird = require('../src/mockingbird');
  var Client = require('../src/client');
  var mockingbird = new Mockingbird(new Client('http'));
  process.mockingbird = mockingbird;
  process.mb_conf = {
    "port": 1337,
    "format": "single",
    "dir": "mocks/",
    "api": {"protocol": "http", "hostname": "example.com", port:8080, "base": "/api/v1"}
  };

  afterEach(function () {
    // Remove the cached required module in order to re-run the self executing function on next 'require' call.
    // Otherwise the module is already loaded and the function will not be executed.
    delete require.cache[require.resolve('../src/index')];
  });

  it('should start a server with Mockingbird serving function', function () {
    process.argv[2] = '-s';
    spyOn(http, 'createServer').and.returnValue({
      listen: function () {
      }
    });
    spyOn(console, 'log');
    require('../src/index');
    expect(console.log).toHaveBeenCalled();
    expect(http.createServer).toHaveBeenCalledWith(mockingbird.serve);
  });

  it('should start a server with Mockingbird updating function', function () {
    process.argv[2] = '-u';
    spyOn(mockingbird, 'reset');
    spyOn(http, 'createServer').and.returnValue({
      listen: function () {
      }
    });
    spyOn(console, 'log');
    require('../src/index');
    expect(console.log).toHaveBeenCalled();
    expect(http.createServer).toHaveBeenCalledWith(mockingbird.update);
  });

  it('should activate Mockingbird reset function', function () {
    process.argv[2] = '-r';
    spyOn(mockingbird, 'reset');
    require('../src/index');
    expect(mockingbird.reset).toHaveBeenCalled();
  });

  it('should display an error if the option is unknown and show the help on console', function () {
    process.argv[2] = '-invalid-option';
    spyOn(console, 'log');
    require('../src/index');
    expect(console.log).toHaveBeenCalledWith('Unknown option. Please insert a valid option.');
  });

  it('should not throw if called without arguments', function () {
    spyOn(console, 'log');
    var indexFunction = require('../src/index').startMockingbird;
    expect(indexFunction).not.toThrow();
  });

  it('should have a default configuration if only mandatory parameters are defined', function () {
    process.argv[2] = '-u';
    process.mockingbird = undefined;
     process.mb_conf = {
       "dir": "mocks",
       "api": {"protocol": "http", "hostname": "example.com"}
     };
    spyOn(console, 'log');
    require('../src/index');
    expect(console.log).toHaveBeenCalledWith('The specified file saver was not found!' +
      ' Mockingbird is starting with default file saver.');
  });
});
