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
            switch(words[0]){
                case "@challenge":
                    q = 'SELECT id FROM user_table WHERE name = \'' + mysql_real_escape_string(username) + '\'';
                    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
                        client.query(q, function(err, result) {
                            done();
                            if (err)
                                sendTextMessage(sender, "Error in challenge. Please try again. (1)");
                            else {
                                if (result.rows.length === 0) {
                                    sendTextMessage(sender, "Username not found. Please try again.");
                                }
                                else {
                                    challenge_id = parseInt(result.rows[0].id);
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
                    makeMoveSetup(username, sender);
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
                    sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200));
                    break;
            }
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

/*function sendGenericMessage(sender) {
    messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "First card",
                    "subtitle": "Element #1 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
                    "buttons": [{
                        "type": "web_url",
                        "url": "https://www.messenger.com",
                        "title": "web url"
                    }, {
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for first element in a generic bubble",
                    }],
                }, {
                    "title": "Second card",
                    "subtitle": "Element #2 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
                    "buttons": [{
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for second element in a generic bubble",
                    }],
                }]
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
}*/

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
                    sendTextMessage(s, "Error in challenge. Please try again. (2)");
                }
                else {
                    username = result.rows[0].name;
                    sendChallenge(s, r, username, ru);
                }
            }
        });
    });
}

