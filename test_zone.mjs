import { extractZonesBeforeRender } from './src/modes/LiveMode.js';
import fs from 'fs';
const html = fs.readFileSync('../renderit.themes/themes/minifood/minifood_menu.html', 'utf8');
extractZonesBeforeRender(html).then(res => {
  console.log('ZONE MAP KEYS:', Object.keys(res.zoneMap));
});
