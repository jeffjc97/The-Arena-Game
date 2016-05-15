var express = require('express');;
var bodyParser = require('body-parser');
var request = require('request');
var pg = require('pg');
var app = express();
var token = "EAADO0pQrRbsBAD8aZB2wCeI1zwFlCVS9W1HGQJQVSQj3Qk837u5agR0Gphg7zaZBOyhkVrRVloP2uZAsNXcZCqDXqc49aP26h1IgZBZCTAEhkIiksjxtx2j895suRIbZBGZB3tZChW4J0lNdNMc8jGGNWSayIR8RQru1CnP9sk3ZCC0gZDZD";
pg.defaults.ssl = true;

app.set('port', (process.env.PORT || 5000));
app.set('view engine', 'ejs');

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

// Process application/json
app.use(bodyParser.json());

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot');
});

// app.get('/db', function (request, response) {
//   pg.connect(process.env.DATABASE_URL, function(err, client, done) {
//     client.query('SELECT * FROM user_table', function(err, result) {
//       done();
//       if (err)
//        { console.error(err); response.send("Error " + err); }
//       else
//        { response.render('pages/db', {results: result.rows} ); }
//     });
//   });
// })

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge']);
    }
    res.send('Error, wrong token');
});

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'));
});

app.post('/webhook/', function (req, res) {
    messaging_events = req.body.entry[0].messaging;
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;
        if (event.message && event.message.text) {
            text = event.message.text;
            words = text.split(" ");
            username = words[words.length - 1];

            q_user_registered = "SELECT * FROM user_table where id =\'" + sender + "\'";
            e = function(err) {
                sendError(sender, 31);
            }
            s_user_registered = function(result) {
                if (!result.rows.length) {
                    switch(words[0]) {
                        case "@register":
                            registerUser(sender, username);
                            break;
                        default:
                            sendTextMessage(sender, "You haven't registered a username yet! Type @register followed by your username to begin playing. (Ex. @register jeff)");
                            break;
                    }
                }
                else {
                    switch(words[0]){
                        case "@generic":
                            sendGenericMessage(sender);
                            break;
                        case "@help":
                            // sendTextMessage(sender, "🔎 GENERAL COMMANDS 🔎\n \
                            //                         🔶 @help: Self-explanatory.
                            //                         🔶 @challenge <username>: Sends a duel request to the specified user. \n \
                            //                         🔶 @accept <username>: Accepts a duel request from the specified user, if one exists. \n \
                            //                         🔶 @reject <username>: Rejects a duel request from the specified user, if one exists. \n \
                            //                         🔰 DUEL COMMANDS 🔰\n \
                            //                         🔶 @strike: Deals damage (0-10) to your opponent if it is your turn. \n \
                            //                         🔶 @forfeit: Forfeits the match. \
                            //                         ");
                            // sendTextMessage(sender, "ok GENERAL COMMANDS 8|\n" +
                            //                         "- @help: Self-explanatory. \n" +
                            //                         "- @challenge <username>: Sends a duel request to the specified user. \n" +
                            //                         "- @accept <username>: Accepts a duel request from the specified user, if one exists. \n" +
                            //                         "- @reject <username>: Rejects a duel request from the specified user, if one exists. \n" +
                            //                         ":|] DUEL COMMANDS :|]\n" +
                            //                         "- @strike: Deals damage (0-10) to your opponent if it is your turn. \n" +
                            //                         "- @forfeit: Forfeits the match.");
                            break;
                        case "@register":
                            sendTextMessage(sender, "You are already registered!");
                            break;
                        case "@challenge":
                            q = 'SELECT id FROM user_table WHERE name = \'' + mysql_real_escape_string(username) + '\'';
                            pg.connect(process.env.DATABASE_URL, function(err, client, done) {
                                client.query(q, function(err, result) {
                                    done();
                                    if (err)
                                        sendError(sender, 1);
                                    else {
                                        if (result.rows.length === 0) {
                                            sendError(sender, 2, "Username not found. Please try again.");
                                        }
                                        else {
                                            challenge_id = result.rows[0].id;
                                            if (challenge_id == sender+"") {
                                                sendTextMessage(sender, "You cannot challenge yourself!");
                                            }else
                                                getUsername(sender, challenge_id, username);
                                        }
                                    }
                                });
                            });
                            break;
                        case "@accept":
                            respondToChallengeSetup(username, sender, true);
                            break;
                        case "@reject":
                            respondToChallengeSetup(username, sender, false);
                            break;
                        case "@strike":
                            makeMoveSetup(sender);
                            break;
                        case "@forfeit":
                            forfeitDuel(sender);
                            break;
                        case "@stats":
                            getStats(username, sender);
                            break;
                        case "@test":
                            username = words[words.length - 1];
                            q = 'SELECT name FROM user_table where id= \'' + sender + '\'';
                            e = function(err) {
                                sendTextMessage(sender, ":-(" + JSON.stringify(err).substring(0,300));
                            };
                            s = function(result) {
                                if (result.rows.length === 0) {
                                    sendTextMessage(sender, ":-( (2)");
                                }
                                else {
                                    username = result.rows[0].name;
                                    sendTextMessage(sender, username);
                                }
                            };
                            makeQuery(q, e, s);
                            break;
                        default:
                            sendNormalMessage(sender, text);
                            // sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200));
                            break;
                    }
                }
            }
            makeQuery(q_user_registered, e, s_user_registered);
        }
        if (event.postback) {
            text = JSON.stringify(event.postback);
            sendTextMessage(sender, "Postback received: "+text.substring(0, 200), token);
            continue;
        }
    }
    res.sendStatus(200);
});

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
        }
    });
}

