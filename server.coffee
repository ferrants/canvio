express = require 'express'
http = require 'http'
assert = require 'assert'

setup_server = () ->

  app = express()

  app.use express.bodyParser()
  app.use express.methodOverride()
  app.use app.router
  app.use express.static(__dirname + '/public')

  app.listen 8080
  console.log "Listening on port 8080"

setup_server()
