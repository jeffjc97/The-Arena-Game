var debug = true;

var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var pg = require('pg');
var JSONbig = require('json-bigint');
var escape = require('pg-escape');
var app = express();

var token = "EAADO0pQrRbsBAD8aZB2wCeI1zwFlCVS9W1HGQJQVSQj3Qk837u5agR0Gphg7zaZBOyhkVrRVloP2uZAsNXcZCqDXqc49aP26h1IgZBZCTAEhkIiksjxtx2j895suRIbZBGZB3tZChW4J0lNdNMc8jGGNWSayIR8RQru1CnP9sk3ZCC0gZDZD";
if (debug) {
    token = "EAAIrIlaiok0BAMltmAAL9rrXYdi7EymNA135BZCjddqjXQUBSNyxEZCaSQJdiucnRsoofUIfZATDqeizPQDtZBQElB96PeMKRuJk2rj9PEM4206QxWuQ40i7myOzwbZAi9Xsn4AKrzlaMlrnIKd0ZAXmWjnsZCWE0OSVLQUqeBJUAZDZD";
}


pg.defaults.ssl = true;

app.set('port', (process.env.PORT || 5000));
app.set('view engine', 'ejs');

var MAX_CHALLENGE_COUNT = 10;
var max_health = 50;
var classes = {0: 'Default', 1: 'Knight', 2: 'Vampire', 3: 'Berserker'};
var verbs = {h: 'healed', s: 'slashed', d: 'stabbed', c: 'crushed'};
var health_tiers = {0: 50, 1: 35, 2: 20, 3: 10};
var attacks = {
    0: {h: {miss: 0, min: 10, max: 10},
        s: {miss: 0.25, min: 9, max: 12},
        d: {miss: 0.15, min: 5, max: 7},
        c: {miss: 0.5, min: 12, max: 15}},
    1: {h: {miss: 0, min: 10, max: 10},
        s: {miss: 0.15, min: 9, max: 12},
        d: {miss: 0.05, min: 5, max: 7},
        c: {miss: 0.45, min: 12, max: 15}},
    2: {h: {miss: 0, min: 10, max: 10},
        s: {miss: 0.3, min: 9, max: 12},
        d: {miss: 0.2, min: 5, max: 7},
        c: {miss: 0.55, min: 12, max: 15},
        heal_chance: 0.5,
        heal_percentage: 0.5},
    3: {h: {miss: 0, min: 10, max: 10},
        s: {miss: 0.25,
            0: {min: 9, max: 12},
            1: {min: 9, max: 13},
            2: {min: 10, max: 14},
            3: {min: 10, max: 16}},
        d: {miss: 0.15,
            0: {min: 5, max: 7},
            1: {min: 5, max: 8},
            2: {min: 6, max: 9},
            3: {min: 6, max: 11}},
        c: {miss: 0.5,
            0: {min: 12, max: 15},
            1: {min: 12, max: 16},
            2: {min: 13, max: 17},
            3: {min: 13, max: 19}}}
};

var class_cost = 300;

// var attacks = {
//     h: {miss: 0, min: 10, max: 10, verb: 'healed'},
//     s: {miss: 0.35, min: 9, max: 11, verb: 'slashed'},
//     d: {miss: 0.15, min: 5, max: 7, verb: 'stabbed'},
//     c: {miss: 0.5, min: 12, max: 17, verb: 'crushed'}
// };

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

// Process application/json
app.use(bodyParser.json());

// app.use(function(req, res, next){
//   if (req.method == 'POST') {
//     var body = '';

//     req.on('data', function (data) {
//       body += data;

//       // Too much POST data, kill the connection!
//       // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
//       if (body.length > 1e6)
//         req.connection.destroy();
//     });

//     req.on('end', function () {
//       // console.log(body); // should work
//         // use post['blah'], etc.
//       req.body = JSONbig.parse(body);
//       next();
//     });
//   }
// });