function sendGenericMessage(sender) {
    messageData = {
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"generic",
            // "recipient_name":"Stephane Crozatier",
            // "order_number":"12345678902",
            // "currency":"USD",
            // "payment_method":"Visa 2345",        
            // "order_url":"http://petersapparel.parseapp.com/order?order_id=123456",
            // "timestamp":"1428444852", 
            "elements":[
              {
                "title":"Help",
                "subtitle":"100% Soft and Luxurious Cotton\nlolol\nlolol",
                "image_url":"http://i.imgur.com/YhRkn3h.png"
              },
            ]
          }
        }
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
        }
    });
}

function mysql_real_escape_string (str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\"+char; // prepends a backslash to backslash, percent,
                                  // and double/single quotes
        }
    });
}

function registerUser(s, username) {
    if (username.charAt(0) == "@" || username.length === 0) {
        sendTextMessage(s, "Invalid username. Please try again.");
    }
    else {
        q_add_username = 'INSERT INTO user_table(id, name) VALUES (\'' + s + '\', \'' + username + '\')';
        e = function(err) {
            if (err.detail.indexOf("already exists") > -1) {
                sendError(s, 29, "Username already exists, please try another.");
            }
            else {
                sendError(s, 30);
            }
        };
        s_add_username = function(result) {
            sendTextMessage(s, "Username successfully registered!");
        };
        makeQuery(q_add_username, e, s_add_username);
    }
}

function getUsername(s, r, ru) {
    q = 'SELECT name FROM user_table where id= \'' + s + '\'';
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query(q, function(err, result) {
            done();
            if (err) {
                sendTextMessage(s, "Error in username lookup.");
            }
            else {
                if (result.rows.length === 0) {
                    sendError(s, 3);
                }
                else {
                    username = result.rows[0].name;
                    sendChallenge(s, r, username, ru);
                }
            }
        });
    });
}

