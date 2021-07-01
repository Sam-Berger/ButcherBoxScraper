# ButcherBox Scraper

ButcherBox Scraper scrapes data from www.ButcherBox.com and updates a firebase database that is used in the ButcherBox Worth It Chrome Extension (https://github.com/Sam-Berger/ButcherBox-Chrome-Extension)

## Requirements

ButcherBox Scraper requires Node.js. Install this before moving forward. Installation info can be found here: https://nodejs.dev/learn/how-to-install-nodejs

## Dependencies

ButcherBox Scaper uses the Node packages Puppeteer (https://www.npmjs.com/package/puppeteer), Dotenv (https://www.npmjs.com/package/dotenv), and Firebase (https://www.npmjs.com/package/firebase). 

## Installation

1. Clone this repository to your local machine
2. Naviage the terminal to your local project folder and run the following:
```
$ npm install
```
This will install the three dependencies necessary for ButcherBox scraper to run. This may take a few minutes, Puppeteer requires Chromium to be downloaded, which is relatively large.

3. Set up an account with Firebase: https://firebase.google.com/
   * Create a new project.
   * Go to "Realtime Database" and create a new database. Choose to start in test mode.
   * From the Project Overview page, click "Add App", add a web app, After choosing a name, at "Add Firebase SDK" find the firebaseConfig code, which looks like this: 

    ```
    // Your web app's Firebase configuration
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
    var firebaseConfig = {
        apiKey: "AIzaSyC8Zq_v4fTh3Nj3Itjet-rvI8sZg7JBkHk",
        authDomain: "test-38480.firebaseapp.com",
        databaseURL: "https://test-38480-default-rtdb.firebaseio.com",
        projectId: "test-38480",
        storageBucket: "test-38480.appspot.com",
        messagingSenderId: "608745627597",
        appId: "1:608745627597:web:6e74d04190eacd8adc6e84",
        measurementId: "G-LZMF7N4W2Y"
    };
    ```
   * Copy this code into index.js over lines 7-16.
   * Optionally you can replace the apiKey with apiKey: process.env.API_KEY and paste the apikey into example.env 
    ```
    API_KEY=YOUR_API_KEY
    ```

4. Create an account with ButcherBox.com and put your login credentials in example.env, replacing these fields with your info.
```
BB_USERNAME=YOUR_USERNAME
BB_PASSWORD=YOUR_PASSWORD
```

5. Rename example.env to .env

## Usage

ButcherBox Scraper can be executed with:
```
node index.js
```

It is set up to first login and then direct to https://www.butcherbox.com/account/addons and https://www.butcherbox.com/account/deals. These are the only two pages with stand alone prices for items. 

## License
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MIT License

Copyright (c) 2021 Samuel Berger

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Things I learned with this project

* The basics of how scrapers work
* Puppeteer
* How to connect and save to Firebase
* How to work around node modules that don't work the way I want (In page.evaluate in Puppeteer, you cannot use functions defined outside of page.evaluate. My solution was to pull out the bare minimum and unfortunately why unDRY code)
* The importance of .gitignore
