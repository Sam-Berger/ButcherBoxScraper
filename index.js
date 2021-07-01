const puppeteer = require("puppeteer");
const calculations = require("./calculations")
require('dotenv').config();

const firebase = require("firebase")

//This is the config code for my Firebase realtime database.
//Replace this to change to a different Firebase database
const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: "butcherbox-scraper.firebaseapp.com",
    projectId: "butcherbox-scraper",
    storageBucket: "butcherbox-scraper.appspot.com",
    messagingSenderId: "775652181812",
    appId: "1:775652181812:web:3a0893f62421e085ca0761",
    measurementId: "G-R64JQ27X4K"
};

firebase.initializeApp(firebaseConfig);

// //save data to firebase
let database = firebase.database()

let ref = database.ref('products')

//this function is the workhorse of this project. It navigates a headless browser to log in to Butcherbox.com
//Once there, it pulls from the HTML the name, description, and price string of every item available.
async function scrape() {
    //set headless to true to not launch a UI of Chromium. Set to false to follow the function's progress
    const browser = await puppeteer.launch({ headless: false })
    const page = await browser.newPage()
    await page.goto(process.env.LOGIN_PAGE)
    await page.waitForSelector("#username")
    await page.waitForTimeout(5000);

    await page.type("#username", process.env.BB_USERNAME)
    await page.type("#password", process.env.BB_PASSWORD)
    await page.click("button")
    await page.waitForTimeout(10000);

    await page.goto(process.env.DEALS_PAGE, {
        waitUntil: ['domcontentloaded', 'networkidle0']
    })

    const grabDealPrices = await page.evaluate(() => {

        let parentClass = "css-1swbghd"
        let nameClass = "css-1g1weue"
        let amountClass = "css-51ry97"
        let priceClass = "css-t6djce"
        let products = document.getElementsByClassName(parentClass);
        let allProductInfo = []
        for (let i = 0; i < products.length; i++) {
            if (products[i].getElementsByClassName(nameClass).length > 0 && products[i].getElementsByClassName(priceClass).length > 0) {

                productInfo = {}
                let productName = products[i].getElementsByClassName(nameClass)[0].textContent;
                let amountString = products[i].getElementsByClassName(amountClass)[0].textContent;
                let priceString = products[i].getElementsByClassName(priceClass)[0].textContent;

                productInfo.name = productName
                productInfo.priceString = priceString
                productInfo.amountString = amountString
                allProductInfo.push(productInfo)
            }
        }
        return allProductInfo
    });

    await page.waitForTimeout(10000);
    let dealsArray = grabDealPrices
    await page.goto(process.env.ADDONS_PAGE, {
        waitUntil: ['domcontentloaded', 'networkidle0']
    })
    const grabAddOnPrices = await page.evaluate(() => {

        const productNames = document.getElementsByClassName("css-1s1lv4r")
        const amountString = document.getElementsByClassName("css-13rzl1b")
        const priceString = document.getElementsByClassName("css-1jiogkd")
        const data = [];
        for (let i = 0; i < productNames.length; i++) {
            let object = {}
            object = {
                name: productNames[i].textContent,
                amountString: amountString[i].textContent,
                priceString: priceString[i].textContent
            }
            data.push(object)
        }
        return data

    });
    await page.waitForTimeout(20000);
    let addOnArray = grabAddOnPrices

    combinedArray = removeDuplicates(dealsArray, addOnArray)

    await browser.close()
    console.log(combinedArray)
    return combinedArray
}

//Sometimes the same item will be present in both /deals and /addons. They are often the same price
//however sometimse the differ, and for the sake of comparison we only want one of these moving to the database.
//This function removes duplicates.
function removeDuplicates(dealsArray, addOnArray) {
    for (let i = 0; i < dealsArray.length; i++) {
        for (let j = 0; j < addOnArray.length; j++) {
            if (dealsArray[i].name.trim() == addOnArray[j].name.trim()) {

                let dealsPrice = calculations.calculatePrice(dealsArray[i].priceString)
                let addOnPrice = calculations.calculatePrice(addOnArray[j].priceString)
                let bestPrice = Math.min(dealsPrice, addOnPrice)

                let object = {
                    name: addOnArray[j].name.trim(),
                    amountString: addOnArray[j].amountString,
                    priceString: "$" + bestPrice
                }
                dealsArray.splice(i, 1, object)
                addOnArray.splice(j, 1)
            }

        }
    }

    combinedArray = addOnArray.concat(dealsArray)

    return combinedArray
}

