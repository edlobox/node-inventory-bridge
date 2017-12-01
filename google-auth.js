var path = require("path")
var Promise = require("bluebird")
var fs = Promise.promisifyAll(require("fs"))
var moment = require("moment")
var debug = require("debug")("GoogleAuth")

var google = require('googleapis')
var OAuth2 = google.auth.OAuth2

var cid = process.env.GD_WEB_CLIENT_ID
var cs = process.env.GD_WEB_CLIENT_SECRET
var curi = process.env.GD_WEB_REDIRECT_URI

function getTokens(){
  var tokensPath = path.join(__dirname, "./tokens.json")
  return fs.readFileAsync(tokensPath, "utf8").then(function(file){
    return JSON.parse(file[0])
  }).catch(function(e){
    return false
  }).then(function(exists){

    if(exists) {
      debug("Getting Tokens From tokens path")
      return exists
    }

    if(!process.env.GD_USER_ACCESS_TOKEN) return false
    debug("Getting Tokens From ENV")
    return {
      access_token: process.env.GD_USER_ACCESS_TOKEN,
      token_type: process.env.GD_USER_TOKEN_TYPE,
      expiry_date: process.env.GD_USER_EXPIRY_DATE,
      refresh_token: process.env.GD_USER_REFRESH_TOKEN
    }
  })
}

function getOauth2Client(){
  return getTokens().then(function(tokens){
    if(!tokens) throw new Error("tokens is undefined")
    var oauth2Client = new OAuth2(cid, cs, curi);
    oauth2Client.refreshAccessToken = Promise.promisify(oauth2Client.refreshAccessToken)
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token
    });
    var tokenExpireDate = moment(tokens.expiry_date, "x")
    var tokenIsExpired = moment().isAfter(tokenExpireDate)
    if(!tokenIsExpired) return Promise.resolve(oauth2Client)
    return oauth2Client.refreshAccessToken().then(function(tokens){
      debug("Access Token Refreshed")
      fs.writeFileAsync("./tokens.json", JSON.stringify(tokens[0], undefined, 2), "utf8");
      return oauth2Client
    })
  })
}

module.exports = getOauth2Client


/*getOauth2Client().then(function(oauth2Client){
  console.log(oauth2Client)
})
*/
