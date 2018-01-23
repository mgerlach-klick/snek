var assert = require('assert');

// i just want my functions in here. Is this so hard, mocha?!?
var fs = require("fs")
eval(fs.readFileSync('challenge2.js')+'');

describe('toGridmap', _ => {
    it("should return a map ", done => {
        var gridMap = toGridmap([])
        assert.deepEqual(gridMap ,{})
        done()
    })

    it("should work for one element", () => {
        let pixel = makePixel(0,0,0)
        let pixels = [pixel]
        let grid = toGridmap(pixels)
        assert.deepEqual(grid, {"0 0": pixel})
    })
})
