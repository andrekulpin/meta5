'use strict';

module.exports = function(fn) {
  var called = false;
  var cache;
  return function* cached() {
    if (called) {
      return cache;
    }
    cache = yield* fn.apply(this, arguments);
    called = true;
    return cache;
  };
};
