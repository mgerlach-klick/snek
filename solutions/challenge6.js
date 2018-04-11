var request = require("request")
var r = require("ramda")
var assert = require('assert')

var WIDTH = 25
var HEIGHT = 25
var BACKGROUND_COLOR = "#6495ed"

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
    return toGridmap(grid)
}

// this function has seen the greatest improvement from the data structure refactoring!
// We can now simply merge the two gridmaps to easily 'overwrite' pixels
var createWorld = (world, snake, apple) => {
    //merge all the things together
    var w = r.is(Array, world) ? toGridmap(world) : world
    var s = r.is(Array, snake) ? toGridmap(snake) : snake
    var a = toGridmap([apple])

    var newWorld = r.mergeAll([w,s,a])
    return newWorld
}

var getCoordinate = (px) => px.x + " " + px.y // get an easily comparable "identity" of a pixel

var isSameCoordinate = (p1,p2) => getCoordinate(p1) == getCoordinate(p2)

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

var readArrowKeys = r.partial(readOneInputChar, [["left", "right", "up", "down", "c"]])

var calculateNewHead = (direction, pixel) => {
    assertIsObject(pixel)

    var {x, y, color} = pixel

    switch(direction) {
    case "left": return makePixel( x-1, y,color )
    case "right": return makePixel( x+1, y, color )
    case "up": return makePixel( x, y-1, color )
    case "down": return makePixel( x, y+1, color )
    case "c": return process.exit()

    default: throw("That is a direction we don't support!") // should never happen!
    }
}

var snakeHead = (snake) => r.head(snake)

var moveSnake = (direction, snake, apple) => {
    var newSnakeBody = r.dropLast(1, snake)
    var oldSnakeHead = snakeHead(snake)
    var newSnakeHead = calculateNewHead(direction, oldSnakeHead)
    var snakeAteApple =  isSnakeEatsApple(snake, direction, apple)
    var newSnake = snakeAteApple ? r.concat([newSnakeHead], snake) : r.concat([newSnakeHead], newSnakeBody)
    var world = makeBackground(BACKGROUND_COLOR)
    var newApple = snakeAteApple ? placeApple(newSnake, world) : apple
    var newWorld = createWorld(world, newSnake, newApple)
    return [newSnake, newApple, newWorld]
}

var isSnakeEatsApple = (snake, direction, apple) => {
    var head = calculateNewHead(direction, snakeHead(snake))
    return isSameCoordinate(head, apple)
}


var isSnakeRunsIntoWall = (snake, direction) => {
    var head = calculateNewHead(direction,snakeHead(snake))
    return head.x < 0 || head.x >= WIDTH || head.y < 0 || head.y >= HEIGHT
}

var isSnakeEatsItself = (snake, apple, direction) => {
    var [newSnake, newApple, newWorld] = moveSnake(direction, snake, apple)

    // if the new head has the same coordinates as any of the tail pixels, the snake ate itself!
    var snakeCoords = r.map(getCoordinate, newSnake)
    var head = r.head(snakeCoords)
    var tail = r.tail(snakeCoords)
    return r.any(r.equals(head), tail)
}

var isGameOver = (snake, apple, direction) => {
    const areAnyTrue = r.any(r.equals(true)) // remember that ramda auto-curries, so it's perfectly fine to only provide *some* of the arguments
    return areAnyTrue([ isSnakeEatsItself(snake, apple, direction)
                       , isSnakeRunsIntoWall(snake, direction)])
}

var placeApple = (snake, world) => {
    // find all the places in the world where the snake is not
    var comparatorFn = (x,y) => getCoordinate(x) == getCoordinate(y) // we need to compare positions without caring what colour that pixel is
    var worldArray = fromGridmap(world)
    var placesWithoutSnek = r.differenceWith(comparatorFn, worldArray, snake) //http://ramdajs.com/docs/#differenceWith

    // pick one of these places to place the apple
    var randNth = (arr) => arr[Math.floor(Math.random() * arr.length)] // get me a random element from an array
    var applePixel = randNth(placesWithoutSnek)

    // put the apple there!
    var makeApple = (pixel) => {
        pixel.color = "#FFFF00"
        return pixel
    }

    var apple = makeApple(applePixel)
    return apple
}


function moveAndDisplaySnakeOnKeypress(snake, apple, direction) {
    var newSnake = null // this is a bit of hack, I apologize. On the other hand we end up with a nice, recursive, asynchronous function!
    if(direction) { // this is so we can call this function initially.
        if (isGameOver(snake, apple, direction))
            throw "GAME OVER! You suuuuuck!!!" // This is not a good solution but it works for now!
        var [newSnake, newApple, newWorld] = moveSnake(direction, snake, apple)
        var displayGridmap = gm => makeRequest(fromGridmap(gm))
        displayGridmap(newWorld)
    }
    readArrowKeys(r.partial(moveAndDisplaySnakeOnKeypress, [newSnake ? newSnake : snake, newApple ? newApple : apple]))
}

function main(){
    var initialSnake = [makePixel(12,12,"#00ff00"), makePixel(11,12,"#00ff00"), makePixel(10,12,"#00ff00")]
    var world = makeBackground(BACKGROUND_COLOR)
    var apple = placeApple(initialSnake, world)
    var nextWorld = createWorld(world, initialSnake, apple)
    makeRequest(fromGridmap(nextWorld))
    console.log("use your arrow keys to move the pixel: ")
    console.log("press 'c' to exit")
    moveAndDisplaySnakeOnKeypress(initialSnake, apple, null)
}

main() // GO GO GO!
