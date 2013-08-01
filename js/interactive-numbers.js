(function() {
  "use strict";

  CodeMirror.__values = {};

  CodeMirror.defineOption("interactiveNumbers", false, function(cm, val, old) {
    var prev = old && old != CodeMirror.Init;
    if (val) {
      // cm.on("update", setInteractive);

      setInteractive(cm);
    }
  });

  function setInteractive(cm) {
    var currentText = cm.options.value,
        scrubbableLinks = [],
        key, val, newTree, range, pos,
        hasReloaded = false,
        toRun = [];

    var syntax = findLiterals(esprima.parse(currentText, {raw: true, loc: true, range: true}));

    var out = escodegen.generate(syntax.ast);
    cm.setValue(out);

    for (key in syntax.values) {
      val = syntax.values[key],
          range = val.range,
          pos = val.loc;
      cm.setSelection(pos.start, pos.end);
      var cur = cm.getCursor(),
          line = cm.getLine(cur.line);

      cm.setSelection({line: cur.line, ch: pos.start.column}, {line: cur.line, ch: pos.end.column});
    }
  }

  /*
  * Run through the syntax tree and find literals
  * that are numbers (possibly do some introspection in the future)
  * and create a new expression (hijack the syntax tree)
  */
  function findLiterals(tree) {
    var nextId = 0,
        _values = {},
        prefix = 'interactive_';

    var markLiterals = function(e) {
      var id;
      if (e.type === 'Literal' && typeof e.value === 'number') {
        id = nextId++;
        _values[prefix + id] = {
          range: e.range,
          value: e.value,
          loc: {
            start: {
              column: e.loc.start.column,
              line: e.loc.start.line
            },
            end: {
              column: e.loc.end.column,
              line: e.loc.end.line
            }
          }
        };
        console.log(e);
      } else {
        recursiveWalk(e, markLiterals);
      }
    }

    // Walk the tree and run the function `f`
    // on instances of 
    var recursiveWalk = function(tree, f) {
      var i, key, val;

      if (tree instanceof Array) {
        var len = tree.length;
        for (i = 0; i < len; i++) {
          val = tree[i];
          if (typeof val === 'object' && val !== null) { 
            f(val);
          }
        }
      } else {
        for (key in tree) {
          val = tree[key];
          if (typeof val === 'object' && val !== null) {
            f(val);
          }
        }
      }
      return tree;
    };

    return {
      ast: recursiveWalk(tree, markLiterals),
      values: _values
    }
  }

})();