import { DataScriptExecutionContext, execute, readJSON } from "./datascript.js";

var json = readJSON("tester.ds.json")

var library = {
  meta_functions: ["if", "else", "set", "get"],

  write(what) {
    console.log(what)
    return what
  },

  add(a, b) {
    return a + b
  },

  async if(_context, condition, block) {
    if (await execute(condition, _context)) return await execute(block, _context)
    return null
  },

  set (_context, key, value) {
    _context.setVar(key, value)
  },

  get (_context, key,) {
    return _context.getVar(key)
  }
}

var result = execute(json, new DataScriptExecutionContext(library))
