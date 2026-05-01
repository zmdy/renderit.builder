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
[01-05-26 12:58] CREATE - Sprint 0.4 Renderer: Implemented src/core/Renderer.js using iterative approach for generating the final HTML string, including variable resolving and standard escaping. Completed E2E pipeline tests in tests/Renderer.test.js.
[01-05-26 13:15] CREATE - Sprint 1.1 AddonManager: Implemented src/core/AddonManager.js with local-first resolution, GitHub fallback with sessionStorage cache, template injection, and Magic Keys extraction. Added comprehensive test suite in tests/AddonManager.test.js.
[01-05-26 16:42] CREATE - Sprint 1.3 StaticMode: Implemented src/modes/StaticMode.js to orchestrate the entire build pipeline for multi-page projects, routing pages properly (slug/index.html). Added utilities AssetScanner.js, SeoGenerator.js (robots, sitemap, llms.txt, .htaccess), and ZipBuilder.js. Wrote node:test E2E cases simulating JSZip.
[01-05-26 16:55] CREATE - Sprint 1.2 SampleGenerator & DesignSystem: Implemented src/utils/SampleGenerator.js to build base JSON data from template tokens, resolving deep paths and handling split-page format. Implemented src/utils/DesignSystem.js for validating and mocking the complex design schema. Fully tested.
[01-05-26 16:58] FIX - Sprint 1.3 Audit: Fixed AssetScanner.js regex to include .pdf and .woff2 extensions. Fixed SeoGenerator.generateLlmsTxt to include baseUrl and page list (## Pages section). Updated StaticMode.js to pass siteUrl and pages to generateLlmsTxt. Updated tests accordingly.
[01-05-26 17:14] CREATE - Sprint 1.4 LiveMode: Implemented src/modes/LiveMode.js orchestrating the live build pipeline with data-renderit-zone detection, Base64 template encoding and loading placeholder injection. Added src/live/renderit-live.js (4.6KB inline renderer with lazy IntersectionObserver hydration) and src/live/sw.js (stale-while-revalidate Service Worker). Covered by tests/LiveMode.test.js.
