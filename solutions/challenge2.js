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

makeRequest(fromGridmap(fillBackground("#6495ed", [makePixel(12,12,"#00ff00")])))



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
