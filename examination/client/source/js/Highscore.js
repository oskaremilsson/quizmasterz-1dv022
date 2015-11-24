/**
 * Created by Oskar on 2015-11-24.
 */

function Highscore(nickname, score) {
    this.nickname = nickname;
    this.score = score;
    this.highscore = [];

    this.readFromFile();
}

Highscore.prototype.readFromFile = function() {
    var hsFile = localStorage.getItem("highscore");
    if(hsFile) {
        var json = JSON.parse(hsFile);
        console.log(json);
        // push into this.highscore here
    }
};

Highscore.prototype.isHighscore = function() {
    var isHighscore = false;
    if(this.highscore.length === 0) {
        console.log("first entry");
        isHighscore = true;
    } else {
        var lastScore = this.highscore[this.highscore.length - 1].score;
        if(this.score < lastScore) {
            isHighscore = true;
        }
    }
    return isHighscore;
};

Highscore.prototype.addToList = function() {
    var added = false;
    if(this.isHighscore()) {
        //find the index to put this score and do it,
        // call the storage-function and return true
        console.log("isHighscore, adding to list..")
    }
    return added;
};

module.exports = Highscore;
