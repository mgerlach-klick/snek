var request = require("request")
var r = require("ramda")

var WIDTH = 25
var HEIGHT = 25

var makePixel = (x,y,color) => {
   return {"x": x, "y": y, "color": color}
}


var makeBackground = color => {
    var grid = []
    for(x of r.range(0,WIDTH))
        for(y of r.range(0,HEIGHT))
            grid.push(makePixel(x,y,color))
    return grid
}

var removePixels = (grid, pixels) => {
    assert(r.is(Array, grid))
    assert(r.is(Array, pixels)) //this bit me while testing, so it may bite someone else too!

    var getCoordinate = (px) => px.x + " " + px.y // get an easily comparable "identity" of a pixel
    var coordinates = r.map(getCoordinate, pixels)
    var containsNot = r.complement(r.contains)

    var backgroundPixels = r.filter(px => {
        let pxCoord = getCoordinate(px)
        return containsNot(pxCoord, coordinates) //filter out pixels with coordinates already in the non-background pixels
    }, grid)

    return backgroundPixels
}

var fillBackground = (color, pixels) => {
    var background = makeBackground(color)
    var backgroundWithoutPixels = removePixels(background,pixels)
    return r.concat(backgroundWithoutPixels, pixels)
}

var makeRequest = pixels => {
    var reqObj = {url: "http://localhost:5000/"
                  ,method: "POST"
                  ,json: {cells: pixels}
                 }
    request(reqObj)
}

 makeRequest(fillBackground("#6495ed", [makePixel(12,12,"#ff0000")]))