// sender id, recipient id, sender username, recipient username
function sendChallenge(s, r, su, ru) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        q_validate = 'SELECT name, in_duel FROM user_table where id= \'' + s + '\'';
        client.query(q_validate, function(err, result) {
            done();
            if (err) {
                sendError(s, 4);
            }
            else if (result.rows.length === 0 || result.rows.length > 1) {
                sendError(s, 5);
            }
            else if(result.rows[0].in_duel === '1'){
                sendError(s, 6, "You are already in a duel.");      
            }
            else{
                q = 'INSERT into challenge_table values (' + s + ", " + r + ')';
                client.query(q, function(err, result) {
                    done();
                    if (err) {
                        if (err.detail.indexOf("already exists") > -1) {
                            sendError(s, 7, "Challenge already pending, please wait...");
                        }
                        else {
                            sendError(s, 8);
                        }
                    }
                    else {
                        //verify that user isn't already in a duel
                        q_induel = 'SELECT * from user_table WHERE id = \'' + r + '\'';
                        client.query(q_induel, function(err, result){
                            done();
                            if (err) {
                                sendError(s, 9);
                            }
                            else if (result.rows.length === 0) {
                                sendError(s, 10);
                            }
                            else if(result.rows[0].in_duel === '1'){
                                sendError(s, 11, ru + " is already in a duel.");      
                            }
                            else{
                                sendTextMessage(s, "Challenge sent! Waiting for " + ru + " to respond...");
                                sendTextMessage(parseInt(r), su + " has challenged you to a duel! Reply @accept " + su + " or @reject " + su + " to respond.");
                            }
                        });
                    }
                });
            }
        });
    });
}

//r (id) is responding to challenge from su (name) with response 
function respondToChallengeSetup(su, r, response) {
    // get recipient username
    // get sender id
    q = 'SELECT name, in_duel FROM user_table where id= \'' + r + '\'';
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query(q, function(err, result) {
            done();
            if (err) {
                sendError(r, 12);
            }
            else {
                if (result.rows.length === 0) {
                    sendError(r, 13);
                }
                else if(result.rows[0].in_duel !== '0'){
                    sendError(r, 14, "You are currently in a duel!");
                }
                else {
                    //username of the responder
                    ru = result.rows[0].name;
                    //get sender id and status
                    q2 = 'SELECT id, in_duel FROM user_table where name = \'' + su + '\'';
                    client.query(q2, function(err, result) {
                        done();
                        if (err) {
                            sendError(r, 15);
                        }
                        else {
                            if (result.rows.length === 0) {
                                sendError(r, 16);
                            }
                            else if (result.rows.length > 1) {
                                sendError(r, 17);
                            }
                            else {
                                s = result.rows[0].id;
                                if(result.rows[0].in_duel !== '0'){
                                    sendError(r, 18, su + " is currently in a duel. Please try accepting again soon.");      
                                }
                                else{   
                                    s = result.rows[0].id;
                                    respondToChallenge(s, r, su, ru, response);
                                }
                            }
                        }
                    });
                }
            }
        });
    });
}

function respondToChallenge(s, r, su, ru, response) {
    // validate
        //make sure neither responder nor challenger are in duel currently
    // make changes/start game
    q = 'SELECT * FROM challenge_table WHERE sender = \'' + s + '\' AND recipient = \'' + r + '\'';
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query(q, function(err, result) {
            done();
            if (err) {
                sendTextMessage(s, "Error in challenge lookup. (1)");
            }
            else {
                if (result.rows.length === 0) {
                    sendError(r, 19, "This challenge request has expired or does not exist.");
                }
                else if (result.rows.length > 1){
                    sendError(r, 20);   
                }
                else {
                    q2 = 'DELETE FROM challenge_table WHERE sender = \'' + s + '\' AND recipient = \'' + r + '\'';
                    client.query(q2, function(err, result) {
                        done();
                        if (err) {
                            sendError(s, 21);
                        }
                        else {
                            if (response) {
                                // start duel
                                setupDuel(s, r);
                                sendTextMessage(s, ru + " has accepted your request! Starting duel...");
                                sendTextMessage(r, "Request accepted. Starting duel...");
                            }
                            else {
                                sendTextMessage(s, ru + " has rejected your challenge request.");
                                sendTextMessage(r, "Request rejected.");
                            }
                        }
                    });
                }
            }
        });
    });
}

