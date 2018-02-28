const interpret = (inp) => {
  let value = numParser(inp) || strParser(inp) || boolParser(inp) ||
  mathExpParser(inp) || whiteSpaceParser(inp)
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
  '+': (operands) => operands.reduce((a, b) => { if (typeof a === 'number' && typeof b === 'number'){ return a + b } else { return null } }),
  '*': (operands) => operands.reduce((a, b) => a * b),
  '-': (operands) => operands.reduce((a, b) => a - b),
  '/': (operands) => operands.reduce((a, b) => a / b),
  '>': (operands) => operands.reduce((a, b) => { return a > b ? b : false }),
  '<': (operands) => operands.reduce((a, b) => { return a < b ? b : false }),
  'abs': (operands) => Math.abs(...operands),
  'mod': (operands) => operands.reduce((a, b) => a % b),
  'operators': [],
  'math_operators': ['+', '-', '*', '/'],
  'rel_operatos': ['>', '<', '>=', '<=']
}

const mathExpParser = (input) => {
  console.log('expression')
  env['operators'] = []
  let operator, result
  let operands = []
  input = checkIntermittentSpace(input)
  if (input[0] === '(') {
    console.log('EXPRESSION START')
    input = input.slice(1)
    console.log('Inp: ', input)
    if (input[0] === ')') { return '()' }
    for (var keyword in env) {
      if (input.startsWith(keyword)) {
        operator = keyword
        input = input.slice(keyword.length)
        console.log('Inp: ', input)
        break
      }
    }
    console.log('Operator: ', operator)
    if (operator) {
      while (input[0] !== ')') {
        result = interpret(checkIntermittentSpace(input))
        if (result) {
          operands.push(result[0])
          input = result[1]
        } else return null
      }
      console.log('Operands ', operands)
      console.log('Inp ', input)
      if (operator && operands && input[0] === ')') {
        let value
        while (operands.length >= 2 && operands[0]) {
          let elements = [operands.splice(0, 1)[0], operands.splice(0, 1)[0]]
          console.log('Elements: ', elements)
          operands.unshift(evaluate(operator, elements))
          console.log('First value: ', operands)
        }

        console.log('VALUE ', operands)
        return [operands[0], input.slice(1)]
      }
    } else return null
  } else return null
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
