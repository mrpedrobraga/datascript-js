import * as fs from 'fs'

/**
 * Reads a JSON file into DataScript.
 * */
export function readJSON(path) {
  const raw = fs.readFileSync(path, 'utf-8')
  return JSON.parse(raw)
}

/**
 * Class that holds the information for the context
 * of execution of a DataScript script.
 * @class
 * @constructor
 * */
export class DataScriptExecutionContext {
  /**
   * @param {DataScriptBackendLibrary} library*/
  constructor(library) {
    /**
    * @type {DataScriptBackendLibrary}
    * @public
    * */
    this.library = library

    /**
    * @type {boolean}
    * @public
    */
    this.last_condition_check_was_successful = false

    /**
     * @type {object[]}
     * @public
     */
    this.local_variable_stack = [{}]
  }

  /** Creates a new stack context for local variables. */
  vstack_push() {
    return this.local_variable_stack.push([{}])
  }

  /** Drops the last stack context for local variables. */
  vstack_pop () {
    return this.local_variable_stack.pop()
  }

  /** Sets the closest variable with a given name to a value. */
  setVar(name, value) {
    for (let i = this.local_variable_stack.length - 1; i >= 0; i--) {
      const frame = this.local_variable_stack[i]
      if (name in frame) frame[name] = value
    }
    this.local_variable_stack.at(-2)[name] = value
  }

  /** Gets the closest variable with a given name. */
  getVar(name) {
    for (let i = this.local_variable_stack.length - 1; i >= 0; i--) {
      const frame = this.local_variable_stack[i]
      if (name in frame) return frame[name]
    }
    throw `Variable ${name} not declared.`
  }
}

export class DataScriptBackendLibrary {
  /**
   * @type {string[]}
   * */
  meta_functions

  /**
   * @param {string[]} meta_functions*/
  constructor(meta_functions) {
    this.meta_functions = meta_functions
  }
}

/**
 * Executes a block (or an instruction) of Datascript code.
 * @param {DataScriptExecutionContext} _context
 * */
export async function execute(block, _context) {
  if (Array.isArray(block)) {
    if (typeof block[0] === 'string') {
      return await executeInstruction(block, _context)
    } else {
      return await executeBlock(block, _context)
    }
  } else {
    // If not an array, pass the value through
    return block
  }
}

/**
 * Executes a DataScript block.
 * @param {i} block
 * @param {*} _context
 * */
export async function executeBlock(block, _context) {
  let i_index = 0
  let result = null

  while (true) {
    if (i_index >= block.length) {
      break
    }

    const instruction = block[i_index]

    if (Array.isArray(instruction) && typeof instruction[0] === 'string') {
      result = await executeInstruction(instruction, _context)
    } else {
      result = instruction
    }

    i_index++
  }

  return result
}

/**
 * Executes a single DataScript instruction.
 * @param {*} instruction
 * @param {DataScriptExecutionContext} _context
 * */
export async function executeInstruction(instruction, _context) {
  const i_keyword = instruction[0]

  // Comments!
  if (i_keyword.startsWith("--") && i_keyword.endsWith("--")) { return null }

  let params = instruction.slice(1)
  let result

  if (_context.library.meta_functions.includes(i_keyword)) {
    params.unshift(_context)
    _context.vstack_push()
    result = await _context.library[i_keyword](...params)
    _context.vstack_pop()
  } else {
    _context.last_condition_check_was_successful = false
    params = await Promise.all(params.map(async (param) => await execute(param, _context)))
    result = await _context.library[i_keyword](...params)
  }

  return result
}
