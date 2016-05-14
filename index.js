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
            switch(words[0]){
                case "@challenge":
                    username = words[words.length - 1];
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
                    username = words[words.length - 1];
                    respondToChallengeSetup(username, sender, true);
                    break;
                case "@reject":
                    username = words[words.length - 1];
                    respondToChallengeSetup(username, sender, false);
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
                    sendTextMessage(sender, "Error in challenge. Please try again. (2)");
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
                            sendTextMessage(s, "Challenge already pending, please wait.");
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
    q = 'UPDATE user_table SET in_duel = 1 WHERE id = \'' + s + '\'';
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query(q, function(err, result) {
            done();
            if (err) {
                sendTextMessage(s, "Error in setting up duel. Please try again. (1)");
            }
            else {
                q2 = 'UPDATE user_table SET in_duel = 1 WHERE id = \'' + r + '\'';
                client.query(q2, function(err, result) {
                    done();
                    if (err) {
                        sendTextMessage(s, "Error in setting up duel. Please try again. (2)");
                    }
                    else {
                        first = s
                        if (Math.random() > 0.5)
                            first = r
                        q3 = 'INSERT INTO duel_table(user_turn, sender_id, recipient_id) VALUES (\'' + first + '\', \'' + s + '\', \'' + r + '\')';
                        client.query(q3, function(err, result) {
                            done();
                            if (err) {
                                // sendTextMessage(s, "Error in setting up duel. Please try again. (3)");
                                sendTextMessage(s, JSON.stringify(err).substring(0, 200));
                            }
                            else {
                                startDuel(s,r);
                            }
                        });
                    }
                });
            }
        });
    });
}

function startDuel(s, r) {
    sendTextMessage(s, "The duel has begun!");
    sendTextMessage(r, "The duel has begun!");
}