# Renderit.builder - changelog

Pattern to be followed
[DD-MM-YY hh:mm] CHANGE_TYPE - Description

CHANGE_TYPE --> CREATE, DELETE, UPDATE, FIX, REFACTOR, etc...

Example
[01-01-2026 10:00] UPDATE - Minor improvents in the file XPTO.css

---

## Start bellow here

[01-05-26 12:10] CREATE - Sprint 0.1 Scaffolding: Setup project folder structure, created src/core/types.js with JSDoc and Error classes, and generated 18 test fixtures.
[01-05-26 12:17] CREATE - Sprint 0.2 Lexer: Implemented src/core/Lexer.js to tokenize template strings into flat arrays, and added comprehensive native node:test suite in tests/Lexer.test.js.
[01-05-26 12:22] CREATE - Sprint 0.3 Parser: Implemented src/core/Parser.js to construct an AST from lexer tokens, complete with tree hierarchy for loops and conditions, throwing precise ParseErrors, and added corresponding node:test cases.
