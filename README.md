![Renderit.builder Logo](./assets/images/logo-renderit-builder.png)

Renderit.builder is a static site rendering engine built with Vanilla JS. It takes an HTML template with __Magic Tags__ and a JSON content file, and renders static sites with native SEO, zero dependencies, and a 100/100 score on Lighthouse.

The processing cost occurs **at build time**, not when the user accesses the site.

![JS Badge](https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=for-the-badge&logo=JavaScript&logoColor=black)
![GPLv3 Badge](https://img.shields.io/badge/GPLv3-BD0000.svg?style=for-the-badge&logo=GPLv3&logoColor=white)

> Static code is the perfect end state of the web. Management should be as dynamic as a thought.

## Operation Modes

1) Static Mode
Renderit.builder generates a `.zip` file, containing all static assets necessary to website work. It's the fastest and safest way os delivering websites. Ideal for simple websites and landing pages, with few in-time changes.

2) Live Mode
The site is partialy static, but consumes real-time data via .json or API calls. Ideal for stores, like restaurants, clothe-stores and business with lots of in-time changes (prices, descriptions, etc).

3) Manager Modo
Allows the edition of Static and Live websites in a dashboard, using a backend (PHP or ASP) bridge-file