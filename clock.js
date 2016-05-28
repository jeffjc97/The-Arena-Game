var express = require('express');
// var bodyParser = require('body-parser');
var request = require('request');
var pg = require('pg');
var JSONbig = require('json-bigint');
var app = express();
var token = "EAADO0pQrRbsBAD8aZB2wCeI1zwFlCVS9W1HGQJQVSQj3Qk837u5agR0Gphg7zaZBOyhkVrRVloP2uZAsNXcZCqDXqc49aP26h1IgZBZCTAEhkIiksjxtx2j895suRIbZBGZB3tZChW4J0lNdNMc8jGGNWSayIR8RQru1CnP9sk3ZCC0gZDZD";
pg.defaults.ssl = true;

app.set('port', (process.env.PORT || 5000));
app.set('view engine', 'ejs');

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'));
});

app.use(function(req, res, next){
  if (req.method == 'POST') {
    var body = '';

    req.on('data', function (data) {
      body += data;

      // Too much POST data, kill the connection!
      // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
      if (body.length > 1e6)
        req.connection.destroy();
    });

    req.on('end', function () {
      // console.log(body); // should work
        // use post['blah'], etc.
      req.body = JSONbig.parse(body);
      next();
    });
  }
});

//OnInterval
var ClearChallenges = function(){
    q_delete_expired_challenges = "DELETE FROM challenge_table c WHERE issued < NOW()- interval \'10 minute\'";
    q_get_expired_challenges = "SELECT u.name, c.sender FROM challenge_table c left join user_table u ON (u.id = c.recipient) WHERE issued < NOW()- interval \'10 minute\'";
    e = function(err){
        sendError(10206557582650156, "Challenge Clearer has failed");
        sendError(10205320360242528, "Challenge Clearer has failed");
    };
    s_get_expired_challenges = function(result){
      for (var i = 0; i < result.rows.length; i++){
        sender = result.rows[i].sender;
        name = result.rows[i].name;
        sendTextMessage(sender, "Your challenge to "+name+ " has expired. Please reissue it if you wish.");
      }
      makeQuery(q_delete_expired_challenges, e, s_delete_expired_challenges);
    };
    s_delete_expired_challenges = function(result){
      // sendTextMessage(10206557582650156, "Challenge Clearer has worked");
      // sendTextMessage(10205320360242528, "Challenge Clearer has worked");
    };
    makeQuery(q_get_expired_challenges, e, s_get_expired_challenges);
};
// var CheckMovesExpire = function(){
//     q_get_stale_duels = "SELECT d.duel_id, d.sender_id, d.recipient_id, u1.name as sender_name, u2.name recipient_name, d.user_turn FROM duel_table d LEFT JOIN user_table u1 ON (u1.id = d.sender_id) LEFT JOIN user_table u2 ON (u2.id = d.recipient_id) WHERE d.pressure_time < NOW()- interval \'30 second\'";
//     e = function(err){
//         sendError(10206557582650156, "CheckMovesExpire has failed");
//         sendError(10205320360242528, "CheckMovesExpire has failed");
//     }
//     s_get_stale_duels = function(result){
//         for (var i = 0; i < result.rows.length; i++) {
//             sender_id = result.rows[i].sender_id;
//             recipient_id = result.rows[i].recipient_id;
//             sender_name = result.rows[i].sender_name;
//             recipient_name = result.rows[i].recipient_name;
//             user_turn = result.rows[i].user_turn;
//             duel_id = result.rows[i].duel_id;
//             if (sender_id == user_turn) {
//                 timeOutDuel(sender_id, recipient_id, sender_name, recipient_name, duel_id);
//             }else{
//                 timeOutDuel(recipient_id, sender_id, recipient_name, sender_name, duel_id);
//             }
//         };
//     }
//     makeQuery(q_get_stale_duels, e, s_get_stale_duels);
// }
// setInterval(ClearChallenges, 300000);
// setInterval(CheckMovesExpire, 5000);

// function timeOutDuel(lid, wid, lname, wname, did) {
//     sendTextMessage(lid, "You were defeated by " + wname + ". Duel ending in 5 seconds...");
//     sendTextMessage(wid, "You have defeated " + lname + "! Duel ending in 5 seconds...");
//     setTimeout(function(){
//         var stake = 0;
//         e = function(err) {
//             sendError(lid, 27);
//             sendError(wid, 27);
//         };
//         s_update_w = function(result) {
//             sendTextMessage(lid, "The duel has ended.");
//             sendTextMessage(wid, "The duel has ended.");
//         };
//         s_update_l = function(result) {
//             if (!stake) {
//                 stake = 10;
//             }
//             q_update_w = "UPDATE user_table SET in_duel = 0, wins=wins+1, games_played=games_played+1, points = points +"+stake+"  WHERE id = \'" + wid + "\'";
//             makeQuery(q_update_w, e, s_update_w);
//         };
//         s_update_d = function(result) {
//             stake = result.rows[0].stake;
//             q_update_l = "UPDATE user_table SET in_duel = 0, losses=losses+1, games_played=games_played+1, points = points -"+stake+" WHERE id = \'" + lid + "\'";
//             makeQuery(q_update_l, e, s_update_l);
//         };
//         q_update_d = "UPDATE duel_table SET winner_id = \'" + wid + "\' WHERE duel_id = \'" + did + "\' RETURNING stake";
//         makeQuery(q_update_d, e, s_update_d);
//     }, 5000);
// }

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