// invariant: neither party is in a duel
function setupDuel(s, r) {
    first = s
    if (Math.random() > 0.5)
        first = r;
    q3 = 'INSERT INTO duel_table(user_turn, sender_id, recipient_id) VALUES (\'' + first + '\', \'' + s + '\', \'' + r + '\') RETURNING duel_id';
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query(q3, function(err, result) {
            done();
            if (err) {
                sendError(s, 22);
                // sendTextMessage(s, JSON.stringify(err).substring(0, 200));
            }
            else {
                duel_id = result.rows[0].duel_id;
                q = 'UPDATE user_table SET in_duel = '+duel_id+' WHERE id = \'' + s + '\'';
                client.query(q, function(err, result) {
                    done();
                    if (err) {
                        sendError(s, 23);
                    }
                    else {
                        q2 = 'UPDATE user_table SET in_duel = '+duel_id+' WHERE id = \'' + r + '\'';
                        client.query(q2, function(err, result) {
                            done();
                            if (err) {
                                sendError(s, 24);
                            }
                            else {
                                // sendTextMessage(s, JSON.stringify(result).substring(0, 200))
                                startDuel(s,r, first);
                            }
                        });
                    }
                });
            }
        });
    });
}

function startDuel(s, r, f_id) {
    q = 'SELECT name FROM user_table where id= \'' + f_id + '\'';
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query(q, function(err, result) {
            done();
            if (err || result.rows.length !== 1) {
                sendError(s, 25);
                sendError(r, 25);
            }
            else {
                first = result.rows[0].name;
                sendTextMessage(s, "The duel has begun! "+first+ " has the first move.");
                sendTextMessage(r, "The duel has begun! "+first+ " has the first move.");
            }
        });
    });
}


