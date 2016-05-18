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


var max_health = 50;
// Process application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({extended: false}));

// Process application/json
// app.use(bodyParser.json());

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

// Index route
app.get('/', function (req, res) {
    res.send('BOT FUN - a messenger chat game.');
});

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'we_are_astronauts_baby_8409') {
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
        sender = event.sender.id.toString();
        if (event.message && event.message.text) {
            text = event.message.text;
            words = text.split(" ");
            username = words[words.length - 1];
            getUserInfo(sender);
            q_user_registered = "SELECT * FROM user_table where id = \'" + sender + "\'";
            e = function(err) {
                sendError(sender, 31);
            };
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
                        case "@help":
                            sendHelpMessage(sender);
                            break;
                        case "@about":
                            sendTextMessage(sender, "Bot Fun - a text based game by Jeff Chang and Roy Falik.");
                            break;
                        case "@register":
                            sendTextMessage(sender, "You are already registered!");
                            break;
                        case "@me":
                            getPersonalInfo(sender);
                            break;
                        case "@challenge":
                            q_challenge = 'SELECT id FROM user_table WHERE name = \'' + mysql_real_escape_string(username) + '\'';
                            e = function(err) {
                                sendError(sender, 1);
                            };
                            s_challenge = function(result) {
                                if (result.rows.length === 0) {
                                    sendError(sender, 2, "Username not found. Please try again.");
                                }
                                else {
                                    challenge_id = result.rows[0].id;
                                    if (challenge_id == sender+"") {
                                        sendTextMessage(sender, "You cannot challenge yourself!");
                                    } else
                                        sendChallenge(sender, challenge_id, username);
                                }
                            };
                            makeQuery(q_challenge, e, s_challenge);
                            break;
                        case "@accept":
                            // respondToChallengeSetup(username, sender, true);
                            respondToChallenge(username, sender, true);
                            break;
                        case "@reject":
                            // respondToChallengeSetup(username, sender, false);
                            respondToChallenge(username, sender, false);
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
                            getStats(username, sender);
                            break;
                        case "@challenges":
                            getPendingChallenges(sender);
                            break;
                        default:
                            sendNormalMessage(sender, text);
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

function sendHelpMessage(sender) {
    messageData = {
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"generic",
            "elements":[
              {
                "title":"Bot Fun: Help",
                "subtitle":"Commands that can be used outside of a duel.",
                "image_url":"http://i.imgur.com/72NClPr.png"
              },
              {
                "title":"Bot Fun: Help",
                "subtitle":"Commands that can be used during a duel.",
                "image_url":"http://i.imgur.com/ZnCadyq.png"
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

function getUserInfo(sender) {
    // curl -X GET "https://graph.facebook.com/v2.6/<USER_ID>?fields=first_name,last_name,profile_pic&access_token=<PAGE_ACCESS_TOKEN>"
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
                q_add_username = 'INSERT INTO user_table(id, name, first_name, last_name, profile_pic, gender) VALUES (\'' + s + '\', \'' + username + '\', \'' + body.first_name + '\', \'' + body.last_name + '\', \'' + body.profile_pic + '\', \'' + body.gender + '\')';
                e = function(err) {
                    if (err.detail.indexOf("already exists") > -1) {
                        sendError(s, 29, "Username already exists, please try another.");
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

function getPersonalInfo(s){
    q_get_username = "SELECT name FROM user_table WHERE id = \'"+s+"\'";
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

function sendChallenge(s, r, ru) {
    s_validate_recipient = function(result) {
        if (result.rows.length === 0) {
            sendError(s, 10);
        }
        else if(result.rows[0].in_duel > 0){
            sendError(s, 11, ru + " is already in a duel.");
        }
        else{
            sendTextMessage(s, "Challenge sent! Waiting for " + ru + " to respond...");
            sendTextMessage(r, su + " has challenged you to a duel! Reply @accept " + su + " or @reject " + su + " to respond.");
        }
    };

    s_insert_duel = function(result) {
        q_validate_recipient = 'SELECT * from user_table WHERE id = \'' + r + '\'';
        makeQuery(q_validate_recipient, e, s_validate_recipient);
    };

    e_insert_duel = function(err) {
        if (err.detail.indexOf("already exists") > -1) {
            sendError(s, 7, "Challenge already pending, please wait...");
        }
        else {
            sendError(s, 8);
        }
    };

    s_validate_sender = function(result) {
        if (result.rows.length != 1) {
            sendError(s, 42);
        }
        else if(result.rows[0].in_duel > 0){
            sendError(s, 6, "You are already in a duel.");
        }
        else {
            q_insert_duel = 'INSERT into challenge_table values (' + s + ", " + r + ')';
            makeQuery(q_insert_duel, e_insert_duel, s_insert_duel);
        }
    };

    s_get_username = function(result) {
        if (result.rows.length === 0) {
            sendError(s, 41);
        }
        else {
            su = result.rows[0].name;
            q_validate_sender = 'SELECT name, in_duel FROM user_table where id= \'' + s + '\'';
            makeQuery(q_validate_sender, e, s_validate_sender);
        }
    };

    e = function(err) {
        sendError(s, 40);
    };
    var su = "none";
    q_get_username = 'SELECT name FROM user_table where id= \'' + s + '\'';
    makeQuery(q_get_username, e, s_get_username);
}

//r (id) is responding to challenge from su (name) with response 
function respondToChallenge(su, r, response) {
    s_delete_challenge = function(result) {
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
    };

    s_get_challenge = function(result) {
        if (result.rows.length === 0) {
            sendError(r, 19, "This challenge request has expired or does not exist.");
        }
        else if (result.rows.length > 1){
            sendError(r, 20);
        }
        else {
            q_delete_challenge = 'DELETE FROM challenge_table WHERE sender = \'' + s + '\' AND recipient = \'' + r + '\'';
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
                sendError(r, 18, su + " is currently in a duel. Please try accepting again soon.");
            }
            else {
                s = result.rows[0].id;
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
            sendError(r, 14, "You are currently in a duel!");
        }
        else {
            //username of the responder
            ru = result.rows[0].name;
            //get sender id and status
            q_get_sender = 'SELECT id, in_duel FROM user_table where name = \'' + su + '\'';
            makeQuery(q_get_sender, e, s_get_sender);
        }
    };

    e = function(err) {
        sendError(r, 12);
    };
    var ru = 'none';
    var s = 'none';
    q_get_recipient = 'SELECT name, in_duel FROM user_table where id= \'' + r + '\'';
    makeQuery(q_get_recipient, e, s_get_recipient);

}

// invariant: neither party is in a duel
function setupDuel(s, r) {
    s_update_r = function(result) {
        startDuel(s,r, first);
    };
    s_update_s = function(result) {
        q_update_r = 'UPDATE user_table SET in_duel = '+duel_id+' WHERE id = \'' + r + '\'';
        makeQuery(q_update_r, e, s_update_r);
    };
    s_insert_duel = function(result) {
        duel_id = result.rows[0].duel_id;
        q_update_s = 'UPDATE user_table SET in_duel = '+duel_id+' WHERE id = \'' + s + '\'';
        makeQuery(q_update_s, e, s_update_s);
    };
    first = Math.random() < 0.5 ? s : r;
    e = function(err) {
        sendError(s, 22);
    };
    var duel_id = 'none';
    q_insert_duel = 'INSERT INTO duel_table(user_turn, sender_id, recipient_id) VALUES (\'' + first + '\', \'' + s + '\', \'' + r + '\') RETURNING duel_id';
    makeQuery(q_insert_duel, e, s_insert_duel);
}

function startDuel(s, r, f_id) {
    q_duel = 'SELECT id, name FROM user_table where id= \'' + f_id + '\'';
    e = function(err) {
        sendError(s, 25);
        sendError(r, 25);
    };
    s_duel = function(result) {
        first = result.rows[0].name;
        if (result.rows[0].id == s) {
            sendTextMessage(s, "The duel has begun! You have the first move.");
            sendTextMessage(r, "The duel has begun! " + first + " has the first move.");
        }
        else {
            sendTextMessage(r, "The duel has begun! You have the first move.");
            sendTextMessage(s, "The duel has begun! " + first + " has the first move.");
        }
    };
    makeQuery(q_duel, e, s_duel);
}

function makeMoveSetup(s, type){
    s_get_defender = function(result) {
        if (result.rows.length !== 1) {
            sendError(s, 34);
        }
        else{
            move.defender_name = result.rows[0].name;
            makeMove(move);
        }
    };
    s_get_duel = function(result) {
        data = result.rows[0];
        turn_id = data.user_turn;
        if (s != turn_id) {
            sendError(s, 35, "It's not your turn. Please wait.");
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
            q_get_defender = 'SELECT name FROM user_table WHERE id= \'' + move.defender_id + '\'';
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
            if (move.duel_id === 0) {
                sendError(s, 36, "You are not currently in a duel.");
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
    q_get_s = 'SELECT name, id, in_duel FROM user_table where id= \'' + s + '\'';
    makeQuery(q_get_s, e, s_get_s);
}

//invariant: it is currently the attacker's turn
// move: type_of_attack, attacker/defender/duel_id, attacker/defender_name
// attacker/defender_health, attacker_is_sender, potions_attacker/defender
// bleed_attacker/defender, stun_attacker/defender, attacker_gender
function makeMove(move){
    var q_update_duel;
    var attacks = {
        h: {miss: 0, min: 10, max: 10, verb: 'healed'},
        s: {miss: 0.25, min: 9, max: 12, verb: 'slashed'},
        d: {miss: 0.15, min: 5, max: 7, verb: 'stabbed'},
        c: {miss: 0.5, min: 12, max: 17, verb: 'crushed'}
    };
    var attack = attacks[move.type_of_attack];
    var max = attack.max; var min = attack.min; var verb = attack.verb; var miss = attack.miss;
    var new_health_att;
    var new_health_def;

    attack_value = Math.random() > miss ? (Math.floor(Math.random() * (max - min)) + min) : 0;

    if (attack_value >= move.health_defender && move.type_of_attack != 'h') {
        attack_value = move.health_defender;
        sendTextMessage(move.defender_id, move.attacker_name + " " + verb + " you for " + attack_value + " hp!");
        sendTextMessage(move.attacker_id, "You " + verb + " " + move.defender_name + " for " + attack_value + " hp!");
        loseDuel(move.defender_id, move.attacker_id, move.defender_name, move.attacker_name, move.duel_id);
        return;
    }
    
    if (move.type_of_attack == "h") {
        if (move.potions_attacker) {
            sendTextMessage(attacker_id, move.attacker_gender);
            new_health_att = Math.min(move.health_attacker + attack_value, max_health);
            // update the duel
            q_update_duel = 'UPDATE duel_table SET user_turn = \'' + move.defender_id + '\', health_recipient = '+new_health_att+', recipient_heal = recipient_heal - 1, moves_in_duel = moves_in_duel + 1, WHERE duel_id = '+ move.duel_id;
            if (move.attacker_is_sender) {
                q_update_duel = 'UPDATE duel_table SET user_turn = \'' + move.defender_id + '\', health_sender = '+new_health_att+', sender_heal = sender_heal - 1, moves_in_duel = moves_in_duel + 1 WHERE duel_id = '+ move.duel_id;
            }
        }
        else {
            sendTextMessage(move.attacker_id, "You do not have any potions left.");
            return;
        }
    }
    else {
        new_health_def = move.health_defender - attack_value;
        // update the duel
        q_update_duel = 'UPDATE duel_table SET user_turn = \'' + move.defender_id + '\', health_sender = '+new_health_def+', moves_in_duel = moves_in_duel + 1 WHERE duel_id = '+ move.duel_id;
        if (move.attacker_is_sender) {
            q_update_duel = 'UPDATE duel_table SET user_turn = \'' + move.defender_id + '\', health_recipient = '+new_health_def+', moves_in_duel = moves_in_duel + 1 WHERE duel_id = '+ move.duel_id;
        }
    }
    e = function(err){
        sendError(move.attacker_id, 40);
    };
    s_update_duel = function(result){
        if (move.type_of_attack === "h") {
            gender_noun = move.attacker_gender == "male" ? "himself" : "herself";
            sendTextMessage(move.defender_id, move.attacker_name + " " + verb + " " + gender_noun + "!");
            sendTextMessage(move.attacker_id, "You " + verb + " yourself!");
            health = makeHealthBars(move.attacker_name, new_health_att, move.defender_name, move.health_defender, max_health);
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
            health = makeHealthBars(move.attacker_name, move.health_attacker, move.defender_name, new_health_def, max_health);
            sendTextMessage(move.defender_id, health);
            sendTextMessage(move.attacker_id, health);
            move.health_attacker = new_health_att;
            move.health_defender = new_health_def;
            makeMovePassives(move);
        }
    };
    makeQuery(q_update_duel, e, s_update_duel);
}

function makeMovePassives(move) {
    sendTextMessage(move.attacker_id, "pass");
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
            q_get_all_info = "SELECT u.name, u.id FROM duel_table d INNER JOIN user_table u ON (u.id = d.recipient_id OR u.id = d.sender_id) WHERE d.duel_id = " + data.in_duel;
            in_duel = data.in_duel;
            makeQuery(q_get_all_info, e, s_get_all_info);
        }
        else {
            sendError(lid, 39, "You are not currently in a duel.");
        }
    };
    makeQuery(q_get_did, e, s_get_did);
}

function loseDuel(lid, wid, lname, wname, did) {
    sendTextMessage(lid, "You were defeated by " + wname + ". Duel ending in 5 seconds...");
    sendTextMessage(wid, "You have defeated " + lname + "! Duel ending in 5 seconds...");
    setTimeout(function(){
        q_update_l = "UPDATE user_table SET in_duel = 0, wins=wins+1, games_played=games_played+1 WHERE id = \'" + wid + "\'";
        q_update_w = "UPDATE user_table SET in_duel = 0, losses=losses+1, games_played=games_played+1 WHERE id = \'" + lid + "\'";
        q_update_d = "UPDATE duel_table SET winner_id = \'" + wid + "\' WHERE duel_id = \'" + did + "\'";
        e = function(err) {
            sendError(lid, 27);
            sendError(wid, 27);
        };
        s_update_l = function(result) {
            sendTextMessage(lid, "The duel has ended.");
            sendTextMessage(wid, "The duel has ended.");
        };
        s_update_w = function(result) {
            makeQuery(q_update_l, e, s_update_l);
        };
        s_update_d = function(result) {
            makeQuery(q_update_w, e, s_update_w);
        };
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

function getStats(user, s){
    q_get_stats = "SELECT * FROM user_table where name= \'" + user + "\'";
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
            sendTextMessage(s, "STATS: " + user + "\nWins: " + data.wins + "\nLosses: " + data.losses+"\nDraws: " + data.draws + "\nGames: " + data.games_played + "\nWin %: " + pct);
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
    }
    s_name = function(result){
        if (result.rows.length != 1) {
            sendError(s, 34);
        }
        else{
            name = result.rows[0].name;
            q_get_challenges = "SELECT u.name as \"sender\", u2.name as \"recipient\" from challenge_table c join user_table u on (u.id = c.sender) left join user_table u2 on (u2.id = c.recipient) where u.name = \'" + name + "\' OR u2.name = \'" + name + "\'";
            s_get_challenges = function(result){
                if (!result.rows.length) {
                    sendTextMessage(s, "You have no current pending challenges.");
                }
                else{
                    //challenges they're sender
                    result_string = "You've challenged:";
                    for (var i = result.rows.length - 1; i >= 0; i--) {
                        sender_val = result.rows[i].sender;
                        if (sender_val == name) {
                            result_string+="\n";
                            result_string += result.rows[i].recipient;
                        }
                    }
                    if (result_string !== "You've challenged:") {
                        sendTextMessage(s, result_string);
                    }
                    //get a list of challenges they're recipient
                    result_string = "You've been challenged by:";
                    for (i = result.rows.length - 1; i >= 0; i--) {
                        recip_val = result.rows[i].recipient;
                        if (recip_val == name) {
                            result_string+="\n";
                            result_string += result.rows[i].sender;
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