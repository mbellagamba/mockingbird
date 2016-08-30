describe('Sortable', function () {

  var SortableQuery = require('../src/sortable').SortableQuery;
  var SortableJson = require('../src/sortable').SortableJson;
  describe('query', function () {

    var sortable = new SortableQuery('user=user%40example.com&password=password');

    it('should be sortable by keys', function () {
      expect(sortable.sortByKeys).toBeDefined();
    });

    it('should return the sorted query', function () {
      var result = sortable.sortByKeys();
      expect(result).toEqual('password=password&user=user%40example.com');
    });

    it('should remove the question mark and return the sorted query', function () {
      var sortableQ = new SortableQuery('?user=user%40example.com&password=password');
      var result = sortableQ.sortByKeys();
      expect(result).toEqual('password=password&user=user%40example.com');
    });

  });

  describe('JSON', function () {

    var json = {photo: "photo", dummy: "data", array: [], zero: 0, object: {this: "must", be: "ordered"}};
    var sortable = new SortableJson(JSON.stringify(json));

    it('should be sortable by keys', function () {
      expect(sortable.sortByKeys).toBeDefined();
    });

    it('should return the sorted JSON', function () {
      var expected = {array: [], dummy: "data", object: {be: "ordered", this: "must"}, photo: "photo", zero: 0};
      var result = sortable.sortByKeys();
      expect(result).toEqual(JSON.stringify(expected));
    });

  });

  describe('get sortable', function () {
    var getSortable = require('../src/sortable').getSortable;

    it('should return a sortable JSON if type is application/json', function () {
      var sortable = getSortable(JSON.stringify({a: 'b'}), 'application/json');
      expect(sortable instanceof SortableJson).toBe(true);
    });

    it('should return a sortable JSON if mime type is application/json', function () {
      var sortable = getSortable(JSON.stringify({a: 'b'}), 'application/json');
      expect(sortable instanceof SortableJson).toBe(true);
    });

    it('should return a sortable Query if mime type is application/x-www-form-urlencoded', function () {
      var sortable = getSortable('user=user&pass=pass', 'application/x-www-form-urlencoded');
      expect(sortable instanceof SortableQuery).toBe(true);
    });

    it('should return string if mime type is undefined', function () {
      var sortable = getSortable('raw data in some unknown format');
      expect(typeof sortable === 'string').toBe(true);
    });
  });
});
