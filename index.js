var less = require("less")
  , through = require('through')
  , path = require('path');

module.exports = function(file) {
  var input = '';
  if (/\.less$/i.test(file) === false) {
    return through(); 
  } 

  function write(data) { input += data; }
  function end() {
    var self = this;

    function jsToLoad(css) {
      return "var css = "+ JSON.stringify(css) +";"+ 
             "(require('lessify'))(css); module.exports = css;";
    }

    function jsToThrow(error) {
      return "throw new Error(" + JSON.stringify(JSON.stringify(error)) + ");";
    }

    function render(callback) {
      try {
        less.render(input, {filename: file, paths: [path.dirname(file)]}, function(err, css) {
          if (err) {
            callback(err);
          } else {
            callback(undefined, css);
          }
        });
      } catch (error) {
        callback(error);
      }
    }

    render(function (err, css) {
      if (err) {
        self.queue(jsToThrow(err));
      } else {
        self.queue(jsToLoad(css));
      }
      self.queue(null);
    });
  }

  return through(write, end);
}
