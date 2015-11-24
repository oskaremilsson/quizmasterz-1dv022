/**
 * Created by Oskar on 2015-11-24.
 */

function Timer(element, time) {
    this.time = time;
    this.element = element;
    this.startTime = new Date().getTime();
    this.interval = undefined;
}

Timer.prototype.start = function() {
    this.interval = setInterval(this.run.bind(this), 100);
};

Timer.prototype.run = function() {
    var now = new Date().getTime();
    var diff = (now - this.startTime)/1000;
    console.log(this.startTime);
    if(diff >= this.time) {
        clearInterval(this.interval);
    }
    this.print(this.time - diff);
};

Timer.prototype.stop = function() {
    clearInterval(this.interval);
    var now = new Date().getTime();

    return (now - this.startTime)/1000;
};

Timer.prototype.print = function(diff) {
    this.element.replaceChild(document.createTextNode(diff), this.element.firstChild);
};

module.exports = Timer;
