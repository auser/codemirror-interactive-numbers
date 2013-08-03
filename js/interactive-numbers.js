(function() {
  "use strict";

  var editing = false,
      nextId = 0,
      $values = {};

  CodeMirror.defineOption("interactiveNumbers", false, function(cm, val, old) {
    var prev = old && old != CodeMirror.Init;
    if (val) {
      cm.on("change", setInteractive);

      setInteractive(cm);
    }
  });

  function setInteractive(cm, changeObj) {

    var currentText,
        scrubbableLinks = [],
        key, val, newTree, range, pos,
        start, end,
        hasReloaded = false,
        toRun = [],
        clsName = 'scrub_widget';

    currentText = cm.getValue() || cm.options.value;

    if (!editing) {
      editing = true;
      
      // TODO: Clean up after ourselves
      try {
        var syntax = findLiterals(cm, esprima.parse(currentText, {range: true}));
        var out = escodegen.generate(syntax.ast);
        
        var widgets = [];

        $values = syntax.values;
        for (key in syntax.values) {
          val = syntax.values[key],
                start = val.start,
                end = val.end;

          var editableWidget = document.createElement('span');
          editableWidget.className = clsName;
          editableWidget.textContent = val.value;
          editableWidget.id = key;
          widgets.push(editableWidget);

          var range = cm.markText(start, end, {
            handleMouseEvents: true,
            replacedWith: editableWidget,
            shared: true,
            addToHistory: true
          });
        }
        attachInteractivity(widgets);
      } catch(e) {
        console.log(e);
      }
      editing = false;
    }
  }

  function attachInteractivity(elems) {
    var ele, i;

    for (i = 0; i < elems.length; i++) {
      ele = elems[i];
      ele.addEventListener('mousedown', function(e) {
        e.preventDefault();
        var mx = e.pageX,
            my = e.pageY,
            orig = Number(ele.textContent),
            delta = orig;

        ele.classList.add('dragging');
        var moved = function(e) {
          e.preventDefault();
          var d = Number((Math.round((e.pageX - mx)/2) + orig).toFixed(5));
          ele.textContent = d;
          $values[ele.id].value = d;
        };
        window.addEventListener('mousemove', moved);
        var up = function(e) {
          window.removeEventListener('mousemove', moved);
          window.removeEventListener('mouseup', up);
          ele.classList.remove('dragging');
        };
        window.addEventListener('mouseup', up);
      });
    }
  }

  /*
  * Run through the syntax tree and find literals
  * that are numbers (possibly do some introspection in the future)
  * and create a new expression (hijack the syntax tree)
  */
  function findLiterals(cm, tree) {
    var _values = {},
        prefix = 'interactive_';

    var markLiterals = function(e) {
      var id;
      if (e.type === 'Literal' && typeof e.value === 'number') {
        if (nextId >= 2048) { nextId = 0; };
        id = nextId++;
        _values[prefix + id] = {
          range: e.range,
          value: e.value,
          start: cm.posFromIndex(e.range[0]),
          end: cm.posFromIndex(e.range[1])
        };
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