var token = "EAADO0pQrRbsBAD8aZB2wCeI1zwFlCVS9W1HGQJQVSQj3Qk837u5agR0Gphg7zaZBOyhkVrRVloP2uZAsNXcZCqDXqc49aP26h1IgZBZCTAEhkIiksjxtx2j895suRIbZBGZB3tZChW4J0lNdNMc8jGGNWSayIR8RQru1CnP9sk3ZCC0gZDZD";
var request = require('request');



//OnInterval
var threeSecondInterval = function(){
    sendTextMessage(10205320360242528, "Another 3 seconds have gone by. What did you do in them?");
    sendTextMessage(1020655582650156, "Another 3 seconds have gone by. What did you do in them?");
}
setInterval(threeSecondInterval, 3000)

//For specific times, use a chron job
var fifteenSeconsAfterMinute = function() {
  sendTextMessage(10205320360242528,"Another minute is gone forever. Hopefully, you made the most of it...");
  sendTextMessage(1020655582650156,,"Another minute is gone forever. Hopefully, you made the most of it...");
}
var CronJob = require('cron').CronJob;
new CronJob({
  cronTime: "15 * * * * *",//15 seconds after every minute
  onTick: fifteenSeconsAfterMinute,
  start: true,
  timeZone: "America/Los_Angeles"
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