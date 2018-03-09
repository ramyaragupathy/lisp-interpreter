const interpret = (inp, localEnv) => {
  let value = numParser(inp) || strParser(inp) || boolParser(inp) ||
              ifParser(inp, localEnv) || defineParser(inp) || expressionParser(inp, localEnv) ||
              envLookUp(inp, localEnv) || whiteSpaceParser(inp)
  if (value) {
    if (value[1] === '\n' || value[1] === '') {
      return value[0]
    } else {
      if (typeof value[0] === 'string' && value[0].startsWith('(lambda')) {
        let result = lambdaParser(value)[0]
        return result
      } else return value
    }
  }
}
const boolParser = (input) => {
  input = checkIntermittentSpace(input)
  return input.startsWith('#t') ? ['#t', input.slice(2)]
    : (input.startsWith('#f')) ? ['#f', input.slice(2)] : null
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
  input = checkIntermittentSpace(input)
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
  '>=': (operands) => !!operands.reduce((a, b) => { return a >= b ? b : false }),
  '<=': (operands) => !!operands.reduce((a, b) => { return a <= b ? b : false }),
  '+': (operands) => !!operands.reduce((a, b) => a + b),
  '*': (operands) => !!operands.reduce((a, b) => a * b),
  '-': (operands) => !!operands.reduce((a, b) => a - b),
  '/': (operands) => !!operands.reduce((a, b) => a / b),
  '>': (operands) => !!operands.reduce((a, b) => { return a > b ? b : false }),
  '<': (operands) => !!operands.reduce((a, b) => { return a < b ? b : false }),
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
  'binary_operators': ['mod', 'expt'],
  'lambda': []
}

const expressionParser = (input, localEnv) => {
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
      input = checkIntermittentSpace(input)
      while (input[0] !== ')') {
        result = interpret(checkIntermittentSpace(input), localEnv)
        if (result) {
          operands.push(result[0])
          input = checkIntermittentSpace(result[1])
        } else return null
      }
      if (env['lambda'].indexOf(operator) >= 0) {
        return lambdaParser([env[operator], operands.toString(), input.slice(1)])
      }
      input = checkIntermittentSpace(input)
      if (operator && operands && input[0] === ')') {
        let value
        if (env['unary_operators'].indexOf(operator) >= 0) {
          if (operands.length > 1) {
            return ('Error: ' + operator + ': too many arguments (at most: 1 got: ' + operands.length + ') ' + '[' + operator + ']')
          } else {
            let elements = operands[0]
            operands[0] = evaluate(operator, elements)
          }
        } else if (env['binary_operators'].indexOf(operator) >= 0) {
          if (operands.length > 2) {
            return ('Error: ' + operator + ': too many arguments (at most: 2 got: ' + operands.length + ') ' + '[' + operator + ']')
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

const ifParser = (input, localEnv) => {
  input = checkIntermittentSpace(input)
  if (input.startsWith('(if')) {
    input = checkIntermittentSpace(input).slice(3)
    let result = interpret(input, localEnv)
    let condition = result[0]
    if (result[1] !== '\n' && result[1][0] !== ')') {
      result = interpret(checkIntermittentSpace(result[1]), localEnv)
      let thenExp = result[0]
      if (!(condition === '#f' || condition === false)) {
        return thenExp
      } else if (result[1] !== '\n' && result[1][0] !== ')') {
        let elseExp = interpret(checkIntermittentSpace(result[1]), localEnv)[0]
        return (condition === '#f' || condition === false) ? elseExp : thenExp
      } else return (condition === '#f' || condition === false) ? null : thenExp
    } else return condition
  }
}

const defineParser = (input) => {
  input = checkIntermittentSpace(input)
  if (input.startsWith('(define')) {
    input = checkIntermittentSpace(input.slice(7))
    let key = ''
    while (input[0] !== ' ') {
      key += input[0]
      input = input.slice(1)
    }
    let keyValue = ''
    input = checkIntermittentSpace(input)
    let result = interpret(input)
    if (!result) {
      if (env['lambda'].indexOf(key) < 0) {
        env['lambda'].push(key)
      }
      let arr = ['', '', 0]
      while (input[arr[2]] !== '\n') {
        next(arr, input)
      }
      keyValue = arr[1]
    } else {
      keyValue = result[0]
    }
    env[key] = keyValue
  }
}

const envLookUp = (input, localEnv) => {
  input = checkIntermittentSpace(input)
  let arr = ['', '', 0]
  while (input[arr[2]] !== ' ' && input[arr[2]] !== '\n' && (input[arr[2]] !== '(' && input[arr[2]] !== ')')) {
    next(arr, input)
  }
  if (localEnv) { if (localEnv.hasOwnProperty(arr[1]) && localEnv[arr[1]] !== undefined) return [localEnv[arr[1]], input.slice(arr[2])] } else if (env.hasOwnProperty(arr[1]) && env[arr[1]] !== undefined) return [env[arr[1]], input.slice(arr[2])]
}
const lambdaParser = (value) => {
  let localEnv = {}
  let input = checkIntermittentSpace(value[0])
  if (input.startsWith('(lambda')) {
    let argValue = interpret(checkIntermittentSpace(value[1]), localEnv)
    let argValueList = []
    while (argValue !== undefined) {
      if (argValue[0]) {
        argValueList.push(argValue[0])
        argValue = interpret(checkIntermittentSpace(argValue[1]))
      } else {
        argValueList.push(argValue)
        argValue = undefined
      }
    }
    let argList = []
    input = checkIntermittentSpace(input.slice(7))
    let arg = ''
    if (input[0] === '(') {
      input = input.slice(1)
      while (input[0] !== ')') {
        if (input[0] === ' ') {
          if (arg) argList.push(arg)
          arg = ''
          input = checkIntermittentSpace(input)
        } else {
          arg += input[0]
          input = input.slice(1)
        }
      }
    }
    argList.push(arg)
    if (argList[0]) {
      argList.forEach(function (item, index) {
        localEnv[item] = argValueList[index]
      })
    } else localEnv[arg] = argValueList[0]
    input = checkIntermittentSpace(input.slice(1))
    let funcBody = '('
    let openBrackets = 0
    let closeBrackets = 0
    if (input[0] === '(') {
      openBrackets++
      input = input.slice(1)
      while (openBrackets !== closeBrackets) {
        if (input[0] === '(') {
          openBrackets++
        } else if (input[0] === ')') {
          closeBrackets++
        }
        funcBody += input[0]
        input = input.slice(1)
      }
    }
    return [interpret(funcBody, localEnv), value[2]]
  }
}

const checkIntermittentSpace = (input) => {
  while (input[0] !== ')' && whiteSpaceParser(input)) {
    input = input.slice(1)
  }
  return input
}

const evaluate = (operator, operands) => {
  if (env.hasOwnProperty(operator)) {
    return (env[operator](operands))
  }
}
module.exports = interpret
