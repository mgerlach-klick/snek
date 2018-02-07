var request = require("request")
var r = require("ramda")
var assert = require('assert')

var WIDTH = 25
var HEIGHT = 25

// I ended up using these functions in multiple places so I factored them out
var assertIsArray = x => assert(r.is(Array, x))
var assertIsObject = x => assert(r.is(Object, x))

var makePixel = (x,y,color) => {
   return {"x": x, "y": y, "color": color}
}


// this functionality is easy to express as a list, so I'm leaving it like this
var makeBackground = color => {
    var grid = []
    for(x of r.range(0,WIDTH))
        for(y of r.range(0,HEIGHT))
            grid.push(makePixel(x,y,color))
    return grid
}

var makeBlueBackground = r.partial(makeBackground, ["#6495ed"])

// this function has seen the greatest improvement from the data structure refactoring!
// We can now simply merge the two gridmaps to easily 'overwrite' pixels
var fillBackground = (color, pixels) => {
    var background = toGridmap(makeBackground(color))
    var pixelMap = toGridmap(pixels)
    return r.merge(background, pixelMap)
}

var getCoordinate = (px) => px.x + " " + px.y // get an easily comparable "identity" of a pixel

// it would be nicer if this worked without mutation, but that isn't
// straightforward in javascript. Since this function gets called from within a
// function that makes a copy of the original datastructure, we are okay with
// this
var setPixel = (grid, pixel) => {
    assertIsObject(grid)
    grid[getCoordinate(pixel)] = pixel
    return grid
}


var toGridmap = pixels => {
    assertIsArray(pixels)

    var grid = r.reduce(
        (grid, pixel) => setPixel(grid, pixel)
        , {}
        , pixels
    )

    return grid
}

var fromGridmap = grid => {
    assertIsObject(grid)

    var pixels = r.reduce(
        (acc, coord) => {
            acc.push(grid[coord])
            return acc
        }
        , []
        , Object.keys(grid)
    )

    return pixels
}

var makeRequest = pixels => {
    assertIsArray(pixels)
    var reqObj = {url: "http://localhost:5000/"
                  ,method: "POST"
                  ,json: {cells: pixels}
                 }
    request(reqObj)
}


// this function is a little tricky, especially since listeners persist.
// This becomes an issue if we don't want to have a global listener and instead want to
// just functionally 'read a key and do a thing'!
var readOneInputChar = (allowedInputs, cb) => {
    const readline = require('readline');
    readline.emitKeypressEvents(process.stdin);

    function keyHandler(str, key) { // we name our function so we don't attach it multiple times!
        if (key && r.contains(key.name, allowedInputs)){ // only listen for specific keys
            process.stdin.removeListener('keypress', keyHandler) //remove yourself, otherwise we attach a bunch of listeners!
            cb(key.name)
        }
    }
    process.stdin.setRawMode(true);
    process.stdin.on('keypress', keyHandler );
}

var readArrowKeys = r.partial(readOneInputChar, [["left", "right", "up", "down"]])

// calculate a new pixel position from a direction input and a current pixel
var calculatePixelPos = (direction, pixelPos) => {
    assertIsArray(pixelPos)
    assert(pixelPos.length == 2)

    var [x, y] = pixelPos

    switch(direction) {
    case "left": return [x-1, y]
    case "right": return [x+1, y]
    case "up": return [x, y-1]
    case "down": return [x, y+1]
    default: throw("That is a direction we don't support!")
    }
}

var movePixel = (direction, pixelPos) => {
    var background = toGridmap(makeBlueBackground()) // we just assume a blue background here!
    var [newX, newY]= calculatePixelPos(direction, pixelPos)
    var newPixel = makePixel(newX, newY, "#ff0000")
    var newState = setPixel(background, newPixel)
    return [[newX, newY], newState]
}

var displayGridmap = gm => makeRequest(fromGridmap(gm))

function moveAndDisplayPixelOnKeypress(pixelPos, direction) {
    var newPos = null // this is a bit of hack, I apologize. On the other hand we end up with a nice, recursive, asynchronous function!
    if(direction) { // this is so we can call this function initially.
        console.log(direction,"=>", pixelPos)
        var [newPos, world] = movePixel(direction, pixelPos)
        displayGridmap(world)
    }
    console.log("use your arrow keys to move the pixel: ")
    readArrowKeys(r.partial(moveAndDisplayPixelOnKeypress, [newPos ? newPos : pixelPos]))
}

makeRequest(fromGridmap(fillBackground("#6495ed", [makePixel(12,12,"#00ff00")])))
moveAndDisplayPixelOnKeypress([12,12], null)

// ============ Tests ===============

var test_toGridmap = _ => {
    console.log("it should return a map")
    var gridMap = toGridmap([])
    assert.deepEqual(gridMap ,{})

    console.log("it should work for one element")
    let pixel = makePixel(0,0,0)
    let pixels = [pixel]
    let grid = toGridmap(pixels)
    assert.deepEqual(grid, {"0 0": pixel})
}

var test_fromGridmap = _ => {
    console.log("it should produce the right map")
    let pixels = [makePixel(0,0,0), makePixel(1,1,1), makePixel(2,2,3)]

    console.log("it should roundtrip")
    assert.deepEqual(pixels, fromGridmap(toGridmap(pixels)))
}

// This only works when executing these tests in a node console. You probably don't want to do this but use a proper test runner!
var runtests = () => {
    console.log("Running tests")

    var g = global
    var symbols = Object.keys(g)
    var testNames = r.filter(sym => sym.startsWith("test_"), symbols)
    var successful = 0
    var failed = 0

    testNames.forEach(testN => {
        try {
            let test = g[testN]
            test()
            console.log(testN+": ✓")
            successful++;
        } catch (ex) {
            console.log(testN+": ✗✗✗")
            console.log(ex.message)
            failed++;
        } finally {
            console.log("---")
            console.log("Successful: "+successful)
            console.log("failed: "+failed)
        }
    })
}
