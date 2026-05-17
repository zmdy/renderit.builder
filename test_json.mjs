import fs from 'fs';
const html = fs.readFileSync('../renderit.themes/themes/minifood/minifood_menu.html', 'utf8');
const zonePattern = /data-renderit-zone="([^"]+)"[^>]*data-renderit-src="([^"]+)"|data-renderit-src="([^"]+)"[^>]*data-renderit-zone="([^"]+)"/gi;
let match;
while ((match = zonePattern.exec(html)) !== null) {
  console.log("MATCH:", match[1] || match[4], match[2] || match[3]);
}