// Index route
app.get('/', function (req, res) {
    res.send('The Arena - a messenger chat game by Jeffrey Chang and Roy Falik. Play at m.me/TheArenaGame');
});

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'we_are_astronauts_baby_8409') {
        res.send(req.query['hub.challenge']);
    }
    else {
        res.send('Error, wrong token');
    }
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
            console.log("1");
            getUserInfo(sender);
            console.log("2");
            q_user_registered = "SELECT * FROM user_table where id = \'" + sender + "\'";
            e = function(err) {
                sendError(sender, 31);
            };
            s_user_registered = function(result) {
                if (!result.rows.length) {
                    switch(words[0]) {
                        case "@register":
                            if (words.length == 2) {
                                registerUser(sender, username);
                            }
                            else {
                                sendTextMessage(sender, "Usernames must be one word.");
                            }
                            break;
                        default:
                            console.log(sender);
                            sendTextMessage(sender, "You haven't registered a username yet! Type @register followed by your username to begin playing. (Ex. @register jeff)");
                            break;
                    }
                }
                else {
                    if (Math.floor((Math.random() * 100)) == 42) {
                        sendTextMessage(sender, "We'd love to know what you think of the game! Please use the @feedback command to leave us your thoughts.");
                    }
                    switch(words[0]){
                        case "@help":
                            sendHelpMessage(sender);
                            break;
                        case "@about":
                            sendTextMessage(sender, "The Arena - a text based game by Jeff Chang and Roy Falik.");
                            break;
                        case "@register":
                            sendTextMessage(sender, "You are already registered!");
                            break;
                        case "@me":
                            getPersonalInfo(sender);
                            break;
                        case "@challenge":
                            if (words.length == 2) {
                                setupChallenge(sender, username);
                            }
                            else {
                                sendTextMessage(sender, "Invalid challenge command. See @help for more information.");
                            }
                            break;
                        case "@random":
                            randomChallenge(sender);
                            break;
                        case "@accept":
                            if (words.length == 2) {
                                respondToChallenge(username, sender, true);
                            }
                            else if (words.length == 1) {
                                sendTextMessage(sender, "Make sure to include the challenger's username (ex. @accept jeff).");
                            }
                            else {
                                sendTextMessage(sender,"Invalid accept command. See @help for more information.");
                            }
                            break;
                        case "@reject":
                            if (words.length == 2) {
                                respondToChallenge(username, sender, false);
                            }
                            else if (words.length == 1) {
                                sendTextMessage(sender, "Make sure to include the challenger's username (ex. @reject jeff).");
                            }
                            else {
                                sendTextMessage(sender, "Invalid reject command. See @help for more information.");
                            }
                            break;
                        case "@feedback":
                            if (words.length > 1) {
                                userFeedback(sender, text.substr(text.indexOf(" ") + 1));
                            }
                            else {
                                sendTextMessage(sender, "Please include your feedback after the command.");
                            }
                            break;
                        case "@friend":
                            if (words.length == 2) {
                                addFriend(sender, username);
                            }
                            else {
                                sendTextMessage(sender, "Invalid friends command. See @help for more information.");
                            }
                            break;
                        case "@friends":
                            if (words.length == 1) {
                                listFriends(sender);
                            }
                            else {
                                sendTextMessage(sender, "Invalid friends command. See @help for more information.");
                            }
                            break;
                        case "@d":
                        case "@dagger":
                            makeMoveSetup(sender, 'd');
                            break;
                        case "@s":
                        case "@sword":
                            makeMoveSetup(sender, 's');
                            break;
                        case "@c":
                        case "@club":
                            makeMoveSetup(sender, 'c');
                            break;
                        case "@h":
                        case "@heal":
                            makeMoveSetup(sender, 'h');
                            break;
                        case "@forfeit":
                            forfeitDuel(sender);
                            break;
                        case "@stats":
                            if (words.length == 2) {
                                getStats(username, sender);
                            }
                            else {
                                sendTextMessage(sender, "Invalid stats command. See @help for more information.");
                            }
                            break;
                        case "@challenges":
                            getPendingChallenges(sender);
                            break;
                        case "@pressure":
                            setPressure(sender);
                            break;
                        case "@shop":
                            presentShop(sender);
                            break;
                        case "@buy":
                            if (words.length == 2) {
                                purchase(sender, username);
                            }
                            else{
                                sendTextMessage(sender, "Invalid buy command. See @shop for more information.");   
                            }
                            break;
                        case "@class":
                            if (words.length == 2) {
                                changeClass(sender, username);
                            }
                            else{
                                sendTextMessage(sender, "Invalid class command. See @help for more information.");   
                            }
                        case "@cancel":
                            if (words.length == 2) {
                                cancelChallenge(sender, username);
                            }
                            else {
                                sendTextMessage(sender, "Invalid cancel command. See @help for more information.");
                            }
                            break;
                        case "@stake":
                            if (words.length == 3) {
                                username = words[words.length - 2];
                                val = words[words.length - 1];
                                if (isNaN(parseInt(val))) {
                                    sendTextMessage(sender, "Invalid stake command. See @help for more information.");
                                }
                                else if (val < 1) {
                                    sendTextMessage(sender, "Stake value must be greater than 0.");
                                }
                                else {
                                    setupChallenge(sender, username, val);
                                }
                            }
                            else {
                                sendTextMessage(sender, "Invalid stake command. See @help for more information.");
                            }
                            break;
                        default:
                            if (words[0].charAt(0) == "@") {
                                sendTextMessage(sender, "Not a valid command. See @help for more information.");
                            }
                            else {
                                sendNormalMessage(sender, text);
                            }
                            break;
                    }
                }
            };
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

// Function used to query the database
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

// Function used to send errors to the users
function sendError(uid, eid, msg) {
    if (!msg) {
        msg =  "Sorry - something bad happened! Please try again. #" + eid;
    }
    q_insert_error = "INSERT INTO error_log VALUES (\'"+msg+"\', default, \'"+uid+"\')";
    e = function(err){return;};
    s_insert_error = function(result){
        sendTextMessage(uid, msg);
    }
    makeQuery(q_insert_error, e, s_insert_error);
}

// First function that gets called when someone sends a challenge
// Leads into sendChallenge
function setupChallenge(sender, username, stake_val){
    if (!stake_val) {
        stake_val = 0;
    }
    q_max_challenges = 'SELECT COUNT(*) from challenge_table WHERE sender = \''+sender+'\'';
    e_validate_val = function(err){
        sendError(sender, 44);
    };
    s_max_challenges = function(result){
        if (result.rows[0].count >= MAX_CHALLENGE_COUNT) {
            sendTextMessage(sender, "You already have 10 challenges pending. Please cancel some before issuing any more.");
        }
        else {
            q_validate_val = 'SELECT id, name, points, in_duel FROM user_table WHERE id = \'' + sender + '\' OR name = E\''+mysql_real_escape_string(username)+'\'';
            s_validate_val = function(result){
                if (result.rows.length != 2) {
                    sendTextMessage(sender, "Username not found. Please try again.");
                }
                else{
                    challenger_p = result.rows[0].points;
                    challenger_name = result.rows[0].name;
                    challenger_in_duel = result.rows[0].in_duel;
                    receiver_p = result.rows[1].points;
                    receiver_id = result.rows[1].id;
                    receiver_in_duel = result.rows[1].in_duel;
                    if (result.rows[1].id == sender) {
                        challenger_p = result.rows[1].points;
                        challenger_name = result.rows[1].name;
                        challenger_in_duel = result.rows[1].in_duel;
                        receiver_p = result.rows[0].points;
                        receiver_id = result.rows[0].id;
                        receiver_in_duel = result.rows[0].in_duel;
                    }
                    if (stake_val > challenger_p) {
                        sendTextMessage(sender, "You don't have enough coins for this stake!");
                        return;
                    }
                    if (stake_val > receiver_p) {
                        sendTextMessage(sender, username + " doesn't have enough coins for this stake!");
                        return;
                    }
                    if (challenger_in_duel) {
                        sendTextMessage(sender, "You are currently in a duel!");
                        return;
                    }
                    if (receiver_in_duel) {
                        sendTextMessage(sender, username+" is currently in a duel. Please try again later.");
                    }
                    else{
                        //both parties have enough points for the challenge and are not in duels
                        sendChallenge(sender, challenger_name, receiver_id, username, stake_val);
                    }
                }
            };
            makeQuery(q_validate_val, e_validate_val, s_validate_val);
        }
    };
    makeQuery(q_max_challenges, e_validate_val, s_max_challenges);
}

