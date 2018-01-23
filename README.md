# Snek

## Introduction

Welcome to Snek! We will implement parts of this game:

![I spent a lot of my high school years doing this](assets/snek-nokia.gif)

The challenge will be to implement the game in a functional manner. To reiterate, functional means to keep functions as pure as possible, i.e. to have no side-effects in them.

I won't tell you what code to write, but we will break the implementation down into bite-sized mini goals. This will teach you how to build up an implementation from the bottom up, and to slowly evolve it into the final project.

Feel free to use this project to learn a new programming language. Maybe you want to give Python or Ruby a try. Maybe you'd like to see why Max keeps raving about Clojure. Or maybe you just want to learn to program functionally in an- environment you're already confident in and you decide to write it in JS/Node. All of these are fine! I will provide some ES6/Node example solutions in the `solutions` folder, but if there is any way at all, try not to look at them!

## Requirements

### MacOS

The easiest way to get the UI is to download <https://s3.amazonaws.com/max.public/GoLUIServer.app.zip>.

This was originally used to implement the Game of Life but it perfectly suited for any type of pixel-based cross-platform representation.


### Linux/Windows

To get started, install a Java runtime.

Then download the canvas we will draw on get: <https://s3.amazonaws.com/max.public/GameOfLifeUIServer.jar>

This was originally used to implement the Game of Life but it perfectly suited for any type of pixel-based cross-platform representation.
You can start it by double-clicking the `GameOfLifeUIServer.jar` file. It will then open a window.


## GameOfLifeUIServer usage
The GameOfLifeUIServer exposes a REST api on `http://localhost:5000`. It only supports one command: A `POST` to `/`. This post sets one or more pixels at specific coordinates to a certain colour. A pixel is defined as a JSON object with the values `x`,`y`, and `color`. X and Y are integers (0/0 is the upper left corner), and `color` is a CSS hex color string such as `#ff0000`. The `POST` expects a JSON object with the key `cells` that has the value of an array of pixel objects. By default the grid displayed has 25x25 pixels.

This may sound a little hard, but it's easy when you try it. Start the UI Server and run this in a console:

```sh
 curl -H "Content-Type: application/json" -X POST -d '{"cells":[{"x":3,"y":0,"color":"#ff0000"}]}' http://localhost:5000/
```

This should turn the 4th pixel in the first row red! Once this works, head on to the challenges

## Functional Programming Guidelines
Try to follow these guidelines for your application:

- Keep the core functions - especially those involving business logic - pure

- Push state manipulations to the very boundaries of your application

- Your main functions should simply pipe data through your pure functions

- Keep your functions short


# Challenges

## Challenge 1

- Write a program that does the same thing as the `curl` call from the *GameOfliveUIServer usage* section. Feel free to use a different colour or position!

If you're doing this on NodeJS, I have good experience with the [request module](https://github.com/request/request). Make sure not to post this as form encoded and to send the right content-type!

- Now refactor your program into a function that takes any number of pixels and displays them. A pixel is a JSON structure with an `x`, a `y` and a `color`, like this: `{"x":3,"y":0,"color":"#ff0000"}`. Extra brownie points if you make it easy to just pass a single pixel as well.

- Write a function that takes a number of pixels, and a background colour, and returns a full grid of pixels of the specified background color, plus the initially specified pixels.
As an example, calling something like `sendToUI(fillBackground("#ffffff", [{x:0,y:0,"#ff0000"}]))` should fill the whole grid with white pixels and only the top-left most pixel should be red.

> **Note**: Please note that in my hypothetical `fillBackground` function we give the background colour first, and the arguments that change more often last. This is by design and a typical pattern in functional programming; it allows me to create a convenience function through partial application, such as
```
const fillWhiteBackground = partial(fillBackground, "#ffffff")
fillWhiteBackground([{x:0,y:0,"#ff0000"}])
```
> to make my code more expressive and to save me from having to specify the white background colour in multiple places. Try to follow this pattern wherever you can!

> Please also note that we are not creating side-effects in the `fillBackground` function, but we are instead manipulating data structures! This is the essence of functional programming!