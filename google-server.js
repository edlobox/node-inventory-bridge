require('dotenv').config()
var _ = require("underscore")
var Promise = require("bluebird")
var express = require('express')
var app = express()

var google = require('googleapis')
var OAuth2 = google.auth.OAuth2

var cid = process.env.GD_WEB_CLIENT_ID
var cs = process.env.GD_WEB_CLIENT_SECRET
var curi = process.env.GD_WEB_REDIRECT_URI

var oauth2Client = new OAuth2(cid, cs, curi)
oauth2Client.getToken = Promise.promisify(oauth2Client.getToken)

var fs = Promise.promisifyAll(require("fs"))

app.get('/google', function (req, res) {
  var url = oauth2Client.generateAuthUrl({
    approval_prompt: "force",
    access_type: 'offline',
    scope: "https://www.googleapis.com/auth/drive"
  })
  return res.redirect(url)
})

app.get('/oauth2callback', function (req, res) {
  return oauth2Client.getToken(req.query.code).then(function(tokens){
    var envVariables = []
    _.each(tokens[0], function(value, key){
      envVariables.push("GD_USER_"+key.toUpperCase() + "=" + value)
    })
    fs.writeFileAsync("./.tokens", envVariables.join("\n"), "utf8")
    return res.json(tokens)
  }).catch(function(err){
    throw err
    return res.redirect("/google")
  })
})

var server = app.listen(process.env.PORT || 3000 , function () {})