// @help
function sendHelpMessage(sender) {
    messageData = {
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"generic",
            "elements":[
              {
                "title":"Bot Fun: Help",
                "subtitle":"Commands that can be used outside of a duel. (1/2)",
                "image_url":"http://i.imgur.com/33ecJLi.png",
                "buttons":[{
                    "type":"web_url",
                    "url":"http://i.imgur.com/33ecJLi.png",
                    "title":"Larger image"
                }
                ]
              },
              {
                "title":"Bot Fun: Help",
                "subtitle":"Commands that can be used outside of a duel. (2/2)",
                "image_url":"http://i.imgur.com/Fc0gm4l.png",
                "buttons":[{
                    "type":"web_url",
                    "url":"http://i.imgur.com/Fc0gm4l.png",
                    "title":"Larger image"
                }
                ]
              },
              {
                "title":"Bot Fun: Help",
                "subtitle":"Commands that can be used during a duel.",
                "image_url":"http://i.imgur.com/bvgvgir.png",
                "buttons":[{
                    "type":"web_url",
                    "url":"http://i.imgur.com/bvgvgir.png",
                    "title":"Larger image"
                }
                ]
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

// @shop
function presentShop(sender) {
    messageData = {
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"generic",
            "elements":[
              {
                "title":"Shop For Some Gay Shit",
                "subtitle":"Welcome to Bompton",
                "image_url":"http://images.rapgenius.com/6d0f31c832f3dfbbc8ddb2ae0a6cb5fa.560x344x1.jpg"
              }
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

// Function used on register to get the user's personal information
function getUserInfo(sender) {
    request({
        url: 'https://graph.facebook.com/v2.6/' + sender ,
        qs: {fields:"first_name,last_name,profile_pic", access_token:token},
        method: 'GET',
    }, function(error, response, body) {
        if (error) {
            console.log('Error getting userinfo: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        } else {
            return body;
        }
    });
}

// @register
function registerUser(s, username) {
    pat = "^[A-Za-z0-9]{1,12}$";
    reg = new RegExp(pat);
    if (!reg.test(username) || username.length < 1 || username.length > 11) {
        sendTextMessage(s, "Invalid username. Usernames must be under 12 characters and can only contain letters and numbers. Please try again.");
    }
    else {
        request({
            url: 'https://graph.facebook.com/v2.6/' + sender ,
            qs: {fields:"first_name,last_name,profile_pic,gender", access_token:token},
            method: 'GET',
        }, function(error, response, body) {
            if (error) {
                console.log('Error getting userinfo: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            } else {
                body = JSONbig.parse(body);
                q_add_username = 'INSERT INTO user_table(id, name, first_name, last_name, profile_pic, gender, current_class) VALUES (\'' + s + '\', E\'' + mysql_real_escape_string(username) + '\', \'' + body.first_name + '\', \'' + body.last_name + '\', \'' + body.profile_pic + '\', \'' + body.gender + '\', 0)';
                e = function(err) {
                    if (err.detail.indexOf("already exists") > -1) {
                        sendTextMessage(s, "Username already exists, please try another.");
                    }
                    else {
                        sendError(s, 30);
                    }
                };
                s_add_username = function(result) {
                    sendTextMessage(s, "Username successfully registered! Type @help to learn more about the game.");
                };
                makeQuery(q_add_username, e, s_add_username);
            }
        });
    }
}

// @me
// Get game info about a user, related to @stats <username>
function getPersonalInfo(s){
    q_get_username = "SELECT name, points FROM user_table WHERE id = \'"+s+"\'";
    e = function(err){
        sendError(s,43);
    };
    s_get_username = function(result){
        if (result.rows.length != 1) {
            sendError(s, 44);
        }
        else{
            username = result.rows[0].name;
            getPendingChallenges(s);
            getStats(username, s);
        }
    };
    makeQuery(q_get_username, e, s_get_username);
}

// @challenge <username>, after setupChallenge
//invariant: neither party is in a duel and both parties have enough for the stake
function sendChallenge(sender, challenger_name, receiver_id, username, stake_val){
    q_insert_duel = 'INSERT into challenge_table values (' + sender + ', ' + receiver_id + ',default, '+stake_val+',1)';
    e_insert_duel = function(err) {
        if (err.detail.indexOf("already exists") > -1) {
            sendTextMessage(sender,"Challenge already pending, please wait...");
        }
        else {
            sendError(sender, 8);
            // sendTextMessage(sender, JSON.stringify(err).substring(0,200));
        }
    };
    s_insert_duel = function(result) {
        if (stake_val) {
            sendTextMessage(sender, "Challenged "+username+" for "+stake_val+" coins. Waiting for response...");
            sendTextMessage(receiver_id, "You have been challenged by "+challenger_name+" for "+stake_val+" coins. Type @accept/@reject "+challenger_name+" to accept or reject.");
        }
        else {
            sendTextMessage(sender, "Challenged "+username+" to a friendly duel. Waiting for response...");
            sendTextMessage(receiver_id, "You have been challenged by "+challenger_name+" to a friendly duel. Type @accept/@reject "+challenger_name+" to accept or reject.");
        }
    };
    makeQuery(q_insert_duel, e_insert_duel, s_insert_duel);
}

// @random
var trials = 0;
function randomChallenge(s) {
    s_get_random = function(result) {
        if (result.rows.length > 0) {
            r = result.rows[0].id;
            ru = result.rows[0].name;
            sendChallenge(s, su, r, ru, 0);
        }
        else if(trials < 5){
            trials+=1;
            randomChallenge(s);
        }
        else{
            sendTextMessage(s, "Could not find a random challenge at this time. Please try again later.");
        }
    };
    s_get_sender = function(result) {
        su = result.rows[0].name;
        s_in_duel = result.rows[0].in_duel;
        if (s_in_duel) {
            sendTextMessage(sender, "You are currently in a duel!");
        }
        else {
            q_get_random = "SELECT u.id, u.name, c.sender FROM user_table u LEFT OUTER JOIN challenge_table c ON (u.id = c.recipient) WHERE (c.sender IS NULL OR c.sender != \'"+s+"\') AND u.id != \'"+s+"\' OFFSET FLOOR(RANDOM() * (SELECT COUNT(*) FROM user_table)) LIMIT 1";
            makeQuery(q_get_random, e, s_get_random);
        }
    };
    e = function(err) {
        sendError(s, 110);
    };
    var rid, ru, su;
    q_get_sender = "select name, in_duel from user_table where id = '" + s + "'";
    makeQuery(q_get_sender, e, s_get_sender);
}

// @accept <username>, @reject <username>
//r (id) is responding to challenge from su (name) with response 
function respondToChallenge(su, r, response) {
    s_delete_challenge = function(result) {
        if (response) {
            // start duel
            stake_val = result.rows[0].val;
            if (sp < stake_val) {
                sendTextMessage(s, ru + " accepted your duel request, but you no longer have enough coins. Please re-issue the challenge.");
                sendTextMessage(r, "Request accepted, but " + su + " no longer has enough coins. Please re-issue the challenge.");
            }
            else if (rp < stake_val) {
                sendTextMessage(s, ru + " accepted your duel request, but no longer has enough coins. Please re-issue the challenge.");
                sendTextMessage(r, "Request accepted, but you no longer have enough coins. Please re-issue the challenge.");
            }
            else {
                setupDuel(s, r, stake_val);
                sendTextMessage(s, ru + " has accepted your request! Starting duel...");
                sendTextMessage(r, "Request accepted. Starting duel...");
            }
        }
        else {
            sendTextMessage(s, ru + " has rejected your challenge request.");
            sendTextMessage(r, "Request rejected.");
        }
    };

    s_get_challenge = function(result) {
        if (result.rows.length === 0) {
            sendTextMessage(r, "This challenge request has expired or does not exist.");
        }
        else if (result.rows.length > 1){
            sendError(r, 20);
        }
        else {
            q_delete_challenge = 'DELETE FROM challenge_table WHERE sender = \'' + s + '\' AND recipient = \'' + r + '\' RETURNING val';
            makeQuery(q_delete_challenge, e, s_delete_challenge);
        }
    };

    s_get_sender = function(result) {
        if (result.rows.length === 0) {
            sendTextMessage(r, "Username " + su + " does not exist.");
        }
        else if (result.rows.length > 1) {
            sendError(r, 17);
        }
        else {
            if(result.rows[0].in_duel !== 0){
                sendTextMessage(r,su + " is currently in a duel. Please try accepting again soon.");
            }
            else {
                s = result.rows[0].id;
                sp = result.rows[0].points;
                q_get_challenge = 'SELECT * FROM challenge_table WHERE sender = \'' + s + '\' AND recipient = \'' + r + '\'';
                makeQuery(q_get_challenge, e, s_get_challenge);
            }
        }
    };

    s_get_recipient = function(result) {
        if (result.rows.length === 0) {
            sendError(r, 13);
        }
        else if(result.rows[0].in_duel !== 0) {
            sendTextMessage(r, "You are currently in a duel!");
        }
        else {
            //username of the responder
            ru = result.rows[0].name;
            rp = result.rows[0].points;
            //get sender id and status
            q_get_sender = 'SELECT points, id, in_duel FROM user_table where name = E\'' + mysql_real_escape_string(su) + '\'';
            makeQuery(q_get_sender, e, s_get_sender);
        }
    };

    e = function(err) {
        sendError(r, 12);
    };
    var ru = 'none';
    var s = 'none';
    var rp, sp;
    q_get_recipient = 'SELECT points, name, in_duel FROM user_table where id= \'' + r + '\'';
    makeQuery(q_get_recipient, e, s_get_recipient);

}

// @cancel <username>
function cancelChallenge(s, u){
    q_cancel = "DELETE FROM challenge_table USING user_table WHERE sender=\'"+s+"\' AND recipient = user_table.id and user_table.name = E\'"+mysql_real_escape_string(u)+"\' RETURNING user_table.name, user_table.id";
    e = function(err){
        sendError(s, 46);
    };
    s_cancel = function(result){
        if (result.rows.length != 1) {
            e(null);
        }
        else{
            sendTextMessage(s, "Your challenge to "+u+" has been cancelled.");
        }
    };
    makeQuery(q_cancel, e, s_cancel);
}

// called from respondToDuel, on accept, followed by startDuel
// invariant: neither party is in a duel
function setupDuel(s, r, stake_val) {
    s_update_s = function(result) {
        startDuel(s,r, first);
    };
    s_insert_duel = function(result) {
        duel_id = result.rows[0].duel_id;
        q_update_s = 'UPDATE user_table SET in_duel = '+duel_id+' WHERE id = \'' + s + '\' OR id = \'' + r + '\'';
        makeQuery(q_update_s, e, s_update_s);
    };
    first = Math.random() < 0.5 ? s : r;
    e = function(err) {
        sendError(s, 22);
    };
    var duel_id = 'none';
    q_insert_duel = 'INSERT INTO duel_table(user_turn, sender_id, recipient_id, stake) VALUES (\'' + first + '\', \'' + s + '\', \'' + r + '\', '+stake_val+') RETURNING duel_id';
    makeQuery(q_insert_duel, e, s_insert_duel);

}

// starts the duel, called from setupDuel
function startDuel(s, r, f_id) {
    // q_duel = 'SELECT id, name FROM user_table where id= \'' + f_id + '\'';
    q_duel = 'SELECT id, name, current_class FROM user_table where id= \'' + s + '\' or id= \'' + r + '\'';
    e = function(err) {
        sendError(s, 25);
        sendError(r, 25);
    };
    s_duel = function(result) {
        s_index = s == result.rows[0].id ? 0 : 1;
        r_index = s_index ? 0 : 1;
        first_player = f_id == s ? s_index : r_index;
        s_class = result.rows[s_index].current_class ? " (" + classes[result.rows[s_index].current_class] + ")" : "";
        r_class = result.rows[r_index].current_class ? " (" + classes[result.rows[r_index].current_class] + ")" : "";
        // s goes first
        if (first_player == s_index) {
            sendTextMessage(s, "The duel with " + result.rows[r_index].name + r_class + " has begun! You have the first move. To message your opponent, just type normally in the chat.");
            sendTextMessage(r, "The duel with " + result.rows[s_index].name + s_class + " has begun! " + result.rows[s_index].name + " has the first move. To message your opponent, just type normally in the chat.");
        }
        else {
            sendTextMessage(r, "The duel with " + result.rows[s_index].name + s_class + " has begun! You have the first move. To message your opponent, just type normally in the chat.");
            sendTextMessage(s, "The duel with " + result.rows[r_index].name + r_class + " has begun! " + result.rows[r_index].name + " has the first move. To message your opponent, just type normally in the chat.");
        }
    };
    makeQuery(q_duel, e, s_duel);
}

// followed by makeMove
function makeMoveSetup(s, type){
    s_get_defender = function(result) {
        if (result.rows.length !== 1) {
            sendError(s, 34);
        }
        else{
            move.defender_name = result.rows[0].name;
            move.defender_gender = result.rows[0].gender;
            move.defender_class = result.rows[0].current_class;
            makeMove(move);
        }
    };
    s_get_duel = function(result) {
        data = result.rows[0];
        turn_id = data.user_turn;
        if (s != turn_id) {
            sendTextMessage(s, "It's not your turn. Please wait.");
        }
        else {
            //we know s is attacker. Is s sender_id or recipient_id?
            move.attacker_is_sender = isSender_id(s, data);
            move.defender_id = data.sender_id;
            move.health_defender = data.health_sender;
            move.health_attacker = data.health_recipient;
            move.potions_defender = data.sender_heal;
            move.potions_attacker = data.recipient_heal;
            move.bleed_defender = data.bleed_sender;
            move.bleed_attacker = data.bleed_recipient;
            move.stun_defender = data.stun_sender;
            move.stun_attacker = data.stun_recipient;
            if (move.attacker_is_sender) {
                move.defender_id = data.recipient_id;
                move.health_defender = data.health_recipient;
                move.health_attacker = data.health_sender;
                move.potions_defender = data.recipient_heal;
                move.potions_attacker = data.sender_heal;
                move.bleed_defender = data.bleed_recipient;
                move.bleed_attacker = data.bleed_sender;
                move.stun_defender = data.stun_recipient;
                move.stun_attacker = data.stun_sender;
            }
            //query for defender's name
            q_get_defender = 'SELECT name, gender, current_class FROM user_table WHERE id= \'' + move.defender_id + '\'';
            makeQuery(q_get_defender, e, s_get_defender);
        }
    };
    s_get_s = function(result) {
        if (result.rows.length !== 1) {
           sendError(s, 27);
        }
        else {
            move.duel_id = result.rows[0].in_duel;
            move.attacker_name = result.rows[0].name;
            move.attacker_gender = result.rows[0].gender;
            move.attacker_class = result.rows[0].current_class;
            if (move.duel_id === 0) {
                sendTextMessage(s, "You are not currently in a duel.");
            }
            else {
                q_get_duel = 'SELECT * FROM duel_table WHERE duel_id = ' + move.duel_id;
                makeQuery(q_get_duel, e, s_get_duel);
            }
        }
    };
    e = function(err) {
        sendError(s, 26);
    };
    var move = {
        type_of_attack: type,
        attacker_id: s
    };
    q_get_s = 'SELECT name, id, gender, in_duel, current_class FROM user_table where id= \'' + s + '\'';
    makeQuery(q_get_s, e, s_get_s);
}


// assumes a hit, not miss
// returns move damage, given user attack style, class, and health (for berserker)
function getDamage(attack, user_class, health) {
    var damage;
    function getTier(health) {
        for (var i = 0; i < 4; i++) {
            if (health > health_tiers[i]) {
                return i - 1;
            }
        }
        return 3;
    }

    // heal
    if (attack == "h") {
        return 10;
    }

    // berserker
    if (user_class == 3) {
        tier = getTier(health);
        damage = {
            max: attacks[user_class][attack][tier].max,
            min: attacks[user_class][attack][tier].min
        };
    }
    else {
        damage = {
            max: attacks[user_class][attack].max,
            min: attacks[user_class][attack].min
        };
    }

    return Math.floor(Math.random() * (damage.max - damage.min)) + damage.min;
}

// called by makeMoveSetup
//invariant: it is currently the attacker's turn
// move: type_of_attack, attacker/defender/duel_id, attacker/defender_name
// attacker/defender_health, attacker_is_sender, potions_attacker/defender
// bleed_attacker/defender, stun_attacker/defender, attacker_gender, attacker/defender_class
function makeMove(move){
    move.bleed = 0;
    move.vampire = 0;
    var q_update_duel;
    var verb = verbs[move.type_of_attack];

    // attack_value = Math.random() > miss ? (Math.floor(Math.random() * (max - min)) + min) : 0;
    // attack_value = move.type_of_attack == "h" ? 10 : getDamage(move.type_of_attack, move.attacker_class, move.attacker_health);
    
    attack_value = Math.random() > attacks[move.attacker_class][move.type_of_attack].miss ? getDamage(move.type_of_attack, move.attacker_class, move.attacker_health) : 0;

    // dealing with heal
    if (move.type_of_attack == "h") {
        if (move.potions_attacker) {
            move.health_attacker = Math.min(move.health_attacker + attack_value, max_health);
            // if the opponent is bleeding, still do damage
            if (move.bleed_defender) {
                move.bleed = Math.floor(Math.random() * (5 - 2)) + 2;
                move.health_defender = move.health_defender - move.bleed;
                attack_value = move.bleed;
                move.bleed_defender -= 1;
            }

            q_update_duel = 'UPDATE duel_table SET user_turn = \'' + move.defender_id + '\', health_recipient = '+move.health_attacker + ', health_sender = ' + move.health_defender + ', recipient_heal = recipient_heal - 1, moves_in_duel = moves_in_duel + 1, pressure_time = null, bleed_sender = ' + move.bleed_defender + 'WHERE duel_id = '+ move.duel_id;
            if (move.attacker_is_sender) {
                q_update_duel = 'UPDATE duel_table SET user_turn = \'' + move.defender_id + '\', health_sender = '+move.health_attacker + ', health_recipient = ' + move.health_defender + ', sender_heal = sender_heal - 1, moves_in_duel = moves_in_duel + 1, pressure_time = null, bleed_recipient = ' + move.bleed_defender + 'WHERE duel_id = '+ move.duel_id;
            }
        }
        else {
            sendTextMessage(move.attacker_id, "You do not have any potions left.");
            return;
        }
    }
    else {
        // vampire
        if (move.attacker_class == 2 && Math.random() > 0.5 && attack_value) {
            move.vampire = Math.floor(attack_value / 2);
            move.health_attacker += move.vampire;

        }
        move.health_defender = move.health_defender - attack_value;
        // update the duel
        // stun, just keep the next turn id the same
        next = move.defender_id;
        if (move.type_of_attack == "c" && attack_value > 0 && Math.random() < 0.3) {
            next = move.attacker_id;
            move.stun = true;
        }
        // bleed
        if (move.type_of_attack == "d" && attack_value > 0 && Math.random() < 0.3) {
            move.bleed_defender = 3;
        }
        if (move.bleed_defender) {
            move.bleed = Math.floor(Math.random() * (5 - 2)) + 2;
            move.health_defender -= move.bleed;
            move.bleed_defender -= 1;
        }
        q_update_duel = 'UPDATE duel_table SET user_turn = \'' + next + '\', health_recipient = ' + move.health_attacker + ', health_sender = '+ move.health_defender +', moves_in_duel = moves_in_duel + 1, pressure_time = null, bleed_sender = ' + move.bleed_defender + ' WHERE duel_id = '+ move.duel_id;
        if (move.attacker_is_sender) {
            q_update_duel = 'UPDATE duel_table SET user_turn = \'' + next + '\', health_sender = ' + move.health_attacker + ', health_recipient = '+ move.health_defender +', moves_in_duel = moves_in_duel + 1, pressure_time = null, bleed_recipient = ' + move.bleed_defender + ' WHERE duel_id = '+ move.duel_id;
        }
    }

    // if the defender is dead
    // at this point, health_defender is the health after attack and poison
    // attack_value is the value of just the attack
    // move.bleed is the value of the bleed
    if (move.health_defender <= 0 && move.type_of_attack != 'h') {
        def_gender_noun = move.defender_gender == "male" ? "He" : "She";
        // if you're bleeding when you lose
        if (move.bleed) {
            sendTextMessage(move.defender_id, "You're bleeding! You lost " + move.bleed + " health. (" + move.bleed_defender + " turn(s) remaining)");
            sendTextMessage(move.attacker_id, move.defender_name + " is bleeding! " + def_gender_noun + " lost " + move.bleed + " health. (" + move.bleed_defender + " turn(s) remaining)");
        }
        // if the bleed killed you
        if (move.health_defender + attack_value < 0) {
            loseDuel(move.defender_id, move.attacker_id, move.defender_name, move.attacker_name, move.duel_id);
        }
        // either you're not bleeding or the bleed didn't kill you
        else {
            attack_value = attack_value + move.health_defender;
            sendTextMessage(move.defender_id, move.attacker_name + " " + verb + " you for " + attack_value + " hp!");
            sendTextMessage(move.attacker_id, "You " + verb + " " + move.defender_name + " for " + attack_value + " hp!");
            loseDuel(move.defender_id, move.attacker_id, move.defender_name, move.attacker_name, move.duel_id);
        }
        return;
    }

    e = function(err){
        sendError(move.attacker_id, 60, JSON.stringify(err).substring(0,300));
    };
    s_update_duel = function(result){
        def_gender_noun = move.defender_gender == "male" ? "He" : "She";
        if (move.bleed) {
            sendTextMessage(move.defender_id, "You're bleeding! You lost " + move.bleed + " health. (" + move.bleed_defender + " turn(s) remaining)");
            sendTextMessage(move.attacker_id, move.defender_name + " is bleeding! " + def_gender_noun + " lost " + move.bleed + " health. (" + move.bleed_defender + " turn(s) remaining)");
        }
        if (move.vampire) {
            sendTextMessage(move.defender_id,  move.attacker_name + " regenerated " + move.vampire + " health.");
            sendTextMessage(move.attacker_id,  "You drained " + move.defender_name + " for " + move.vampire + " health!");
        }
        if (move.type_of_attack === "h") {
            att_gender_noun = move.attacker_gender == "male" ? "himself" : "herself";
            sendTextMessage(move.defender_id, move.attacker_name + " " + verb + " " + att_gender_noun + "!");
            sendTextMessage(move.attacker_id, "You " + verb + " yourself!");
            health = makeHealthBars(move.attacker_name, move.health_attacker, move.defender_name, move.health_defender, max_health);
            sendTextMessage(move.defender_id, health);
            sendTextMessage(move.attacker_id, health);
        }
        else {
            if (attack_value === 0) {
                sendTextMessage(move.defender_id, move.attacker_name + " missed!");
                sendTextMessage(move.attacker_id, "You missed!");
            }
            else {
                sendTextMessage(move.defender_id, move.attacker_name + " " + verb + " you for " + attack_value + " health!");
                sendTextMessage(move.attacker_id, "You " + verb + " " + move.defender_name + " for " + attack_value + " health!");
            }
            if (move.stun) {
                sendTextMessage(move.defender_id, "You've been stunned!");
                sendTextMessage(move.attacker_id, "You stunned " + move.defender_name + "!");
            }
            health = makeHealthBars(move.attacker_name, move.health_attacker, move.defender_name, move.health_defender, max_health);
            sendTextMessage(move.defender_id, health);
            sendTextMessage(move.attacker_id, health);
        }
    };
    makeQuery(q_update_duel, e, s_update_duel);
}

function makeHealthBars(aname, ahp, dname, dhp, maxhp) {
    function makeHealth(name, hp) {
        hp = Math.max(hp, 0);
        health = Math.min(Math.ceil(hp / (maxhp / 20)), 20);
        damage = 20 - health;
        return Array(health + 1).join("▓") + Array(damage + 1).join("▒") + " " + hp;
    }
    return aname + "\n" + makeHealth(aname, ahp) + "\n" + dname + "\n" + makeHealth(dname, dhp);
}

//data is a row from duel_table
function isSender_id(id, data){
    return id == data.sender_id;
}

function forfeitDuel(lid) {
    q_get_did = "SELECT in_duel FROM user_table where id = \'" + lid + "\'";
    var in_duel = -1;
    e = function(err) {
        sendError(lid, 38);
    };
    s_get_all_info = function(result) {
        loser = result.rows[0];
        winner = result.rows[1];
        if (lid != loser.id) {
            loser = result.rows[1];
            winner = result.rows[0];
        }
        sendTextMessage(loser.id, "You have forfeited.");
        sendTextMessage(winner.id, loser.name + " has forfeited.");
        loseDuel(loser.id, winner.id, loser.name, winner.name, in_duel);
    };
    s_get_did = function(result) {
        data =result.rows[0];
        if (data.in_duel) {
            q_get_all_info = "SELECT u.name, u.id, d.stake FROM duel_table d INNER JOIN user_table u ON (u.id = d.recipient_id OR u.id = d.sender_id) WHERE d.duel_id = " + data.in_duel;
            in_duel = data.in_duel;
            makeQuery(q_get_all_info, e, s_get_all_info);
        }
        else {
            sendTextMessage(lid,"You are not currently in a duel.");
        }
    };
    makeQuery(q_get_did, e, s_get_did);
}

function loseDuel(lid, wid, lname, wname, did) {
    sendTextMessage(lid, "You were defeated by " + wname + ". Duel ending in 5 seconds...");
    sendTextMessage(wid, "You have defeated " + lname + "! Duel ending in 5 seconds...");
    setTimeout(function(){
        var stake = 0;
        e = function(err) {
            sendError(lid, 27);
            sendError(wid, 27);
        };
        s_update_w = function(result) {
            sendTextMessage(lid, "The duel has ended.");
            sendTextMessage(wid, "The duel has ended.");
        };
        s_update_l = function(result) {
            if (!stake) {
                stake = 10;
            }
            q_update_w = "UPDATE user_table SET in_duel = 0, wins=wins+1, games_played=games_played+1, points = points +"+stake+"  WHERE id = \'" + wid + "\'";
            makeQuery(q_update_w, e, s_update_w);
        };
        s_update_d = function(result) {
            stake = result.rows[0].stake;
            q_update_l = "UPDATE user_table SET in_duel = 0, losses=losses+1, games_played=games_played+1, points = points -"+stake+" WHERE id = \'" + lid + "\'";
            makeQuery(q_update_l, e, s_update_l);
        };
        q_update_d = "UPDATE duel_table SET winner_id = \'" + wid + "\' WHERE duel_id = \'" + did + "\' RETURNING stake";
        makeQuery(q_update_d, e, s_update_d);
    }, 5000);
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
            if (text.charAt(0) == "@") {
                sendTextMessage(s, "Not a valid command. Type @help for a list of commands.");
            }
            else {
                sendTextMessage(s, "Why are you talking to yourself? \"" + text + "\"");
            }
        }
    };
    makeQuery(q_get_user_info, e, s_get_user_info);
}

function listFriends(s) {
    s_get_friends = function(result) {
        num_messages = Math.ceil(result.rows.length / 20);
        if (result.rows.length === 0) {
            sendTextMessage(s, "Add some friends to get started! (Ex. @friend jeff)");
        }
        else {
            for (i = 0; i < num_messages; i++) {
                friend_string = "Friends:\n";
                for (j = 20 * i; j < Math.min(result.rows.length, 20 * (i + 1)); j++) {
                    if (j % 20 === 19) {
                        friend_string += result.rows[j].name + " - " + result.rows[j].fname;
                    }
                    else {
                        friend_string += result.rows[j].name + " - " + result.rows[j].fname + "\n";
                    }
                }
                sendTextMessage(s, friend_string);
            }
        }
    };
    e = function(err) {
        sendError(s, 112);
    };
    q_get_friends = "select u.name as \"name\", u.first_name as \"fname\" from friend_table f join user_table u on (f.friend_id = u.id)";
    makeQuery(q_get_friends, e, s_get_friends);
}

function addFriend(s, fu) {
    s_add_friend = function(result) {
        sendTextMessage(s, fu + " added to your friends list! Type @friends to see all friends.");
    };
    s_validate_fu = function(result) {
        if (result.rows.length) {
            fid = result.rows[0].id;
            q_add_friend = "insert into friend_table(owner_id, friend_id) VALUES (" + s + ", " + fid + ")";
            makeQuery(q_add_friend, e, s_add_friend);
        }
        else {
            sendTextMessage(s, "Username not found. Please try again.");
        }
    };
    e = function(err) {
        if (err.detail.indexOf("already exists") > -1) {
            sendTextMessage(s,"This person is already on your friends list!");
        }
        else {
            sendError(s, 114);
        }
    };
    q_validate_fu = "select id from user_table where name = E\'" + mysql_real_escape_string(fu) + "\'";
    makeQuery(q_validate_fu, e, s_validate_fu);
}

function getStats(user, s){
    q_get_stats = "SELECT * FROM user_table where name= E\'" + mysql_real_escape_string(user) + "\'";
    e = function(err){
        sendError(s, 32);
    };
    success = function(result){
        if (result.rows.length == 1) {
            data = result.rows[0];
            pct = (100*data.wins/data.games_played).toFixed(2);
            if (data.games_played === 0) {
                pct = "N/A";
            }
            user_class = result.rows[0].current_class ? " (" + classes[result.rows[0].current_class] + ")" : "";
            sendTextMessage(s, "STATS: " + user + user_class + "\nWins: " + data.wins + "\nLosses: " + data.losses+"\nDraws: " + data.draws + "\nGames: " + data.games_played + "\nWin %: " + pct);
            if (data.id == s) {
                sendTextMessage(s, "You have "+ data.points+" coins.");
            }else{
                sendTextMessage(s, user + " has "+ data.points+" coins.");
            }

        }
        else{
            sendTextMessage(s, "User not found.");
        }

    };
    makeQuery(q_get_stats, e, success);
}

//username optional
function getPendingChallenges(s){
    q_name = "SELECT name FROM user_table where id= \'" + s + "\'";
    e = function(err){
        sendError(s, 37);
    };
    s_name = function(result){
        if (result.rows.length != 1) {
            sendError(s, 34);
        }
        else{
            name = result.rows[0].name;
            q_get_challenges = "SELECT u.name as \"sender\", u2.name as \"recipient\", c.val from challenge_table c join user_table u on (u.id = c.sender) left join user_table u2 on (u2.id = c.recipient) where u.name = \'" + name + "\' OR u2.name = \'" + name + "\'";
            s_get_challenges = function(result){
                if (!result.rows.length) {
                    sendTextMessage(s, "You have no current pending challenges.");
                }
                else{
                    //challenges they're sender
                    result_string = "You've challenged:";
                    for (var i = result.rows.length - 1; i >= 0; i--) {
                        sender_val = result.rows[i].sender;
                        val = result.rows[i].val;
                        if (sender_val == name) {
                            result_string+="\n";
                            result_string += result.rows[i].recipient;
                            result_string += " - ";
                            result_string += val + " coins";
                        }
                    }
                    if (result_string !== "You've challenged:") {
                        sendTextMessage(s, result_string);
                    }
                    //get a list of challenges they're recipient
                    result_string = "You've been challenged by:";
                    for (i = result.rows.length - 1; i >= 0; i--) {
                        recip_val = result.rows[i].recipient;
                        val = result.rows[i].val;
                        if (recip_val == name) {
                            result_string+="\n";
                            result_string += result.rows[i].sender;
                            result_string += " - ";
                            result_string += val + " coins";
                        }
                    }
                    if (result_string !== "You've been challenged by:") {
                        sendTextMessage(s, result_string);
                    }
                }
            };
            makeQuery(q_get_challenges, e, s_get_challenges);
        }
    };
    makeQuery(q_name, e, s_name);
}

function setPressure(s){
    q_user_in_duel = "SELECT duel_id FROM duel_table WHERE winner_id='none' AND (sender_id =\'"+s+"\' OR recipient_id=\'"+s+"\')";
    e = function(err){
        sendError(s, 50);
    };
    s_user_in_duel = function(result){
        if (result.rows.length != 1) {
            sendTextMessage(s, "You are not currently in a duel!");
        }else{
            duel_id = result.rows[0].duel_id;
            q_update_duel = "UPDATE duel_table SET pressure_time = now() WHERE duel_id="+duel_id+" AND user_turn !=\'"+s+"\' RETURNING user_turn, sender_id, recipient_id";
            makeQuery(q_update_duel, e, s_update_duel);
        }
    };
    s_update_duel = function(result){
        if (result.rows.length != 1) {
            sendTextMessage(s, "It is currently your turn, please make a move.");
        }else{
            user_turn = result.rows[0].user_turn;
            sender_id = result.rows[0].sender_id;
            recipient_id = result.rows[0].recipient_id;
            if (s == sender_id) {
                sendTextMessage(sender_id, "Your opponent has 30 seconds to make a move.");
                sendTextMessage(recipient_id, "Your opponent has pressured you. You now have 30 seconds to make a move.");
            }else{
                sendTextMessage(recipient_id, "Your opponent has 30 seconds to make a move.");
                sendTextMessage(sender_id, "Your opponent has pressured you. You now have 30 seconds to make a move.");
            }
        }
    }
    makeQuery(q_user_in_duel, e, s_user_in_duel);
}

function userFeedback(s, feedback) {
    q_feedback = 'INSERT INTO feedback_table(id, feedback) VALUES (\'' + s + '\', E\'' + mysql_real_escape_string(feedback.substr(0, 1000)) + '\')';
    e = function(err){
        console.log(err);
        sendError(s, 105);
    };
    s_feedback = function(result) {
        sendTextMessage(s, "Thanks for your feedback! We really appreciate it.");
    };
    makeQuery(q_feedback, e, s_feedback);
}

function purchase(sender, classname){
    q_points = 'SELECT in_duel, points FROM user_table WHERE id =\''+sender+'\'';
    e=function(err){
        sendError(sender, 123);
    };
    s_points = function(result){
        if (result.rows.length != 1) {
            sendError(sender, 124);
        }else{
            if (result.rows[0].in_duel > 0) {
                sendTextMessage(sender, "You cannot do this during a duel.");
                return;
            }
            classNum = validClass(classname);
            if (classNum == -1) {
                sendTextMessage(sender, "Invalid purchase name.");
                return;
            }
            else if(result.rows[0].points < class_cost){
                sendTextMessage(sender, "You do not have enough points to purchase this.");
                return;
            }
            q_already_owned = "SELECT id, class from user_classes WHERE id=\'"+sender+"\' AND class="+classNum;
            s_already_owned = function(result){
                if (result.rows.length > 1) {
                    sendError(sender, 125);
                }else{
                    if (result.rows.length == 1) {
                        sendTextMessage(sender, "You already own this class.");
                    }else{
                        q_purchase = "UPDATE user_table SET points = points-"+class_cost+" WHERE id=\'"+sender+"\'";
                        s_purchase = function(result){
                            q_new_class = "INSERT INTO user_classes(id, class) VALUES (\'"+sender+"\', "+classNum+")";
                            s_new_class = function(result){
                                sendTextMessage(sender, "Successfully purchased the "+classes[classNum]+" class!");
                            };
                            makeQuery(q_new_class, e, s_new_class);
                        };
                        makeQuery(q_purchase, e, s_purchase);
                    }
                }
            };
            makeQuery(q_already_owned, e, s_already_owned);
        }
    };
    makeQuery(q_points, e, s_points);
}

function changeClass(sender, classname) {
    classNum = validClass(classname);
    if (classNum == -1) {
        sendTextMessage(sender, "Invalid class name.");
        return;
    }
    s_update_class = function(result) {
        sendTextMessage(sender, "Class successfully changed!");
    };
    s_check_unlock = function(result) {
        if (result.rows.length) {
            q_update_class = "UPDATE user_table SET current_class = " + classNum + " WHERE id = '" + sender + "'";
        }
        else {
            sendTextMessage(sender, "You have not unlocked this class. Use the shop to unlock it!");
        }
    };

    e = function(err){
        sendError(sender, 124);
    };

    q_check_unlock = "SELECT * from user_classes WHERE id = '" + sender + "' AND class = " + classNum;
    makeQuery(q_check_unlock, e, s_check_unlock);
}

// add tolowercase
function validClass(text){
    for (var classNum in classes) {
        if (classNum !== 0 && classes[classNum] == text) {
            return classNum;
        }
    }
    return -1;
}
