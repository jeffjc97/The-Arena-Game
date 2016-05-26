var express = require('express');
// var bodyParser = require('body-parser');
var request = require('request');
var pg = require('pg');
var JSONbig = require('json-bigint');
var app = express();
var token = "EAADO0pQrRbsBAD8aZB2wCeI1zwFlCVS9W1HGQJQVSQj3Qk837u5agR0Gphg7zaZBOyhkVrRVloP2uZAsNXcZCqDXqc49aP26h1IgZBZCTAEhkIiksjxtx2j895suRIbZBGZB3tZChW4J0lNdNMc8jGGNWSayIR8RQru1CnP9sk3ZCC0gZDZD";
pg.defaults.ssl = true;



setInterval(ClearChallenges, 3000);

//OnInterval
var ClearChallenges = function(){
    q_delete_expired_challenges = "DELETE FROM challenge_table c WHERE issued < NOW()- interval \'10 minute\'";
    q_get_expired_challenges = "SELECT u.name, c.sender FROM challenge_table c left join user_table u ON (u.id = c.recipient) WHERE issued < NOW()- interval \'10 minute\'";
    e = function(err){
        sendError(10206557582650156, "Challenge Clearer has failed");
        sendError(10205320360242528, "Challenge Clearer has failed");
    };
    s_get_expired_challenges = function(result){
      for (var i = 0; i < result.rows.length; i++)
        sender = result.rows[i].sender;
        name = result.rows[i].name;
        sendTextMessage(sender, "Your challenge to "+name+ " has expired. Please reissue it if you wish.");
      }
      makeQuery(q_delete_expired_challenges, e, s_delete_expired_challenges);
    };
    s_delete_expired_challenges = function(result){
      sendTextMessage(10206557582650156, "Challenge Clearer has worked");
      sendTextMessage(10205320360242528, "Challenge Clearer has worked");
    };
    makeQuery(q_get_expired_challenges, e, s_get_expired_challenges);
}

function makeQuery(q, error, success) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query(q, function(err, result) {
            done();
            if (err) {
                error(err);
            }
            else {
                success(result);

            }
        });
    });
}

function sendError(uid, eid, msg) {
    if (typeof msg === 'undefined') {
        sendTextMessage(uid, "Sorry - something bad happened! Please try again. (" + eid + ")");
    }
    else {
        sendTextMessage(uid, msg);
    }
}



function sendTextMessage(sender, text) {
    messageData = {
        text:text
    };
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
            // console.log('Error: ', response);
        }
    });
}