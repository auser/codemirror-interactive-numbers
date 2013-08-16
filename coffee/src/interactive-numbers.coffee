(->
  "use strict"
  esprima = require("esprima")
  escodegen = require("escodegen")
  CodeMirror = global.CodeMirror #|| require('code-mirror')
  exports.interactiveOptions = $options = {}
  editing = false

  setInteractive = (cm, changeObj) ->
    unless editing
      editing = true
      scrubbableLinks = []
      key = val = newTree = range = pos = start = end = undefined
      hasReloaded = false
      toRun = []
      clsName = "scrub_widget"
      currentText = cm.getValue() or cm.options.value
      
      # Clean up after ourselves
      marks = cm.getAllMarks()
      (mark.clear() for mark in marks)
      try
        syntax = findLiterals(cm, esprima.parse(currentText,
          range: true
        ))
        widgets = []
        $options.values = syntax.values
        for key of syntax.values
          val = syntax.values[key]
          start = val.start
          end = val.end

          editableWidget = document.createElement("span")
          editableWidget.className = clsName
          editableWidget.textContent = val.value
          editableWidget.id = key
          widgets.push editableWidget
          range = cm.markText(start, end,
            handleMouseEvents: true
            replacedWith: editableWidget
            shared: true
            addToHistory: true
          )
          attachInteractivity editableWidget, val, cm
      catch e
        console.log e

      # $options.values = exports.interactiveOptions.values
      editing = false
  attachInteractivity = (ele, val, cm) ->
    ele.addEventListener "mousedown", (e) ->
      e.preventDefault()
      mx = e.pageX
      my = e.pageY
      orig = Number(ele.textContent)
      delta = orig
      ele.classList.add "dragging"
      moved = (e) ->
        e.preventDefault()
        d = Number((Math.round((e.pageX - mx) / 2) + orig).toFixed(5))
        ele.textContent = d
        $options.values[ele.id].value = d
        cm.replaceRange(String(d), val.start, val.end)

        if $options.onChange
          $options.onChange($options.values)


      window.addEventListener "mousemove", moved
      up = (e) ->
        window.removeEventListener "mousemove", moved
        window.removeEventListener "mouseup", up
        ele.classList.remove "dragging"

      window.addEventListener "mouseup", up
  
  #
  #  * Run through the syntax tree and find literals
  #  * that are numbers (possibly do some introspection in the future)
  #  * and create a new expression (hijack the syntax tree)
  #  
  findLiterals = (cm, tree) ->
    _values = {}
    prefix = "interactive_"
    nextId = 0
    markLiterals = (e) ->
      if e.type is "Literal" and typeof e.value is "number"
        nextId = 0 if nextId >= 2048
        id = nextId++
        _values[prefix + id] =
          range: e.range
          value: e.value
          start: cm.posFromIndex(e.range[0])
          end: cm.posFromIndex(e.range[1])
      else
        recursiveWalk e, markLiterals

    
    # Walk the tree and run the function `f`
    # on instances of 
    recursiveWalk = (tree, f) ->
      i = undefined
      key = undefined
      val = undefined
      if tree instanceof Array
        len = tree.length
        i = 0
        while i < len
          val = tree[i]
          f val  if typeof val is "object" and val isnt null
          i++
      else
        for key of tree
          val = tree[key]
          f val  if typeof val is "object" and val isnt null
      tree

    {
      ast: recursiveWalk(tree, markLiterals)
      values: _values
    }

  nextId = 1
  global.CodeMirror.defineOption "interactiveNumbers", {}, (cm, val, old) ->
    prev = old and old isnt CodeMirror.Init
    if val
      $options = val
      cm.on "change", setInteractive
      setInteractive cm

)()