const interpret = (inp) => {
  let value = numParser(inp) || strParser(inp) || boolParser(inp) ||
  expressionParser(inp) || ifParser(inp) || whiteSpaceParser(inp)
  if (value) {
    if (value[1] === '\n' || value[1] === '') {
      return value[0]
    } else return value
  } else return null
}
const boolParser = (input) => {
  return input.startsWith('#t') ? ['#t', input.slice(2, input.length)]
    : (input.startsWith('#f')) ? ['#f', input.slice(5, input.length)] : null
}
const digitParser = (input) => { return (input >= '0' && input <= '9') ? input : null }
const expParser = (input) => { return (input === 'E' || input === 'e') ? input : null }
const signParser = (input) => { return (input === '+' || input === '-') ? input : null }
const next = (arr, input) => {
  arr[0] = input[arr[2]]
  arr[1] += input[arr[2]]
  arr[2]++
  return arr
}
const numParser = (input) => {
  let arr = ['', '', 0]
  if (signParser(input[arr[2]]) || digitParser(input[arr[2]])) {
    next(arr, input)
    while ((digitParser(input[arr[2]]) || expParser(input[arr[2]]) || input[arr[2]] === '.')) {
      next(arr, input)
      if (expParser(input[arr[2]])) {
        next(arr, input)
        while ((digitParser(input[arr[2]]) || signParser(input[arr[2]]))) {
          next(arr, input)
        }
        if (input[arr[2]] === '.') return null
      }
    }
    return arr[1][0] === '0' ? (arr[1].length === 1 ? [Number(arr[1]), input.slice(arr[2])]
      : (arr[1][1] === '.' || expParser(arr[1][1]) ? [Number(arr[1]), input.slice(arr[2])] : null))
      : (Number(arr[1]) ? [Number(arr[1]), input.slice(arr[2])] : null)
  } else return null
}

const strParser = (input) => {
  let inpLength = input.length
  let arr = ['', '', 0]
  if (input[arr[2]] === '"') {
    next(arr, input)
    while (input[arr[2]] !== '"' && arr[2] < inpLength) {
      if (input[arr[2]] === '\\') {
        next(arr, input)
        if (!specialChars(input[arr[2]])) { return null } else if (input[arr[2]] === 'u') {
          let numHex = 1
          let hexCode = '0x'
          next(arr, input)
          while (hexChars(input[arr[2]]) && numHex <= 4) {
            numHex++
            hexCode += input[arr[2]]
            next(arr, input)
          }
          if (numHex === 5) {
            arr[1] = arr[1].slice(0, -6)
            arr[1] += String.fromCharCode(hexCode)
          } else return null
        } else if (input[arr[2]] === '"' || input[arr[2]] === '\\') {
          arr[1] = arr[1].slice(0, -1)
        }
      }
      next(arr, input)
    }
    return (input[arr[2]] === '"') ? [arr[1].slice(1), input.slice(arr[2] + 1)] : null
  } else return null
}

const hexChars = (input) => { return ((input >= 'A' && input <= 'F') || (input >= 'a' && input <= 'f') || digitParser(input)) ? input : null }
const specialChars = (input) => { return (input === '"' || input === '\\' || input === '/' || input === 'b' || input === 'f' || input === 'n' || input === 'r' || input === 't' || input === 'u') ? input : null }
const whiteSpaceParser = (input) => { return (input[0] === ' ') ? [input[0], input.slice(1)] : null }

const env = {
  '>=': (operands) => operands.reduce((a, b) => { return a >= b ? b : false }),
  '<=': (operands) => operands.reduce((a, b) => { return a <= b ? b : false }),
  '+': (operands) => operands.reduce((a, b) => a + b),
  '*': (operands) => operands.reduce((a, b) => a * b),
  '-': (operands) => operands.reduce((a, b) => a - b),
  '/': (operands) => operands.reduce((a, b) => a / b),
  '>': (operands) => operands.reduce((a, b) => { return a > b ? b : false }),
  '<': (operands) => operands.reduce((a, b) => { return a < b ? b : false }),
  'abs': (operands) => Math.abs(operands),
  'sin': (operands) => Math.sin(operands),
  'cos': (operands) => Math.cos(operands),
  'tan': (operands) => Math.tan(operands),
  'mod': (operands) => operands.reduce((a, b) => { return a % b }),
  'expt': (operands) => Math.pow(operands[0], operands[1]),
  'operators': [],
  'math_operators': ['+', '-', '*', '/'],
  'rel_operatos': ['>', '<', '>=', '<='],
  'unary_operators': ['abs', 'sin', 'cos', 'tan'],
  'binary_operators': ['mod', 'expt']
}

const expressionParser = (input) => {
  env['operators'] = []
  let operator, result
  let operands = []
  input = checkIntermittentSpace(input)
  if (input[0] === '(') {
    input = input.slice(1)
    if (input[0] === ')') { return '()' }
    for (var keyword in env) {
      if (input.startsWith(keyword)) {
        operator = keyword
        input = input.slice(keyword.length)
        break
      }
    }
    if (operator) {
      while (input[0] !== ')') {
        result = interpret(checkIntermittentSpace(input))
        if (result) {
          operands.push(result[0])
          input = checkIntermittentSpace(result[1])
        } else return null
      }
      input = checkIntermittentSpace(input)
      if (operator && operands && input[0] === ')') {
        let value
        if (env['unary_operators'].indexOf(operator) >= 0) {
          if (operands.length > 1) {
            return 'Only one operand allowed'
          } else {
            let elements = operands[0]
            operands[0] = evaluate(operator, elements)
          }
        } else if (env['binary_operators'].indexOf(operator) >= 0) {
          if (operands.length > 2) {
            return 'Error: ' + operator + ': too many arguments (at most: 2 got: ' + operands.length + ') ' + '[' + operator + ']'
          }
        }
        while (operands.length >= 2 && operands[0]) {
          let elements = [operands.shift(), operands.shift()]
          operands.unshift(evaluate(operator, elements))
        }
        return [operands[0], input.slice(1)]
      }
    } else return null
  } else return null
}

const ifParser = (input) => {
  if (input.startsWith('if')) {
    input = checkIntermittentSpace(input).slice(2)
    let result = interpret(input)
    let condition = result[0]
    console.log('evaluating ', result[1])
    result = interpret(checkIntermittentSpace(result[1]))
    console.log('for thenExp ', result)
    let thenExp = result[0]
    console.log('then expression ', thenExp)
    console.log('evaluating ', result[1])
    let elseExp = interpret(checkIntermittentSpace(result[1]))
    console.log('elseExp ', elseExp)
    return condition ? thenExp : elseExp
  }
}

const checkIntermittentSpace = (input) => {
  while (input[0] !== ')' && whiteSpaceParser(input)) {
    input = input.slice(1)
  }
  return input
}
const swap = (operands, value) => {
  let temp = operands[0]
  operands[0] = value
  operands[1] = temp
}
const evaluate = (operator, operands) => {
  if (env.hasOwnProperty(operator)) {
    return (env[operator](operands))
  }
}
module.exports = interpret
