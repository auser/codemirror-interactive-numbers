var ele = document.getElementsByClassName("editable")[0];
    // ele.contentEditable = true;

var text = ele.textContent || ele.innerText;
ele.innerText = "";

var myCodeMirror = CodeMirror(ele, {
  value: text,
  mode:  "javascript",
  interactiveNumbers: true
});