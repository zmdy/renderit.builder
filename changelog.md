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
[01-05-26 17:19] FIX - Sprint 1.4 Audit: Fixed renderit-live.js to use data-renderit-template attribute (was data-template), split zone hydration into eager (Promise.all) and lazy (IntersectionObserver for data-renderit-lazy). Fixed LiveMode.js to emit data-renderit-template. Updated tests accordingly.
[01-05-26 17:42] CREATE - Sprint 1.5 Manager Mode: Implemented src/modes/ManagerMode.js with post-render HTML annotation. Added src/utils/HtmlAnnotator.js for injecting renderit_manager_area attributes and src/utils/BridgeGenerator.js for generating secure bridge files (bridge.php, bridge.asp, .bridge.env) with crypto-secure secrets. Added automatic fetch of remote editor files. Covered by tests/ManagerMode.test.js.
[01-05-26 17:48] UPDATE - Sprint 1.5.1 Refinement: Enhanced src/utils/HtmlAnnotator.js to support attribute-specific suffixes (e.g., renderit_manager_area_src) for variables inside HTML attributes, ensuring full compliance with the technical specification. Updated tests accordingly.
[01-05-26 18:24] FIX - Sprint 1.1 Audit: Implemented external JSON loading for addons via src attribute in AddonManager.js. Extracted addon detection logic to src/utils/AddonScanner.js. Updated all build modes to pass dataContext. Added regression tests.
[01-05-26 18:50] CREATE - Sprint 2.0 UI Base: Established the index.html structure as the foundation for Phase 2. Updated CDNs (CodeMirror 5.65.16, DOMPurify), linked builder.css, and refactored layout with app-header, wizard-container, and app-footer. Integrated step indicators and navigation controls.
[01-05-26 18:55] CREATE - Sprint 2.0.5 Wizard Shell: Created wizard/config.js and wizard/wizard.js to handle initial application state and navigation. Finalized index.html cleanup and script integration.
[01-05-26 19:10] CREATE - Sprint 2.0.2 UI Styles: Implemented assets/css/builder.css with design tokens, component-specific styles (dropzone, cards, preview), premium animations, and responsive media queries.
[01-05-26 19:15] CREATE - Sprint 2.0.3 Wizard Config: Implemented wizard/config.js with global constants, repository URLs, and wizard step definitions.
[01-05-26 19:25] CREATE - Sprint 2.0.4 Wizard Controller: Implemented wizard/wizard.js as the main UI orchestrator. Added global state management, step-by-step navigation logic, and automatic UI updates for indicators and navigation controls.
[01-05-26 19:35] CREATE - Sprint 2.1 Step 1 Mode: Implemented wizard/steps/step-1-mode.js with interactive mode selection cards. Integrated selection logic with global state and dynamic footer navigation controls.
[01-05-26 20:00] FIX - UI Refinement: Exported updateNavButtons in wizard.js and centered wizard-container content in index.html for better UX.
[01-05-26 20:25] CREATE - Sprint 2.2 Step 2 Template: Implemented wizard/steps/step-2-template.js with drag-and-drop ingestion for files and folders. Added real-time addon auditing using AddonScanner and automatic fetch-based status verification.
[01-05-26 20:35] CREATE - Sprint 2.3 Step 3 Sample: Implemented wizard/steps/step-3-sample.js. Added dynamic JSON scaffold generation using SampleGenerator, CodeMirror preview in read-only mode, and download actions.
[01-05-26 20:45] CREATE - Sprint 2.4 Step 4 Data: Implemented wizard/steps/step-4-data.js. Added dual-mode data entry (JSON Upload vs Visual Editor), dynamic form generator, deep-merge logic for multiple JSONs, and real-time field synchronization.
[01-05-26 20:50] CREATE - Sprint 2.4.2 JsonEditor: Implemented wizard/json-editor/JsonEditor.js. Added recursive rendering for complex objects, dynamic array management (Add/Remove/Move), and a modal-based Design System editor with tabbed interface.
[01-05-26 21:00] CREATE - Sprint 2.4.3 Design Modal: Polished Design System modal with specialized controls for Google Fonts, color swatches, and guidelines. Refactored JsonEditor.js to comply with 40-line function rule and improved state synchronization.
[01-05-26 21:30] CREATE - Sprint 2.5 Step 5 Build: Finalized Wizard Phase 2. Implemented wizard/steps/step-5-build.js with real-time build logs, progress tracking, sandboxed iframe preview, and ZIP export integration using JSZip. Integrated all steps into wizard.js routing.