function makeMoveSetup(s){
    q = 'SELECT name, id, in_duel FROM user_table where id= \'' + s + '\'';
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query(q, function(err, result) {
            done();
            if (err || result.rows.length !== 1) {
                sendError(s, 26);
            }
            else {
                duel_id = result.rows[0].in_duel;
                su = result.rows[0].name;
                if (duel_id == 0) {
                    sendTextMessage(s, "You are not currently in a duel.");
                }
                else{
                    q2 = 'SELECT * FROM duel_table WHERE duel_id = '+duel_id;
                    client.query(q2, function(err, result) {
                        done();
                        if (err || result.rows.length !== 1) {
                            sendTextMessage(s, "error");
                        }
                        else{
                            data = result.rows[0];
                            turn_id = data.user_turn;
                            if (s != turn_id) {
                                sendTextMessage(s, "It's not your turn. Please wait.");
                            }
                            else{
                                //we know s is attacker. Is s sender_id or recipient_id?
                                s_is_sender_id = isSender_id(s, data);
                                defender_id = data.sender_id;
                                defender_health = data.health_sender;
                                attacker_health = data.health_recipient;
                                if (s_is_sender_id) {
                                    defender_id = data.recipient_id;
                                    defender_health = data.health_recipient;
                                    attacker_health = data.health_sender;
                                }
                                //query for defender's name
                                q3 = 'SELECT name FROM user_table WHERE id= \'' + defender_id + '\'';
                                client.query(q3, function(err, result) {
                                    done();
                                    if (err || result.rows.length !== 1) {
                                        sendTextMessage(s, "error (7)");
                                    }
                                    else{
                                        makeMove(s, defender_id, defender_health, attacker_health, su, result.rows[0].name, data.duel_id, s_is_sender_id);
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
    });
}

//invariant: it is currently the attacker's turn
function makeMove(attacker_id, defender_id, health_defender, health_attacker, attacker_name, defender_name, duel_id, attacker_is_sender){
    max = 11;
    min = 0;
    attack_value = Math.floor(Math.random() * (max - min)) + min;
    if (attack_value >= health_defender) {
        sendTextMessage(defender_id, attacker_name+" hit you for "+attack_value+" hp!");
        sendTextMessage(attacker_id, "You hit "+defender_name+" for "+attack_value+" hp!");
        loseDuel(defender_id, attacker_id, defender_name, attacker_name, duel_id);
    }else{
        new_health_def = health_defender - attack_value;
        // update the duel
        q = 'UPDATE duel_table SET user_turn = \'' + defender_id + '\', health_sender = '+new_health_def+', moves_in_duel = moves_in_duel + 1 WHERE duel_id = '+duel_id;
        if (attacker_is_sender) {
            q = 'UPDATE duel_table SET user_turn = \'' + defender_id + '\', health_recipient = '+new_health_def+', moves_in_duel = moves_in_duel + 1 WHERE duel_id = '+duel_id;
        }
        pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            client.query(q, function(err, result) {
                done();
                if (err) {
                    sendTextMessage(attacker_id, JSON.stringify(err).substring(0, 200));
                }else{
                    sendTextMessage(defender_id, attacker_name+" hit you for "+attack_value+" hp!");
                    sendTextMessage(attacker_id, "You hit "+defender_name+" for "+attack_value+" hp!");
                    sendTextMessage(defender_id, attacker_name+": "+health_attacker+" ||| "+defender_name+": "+new_health_def);
                    sendTextMessage(attacker_id, attacker_name+": "+health_attacker+" ||| "+defender_name+": "+new_health_def);
                }
            });
        });
    }
}

//data is a row from duel_table
function isSender_id(id, data){
    return id == data.sender_id;
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

function forfeitDuel(uid) {
    return;
}

function loseDuel(lid, wid, lname, wname, did) {
    q_update_l = "UPDATE user_table SET in_duel = 0, wins=wins+1, games_played=games_played+1 WHERE id = \'" + wid + "\'";
    q_update_w = "UPDATE user_table SET in_duel = 0, losses=losses+1, games_played=games_played+1 WHERE id = \'" + lid + "\'";
    q_update_d = "UPDATE duel_table SET winner_id = \'" + wid + "\' WHERE duel_id = \'" + did + "\'";
    e = function(err) {
        sendError(lid, 27);
        sendError(wid, 27);
    }
    s_update_l = function(result) {
        sendTextMessage(lid, "You were defeated by " + wname + ".");
        sendTextMessage(wid, "You have defeated " + lname + "!");
    }
    s_update_w = function(result) {
        makeQuery(q_update_l, e, s_update_l);
    }
    s_update_d = function(result) {
        makeQuery(q_update_w, e, s_update_w);
    }
    makeQuery(q_update_d, e, s_update_d);
}

function sendNormalMessage(s, text) {
    var name = "";
    q_get_user_info = "SELECT name, in_duel from user_table WHERE id = \'" + s + "\'";

    e = function(err) {
        sendError(s, 28);
    };
    s_get_duel_info = function(result) {
        data = result.rows[0];
        message_to = data.sender_id;
        if (message_to == s) { message_to = data.recipient_id; }
        sendTextMessage(message_to, name + ": " + text);
    };
    s_get_user_info = function(result) {
        data = result.rows[0];
        if (data.in_duel) {
            duel_id = data.in_duel;
            q_get_duel_info = "SELECT sender_id, recipient_id FROM duel_table WHERE duel_id = " + duel_id;
            name = data.name;
            makeQuery(q_get_duel_info, e, s_get_duel_info);
        }
        else {
            sendTextMessage(s, "Why are you talking to yourself? \"" + text + "\"");
        }
    };
    makeQuery(q_get_user_info, e, s_get_user_info);
}

function getStats(user, s){
    q_get_stats = "SELECT * FROM user_table where name= \'" + user + "\'";
    e = function(err){
        sendError(s, 32);
    }
    success = function(result){
        if (result.rows.length == 1) {
            data = result.rows[0];
            sendTextMessage(s, "Stats for "+user+":\n Wins: "+data.wins+"\nLosses: "+data.losses+"\nDraws: "+data.draws+"\nGames: "+data.games_played+"\nWin %: "+(data.wins/data.games_played).toFixed(2));
        }
        else{
            sendTextMessage(s, "User not found.");
        }

    }
    makeQuery(q_get_stats, e, success);
}