function getUsernameFromId(id){
    q = 'SELECT name FROM user_table where id= \'' + id + '\'';
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query(q, function(err, result) {
            done();
            if (err || result.rows.length !== 1) {
                return "error";
            }
            else {
                return result.rows[0].name;
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
                sendTextMessage(s, "Error in sending challenge");
            }
            else if (result.rows.length === 0 || result.rows.length > 1) {
                sendTextMessage(s, "Error in sending challenge.");   
            }
            else if(result.rows[0].in_duel === '1'){
                sendTextMessage(s, "You are already in a duel.");      
            }
            else{
                q = 'INSERT into challenge_table values (' + s + ", " + r + ')';
                client.query(q, function(err, result) {
                    done();
                    if (err) {
                        if (err.detail.indexOf("already exists") > -1) {
                            sendTextMessage(s, "Challenge already pending, please wait...");
                        }
                        else {
                            sendTextMessage(s, "Error in sending challenge.");
                        }
                    }
                    else {
                        //verify that user isn't already in a duel
                        q_induel = 'SELECT * from user_table WHERE id = \'' + r + '\'';
                        client.query(q_induel, function(err, result){
                            done();
                            if (err) {
                                sendTextMessage(s, "Error in finding user.");
                            }
                            else if (result.rows.length === 0) {
                                sendTextMessage(s, "Error in finding user.");   
                            }
                            else if(result.rows[0].in_duel === '1'){
                                sendTextMessage(s, ru + " is already in a duel.");      
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
                sendTextMessage(r, "Error in responding to challenge. Please try again. (1)");
            }
            else {
                if (result.rows.length === 0) {
                    sendTextMessage(r, "Error in responding to challenge. Please try again. (2)");
                }
                else if(result.rows[0].in_duel === '1'){
                    sendTextMessage(r, "You are currently in a duel!");
                }
                else {
                    //username of the responder
                    ru = result.rows[0].name;
                    //get sender id and status
                    q2 = 'SELECT id, in_duel FROM user_table where name = \'' + su + '\'';
                    client.query(q2, function(err, result) {
                        done();
                        if (err) {
                            sendTextMessage(r, "Error in responding to challenge. Please try again. (3)");
                        }
                        else {
                            if (result.rows.length === 0) {
                                sendTextMessage(r, "Error in responding to challenge. Please try again. (4)");
                            }
                            else if (result.rows.length > 1) {
                                sendTextMessage(r, su+ "is not a unique id. Please try again. (5)");
                            }
                            else {
                                s = result.rows[0].id;
                                if(result.rows[0].in_duel === '1'){
                                    sendTextMessage(r, su + " is currently in a duel. Please try accepting again soon.");      
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
                    sendTextMessage(r, "This challenge request has expired or does not exist.");
                }
                else if (result.rows.length > 1){
                    sendTextMessage(r, "Error in chappenge lookup. (2)");   
                }
                else {
                    q2 = 'DELETE FROM challenge_table WHERE sender = \'' + s + '\' AND recipient = \'' + r + '\'';
                    client.query(q2, function(err, result) {
                        done();
                        if (err) {
                            sendTextMessage(s, "Error in challenge lookup. (3)");
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
                sendTextMessage(s, "Error in setting up duel. Please try again. (3)");
                // sendTextMessage(s, JSON.stringify(err).substring(0, 200));
            }
            else {
                duel_id = result.rows[0].duel_id;
                q = 'UPDATE user_table SET in_duel = '+duel_id+' WHERE id = \'' + s + '\'';
                client.query(q, function(err, result) {
                    done();
                    if (err) {
                        sendTextMessage(s, "Error in setting up duel. Please try again. (1)");
                    }
                    else {
                        q2 = 'UPDATE user_table SET in_duel = '+duel_id+' WHERE id = \'' + r + '\'';
                        client.query(q2, function(err, result) {
                            done();
                            if (err) {
                                sendTextMessage(s, "Error in setting up duel. Please try again. (2)");
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
                sendTextMessage(s, "Error in starting duel (3)");
                sendTextMessage(r, "Error in starting duel (3)");
            }
            else {
                first = result.rows[0].name;
                sendTextMessage(s, "The duel has begun! "+first+ " has the first move.");
                sendTextMessage(r, "The duel has begun! "+first+ " has the first move.");
            }
        });
    });
}


function makeMoveSetup(su, s){
    q = 'SELECT id, in_duel FROM user_table where name= \'' + su + '\'';
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query(q, function(err, result) {
            done();
            if (err || result.rows.length !== 1) {
                sendTextMessage(s, json.stringify(err).substring(0,200));
            }
            else {
                duel_id = result.rows[0].in_duel;
                //TODO check that in_duel is not 0
                q2 = 'SELECT * FROM duel_table WHERE duel_id = '+duel_id;
                client.query(q2, function(err, result) {
                    done();
                    if (err || result.rows.length !== 1) {
                        sendTextMessage(s, "error");
                    }
                    else{
                        data = result.rows[0];
                        turn_id = data.user_turn;
                        if (s !== user_turn) {
                            sendTextMessage(s, "It's not your turn Please wait...!");
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
                                    makeMove(s, defender_id, defender_health, attacker_health, su, result.rows[0].name, data.duel_id);
                                }
                            });
                        }
                    }
                });
            }
        });
    });
}

//invariant: it is currently the attacker's turn
function makeMove(attacker_id, defender_id, health_defender, health_attacker, attacker_name, defender_name, duel_id){
    max = 11;
    min = 0;
    attack_value = Math.floor(Math.random() * (max - min)) + min;
    if (attack_value >= health_defender) {
        sendTextMessage(defender_id, attacker_name+" hit you for "+attack_value+" hp!");
        sendTextMessage(attacker_id, "You hit "+defender_name+" for "+attack_value+" hp!");
        loseDuel(defender_id, attacker_id, defender_name, attacker_name, duel_id);
    }else{
        new_health_def = health_defender - attack_value;
        sendTextMessage(defender_id, attacker_name+" hit you for "+attack_value+" hp!");
        sendTextMessage(attacker_id, "You hit "+defender_name+" for "+attack_value+" hp!");
        sendTextMessage(defender_id, attacker_name+": "+health_attacker+" ||| "+defender_name+": "+new_health_def);
        sendTextMessage(attacker_id, attacker_name+": "+health_attacker+" ||| "+defender_name+": "+new_health_def);
    }
}

function loseDuel(defender_id, attacker_id, defender_name, attacker_name, duel_id){
    return;
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