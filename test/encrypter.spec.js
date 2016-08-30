describe('Encrypter', function () {

  var encrypter = require('../src/encrypter');
  var crypto = require('crypto');
  var sortable;
  var digest = jasmine.createSpy();
  var update = jasmine.createSpy().and.returnValue({digest: digest});


  beforeEach(function () {
    sortable = jasmine.createSpyObj('sortable', ['sortByKeys']);
    spyOn(crypto, 'createHash').and.returnValue({update: update});
  });

  it('should encrypt single query', function () {
    encrypter.encrypt([sortable]);
    expect(sortable.sortByKeys).toHaveBeenCalled();
    expect(crypto.createHash).toHaveBeenCalledWith('md5');
  });

  it('should encrypt multiple arguments', function () {
    encrypter.encrypt([sortable, sortable, 'not sortable string', '']);
    expect(sortable.sortByKeys.calls.count()).toEqual(2);
    expect(crypto.createHash).toHaveBeenCalledWith('md5');
  });
});
