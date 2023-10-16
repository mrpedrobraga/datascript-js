import { execute, readJSON } from "./datascript.js";

var json = readJSON("tester.ds.json")

var library = {
  meta_functions: ["if", "else"],

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
  }
}

var result = execute(json, { library })
