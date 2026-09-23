/**
 * compiler.js — C-to-JavaScript Transpiler / Simulated Execution Engine
 * Handles the course's embedded C examples via a JavaScript simulation layer.
 * All output is clearly labelled "SIMULATED EXECUTION".
 */

const CCompiler = (() => {

  /* ── Type system ── */
  const TYPE_INFO = {
    'uint8_t':   { bits: 8,  signed: false, max: 255,         min: 0,           mask: 0xFF },
    'uint16_t':  { bits: 16, signed: false, max: 65535,       min: 0,           mask: 0xFFFF },
    'uint32_t':  { bits: 32, signed: false, max: 4294967295,  min: 0,           mask: 0xFFFFFFFF },
    'int8_t':    { bits: 8,  signed: true,  max: 127,         min: -128,        mask: 0xFF },
    'int16_t':   { bits: 16, signed: true,  max: 32767,       min: -32768,      mask: 0xFFFF },
    'int32_t':   { bits: 32, signed: true,  max: 2147483647,  min: -2147483648, mask: 0xFFFFFFFF },
    'int':       { bits: 32, signed: true,  max: 2147483647,  min: -2147483648, mask: 0xFFFFFFFF },
    'unsigned':  { bits: 32, signed: false, max: 4294967295,  min: 0,           mask: 0xFFFFFFFF },
    'char':      { bits: 8,  signed: true,  max: 127,         min: -128,        mask: 0xFF },
    'short':     { bits: 16, signed: true,  max: 32767,       min: -32768,      mask: 0xFFFF },
    'long':      { bits: 32, signed: true,  max: 2147483647,  min: -2147483648, mask: 0xFFFFFFFF },
    'float':     { bits: 32, signed: true,  isFloat: true },
    'double':    { bits: 64, signed: true,  isFloat: true },
    'size_t':    { bits: 32, signed: false, max: 4294967295,  min: 0,           mask: 0xFFFFFFFF },
    'bool':      { bits: 8,  signed: false, max: 1,           min: 0,           mask: 0x1 },
  };

  function applyOverflow(val, typeInfo) {
    if (!typeInfo) return val;
    if (typeInfo.isFloat) return val;
    const masked = ((val >>> 0) & typeInfo.mask);
    if (typeInfo.signed && (masked & (1 << (typeInfo.bits - 1)))) {
      return masked - (1 << typeInfo.bits);
    }
    return masked;
  }

  /* ── Pre-processing: strip includes, resolve #defines ── */
  function preprocess(src) {
    const defines = {};
    const lines = src.split('\n');
    const out = [];
    for (const line of lines) {
      const defMatch = line.match(/^\s*#define\s+(\w+)\s+(.+)$/);
      if (defMatch) { defines[defMatch[1].trim()] = defMatch[2].trim(); continue; }
      if (/^\s*#include/.test(line)) continue; // strip includes
      if (/^\s*#/.test(line)) continue;        // strip other directives
      let l = line;
      for (const [k, v] of Object.entries(defines)) {
        l = l.replace(new RegExp(`\\b${k}\\b`, 'g'), v);
      }
      out.push(l);
    }
    return out.join('\n');
  }

  /* ── Tokenizer ── */
  function tokenize(src) {
    const tokens = [];
    let i = 0;
    while (i < src.length) {
      // Skip whitespace
      if (/\s/.test(src[i])) { i++; continue; }
      // Line comments
      if (src[i] === '/' && src[i+1] === '/') {
        while (i < src.length && src[i] !== '\n') i++;
        continue;
      }
      // Block comments
      if (src[i] === '/' && src[i+1] === '*') {
        i += 2;
        while (i < src.length && !(src[i] === '*' && src[i+1] === '/')) i++;
        i += 2; continue;
      }
      // String literals
      if (src[i] === '"') {
        let j = i + 1, s = '';
        while (j < src.length && src[j] !== '"') {
          if (src[j] === '\\') { s += src[j] + src[j+1]; j += 2; }
          else { s += src[j]; j++; }
        }
        tokens.push({ type: 'STRING', val: s }); i = j + 1; continue;
      }
      // Char literals
      if (src[i] === "'") {
        let j = i + 1, s = '';
        if (src[j] === '\\') { s = src[j+1]; j += 2; } else { s = src[j]; j++; }
        tokens.push({ type: 'CHAR', val: s.charCodeAt(0) }); i = j + 1; continue;
      }
      // Numbers
      if (/\d/.test(src[i]) || (src[i] === '0' && src[i+1] === 'x')) {
        let j = i, n = '';
        if (src[i] === '0' && src[i+1] === 'x') {
          j += 2; n = '0x';
          while (/[0-9a-fA-F]/.test(src[j])) n += src[j++];
        } else {
          while (/[\d.]/.test(src[j])) n += src[j++];
        }
        while ('uUlLfF'.includes(src[j])) j++; // skip suffixes
        tokens.push({ type: 'NUMBER', val: n.startsWith('0x') ? parseInt(n, 16) : parseFloat(n) });
        i = j; continue;
      }
      // Identifiers / keywords
      if (/[a-zA-Z_]/.test(src[i])) {
        let j = i, id = '';
        while (/\w/.test(src[j])) id += src[j++];
        tokens.push({ type: 'ID', val: id }); i = j; continue;
      }
      // Multi-char operators
      const two = src.slice(i, i+2);
      if (['==','!=','<=','>=','&&','||','<<','>>','++','--','+=','-=','*=','/=','%=','|=','&=','^=','<<=','>>=','->'].includes(two)) {
        tokens.push({ type: 'OP', val: two }); i += 2; continue;
      }
      const three = src.slice(i, i+3);
      if (['<<=','>>='].includes(three)) { tokens.push({ type: 'OP', val: three }); i += 3; continue; }
      // Single char operators / punctuation
      tokens.push({ type: 'PUNCT', val: src[i] }); i++;
    }
    return tokens;
  }

  /* ── Simple Interpreter ── */
  class Interpreter {
    constructor() {
      this.output = [];
      this.vars = [{}];    // scope stack
      this.types = [{}];   // type tracking per var
      this.fns = {};       // user-defined functions
      this.callDepth = 0;
      this.maxCalls = 500;
      this.loopIterations = 0;
      this.maxIterations = 2000;
    }

    scope() { return this.vars[this.vars.length - 1]; }
    typeScope() { return this.types[this.types.length - 1]; }

    pushScope() { this.vars.push(Object.create(this.scope())); this.types.push(Object.create(this.typeScope())); }
    popScope()  { this.vars.pop(); this.types.pop(); }

    getVar(name) {
      for (let i = this.vars.length - 1; i >= 0; i--) {
        if (this.vars[i].hasOwnProperty(name)) return this.vars[i][name];
      }
      throw new Error(`Undefined variable: '${name}'`);
    }
    setVar(name, val) {
      for (let i = this.vars.length - 1; i >= 0; i--) {
        if (this.vars[i].hasOwnProperty(name)) {
          const ti = this.types[i][name];
          this.vars[i][name] = ti ? applyOverflow(val, TYPE_INFO[ti]) : val;
          return;
        }
      }
      this.scope()[name] = val; // new var in current scope
    }
    declareVar(name, type, val) {
      const ti = TYPE_INFO[type];
      const v = ti ? applyOverflow(val, ti) : val;
      this.scope()[name] = v;
      this.typeScope()[name] = type;
    }

    print(s) { this.output.push({ kind: 'stdout', text: String(s) }); }
    printErr(s) { this.output.push({ kind: 'stderr', text: String(s) }); }

    /* Printf implementation */
    printf(fmt, args) {
      let s = '';
      let ai = 0;
      for (let i = 0; i < fmt.length; i++) {
        if (fmt[i] === '%' && i + 1 < fmt.length) {
          i++;
          let flags = '', width = '', prec = '', spec = '';
          // flags
          while ('-+0 #'.includes(fmt[i])) flags += fmt[i++];
          // width
          while (/\d/.test(fmt[i])) width += fmt[i++];
          // precision
          if (fmt[i] === '.') { i++; while (/\d/.test(fmt[i])) prec += fmt[i++]; }
          // length modifier
          while ('hlqLz'.includes(fmt[i])) i++;
          spec = fmt[i];
          const arg = args[ai++];
          const w = width ? parseInt(width) : 0;
          let tok = '';
          if (spec === 'd' || spec === 'i') tok = String(arg | 0);
          else if (spec === 'u') tok = String(arg >>> 0);
          else if (spec === 'x') tok = (arg >>> 0).toString(16).padStart(prec ? parseInt(prec) : 0, '0');
          else if (spec === 'X') tok = (arg >>> 0).toString(16).toUpperCase().padStart(prec ? parseInt(prec) : 0, '0');
          else if (spec === 'o') tok = (arg >>> 0).toString(8);
          else if (spec === 'b') tok = (arg >>> 0).toString(2).padStart(8, '0');
          else if (spec === 'f' || spec === 'g') {
            const p = prec !== '' ? parseInt(prec) : (spec === 'g' ? 6 : 6);
            tok = parseFloat(arg).toFixed(p);
          }
          else if (spec === 'e') tok = parseFloat(arg).toExponential(prec !== '' ? parseInt(prec) : 6);
          else if (spec === 'c') tok = String.fromCharCode(arg);
          else if (spec === 's') tok = String(arg);
          else if (spec === 'p') tok = '0x' + (arg >>> 0).toString(16).padStart(8, '0');
          else if (spec === '%') { s += '%'; continue; }
          else tok = '';
          if (w && tok.length < w) {
            tok = flags.includes('-') ? tok.padEnd(w) : tok.padStart(w, flags.includes('0') ? '0' : ' ');
          }
          s += tok;
        } else if (fmt[i] === '\\') {
          i++;
          if (fmt[i] === 'n') s += '\n';
          else if (fmt[i] === 't') s += '\t';
          else if (fmt[i] === 'r') s += '\r';
          else if (fmt[i] === '\\') s += '\\';
          else if (fmt[i] === '"') s += '"';
          else if (fmt[i] === '0') s += '\0';
          else s += '\\' + fmt[i];
        } else {
          s += fmt[i];
        }
      }
      // Split by newlines and print each
      const lines = s.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (i < lines.length - 1) this.print(lines[i] + '↵');
        else if (lines[i] !== '') this.print(lines[i]);
      }
    }

    /* Evaluate expression AST node */
    evalExpr(node) {
      if (!node) return 0;
      if (node.t === 'num') return node.v;
      if (node.t === 'str') return node.v;
      if (node.t === 'id')  return this.getVar(node.v);
      if (node.t === 'cast') {
        const v = this.evalExpr(node.expr);
        const ti = TYPE_INFO[node.castType];
        return ti ? applyOverflow(v, ti) : v;
      }
      if (node.t === 'sizeof') {
        const ti = TYPE_INFO[node.ofType];
        return ti ? (ti.bits / 8) : 4;
      }
      if (node.t === 'unary') {
        const v = this.evalExpr(node.expr);
        if (node.op === '-') return -v;
        if (node.op === '!') return v ? 0 : 1;
        if (node.op === '~') return ~v;
        if (node.op === '++') { this.setVar(node.expr.v, v + 1); return v + 1; }
        if (node.op === '--') { this.setVar(node.expr.v, v - 1); return v - 1; }
        if (node.op === 'post++') { this.setVar(node.expr.v, v + 1); return v; }
        if (node.op === 'post--') { this.setVar(node.expr.v, v - 1); return v; }
        if (node.op === '*') return this.getVar('*' + node.expr.v) ?? v; // simple deref simulation
        if (node.op === '&') return ('0x' + (node.expr.v.charCodeAt(0) * 4 + 0x20000000).toString(16));
        return v;
      }
      if (node.t === 'binary') {
        const left = this.evalExpr(node.left);
        const right = this.evalExpr(node.right);
        switch (node.op) {
          case '+': return left + right;
          case '-': return left - right;
          case '*': return left * right;
          case '/': if (right === 0) throw new Error('Division by zero'); return Math.trunc(left / right);
          case '%': if (right === 0) throw new Error('Modulo by zero'); return left % right;
          case '&': return (left & right) >>> 0;
          case '|': return (left | right) >>> 0;
          case '^': return (left ^ right) >>> 0;
          case '<<': return (left << right) >>> 0;
          case '>>': return left >>> right;
          case '==': return left === right ? 1 : 0;
          case '!=': return left !== right ? 1 : 0;
          case '<':  return left < right ? 1 : 0;
          case '>':  return left > right ? 1 : 0;
          case '<=': return left <= right ? 1 : 0;
          case '>=': return left >= right ? 1 : 0;
          case '&&': return (left && right) ? 1 : 0;
          case '||': return (left || right) ? 1 : 0;
        }
      }
      if (node.t === 'assign') {
        let val = this.evalExpr(node.right);
        let cur = 0;
        try { cur = this.getVar(node.name); } catch(e) {}
        if (node.op === '+=')  val = cur + val;
        if (node.op === '-=')  val = cur - val;
        if (node.op === '*=')  val = cur * val;
        if (node.op === '/=')  val = Math.trunc(cur / val);
        if (node.op === '|=')  val = (cur | val) >>> 0;
        if (node.op === '&=')  val = (cur & val) >>> 0;
        if (node.op === '^=')  val = (cur ^ val) >>> 0;
        if (node.op === '<<=') val = (cur << val) >>> 0;
        if (node.op === '>>=') val = cur >>> val;
        if (node.op === '%=')  val = cur % val;
        this.setVar(node.name, val);
        return val;
      }
      if (node.t === 'arr_assign') {
        const arr = this.getVar(node.name);
        const idx = this.evalExpr(node.index);
        const val = this.evalExpr(node.right);
        if (Array.isArray(arr)) arr[idx] = val;
        return val;
      }
      if (node.t === 'arr_access') {
        const arr = this.getVar(node.name);
        const idx = this.evalExpr(node.index);
        if (Array.isArray(arr)) return arr[idx] ?? 0;
        return 0;
      }
      if (node.t === 'member') {
        const obj = this.getVar(node.name);
        if (obj && typeof obj === 'object') return obj[node.field] ?? 0;
        return 0;
      }
      if (node.t === 'call') {
        return this.callFn(node.name, node.args.map(a => this.evalExpr(a)));
      }
      if (node.t === 'ternary') {
        return this.evalExpr(node.cond) ? this.evalExpr(node.then) : this.evalExpr(node.else);
      }
      return 0;
    }

    /* Call built-in or user function */
    callFn(name, args) {
      if (this.callDepth++ > this.maxCalls) throw new Error('Stack overflow (infinite recursion?)');
      let result = 0;
      try {
        switch (name) {
          case 'printf': this.printf(args[0], args.slice(1)); break;
          case 'puts':   this.print(String(args[0]) + '↵'); break;
          case 'putchar': this.print(String.fromCharCode(args[0])); break;
          case 'abs':    result = Math.abs(args[0]); break;
          case 'fabs':   result = Math.abs(args[0]); break;
          case 'sqrt':   result = Math.sqrt(args[0]); break;
          case 'pow':    result = Math.pow(args[0], args[1]); break;
          case 'floor':  result = Math.floor(args[0]); break;
          case 'ceil':   result = Math.ceil(args[0]); break;
          case 'round':  result = Math.round(args[0]); break;
          case 'sin':    result = Math.sin(args[0]); break;
          case 'cos':    result = Math.cos(args[0]); break;
          case 'rand':   result = Math.floor(Math.random() * 32768); break;
          case 'sprintf': result = 0; break; // stub
          case 'strlen':  result = String(args[0]).length; break;
          case 'memset':  result = 0; break;
          case 'memcpy':  result = 0; break;
          case 'assert':  if (!args[0]) throw new Error('Assertion failed'); break;
          default:
            if (this.fns[name]) {
              result = this.execFn(this.fns[name], args);
            } else {
              this.printErr(`Warning: unknown function '${name}()' called`);
            }
        }
      } finally { this.callDepth--; }
      return result;
    }

    /* Execute a user-defined function */
    execFn(fn, argVals) {
      this.pushScope();
      for (let i = 0; i < fn.params.length; i++) {
        const { name, type } = fn.params[i];
        this.declareVar(name, type, argVals[i] ?? 0);
      }
      let ret = 0;
      try {
        this.execBlock(fn.body);
      } catch(e) {
        if (e.__return !== undefined) ret = e.__return;
        else throw e;
      }
      this.popScope();
      return ret;
    }

    /* Execute a block of statements */
    execBlock(stmts) {
      this.pushScope();
      try {
        for (const stmt of stmts) this.execStmt(stmt);
      } finally { this.popScope(); }
    }

    /* Execute one statement */
    execStmt(stmt) {
      if (this.loopIterations++ > this.maxIterations) throw new Error('Execution limit reached (possible infinite loop)');
      if (!stmt) return;
      switch (stmt.t) {
        case 'decl': {
          const val = stmt.init ? this.evalExpr(stmt.init) : 0;
          if (stmt.isArr) {
            const size = stmt.arrSize ? this.evalExpr(stmt.arrSize) : 0;
            const arr = Array(size).fill(0);
            if (stmt.initList) stmt.initList.forEach((e, i) => arr[i] = this.evalExpr(e));
            this.scope()[stmt.name] = arr;
          } else {
            this.declareVar(stmt.name, stmt.dtype, val);
          }
          break;
        }
        case 'struct_decl': {
          const obj = {};
          for (const f of stmt.fields) obj[f.name] = 0;
          this.scope()[stmt.name] = obj;
          break;
        }
        case 'expr': this.evalExpr(stmt.expr); break;
        case 'return': throw { __return: this.evalExpr(stmt.expr) };
        case 'break': throw { __break: true };
        case 'continue': throw { __continue: true };
        case 'if': {
          if (this.evalExpr(stmt.cond)) this.execBlock(stmt.then);
          else if (stmt.else) {
            if (Array.isArray(stmt.else)) this.execBlock(stmt.else);
            else this.execStmt(stmt.else);
          }
          break;
        }
        case 'while': {
          const maxIt = this.maxIterations;
          let it = 0;
          while (this.evalExpr(stmt.cond)) {
            if (it++ > 1000) { this.printErr('Warning: loop iteration limit (1000) reached'); break; }
            try { this.execBlock(stmt.body); }
            catch(e) { if (e.__break) break; if (e.__continue) continue; throw e; }
          }
          break;
        }
        case 'dowhile': {
          let it = 0;
          do {
            if (it++ > 1000) { this.printErr('Warning: loop iteration limit reached'); break; }
            try { this.execBlock(stmt.body); }
            catch(e) { if (e.__break) break; if (e.__continue) continue; throw e; }
          } while (this.evalExpr(stmt.cond));
          break;
        }
        case 'for': {
          this.pushScope();
          if (stmt.init) this.execStmt(stmt.init);
          let it = 0;
          while (!stmt.cond || this.evalExpr(stmt.cond)) {
            if (it++ > 1000) { this.printErr('Warning: loop iteration limit (1000) reached'); break; }
            try { this.execBlock(stmt.body); }
            catch(e) { if (e.__break) { this.popScope(); return; } if (e.__continue) { /* fall through to update */ } else throw e; }
            if (stmt.update) this.evalExpr(stmt.update);
          }
          this.popScope();
          break;
        }
        case 'switch': {
          const val = this.evalExpr(stmt.expr);
          let matched = false;
          let fell = false;
          for (const c of stmt.cases) {
            if (!matched && !fell && c.val !== null) {
              const cv = this.evalExpr(c.val);
              if (cv !== val) continue;
            }
            matched = true;
            try {
              for (const s of c.body) this.execStmt(s);
            } catch(e) {
              if (e.__break) return;
              if (e.__continue) return;
              throw e;
            }
            fell = true;
          }
          break;
        }
        case 'fndef': {
          this.fns[stmt.name] = stmt;
          break;
        }
        case 'block': this.execBlock(stmt.stmts); break;
      }
    }
  }

  /* ── Parser ── */
  class Parser {
    constructor(tokens) {
      this.tokens = tokens.filter(t => t.type !== 'WHITESPACE');
      this.pos = 0;
    }
    peek(offset = 0) { return this.tokens[this.pos + offset]; }
    eat() { return this.tokens[this.pos++]; }
    expect(type, val) {
      const t = this.eat();
      if (val && t.val !== val) throw new Error(`Expected '${val}', got '${t?.val ?? 'EOF'}'`);
      return t;
    }
    check(val) { return this.peek() && this.peek().val === val; }
    checkId() { return this.peek() && this.peek().type === 'ID'; }

    isType(tok) {
      if (!tok) return false;
      const baseTypes = ['int','char','short','long','float','double','void','unsigned','signed',
        'uint8_t','uint16_t','uint32_t','uint64_t','int8_t','int16_t','int32_t','int64_t',
        'size_t','bool','_Bool','__uint32_t','__uint16_t','__uint8_t'];
      return baseTypes.includes(tok.val);
    }
    isTypeQ(tok) {
      if (!tok) return false;
      return ['const','volatile','static','extern','register','inline','restrict','__volatile__'].includes(tok.val);
    }

    parseProgram() {
      const stmts = [];
      while (this.pos < this.tokens.length) {
        const s = this.parseToplevel();
        if (s) stmts.push(s);
      }
      return stmts;
    }

    parseToplevel() {
      // Skip qualifiers
      while (this.isTypeQ(this.peek())) this.eat();
      // Struct definition
      if (this.check('struct') || this.check('typedef')) {
        return this.parseStructOrTypedef();
      }
      // Enum
      if (this.check('enum')) { this.skipToSemicolon(); return null; }
      // Function or variable declaration
      if (this.isType(this.peek())) {
        return this.parseDeclOrFn();
      }
      // Expression statement
      if (this.pos < this.tokens.length) {
        const s = this.parseStmt();
        return s;
      }
      return null;
    }

    parseStructOrTypedef() {
      // Very simplified: skip typedef struct {} Name; patterns
      this.eat(); // typedef or struct
      if (this.check('struct') || this.check('enum') || this.check('union')) this.eat();
      // consume until closing } Name ;
      let depth = 0;
      while (this.pos < this.tokens.length) {
        const t = this.eat();
        if (t.val === '{') depth++;
        if (t.val === '}') { depth--; if (depth <= 0) break; }
        if (depth === 0 && t.val === ';') break;
      }
      // eat possible name and semicolon
      while (this.pos < this.tokens.length && !this.check(';') && !this.check('{')) this.eat();
      if (this.check(';')) this.eat();
      return null;
    }

    parseDeclOrFn() {
      // Collect full type
      while (this.isTypeQ(this.peek())) this.eat();
      let dtype = '';
      while (this.isType(this.peek()) || (this.peek() && this.peek().type === 'ID' && dtype === '')) {
        dtype += (dtype ? ' ' : '') + this.eat().val;
        if (this.check('unsigned') || this.check('signed') || this.check('long') || this.check('short')) continue;
        break;
      }
      // Pointer
      while (this.check('*')) { this.eat(); dtype += '*'; }
      const name = this.checkId() ? this.eat().val : '_anon';

      // Function?
      if (this.check('(')) {
        return this.parseFnDef(dtype, name);
      }
      // Array?
      if (this.check('[')) return this.parseArrDecl(dtype, name);
      // Simple var
      let init = null;
      if (this.check('=')) { this.eat(); init = this.parseExpr(); }
      if (this.check(';')) this.eat();
      return { t: 'decl', dtype, name, init };
    }

    parseFnDef(retType, name) {
      this.expect('PUNCT', '(');
      const params = [];
      while (!this.check(')')) {
        while (this.isTypeQ(this.peek())) this.eat();
        if (this.check(')') || this.check('void')) { if (!this.check(')')) this.eat(); break; }
        let ptype = '';
        while (this.isType(this.peek()) || (this.checkId() && ptype === '')) {
          ptype += (ptype ? ' ' : '') + this.eat().val;
          break;
        }
        while (this.check('*')) { this.eat(); ptype += '*'; }
        const pname = this.checkId() ? this.eat().val : '_p' + params.length;
        // skip array notation
        if (this.check('[')) { while (!this.check(']') && this.pos < this.tokens.length) this.eat(); this.eat(); }
        params.push({ type: ptype, name: pname });
        if (this.check(',')) this.eat();
        if (!this.isType(this.peek()) && !this.checkId() && !this.check(')')) break;
      }
      if (this.check(')')) this.eat();
      // Semicolon → declaration only
      if (this.check(';')) { this.eat(); return null; }
      // Body
      const body = this.parseBlock();
      return { t: 'fndef', retType, name, params, body };
    }

    parseArrDecl(dtype, name) {
      this.eat(); // [
      let arrSize = null;
      if (!this.check(']')) arrSize = this.parseExpr();
      if (this.check(']')) this.eat();
      let initList = null;
      if (this.check('=')) {
        this.eat();
        if (this.check('{')) {
          this.eat();
          initList = [];
          while (!this.check('}')) {
            initList.push(this.parseExpr());
            if (this.check(',')) this.eat();
          }
          this.eat();
        }
      }
      if (this.check(';')) this.eat();
      return { t: 'decl', isArr: true, dtype, name, arrSize: arrSize ?? { t:'num', v: initList?.length ?? 0 }, initList };
    }

    parseBlock() {
      this.expect('PUNCT', '{');
      const stmts = [];
      while (!this.check('}') && this.pos < this.tokens.length) {
        const s = this.parseStmt();
        if (s) stmts.push(s);
      }
      if (this.check('}')) this.eat();
      return stmts;
    }

    parseStmt() {
      // Skip qualifiers
      while (this.isTypeQ(this.peek())) this.eat();
      // Block
      if (this.check('{')) { const stmts = this.parseBlock(); return { t: 'block', stmts }; }
      // Return
      if (this.check('return')) {
        this.eat();
        let expr = null;
        if (!this.check(';')) expr = this.parseExpr();
        if (this.check(';')) this.eat();
        return { t: 'return', expr };
      }
      // Break / Continue
      if (this.check('break'))    { this.eat(); if (this.check(';')) this.eat(); return { t: 'break' }; }
      if (this.check('continue')) { this.eat(); if (this.check(';')) this.eat(); return { t: 'continue' }; }
      // If
      if (this.check('if')) return this.parseIf();
      // While
      if (this.check('while')) return this.parseWhile();
      // Do-While
      if (this.check('do')) return this.parseDoWhile();
      // For
      if (this.check('for')) return this.parseFor();
      // Switch
      if (this.check('switch')) return this.parseSwitch();
      // Struct instance
      if (this.check('struct')) return this.parseStructInst();
      // Type declaration
      if (this.isType(this.peek())) return this.parseDeclOrFn();
      // Semicolon
      if (this.check(';')) { this.eat(); return null; }
      // Expression
      const expr = this.parseExpr();
      if (this.check(';')) this.eat();
      return { t: 'expr', expr };
    }

    parseIf() {
      this.eat(); // if
      this.expect('PUNCT', '(');
      const cond = this.parseExpr();
      this.expect('PUNCT', ')');
      const then = this.check('{') ? this.parseBlock() : [this.parseStmt()].filter(Boolean);
      let els = null;
      if (this.check('else')) {
        this.eat();
        if (this.check('if')) els = this.parseIf();
        else els = this.check('{') ? this.parseBlock() : [this.parseStmt()].filter(Boolean);
      }
      return { t: 'if', cond, then, else: els };
    }

    parseWhile() {
      this.eat();
      this.expect('PUNCT', '(');
      const cond = this.parseExpr();
      this.expect('PUNCT', ')');
      const body = this.check('{') ? this.parseBlock() : [this.parseStmt()].filter(Boolean);
      return { t: 'while', cond, body };
    }

    parseDoWhile() {
      this.eat(); // do
      const body = this.check('{') ? this.parseBlock() : [this.parseStmt()].filter(Boolean);
      this.expect('ID', 'while');
      this.expect('PUNCT', '(');
      const cond = this.parseExpr();
      this.expect('PUNCT', ')');
      if (this.check(';')) this.eat();
      return { t: 'dowhile', cond, body };
    }

    parseFor() {
      this.eat(); // for
      this.expect('PUNCT', '(');
      const init = !this.check(';') ? this.parseStmt() : (this.eat(), null);
      const cond = !this.check(';') ? this.parseExpr() : null;
      if (this.check(';')) this.eat();
      const update = !this.check(')') ? this.parseExpr() : null;
      this.expect('PUNCT', ')');
      const body = this.check('{') ? this.parseBlock() : [this.parseStmt()].filter(Boolean);
      return { t: 'for', init, cond, update, body };
    }

    parseSwitch() {
      this.eat(); // switch
      this.expect('PUNCT', '(');
      const expr = this.parseExpr();
      this.expect('PUNCT', ')');
      this.expect('PUNCT', '{');
      const cases = [];
      while (!this.check('}') && this.pos < this.tokens.length) {
        if (this.check('case')) {
          this.eat();
          const val = this.parseExpr();
          this.expect('PUNCT', ':');
          const body = [];
          while (!this.check('case') && !this.check('default') && !this.check('}')) {
            const s = this.parseStmt();
            if (s) body.push(s);
          }
          cases.push({ val, body });
        } else if (this.check('default')) {
          this.eat(); this.eat(); // default :
          const body = [];
          while (!this.check('case') && !this.check('}')) {
            const s = this.parseStmt();
            if (s) body.push(s);
          }
          cases.push({ val: null, body });
        } else break;
      }
      if (this.check('}')) this.eat();
      return { t: 'switch', expr, cases };
    }

    parseStructInst() {
      this.eat(); // struct
      const typeName = this.eat().val;
      const name = this.checkId() ? this.eat().val : '_s';
      const fields = [];
      if (this.check('=')) { this.eat(); /* skip initializer */ }
      while (!this.check(';') && this.pos < this.tokens.length) this.eat();
      if (this.check(';')) this.eat();
      return { t: 'struct_decl', typeName, name, fields };
    }

    skipToSemicolon() {
      let depth = 0;
      while (this.pos < this.tokens.length) {
        const t = this.eat();
        if (t.val === '{') depth++;
        if (t.val === '}') depth--;
        if (t.val === ';' && depth <= 0) break;
      }
    }

    /* Expression parser with operator precedence (Pratt-style) */
    parseExpr() { return this.parseAssign(); }

    parseAssign() {
      const left = this.parseTernary();
      const assignOps = ['=','+=','-=','*=','/=','%=','|=','&=','^=','<<=','>>='];
      if (this.peek() && this.peek().type === 'OP' && assignOps.includes(this.peek().val)) {
        const op = this.eat().val;
        const right = this.parseAssign();
        if (left.t === 'id') return { t: 'assign', name: left.v, op, right };
        if (left.t === 'arr_access') return { t: 'arr_assign', name: left.name, index: left.index, op, right };
        if (left.t === 'member') return { t: 'member_assign', name: left.name, field: left.field, op, right };
        return { t: 'assign', name: left.v ?? '_', op, right };
      }
      return left;
    }

    parseTernary() {
      const cond = this.parseOr();
      if (this.check('?')) {
        this.eat();
        const then = this.parseExpr();
        this.expect('PUNCT', ':');
        const els = this.parseExpr();
        return { t: 'ternary', cond, then, else: els };
      }
      return cond;
    }

    parseOr() {
      let left = this.parseAnd();
      while (this.peek()?.val === '||') { const op = this.eat().val; left = { t:'binary', op, left, right: this.parseAnd() }; }
      return left;
    }
    parseAnd() {
      let left = this.parseBitOr();
      while (this.peek()?.val === '&&') { const op = this.eat().val; left = { t:'binary', op, left, right: this.parseBitOr() }; }
      return left;
    }
    parseBitOr() {
      let left = this.parseBitXor();
      while (this.peek()?.val === '|' && this.tokens[this.pos+1]?.val !== '|') { const op = this.eat().val; left = { t:'binary', op, left, right: this.parseBitXor() }; }
      return left;
    }
    parseBitXor() {
      let left = this.parseBitAnd();
      while (this.peek()?.val === '^') { const op = this.eat().val; left = { t:'binary', op, left, right: this.parseBitAnd() }; }
      return left;
    }
    parseBitAnd() {
      let left = this.parseEquality();
      while (this.peek()?.val === '&' && this.tokens[this.pos+1]?.val !== '&') { const op = this.eat().val; left = { t:'binary', op, left, right: this.parseEquality() }; }
      return left;
    }
    parseEquality() {
      let left = this.parseRelational();
      while (['==','!='].includes(this.peek()?.val)) { const op = this.eat().val; left = { t:'binary', op, left, right: this.parseRelational() }; }
      return left;
    }
    parseRelational() {
      let left = this.parseShift();
      while (['<','>','<=','>='].includes(this.peek()?.val)) { const op = this.eat().val; left = { t:'binary', op, left, right: this.parseShift() }; }
      return left;
    }
    parseShift() {
      let left = this.parseAdd();
      while (['<<','>>'].includes(this.peek()?.val)) { const op = this.eat().val; left = { t:'binary', op, left, right: this.parseAdd() }; }
      return left;
    }
    parseAdd() {
      let left = this.parseMul();
      while (['+','-'].includes(this.peek()?.val) && this.peek()?.type === 'OP') { const op = this.eat().val; left = { t:'binary', op, left, right: this.parseMul() }; }
      // handle PUNCT + and -
      while (['+','-'].includes(this.peek()?.val) && this.peek()?.type === 'PUNCT') { const op = this.eat().val; left = { t:'binary', op, left, right: this.parseMul() }; }
      return left;
    }
    parseMul() {
      let left = this.parseUnary();
      while (['*','/','%'].includes(this.peek()?.val)) { const op = this.eat().val; left = { t:'binary', op, left, right: this.parseUnary() }; }
      return left;
    }
    parseUnary() {
      if (this.peek()?.val === '!') { this.eat(); return { t:'unary', op:'!', expr: this.parseUnary() }; }
      if (this.peek()?.val === '-' && (this.peek()?.type === 'OP' || this.peek()?.type === 'PUNCT')) { this.eat(); return { t:'unary', op:'-', expr: this.parseUnary() }; }
      if (this.peek()?.val === '~') { this.eat(); return { t:'unary', op:'~', expr: this.parseUnary() }; }
      if (this.peek()?.val === '++') { this.eat(); return { t:'unary', op:'++', expr: this.parsePostfix() }; }
      if (this.peek()?.val === '--') { this.eat(); return { t:'unary', op:'--', expr: this.parsePostfix() }; }
      if (this.peek()?.val === '*') { this.eat(); return { t:'unary', op:'*', expr: this.parseUnary() }; }
      if (this.peek()?.val === '&') { this.eat(); return { t:'unary', op:'&', expr: this.parseUnary() }; }
      // Cast: (type)
      if (this.check('(') && this.isType(this.tokens[this.pos+1])) {
        this.eat(); // (
        let ct = '';
        while (!this.check(')')) ct += this.eat().val + ' ';
        this.eat(); // )
        return { t:'cast', castType: ct.trim(), expr: this.parseUnary() };
      }
      // sizeof
      if (this.check('sizeof')) {
        this.eat();
        this.expect('PUNCT','(');
        let ofType = '';
        while (!this.check(')')) ofType += this.eat().val;
        this.eat();
        return { t:'sizeof', ofType: ofType.trim() };
      }
      return this.parsePostfix();
    }
    parsePostfix() {
      let node = this.parsePrimary();
      while (true) {
        if (this.peek()?.val === '++') { this.eat(); node = { t:'unary', op:'post++', expr: node }; }
        else if (this.peek()?.val === '--') { this.eat(); node = { t:'unary', op:'post--', expr: node }; }
        else if (this.check('[')) {
          this.eat();
          const idx = this.parseExpr();
          this.eat(); // ]
          node = { t:'arr_access', name: node.v ?? node.name, index: idx };
        }
        else if (this.check('.') || (this.peek()?.val === '->')) {
          this.eat();
          const field = this.eat().val;
          node = { t:'member', name: node.v, field };
        }
        else break;
      }
      return node;
    }
    parsePrimary() {
      const t = this.peek();
      if (!t) return { t:'num', v:0 };
      if (t.type === 'NUMBER') { this.eat(); return { t:'num', v:t.val }; }
      if (t.type === 'CHAR')   { this.eat(); return { t:'num', v:t.val }; }
      if (t.type === 'STRING') { this.eat(); return { t:'str', v:t.val }; }
      if (t.type === 'ID') {
        // Keywords as values
        if (t.val === 'NULL') { this.eat(); return { t:'num', v:0 }; }
        if (t.val === 'true' || t.val === 'TRUE') { this.eat(); return { t:'num', v:1 }; }
        if (t.val === 'false'|| t.val === 'FALSE') { this.eat(); return { t:'num', v:0 }; }
        const name = this.eat().val;
        // Function call
        if (this.check('(')) {
          this.eat();
          const args = [];
          while (!this.check(')') && this.pos < this.tokens.length) {
            args.push(this.parseAssign());
            if (this.check(',')) this.eat();
          }
          if (this.check(')')) this.eat();
          return { t:'call', name, args };
        }
        return { t:'id', v:name };
      }
      if (t.val === '(') {
        this.eat();
        const expr = this.parseExpr();
        if (this.check(')')) this.eat();
        return expr;
      }
      this.eat();
      return { t:'num', v:0 };
    }
  }

  /* ── Public API ── */
  function run(sourceCode) {
    const output = [];
    let error = null;
    try {
      const preprocessed = preprocess(sourceCode);
      const tokens = tokenize(preprocessed);
      const parser = new Parser(tokens);
      const ast = parser.parseProgram();
      const interp = new Interpreter();
      // Register all function definitions first
      for (const node of ast) {
        if (node && node.t === 'fndef') interp.fns[node.name] = node;
      }
      // Find and run main
      let hasMain = false;
      for (const node of ast) {
        if (node && node.t === 'fndef' && node.name === 'main') {
          hasMain = true;
          try { interp.execFn(node, []); } catch(e) { if (e.__return === undefined) throw e; }
          break;
        }
      }
      // If no main, execute top-level expressions
      if (!hasMain) {
        for (const node of ast) {
          if (node && node.t !== 'fndef') interp.execStmt(node);
        }
      }
      return { ok: true, output: interp.output };
    } catch (e) {
      return { ok: false, output, error: e.message || String(e) };
    }
  }

  /* Syntax highlighter for display */
  function highlight(code) {
    const keywords = ['if','else','while','for','do','return','break','continue','switch','case','default','struct','enum','union','typedef','sizeof','static','extern','const','volatile','register','inline','void','int','char','short','long','float','double','unsigned','signed'];
    const types = ['uint8_t','uint16_t','uint32_t','uint64_t','int8_t','int16_t','int32_t','int64_t','size_t','bool','NULL','TRUE','FALSE'];
    let h = code
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      // strings
      .replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, '<span class="c-string">"$1"</span>')
      // chars
      .replace(/'(\\?.)'/, '<span class="c-string">\'$1\'</span>')
      // comments
      .replace(/(\/\/[^\n]*)/g, '<span class="c-comment">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="c-comment">$1</span>')
      // macros
      .replace(/(#\w+)/g, '<span class="c-macro">$1</span>')
      // numbers hex
      .replace(/\b(0x[0-9a-fA-F]+[UuLl]*)\b/g, '<span class="c-number">$1</span>')
      // numbers
      .replace(/\b(\d+[UuLl]*)\b/g, '<span class="c-number">$1</span>');
    // keywords
    for (const k of keywords) {
      h = h.replace(new RegExp(`\\b(${k})\\b`, 'g'), '<span class="c-keyword">$1</span>');
    }
    for (const t of types) {
      h = h.replace(new RegExp(`\\b(${t})\\b`, 'g'), '<span class="c-type">$1</span>');
    }
    return h;
  }

  return { run, highlight, TYPE_INFO };
})();
