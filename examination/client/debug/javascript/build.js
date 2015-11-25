(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Created by Oskar on 2015-11-23.
 */

function req(config, callback) {
    var r = new XMLHttpRequest();

    r.addEventListener("load", function() {

        if (r.status >= 400) {
            callback(r.status);
        }

        callback(null, r.responseText);
    });

    r.open(config.method, config.url);
    console.log(config);
    if(config.data){
        r.setRequestHeader("Content-Type", "application/json");
        r.send(JSON.stringify(config.data));
    } else {
        r.send(null);
    }
}

module.exports.req = req;

},{}],2:[function(require,module,exports){
/**
 * Created by Oskar on 2015-11-24.
 */

function sortFormula(a,b) {
    if (a.score < b.score) {
        return -1;
    }
    if (a.score > b.score) {
        return 1;
    }
    return 0;
}

function Highscore(nickname, score) {
    this.nickname = nickname;
    this.score = score;
    this.highscore = [];

    this.readFromFile();
}

Highscore.prototype.readFromFile = function() {
    var hsFile = localStorage.getItem("hs");
    if(hsFile) {
        var json = JSON.parse(hsFile);
        console.log(json);
        for (var nickname in json) {
            if(json.hasOwnProperty(nickname)) {
                this.highscore.push(json[nickname]);
            }

        }
    }
};

Highscore.prototype.isHighscore = function() {
    var isHighscore = false;
    if(this.highscore.length === 0) {
        console.log("first entry");
        isHighscore = true;
    } else {
        var lastScore = this.highscore[this.highscore.length - 1].score;
        if(this.score < lastScore || this.highscore.length < 5) {
            isHighscore = true;
        }
    }
    return isHighscore;
};

Highscore.prototype.addToList = function() {
    var added = false;
    if(this.isHighscore()) {
        console.log("isHighscore, adding to list..");

        var thisScore = {
            nickname: this.nickname,
            score: this.score
        };

        if(this.highscore.length === 5) {
            //remove the one last
            this.highscore.splice(-1, 1);
        }

        //push the new and sort the array
        this.highscore.push(thisScore);
        this.highscore = this.highscore.sort(function(a,b) {return a.score - b.score;});

        //call to save it
        this.saveToFile();

        added = true;
    }
    return added;
};

Highscore.prototype.saveToFile = function() {
    localStorage.setItem("hs", JSON.stringify(this.highscore));
};

module.exports = Highscore;

},{}],3:[function(require,module,exports){
/**
 * Created by Oskar on 2015-11-23.
 */
"use strict";
var Question = require("./question");
var Ajax = require("./Ajax");
var Timer = require("./Timer");
var Highscore = require("./Highscore");

function Quiz(nickname) {
    console.log(nickname);
    this.nickname = nickname;
    this.timer = undefined;
    this.question = undefined;
    this.nextURL = "http://vhost3.lnu.se:20080/question/1";
    this.button = undefined;
    this.form = undefined;
    this.totalTime = 0;

    this.getQuestion();
}


Quiz.prototype.getQuestion = function () {
    console.log("asking..");
    var url = this.nextURL;
    console.log(url);
    var config = {method: "GET", url: url};
    var responseFunction = this.response.bind(this);
    Ajax.req(config, responseFunction);
};

Quiz.prototype.response = function (error, response) {
    console.log("response...");

    if(error) {
        if(error === 404) {
            console.log("End the quiz");
            //show time and highscore
            this.gameCompleted();
        }
        else {
            console.log(error);
            this.gameOver();
        }
    }

    if(response) {
        console.log(response);
        var obj = JSON.parse(response);
        this.nextURL = obj.nextURL;
        console.log(this.nextURL);

        if(obj.question) {
            this.responseQuestion(obj);
        }
        else {
            if(this.nextURL || obj.message === "Correct answer!") {
                this.responseAnswer(obj);
            }
        }
    }

};

Quiz.prototype.responseQuestion = function(obj) {
    var content = document.querySelector("#content");
    this.clearDiv(content);
    this.question = new Question(obj);
    this.question.print();

    this.timer = new Timer(this, document.querySelector("#timer h1"), 20);
    this.timer.start();

    console.log("Adding listener..");
    this.addListener();
};

Quiz.prototype.responseAnswer = function(obj) {
    var content = document.querySelector("#content");
    this.clearDiv(content);

    var template = document.querySelector("#template-answer").content.cloneNode(true);
    var text = document.createTextNode(obj.message);
    template.querySelector("p").appendChild(text);

    content.appendChild(template);

    var newQuestion = this.getQuestion.bind(this);
    setTimeout(newQuestion, 1000);
};

Quiz.prototype.addListener = function() {
    this.button = document.querySelector("#submit");
    this.form = document.querySelector("#qForm");

    this.button.addEventListener("click",this.submit.bind(this));
    this.form.addEventListener("keypress", this.getKeyPress.bind(this), true);
};

Quiz.prototype.getKeyPress = function(event) {
    if (event.which === 13 || event.keyCode === 13) {
        console.log("got enter");
        event.preventDefault();
        this.submit();
    }
};

Quiz.prototype.submit = function() {
    console.log("submitting...");
    this.totalTime += this.timer.stop();
    console.log("time:" + this.totalTime);
    var input;
    this.button.removeEventListener("click", this.submit.bind(this));
    this.form.removeEventListener("keypress", this.getKeyPress.bind(this));

    if(document.querySelector("#answer")) {
        input = document.querySelector("#answer");
    }
    else {
        input = document.querySelector("input[name='alternative']:checked");
    }


    var config = {method: "POST",
        url: this.nextURL,
        data: {
            answer: input.value
        }};
    var responseFunction = this.response.bind(this);
    Ajax.req(config, responseFunction);
};

Quiz.prototype.gameOver = function() {
    var hs = new Highscore(this.nickname);
    console.log("GAME OVER!!!");
    this.clearDiv(document.querySelector("#content"));

    var template = document.querySelector("#template-gameOver").content.cloneNode(true);

    if(hs.highscore.length > 0 ){
        template.querySelector("h2").appendChild(document.createTextNode("Highscore"));
        var hsFrag = this.createHighscoreFragment(hs);
        template.querySelector("table").appendChild(hsFrag);
    }

    document.querySelector("#content").appendChild(template);
};

Quiz.prototype.gameCompleted = function() {
    var hs = new Highscore(this.nickname, this.totalTime.toFixed(3));
    var template = document.querySelector("#template-quizCompleted").content.cloneNode(true);

    if(hs.addToList()) {
        console.log("you made it to the list");
        template = document.querySelector("#template-newHighscore").content.cloneNode(true);
    }

    if(hs.highscore.length > 0) {
        var h1 = template.querySelector(".time");
        var text = document.createTextNode(this.totalTime.toFixed(3));
        h1.appendChild(text);

        template.querySelector(".hs-title").appendChild(document.createTextNode("Highscore"));
        var hsFrag = this.createHighscoreFragment(hs);
        template.querySelector("table").appendChild(hsFrag);
    }

    this.clearDiv(document.querySelector("#content"));
    document.querySelector("#content").appendChild(template);
};

Quiz.prototype.createHighscoreFragment = function(hs) {
    var frag = document.createDocumentFragment();
    var template;
    var hsNickname;
    var hsScore;
    for(var i = 0; i < hs.highscore.length; i += 1) {
        template = document.querySelector("#template-highscoreRow").content.cloneNode(true);
        hsNickname = template.querySelector(".hs-nickname");
        hsScore = template.querySelector(".hs-score");

        hsNickname.appendChild(document.createTextNode(hs.highscore[i].nickname));
        hsScore.appendChild(document.createTextNode(hs.highscore[i].score));

        frag.appendChild(template);
    }

    return frag;
};

Quiz.prototype.clearDiv = function(div) {
    while(div.hasChildNodes()) {
        div.removeChild(div.lastChild);
    }
};

module.exports = Quiz;

},{"./Ajax":1,"./Highscore":2,"./Timer":4,"./question":6}],4:[function(require,module,exports){
/**
 * Created by Oskar on 2015-11-24.
 */

function Timer(owner, element, time) {
    this.time = time;
    this.element = element;
    this.owner = owner;
    this.startTime = new Date().getTime();
    this.interval = undefined;
}

Timer.prototype.start = function() {
    this.interval = setInterval(this.run.bind(this), 100);
};

Timer.prototype.run = function() {
    var now = new Date().getTime();
    var diff = (now - this.startTime)/1000;
    var showTime = this.time - diff;

    if(diff >= this.time) {
        showTime = 0;
        clearInterval(this.interval);
        this.owner.gameOver();
    }
    this.print(showTime.toFixed(1));
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

},{}],5:[function(require,module,exports){
"use strict";
var Quiz = require("./Quiz");
var q;

function submit(event) {
    if (event.which === 13 || event.keyCode === 13 || event.type === "click") {
        event.preventDefault();
        console.log("submitting");
        var input = document.querySelector("#nickname").value;
        if(input.length > 1) {
            q = new Quiz(input);
        }
    }
}

var button = document.querySelector("#submit");
var form = document.querySelector("#qForm");

button.addEventListener("click",submit, true);
form.addEventListener("keypress", submit, true);


},{"./Quiz":3}],6:[function(require,module,exports){
/**
 * Created by Oskar on 2015-11-23.
 */
"use strict";
function Question(obj) {
    this.id = obj.id;
    this.question = obj.question;
    this.alt = obj.alternatives;
}

Question.prototype.print = function() {
    if(this.alt) {
        console.log("has alternatives");
        this.printAltQuestion();
    }
    else {
        this.printQuestion();
    }
};

Question.prototype.clearDiv = function(div) {
    while(div.hasChildNodes()) {
        div.removeChild(div.lastChild);
    }
};

Question.prototype.printAltQuestion = function() {
    var template = document.querySelector("#template-question-alt").content.cloneNode(true);
    template.querySelector(".qHead").appendChild(document.createTextNode(this.question));
    var inputFrag = this.getAltFrag();
    console.log(template.querySelector("#submit"));
    template.querySelector("#qForm").insertBefore(inputFrag, template.querySelector("#submit"));
    document.querySelector("#content").appendChild(template);
};

Question.prototype.getAltFrag = function() {
    var inputFrag = document.createDocumentFragment();
    var input;
    var label;

    console.log(this.alt);
    for(var alt in this.alt) {
        if(this.alt.hasOwnProperty(alt)) {
            /*label = document.createElement("label");
            input = document.createElement("input");
            input.setAttribute("type", "radio");
            input.setAttribute("name", "alternative");
            input.setAttribute("value", alt);
            //p.appendChild(input);
            label.appendChild(document.createTextNode(this.alt[alt]));
            inputFrag.appendChild(label);*/
            input = document.querySelector("#template-alternative").content.cloneNode(true);
            console.log(input);
            input.querySelector("input").setAttribute("value", alt);

            label = input.querySelector("label");
            label.appendChild(document.createTextNode(this.alt[alt]));

            inputFrag.appendChild(input);
        }

    }
    return inputFrag;
};

Question.prototype.printQuestion = function() {
    var template = document.querySelector("#template-question").content.cloneNode(true);
    template.querySelector(".qHead").appendChild(document.createTextNode(this.question));
    document.querySelector("#content").appendChild(template);
};

module.exports = Question;

},{}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMS4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQWpheC5qcyIsImNsaWVudC9zb3VyY2UvanMvSGlnaHNjb3JlLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9RdWl6LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9UaW1lci5qcyIsImNsaWVudC9zb3VyY2UvanMvYXBwLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9xdWVzdGlvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IE9za2FyIG9uIDIwMTUtMTEtMjMuXG4gKi9cblxuZnVuY3Rpb24gcmVxKGNvbmZpZywgY2FsbGJhY2spIHtcbiAgICB2YXIgciA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgci5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCBmdW5jdGlvbigpIHtcblxuICAgICAgICBpZiAoci5zdGF0dXMgPj0gNDAwKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhyLnN0YXR1cyk7XG4gICAgICAgIH1cblxuICAgICAgICBjYWxsYmFjayhudWxsLCByLnJlc3BvbnNlVGV4dCk7XG4gICAgfSk7XG5cbiAgICByLm9wZW4oY29uZmlnLm1ldGhvZCwgY29uZmlnLnVybCk7XG4gICAgY29uc29sZS5sb2coY29uZmlnKTtcbiAgICBpZihjb25maWcuZGF0YSl7XG4gICAgICAgIHIuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb25cIik7XG4gICAgICAgIHIuc2VuZChKU09OLnN0cmluZ2lmeShjb25maWcuZGF0YSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHIuc2VuZChudWxsKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzLnJlcSA9IHJlcTtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTI0LlxuICovXG5cbmZ1bmN0aW9uIHNvcnRGb3JtdWxhKGEsYikge1xuICAgIGlmIChhLnNjb3JlIDwgYi5zY29yZSkge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGlmIChhLnNjb3JlID4gYi5zY29yZSkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG59XG5cbmZ1bmN0aW9uIEhpZ2hzY29yZShuaWNrbmFtZSwgc2NvcmUpIHtcbiAgICB0aGlzLm5pY2tuYW1lID0gbmlja25hbWU7XG4gICAgdGhpcy5zY29yZSA9IHNjb3JlO1xuICAgIHRoaXMuaGlnaHNjb3JlID0gW107XG5cbiAgICB0aGlzLnJlYWRGcm9tRmlsZSgpO1xufVxuXG5IaWdoc2NvcmUucHJvdG90eXBlLnJlYWRGcm9tRmlsZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBoc0ZpbGUgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcImhzXCIpO1xuICAgIGlmKGhzRmlsZSkge1xuICAgICAgICB2YXIganNvbiA9IEpTT04ucGFyc2UoaHNGaWxlKTtcbiAgICAgICAgY29uc29sZS5sb2coanNvbik7XG4gICAgICAgIGZvciAodmFyIG5pY2tuYW1lIGluIGpzb24pIHtcbiAgICAgICAgICAgIGlmKGpzb24uaGFzT3duUHJvcGVydHkobmlja25hbWUpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oaWdoc2NvcmUucHVzaChqc29uW25pY2tuYW1lXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkhpZ2hzY29yZS5wcm90b3R5cGUuaXNIaWdoc2NvcmUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXNIaWdoc2NvcmUgPSBmYWxzZTtcbiAgICBpZih0aGlzLmhpZ2hzY29yZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJmaXJzdCBlbnRyeVwiKTtcbiAgICAgICAgaXNIaWdoc2NvcmUgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBsYXN0U2NvcmUgPSB0aGlzLmhpZ2hzY29yZVt0aGlzLmhpZ2hzY29yZS5sZW5ndGggLSAxXS5zY29yZTtcbiAgICAgICAgaWYodGhpcy5zY29yZSA8IGxhc3RTY29yZSB8fCB0aGlzLmhpZ2hzY29yZS5sZW5ndGggPCA1KSB7XG4gICAgICAgICAgICBpc0hpZ2hzY29yZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGlzSGlnaHNjb3JlO1xufTtcblxuSGlnaHNjb3JlLnByb3RvdHlwZS5hZGRUb0xpc3QgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYWRkZWQgPSBmYWxzZTtcbiAgICBpZih0aGlzLmlzSGlnaHNjb3JlKCkpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJpc0hpZ2hzY29yZSwgYWRkaW5nIHRvIGxpc3QuLlwiKTtcblxuICAgICAgICB2YXIgdGhpc1Njb3JlID0ge1xuICAgICAgICAgICAgbmlja25hbWU6IHRoaXMubmlja25hbWUsXG4gICAgICAgICAgICBzY29yZTogdGhpcy5zY29yZVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmKHRoaXMuaGlnaHNjb3JlLmxlbmd0aCA9PT0gNSkge1xuICAgICAgICAgICAgLy9yZW1vdmUgdGhlIG9uZSBsYXN0XG4gICAgICAgICAgICB0aGlzLmhpZ2hzY29yZS5zcGxpY2UoLTEsIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9wdXNoIHRoZSBuZXcgYW5kIHNvcnQgdGhlIGFycmF5XG4gICAgICAgIHRoaXMuaGlnaHNjb3JlLnB1c2godGhpc1Njb3JlKTtcbiAgICAgICAgdGhpcy5oaWdoc2NvcmUgPSB0aGlzLmhpZ2hzY29yZS5zb3J0KGZ1bmN0aW9uKGEsYikge3JldHVybiBhLnNjb3JlIC0gYi5zY29yZTt9KTtcblxuICAgICAgICAvL2NhbGwgdG8gc2F2ZSBpdFxuICAgICAgICB0aGlzLnNhdmVUb0ZpbGUoKTtcblxuICAgICAgICBhZGRlZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBhZGRlZDtcbn07XG5cbkhpZ2hzY29yZS5wcm90b3R5cGUuc2F2ZVRvRmlsZSA9IGZ1bmN0aW9uKCkge1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiaHNcIiwgSlNPTi5zdHJpbmdpZnkodGhpcy5oaWdoc2NvcmUpKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSGlnaHNjb3JlO1xuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IE9za2FyIG9uIDIwMTUtMTEtMjMuXG4gKi9cblwidXNlIHN0cmljdFwiO1xudmFyIFF1ZXN0aW9uID0gcmVxdWlyZShcIi4vcXVlc3Rpb25cIik7XG52YXIgQWpheCA9IHJlcXVpcmUoXCIuL0FqYXhcIik7XG52YXIgVGltZXIgPSByZXF1aXJlKFwiLi9UaW1lclwiKTtcbnZhciBIaWdoc2NvcmUgPSByZXF1aXJlKFwiLi9IaWdoc2NvcmVcIik7XG5cbmZ1bmN0aW9uIFF1aXoobmlja25hbWUpIHtcbiAgICBjb25zb2xlLmxvZyhuaWNrbmFtZSk7XG4gICAgdGhpcy5uaWNrbmFtZSA9IG5pY2tuYW1lO1xuICAgIHRoaXMudGltZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5xdWVzdGlvbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLm5leHRVUkwgPSBcImh0dHA6Ly92aG9zdDMubG51LnNlOjIwMDgwL3F1ZXN0aW9uLzFcIjtcbiAgICB0aGlzLmJ1dHRvbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmZvcm0gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy50b3RhbFRpbWUgPSAwO1xuXG4gICAgdGhpcy5nZXRRdWVzdGlvbigpO1xufVxuXG5cblF1aXoucHJvdG90eXBlLmdldFF1ZXN0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgIGNvbnNvbGUubG9nKFwiYXNraW5nLi5cIik7XG4gICAgdmFyIHVybCA9IHRoaXMubmV4dFVSTDtcbiAgICBjb25zb2xlLmxvZyh1cmwpO1xuICAgIHZhciBjb25maWcgPSB7bWV0aG9kOiBcIkdFVFwiLCB1cmw6IHVybH07XG4gICAgdmFyIHJlc3BvbnNlRnVuY3Rpb24gPSB0aGlzLnJlc3BvbnNlLmJpbmQodGhpcyk7XG4gICAgQWpheC5yZXEoY29uZmlnLCByZXNwb25zZUZ1bmN0aW9uKTtcbn07XG5cblF1aXoucHJvdG90eXBlLnJlc3BvbnNlID0gZnVuY3Rpb24gKGVycm9yLCByZXNwb25zZSkge1xuICAgIGNvbnNvbGUubG9nKFwicmVzcG9uc2UuLi5cIik7XG5cbiAgICBpZihlcnJvcikge1xuICAgICAgICBpZihlcnJvciA9PT0gNDA0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkVuZCB0aGUgcXVpelwiKTtcbiAgICAgICAgICAgIC8vc2hvdyB0aW1lIGFuZCBoaWdoc2NvcmVcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbXBsZXRlZCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgICAgdGhpcy5nYW1lT3ZlcigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYocmVzcG9uc2UpIHtcbiAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xuICAgICAgICB2YXIgb2JqID0gSlNPTi5wYXJzZShyZXNwb25zZSk7XG4gICAgICAgIHRoaXMubmV4dFVSTCA9IG9iai5uZXh0VVJMO1xuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLm5leHRVUkwpO1xuXG4gICAgICAgIGlmKG9iai5xdWVzdGlvbikge1xuICAgICAgICAgICAgdGhpcy5yZXNwb25zZVF1ZXN0aW9uKG9iaik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZih0aGlzLm5leHRVUkwgfHwgb2JqLm1lc3NhZ2UgPT09IFwiQ29ycmVjdCBhbnN3ZXIhXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlQW5zd2VyKG9iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbn07XG5cblF1aXoucHJvdG90eXBlLnJlc3BvbnNlUXVlc3Rpb24gPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29udGVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKTtcbiAgICB0aGlzLmNsZWFyRGl2KGNvbnRlbnQpO1xuICAgIHRoaXMucXVlc3Rpb24gPSBuZXcgUXVlc3Rpb24ob2JqKTtcbiAgICB0aGlzLnF1ZXN0aW9uLnByaW50KCk7XG5cbiAgICB0aGlzLnRpbWVyID0gbmV3IFRpbWVyKHRoaXMsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGltZXIgaDFcIiksIDIwKTtcbiAgICB0aGlzLnRpbWVyLnN0YXJ0KCk7XG5cbiAgICBjb25zb2xlLmxvZyhcIkFkZGluZyBsaXN0ZW5lci4uXCIpO1xuICAgIHRoaXMuYWRkTGlzdGVuZXIoKTtcbn07XG5cblF1aXoucHJvdG90eXBlLnJlc3BvbnNlQW5zd2VyID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGNvbnRlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIik7XG4gICAgdGhpcy5jbGVhckRpdihjb250ZW50KTtcblxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtYW5zd2VyXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUob2JqLm1lc3NhZ2UpO1xuICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCJwXCIpLmFwcGVuZENoaWxkKHRleHQpO1xuXG4gICAgY29udGVudC5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG5cbiAgICB2YXIgbmV3UXVlc3Rpb24gPSB0aGlzLmdldFF1ZXN0aW9uLmJpbmQodGhpcyk7XG4gICAgc2V0VGltZW91dChuZXdRdWVzdGlvbiwgMTAwMCk7XG59O1xuXG5RdWl6LnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzdWJtaXRcIik7XG4gICAgdGhpcy5mb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNxRm9ybVwiKTtcblxuICAgIHRoaXMuYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLHRoaXMuc3VibWl0LmJpbmQodGhpcykpO1xuICAgIHRoaXMuZm9ybS5hZGRFdmVudExpc3RlbmVyKFwia2V5cHJlc3NcIiwgdGhpcy5nZXRLZXlQcmVzcy5iaW5kKHRoaXMpLCB0cnVlKTtcbn07XG5cblF1aXoucHJvdG90eXBlLmdldEtleVByZXNzID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBpZiAoZXZlbnQud2hpY2ggPT09IDEzIHx8IGV2ZW50LmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiZ290IGVudGVyXCIpO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLnN1Ym1pdCgpO1xuICAgIH1cbn07XG5cblF1aXoucHJvdG90eXBlLnN1Ym1pdCA9IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKFwic3VibWl0dGluZy4uLlwiKTtcbiAgICB0aGlzLnRvdGFsVGltZSArPSB0aGlzLnRpbWVyLnN0b3AoKTtcbiAgICBjb25zb2xlLmxvZyhcInRpbWU6XCIgKyB0aGlzLnRvdGFsVGltZSk7XG4gICAgdmFyIGlucHV0O1xuICAgIHRoaXMuYnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnN1Ym1pdC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmZvcm0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleXByZXNzXCIsIHRoaXMuZ2V0S2V5UHJlc3MuYmluZCh0aGlzKSk7XG5cbiAgICBpZihkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2Fuc3dlclwiKSkge1xuICAgICAgICBpbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYW5zd2VyXCIpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRbbmFtZT0nYWx0ZXJuYXRpdmUnXTpjaGVja2VkXCIpO1xuICAgIH1cblxuXG4gICAgdmFyIGNvbmZpZyA9IHttZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICB1cmw6IHRoaXMubmV4dFVSTCxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYW5zd2VyOiBpbnB1dC52YWx1ZVxuICAgICAgICB9fTtcbiAgICB2YXIgcmVzcG9uc2VGdW5jdGlvbiA9IHRoaXMucmVzcG9uc2UuYmluZCh0aGlzKTtcbiAgICBBamF4LnJlcShjb25maWcsIHJlc3BvbnNlRnVuY3Rpb24pO1xufTtcblxuUXVpei5wcm90b3R5cGUuZ2FtZU92ZXIgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaHMgPSBuZXcgSGlnaHNjb3JlKHRoaXMubmlja25hbWUpO1xuICAgIGNvbnNvbGUubG9nKFwiR0FNRSBPVkVSISEhXCIpO1xuICAgIHRoaXMuY2xlYXJEaXYoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpKTtcblxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtZ2FtZU92ZXJcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG5cbiAgICBpZihocy5oaWdoc2NvcmUubGVuZ3RoID4gMCApe1xuICAgICAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiaDJcIikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJIaWdoc2NvcmVcIikpO1xuICAgICAgICB2YXIgaHNGcmFnID0gdGhpcy5jcmVhdGVIaWdoc2NvcmVGcmFnbWVudChocyk7XG4gICAgICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCJ0YWJsZVwiKS5hcHBlbmRDaGlsZChoc0ZyYWcpO1xuICAgIH1cblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG59O1xuXG5RdWl6LnByb3RvdHlwZS5nYW1lQ29tcGxldGVkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGhzID0gbmV3IEhpZ2hzY29yZSh0aGlzLm5pY2tuYW1lLCB0aGlzLnRvdGFsVGltZS50b0ZpeGVkKDMpKTtcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLXF1aXpDb21wbGV0ZWRcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG5cbiAgICBpZihocy5hZGRUb0xpc3QoKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcInlvdSBtYWRlIGl0IHRvIHRoZSBsaXN0XCIpO1xuICAgICAgICB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtbmV3SGlnaHNjb3JlXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgIH1cblxuICAgIGlmKGhzLmhpZ2hzY29yZS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBoMSA9IHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIudGltZVwiKTtcbiAgICAgICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLnRvdGFsVGltZS50b0ZpeGVkKDMpKTtcbiAgICAgICAgaDEuYXBwZW5kQ2hpbGQodGV4dCk7XG5cbiAgICAgICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5ocy10aXRsZVwiKS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIkhpZ2hzY29yZVwiKSk7XG4gICAgICAgIHZhciBoc0ZyYWcgPSB0aGlzLmNyZWF0ZUhpZ2hzY29yZUZyYWdtZW50KGhzKTtcbiAgICAgICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcInRhYmxlXCIpLmFwcGVuZENoaWxkKGhzRnJhZyk7XG4gICAgfVxuXG4gICAgdGhpcy5jbGVhckRpdihkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG59O1xuXG5RdWl6LnByb3RvdHlwZS5jcmVhdGVIaWdoc2NvcmVGcmFnbWVudCA9IGZ1bmN0aW9uKGhzKSB7XG4gICAgdmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIHRlbXBsYXRlO1xuICAgIHZhciBoc05pY2tuYW1lO1xuICAgIHZhciBoc1Njb3JlO1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBocy5oaWdoc2NvcmUubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLWhpZ2hzY29yZVJvd1wiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgaHNOaWNrbmFtZSA9IHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuaHMtbmlja25hbWVcIik7XG4gICAgICAgIGhzU2NvcmUgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLXNjb3JlXCIpO1xuXG4gICAgICAgIGhzTmlja25hbWUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoaHMuaGlnaHNjb3JlW2ldLm5pY2tuYW1lKSk7XG4gICAgICAgIGhzU2NvcmUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoaHMuaGlnaHNjb3JlW2ldLnNjb3JlKSk7XG5cbiAgICAgICAgZnJhZy5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZyYWc7XG59O1xuXG5RdWl6LnByb3RvdHlwZS5jbGVhckRpdiA9IGZ1bmN0aW9uKGRpdikge1xuICAgIHdoaWxlKGRpdi5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgZGl2LnJlbW92ZUNoaWxkKGRpdi5sYXN0Q2hpbGQpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUXVpejtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTI0LlxuICovXG5cbmZ1bmN0aW9uIFRpbWVyKG93bmVyLCBlbGVtZW50LCB0aW1lKSB7XG4gICAgdGhpcy50aW1lID0gdGltZTtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3duZXIgPSBvd25lcjtcbiAgICB0aGlzLnN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIHRoaXMuaW50ZXJ2YWwgPSB1bmRlZmluZWQ7XG59XG5cblRpbWVyLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCh0aGlzLnJ1bi5iaW5kKHRoaXMpLCAxMDApO1xufTtcblxuVGltZXIucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICB2YXIgZGlmZiA9IChub3cgLSB0aGlzLnN0YXJ0VGltZSkvMTAwMDtcbiAgICB2YXIgc2hvd1RpbWUgPSB0aGlzLnRpbWUgLSBkaWZmO1xuXG4gICAgaWYoZGlmZiA+PSB0aGlzLnRpbWUpIHtcbiAgICAgICAgc2hvd1RpbWUgPSAwO1xuICAgICAgICBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xuICAgICAgICB0aGlzLm93bmVyLmdhbWVPdmVyKCk7XG4gICAgfVxuICAgIHRoaXMucHJpbnQoc2hvd1RpbWUudG9GaXhlZCgxKSk7XG59O1xuXG5UaW1lci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbCk7XG4gICAgdmFyIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG4gICAgcmV0dXJuIChub3cgLSB0aGlzLnN0YXJ0VGltZSkvMTAwMDtcbn07XG5cblRpbWVyLnByb3RvdHlwZS5wcmludCA9IGZ1bmN0aW9uKGRpZmYpIHtcbiAgICB0aGlzLmVsZW1lbnQucmVwbGFjZUNoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRpZmYpLCB0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRpbWVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgUXVpeiA9IHJlcXVpcmUoXCIuL1F1aXpcIik7XG52YXIgcTtcblxuZnVuY3Rpb24gc3VibWl0KGV2ZW50KSB7XG4gICAgaWYgKGV2ZW50LndoaWNoID09PSAxMyB8fCBldmVudC5rZXlDb2RlID09PSAxMyB8fCBldmVudC50eXBlID09PSBcImNsaWNrXCIpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJzdWJtaXR0aW5nXCIpO1xuICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25pY2tuYW1lXCIpLnZhbHVlO1xuICAgICAgICBpZihpbnB1dC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBxID0gbmV3IFF1aXooaW5wdXQpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG52YXIgYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzdWJtaXRcIik7XG52YXIgZm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcUZvcm1cIik7XG5cbmJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIixzdWJtaXQsIHRydWUpO1xuZm9ybS5hZGRFdmVudExpc3RlbmVyKFwia2V5cHJlc3NcIiwgc3VibWl0LCB0cnVlKTtcblxuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IE9za2FyIG9uIDIwMTUtMTEtMjMuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuZnVuY3Rpb24gUXVlc3Rpb24ob2JqKSB7XG4gICAgdGhpcy5pZCA9IG9iai5pZDtcbiAgICB0aGlzLnF1ZXN0aW9uID0gb2JqLnF1ZXN0aW9uO1xuICAgIHRoaXMuYWx0ID0gb2JqLmFsdGVybmF0aXZlcztcbn1cblxuUXVlc3Rpb24ucHJvdG90eXBlLnByaW50ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYodGhpcy5hbHQpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJoYXMgYWx0ZXJuYXRpdmVzXCIpO1xuICAgICAgICB0aGlzLnByaW50QWx0UXVlc3Rpb24oKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMucHJpbnRRdWVzdGlvbigpO1xuICAgIH1cbn07XG5cblF1ZXN0aW9uLnByb3RvdHlwZS5jbGVhckRpdiA9IGZ1bmN0aW9uKGRpdikge1xuICAgIHdoaWxlKGRpdi5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgZGl2LnJlbW92ZUNoaWxkKGRpdi5sYXN0Q2hpbGQpO1xuICAgIH1cbn07XG5cblF1ZXN0aW9uLnByb3RvdHlwZS5wcmludEFsdFF1ZXN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0ZW1wbGF0ZS1xdWVzdGlvbi1hbHRcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5xSGVhZFwiKS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLnF1ZXN0aW9uKSk7XG4gICAgdmFyIGlucHV0RnJhZyA9IHRoaXMuZ2V0QWx0RnJhZygpO1xuICAgIGNvbnNvbGUubG9nKHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIjc3VibWl0XCIpKTtcbiAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiI3FGb3JtXCIpLmluc2VydEJlZm9yZShpbnB1dEZyYWcsIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIjc3VibWl0XCIpKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xufTtcblxuUXVlc3Rpb24ucHJvdG90eXBlLmdldEFsdEZyYWcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaW5wdXRGcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIHZhciBpbnB1dDtcbiAgICB2YXIgbGFiZWw7XG5cbiAgICBjb25zb2xlLmxvZyh0aGlzLmFsdCk7XG4gICAgZm9yKHZhciBhbHQgaW4gdGhpcy5hbHQpIHtcbiAgICAgICAgaWYodGhpcy5hbHQuaGFzT3duUHJvcGVydHkoYWx0KSkge1xuICAgICAgICAgICAgLypsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsYWJlbFwiKTtcbiAgICAgICAgICAgIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpO1xuICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcInJhZGlvXCIpO1xuICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwibmFtZVwiLCBcImFsdGVybmF0aXZlXCIpO1xuICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwidmFsdWVcIiwgYWx0KTtcbiAgICAgICAgICAgIC8vcC5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICBsYWJlbC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLmFsdFthbHRdKSk7XG4gICAgICAgICAgICBpbnB1dEZyYWcuYXBwZW5kQ2hpbGQobGFiZWwpOyovXG4gICAgICAgICAgICBpbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtYWx0ZXJuYXRpdmVcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhpbnB1dCk7XG4gICAgICAgICAgICBpbnB1dC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRcIikuc2V0QXR0cmlidXRlKFwidmFsdWVcIiwgYWx0KTtcblxuICAgICAgICAgICAgbGFiZWwgPSBpbnB1dC5xdWVyeVNlbGVjdG9yKFwibGFiZWxcIik7XG4gICAgICAgICAgICBsYWJlbC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLmFsdFthbHRdKSk7XG5cbiAgICAgICAgICAgIGlucHV0RnJhZy5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgIH1cblxuICAgIH1cbiAgICByZXR1cm4gaW5wdXRGcmFnO1xufTtcblxuUXVlc3Rpb24ucHJvdG90eXBlLnByaW50UXVlc3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLXF1ZXN0aW9uXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIucUhlYWRcIikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5xdWVzdGlvbikpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXN0aW9uO1xuIl19
