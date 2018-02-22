const repl = require('repl')
const interpreter = require('./src/interpreter.js')
const myEval = (cmd, context, filename, callback) => {
  callback(null, interpreter(cmd))
}
const replServer = repl.start({
  prompt: 'lisp-interpreter > ',
  eval: myEval
})