//This function processes the data that has been scraped and turns it into an object with all the field needed
//for comparison in the ButcherBox Worth It Chrome Extension. 
async function populateDataTable() {
    const objectsArray = [];
    let scrapedData = await scrape()
    for (let i = 0; i < scrapedData.length; i++) {

        scrapedData[i].noWhiteSpaceName = (scrapedData[i].name).replace(/\s+/g, '')
        scrapedData[i].fullPrice = calculations.calculatePrice(scrapedData[i].priceString);

        //some product descriptions do not contain weight info. If this is the case 
        //we manually set the weight to 10000 so it can be processed later. Firebase does not like NaN.
        if (isNaN(calculations.calculateAmount(scrapedData[i].amountString).weight)) {
            scrapedData[i].weight = 10000
        } else {
            scrapedData[i].weight = calculations.calculateAmount(scrapedData[i].amountString).weight
        }

        scrapedData[i].weightType = calculations.calculateAmount(scrapedData[i].amountString).weightType
        scrapedData[i].active = true;

        objectsArray.push(scrapedData[i])

        if (scrapedData[i].name == "Boneless Skinless Breast" || scrapedData[i].name.includes("ButcherBox")) {
            processNameExceptions(scrapedData[i])
            objectsArray.push(scrapedData[i])

        }
    }

    return objectsArray
}

//Butcherbox is not consistent with their product names. 
//For example, some things are plural in one place "Chicken Breast" and plural elsewhere "Chicken Breasts."
//This makes comparison impossible, so this function deals with that so later comparison is possible.
function processNameExceptions(dataObject) {
    if (dataObject.name == "Boneless Skinless Breast") {
        dataObject.name = "Boneless Skinless Breasts"
        dataObject.noWhiteSpaceName = "BonelessSkinlessBreasts"

    }
    if ((dataObject.name).includes("ButcherBox")) {
        dataObject.name = dataObject.name.slice(11)
        dataObject.noWhiteSpaceName = dataObject.name.replace(/\s+/g, '')

    }
}

//This function matches newly scraped items with the database. If this is a new product, it is added
//If this is a product from before it updates the database
//If someone used to be available but is no longer it sets it to be inactive.
async function updateDatabase(scrapedArray) {
    ref.once('value', (snapshot) => {
        const databaseKeyValue = snapshot.val()
        const databaseArray = []
        const databaseArrayNames = []
        const addArrayNames = []
        const addArray = []
        const inDatabaseAndScrapedArray = []

        for (let key in databaseKeyValue) {
            databaseKeyValue[key].key = key
            databaseArray.push(databaseKeyValue[key])
        }
        for (let element of databaseArray) {
            databaseArrayNames.push(element.name)
        }

        for (let element of scrapedArray) {
            if (databaseArrayNames.includes(element.name)) {
                inDatabaseAndScrapedArray.push(element.name)
                let index = databaseArrayNames.indexOf(element.name)
                databaseArrayNames.splice(index, 1)
            } else {
                addArrayNames.push(element.name)
            }
        }
        //add new items
        for (let i = 0; i < addArrayNames.length; i++) {
            for (let j = 0; j < scrapedArray.length; j++) {
                if (addArrayNames[i] == scrapedArray[j].name) {
                    addArray.push(scrapedArray[j])
                    ref.push(scrapedArray[j])

                }
            }
        }

        //update items that are database but also currently active
        for (let i = 0; i < inDatabaseAndScrapedArray.length; i++) {
            for (let j = 0; j < databaseArray.length; j++) {
                if (inDatabaseAndScrapedArray[i] == databaseArray[j].name) {
                    let key = databaseArray[j].key
                    updateRef = ref.child(key)
                    updateRef.update({
                        active: true,
                        fullPrice: databaseArray[j].fullPrice
                    })

                }
            }
        }

        //moves items that were active but are no longer on sale into inactive
        for (let i = 0; i < databaseArrayNames.length; i++) {
            for (let j = 0; j < databaseArray.length; j++) {
                if (databaseArrayNames[i] == databaseArray[j].name) {
                    let key = databaseArray[j].key
                    updateRef = ref.child(key)
                    updateRef.update({
                        active: false
                    })
                }
            }
        }
    })
}

//this function puts everything together so the database is updated with the live scraped data.
async function run() {
    let objectsArray = await populateDataTable()
    console.log("done")
    updateDatabase(objectsArray)
}

run()