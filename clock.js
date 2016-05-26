//OnInterval
var threeSecondInterval = function(){
    sendTextMessage(10205320360242528, "Another 3 seconds have gone by. What did you do in them?");
    sendTextMessage(10206557582650156, "Another 3 seconds have gone by. What did you do in them?");
}
setInterval(threeSecondInterval, 3000);

//For specific times, use a chron job
var fifteenSeconsAfterMinute = function() {
  sendTextMessage(10205320360242528,"Another minute is gone forever. Hopefully, you made the most of it...");
  sendTextMessage(10206557582650156,"Another minute is gone forever. Hopefully, you made the most of it...");
}
var CronJob = require('cron').CronJob;
new CronJob({
  cronTime: "15 * * * * *",//15 seconds after every minute
  onTick: fifteenSeconsAfterMinute,
  start: true,
  timeZone: "America/Los_Angeles"
});