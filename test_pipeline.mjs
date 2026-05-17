import { extractZonesBeforeRender, restoreEncodedZones } from './src/modes/LiveMode.js';
import { AddonManager } from './src/core/AddonManager.js';
import { tokenize } from './src/core/Lexer.js';
import { parse } from './src/core/Parser.js';
import { render } from './src/core/Renderer.js';
import fs from 'fs';

(async () => {
  const html = fs.readFileSync('../renderit.themes/themes/minifood/minifood_menu.html', 'utf8');
  const addonManager = new AddonManager({ addonsDir: '../renderit.themes/addons' });
  const data = {};

  const { templateWithPlaceholders, zoneMap } = await extractZonesBeforeRender(html, addonManager);
  
  const staticShell = await addonManager.resolveAndInject(templateWithPlaceholders, data);
  const tokens = tokenize(staticShell);
  const ast = parse(tokens);
  const rawHtml = render(ast, { data });
  
  const htmlWithZones = restoreEncodedZones(rawHtml, zoneMap);
  console.log("CONTAINS ZONE?", htmlWithZones.includes('data-renderit-zone'));
  console.log("ZONE HTML:", htmlWithZones.match(/<section id="menu"[^>]+>/));
})();
