function calculateUnitPrice(priceString, amountString) {

    let price = calculatePrice(priceString)
    let weight = calculateAmount(amountString).weight
    let weightType = calculateAmount(amountString).weightType

    let pricePerUnit = (price / weight)
    if (weightType == "lb") {
        return pricePerUnit.toFixed(2)
    }
    if (weightType == "oz") {
        return (pricePerUnit * 16).toFixed(2)
    }
}

function calculatePrice(priceString) {
    let index = priceString.indexOf("$")
    let price = Number(priceString.slice(index + 1))
    return price
}

function calculateAmount(amountString) {
    //some amount boxes have descriptions like "Each unit of Ground Beef (85/15) contains 2 x 1 lb packs" so we need to get around just choosing the first number for index
    if (amountString.includes(" x ")) {
        let index = amountString.indexOf(" x ")
        amountString = amountString.slice(index - 5, index + 9)
    }

    //What to do if "lb" is mentioned twice? Use the bigger of the 2
    let weight
        // let doubleLb = false
    if (amountString.includes("lb")) {
        let index = amountString.indexOf("lb")
        let lastIndex = amountString.lastIndexOf("lb")
        if (index == lastIndex) {
            amountString = amountString.slice(index - 6, index + 4)
        } else {
            doubleLb = true
            let amountStringFirst = amountString.slice(index - 6, index + 4)
            let amountStringLast = amountString.slice(lastIndex - 6, lastIndex + 4)
            amountStringFirst = sliceAndTight(amountStringFirst)
            amountStringLast = sliceAndTight(amountStringLast)

            amountStringFirst = amountStringFirst.slice(0, findIndexUnit(amountString, /l|o/))
            amountStringLast = amountStringLast.slice(0, findIndexUnit(amountString, /l|o/))
            if (amountStringFirst > amountStringLast) {
                amountString = amountStringFirst
            } else {
                amountString = amountStringLast
            }
        }
    }

    if (amountString.includes("oz")) {
        let index = amountString.indexOf("oz")
        amountString = amountString.slice(index - 10, index + 4)
    }

    if (amountString.includes("half-pound")) {
        amountString = "0.5lbs"
    }


    amountString = sliceAndTight(amountString);
    let weightType = ""
    if (amountString[findIndexUnit(amountString, /l|o/)] == "l") {
        weightType = "lb"
    }
    if (amountString[findIndexUnit(amountString, /l|o/)] == "o") {
        weightType = "oz"
    }

    amountString = amountString.slice(0, findIndexUnit(amountString, /l|o/))
    let multiplySymbolIndex
    let howMany
    let size
    if (amountString.includes("x")) {
        multiplySymbolIndex = findIndexUnit(amountString, /x/)
        howMany = Number(amountString.slice(0, multiplySymbolIndex))
        size = Number(amountString.slice(multiplySymbolIndex + 1))

        weight = howMany * size;
    } else {
        weight = Number(amountString)
    }

    return {
        weight: weight,
        weightType: weightType

    }
}

function findindex(str) {
    if (str.includes("$")) {
        let index = str.indexOf("$")
        str = str.slice(index + 2)
        let nums = str.match(/\d/);
        return str.indexOf(nums) + index + 2;
    } else {
        let nums = str.match(/\d/);
        return str.indexOf(nums);
    }
}

function findIndexUnit(str, regex) {
    let nums = str.match(regex);
    return str.indexOf(nums)
}

function sliceAndTight(str) {
    let amountIndex = findindex(str)
    return str.slice(amountIndex).replace(/\s+/g, '')
}


module.exports = {
    calculateUnitPrice: calculateUnitPrice,
    calculatePrice: calculatePrice,
    calculateAmount: calculateAmount,
    findindex: findindex,
    findIndexUnit: findIndexUnit,
    sliceAndTight: sliceAndTight,
}