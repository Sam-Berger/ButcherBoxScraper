This scraper pulls data from www.ButcherBox.com and updates a firebase database that is used in my ButcherBox price 



What I learned in this project:

The basics of how scrapers work
Puppeteer
How to connect and save to Firebase
How to work around node modules that don't work the way I want (In page.evaluate in Puppeteer, you cannot use functions defined outside of page.evaluate. My solution was to pull out the bare minimum and unfortunately why unDRY code)
The importance of .gitignore