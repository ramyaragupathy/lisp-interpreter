const interpret = (inp) => {
  return numParser(inp) || strParser(inp)
}

const digitParser = (input) => {return (input >=0 && input <= 9) ? input:null}
const expParser = (input) => {return (input === 'E' || input === 'e') ? input:null}
const signParser = (input) => {return (input === '+' || input === '-') ? input:null}
const next = (arr, input) => {
 arr[0] = input[arr[2]]
 arr[1] += input[arr[2]]
 arr[2]++
 return arr
}
const numParser = (input) => {
  let arr = ['', '', 0]
  if (signParser(input[arr[2]]) === '-' || digitParser(input[arr[2]])) {
    next(arr, input)
    while ((digitParser(input[arr[2]]) || expParser(input[arr[2]]) || input[arr[2]] === '.')) {
      next(arr,input)
      if (expParser(input[arr[2]])) {
        next(arr,input) 
        while ((digitParser(input[arr[2]]) || signParser(input[arr[2]]))) {
          next(arr, input)}
        if (input[arr[2]] === '.') return null     
      }
    } 
    return arr[1][0] === '0'? (arr[1].length === 1?[Number(arr[1]),input.slice(arr[2])]: 
           (arr[1][1] === '.' || expParser(arr[1][1])?[Number(arr[1]),input.slice(arr[2])]:null))
                                  : (Number(arr[1])?[Number(arr[1]), input.slice(arr[2])]:null)
} else return null}

const strParser = (input) => {
  let inpLength = input.length
  let arr = ['','',0]
  if (input[arr[2]] === '"') {
      next(arr, input)
      while(input[arr[2]] !== '"' && arr[2] < inpLength){
        if (input[arr[2]] === '\\') {
          next(arr, input)
          if (!specialChars(input[arr[2]])) {return null} 
          else if (input[arr[2]] === 'u') {
            let numHex = 1, hexCode = '0x'
            next(arr, input)
            while (hexChars(input[arr[2]]) && numHex<=4) {
              numHex++
              hexCode += input[arr[2]]
              next(arr, input)
            }
            if (numHex === 5) {
              arr[1] = arr[1].slice(0,-6)
              arr[1] += String.fromCharCode(hexCode)
            } else return null   
          } else if(input[arr[2]] === '"' || input[arr[2]] === '\\'){
             arr[1] = arr[1].slice(0,-1)
          } 
        } 
        next(arr, input)
      }
    return (input[arr[2]] === '"') ?[arr[1].slice(1), input.slice(arr[2]+1)]:null
  } else return null
}

const hexChars = (input) => {return ((input >= 'A' && input <= 'F') || (input >= 'a' && input <= 'f') || digitParser(input))? input : null}
const specialChars = (input) => {return (input === '"' || input === '\\' || input === '/' || input === 'b' || input === 'f' || input === 'n' ||input === 'r' || input === 't' || input === 'u') ? input : null}
const whiteSpaceParser = (input) => {return (input[0] === ' ') ? [input[0], input.slice(1)] : null}

const next = (arr, input) => {
  arr[0] = input[arr[2]]
  arr[1] += input[arr[2]]
  arr[2]++
  return arr
 }
const expressionParser = (input) => {
  let arr = ['','',0]
  if (input[arr[2]] === '('){
    next(arr)
    while(input[[arr[2]]!==')']){
      result = interpret(input.slice(arr[2]))
    }
  }
}
module.exports = interpret