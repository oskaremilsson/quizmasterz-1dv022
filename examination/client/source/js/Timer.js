/**
 * Created by Oskar on 2015-11-24.
 */

function Timer(element, time) {
    this.time = time;
    this.startTime = new Date().getTime();
    this.interval = undefined;
}

Timer.prototype.start = function() {
    this.interval = setInterval(this.run.bind(this), 100);
};

Timer.prototype.run = function() {
    var now = new Date().getTime();
    var diff = (now - this.startTime)*1000;
    if(diff >= this.time) {
        clearInterval(this.interval);
    }
    this.print(diff);
};

Timer.prototype.print = function(diff) {
    var timer = document.querySelector("#timer h1");
    timer.appendChild(document.createTextNode(diff));
};

module.exports = Timer;
