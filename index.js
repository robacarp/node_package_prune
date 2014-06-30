"use strict";

var glob = require('glob').sync,
    fs = require('fs'),
    jsFiles = []

// a list of paths we don't want to check
var blacklist = [
          /public\/(highcharts|jquery)/,
          /node_modules/
]

// a list of modules we use on the command line, but never get required
var whitelist = ['jake','jshint','mocha']

// figure out all the libraries we import
var libs = Object.keys( JSON.parse(fs.readFileSync('package.json')).dependencies )

// in every chain, turn, turn, turn
// start by searching for all the javascript files in the repo
glob('./**/*.js')

    // Skip reading in large repositories of nonsense
    .filter(function(filename) {
        return blacklist.every(function(regex) {
          return ! filename.match(regex)
        })
    })

    // Read in a file, parse out the requires
    .map(function(filename) {
      var file = fs.readFileSync(filename).toString()
      return file.match(/require\([^)]+\)/g)
    })

    // Filter out nulls
    .filter(function(require){
      return require !== null
    })

    // Flatten sub arrays into one big array
    .reduce(function(flat, slice){
      if (slice === null) {
        return flat
      }

      slice.forEach(function(e) {
        flat.push(e)
      })

      return flat
    },[])

    // Ditch the function call for the filename
    // When it doesn't match, set to null for deletion
    .map(function(require) {
      var match = require.match(/require\(('|")([^']+)('|")\)/)
      if (match) {
        return match[2]
      } else {
        return null
      }
    })

    // Filter out relative paths and nulls
    .filter(function(require){
      return require !== null && require.charAt(0) !== '.'
    })

    // Deduplicate
    .sort()
    .reduce(function(uniques, elem) {
      if (uniques[uniques.length - 1] != elem) {
        uniques.push(elem)
      }

      return uniques
    }, [])

    //
    // At this point the chain begins operating on the list of imports
    // rather than the list of requires
    //
    // Produce a list of the things we import that we don't need
    .reduce(function(imports, library) {
      var index = imports.indexOf(library)
      if (index > -1) {
        imports.splice(index, 1)
      }

      return imports
    }, libs)

    // filter out the whitelisted modules
    .filter(function(module) {
      return whitelist.indexOf(module) < 0
    })

    // and print it
    .forEach(function(e) {
      console.log(e)
    })

