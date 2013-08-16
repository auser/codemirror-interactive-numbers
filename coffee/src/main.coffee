ele = document.getElementsByClassName("editable")[0]

# ele.contentEditable = true;
text = ele.textContent or ele.innerText
ele.innerText = ""
myCodeMirror = CodeMirror(ele,
  value: text
  mode: "javascript"
  interactiveNumbers: true
)