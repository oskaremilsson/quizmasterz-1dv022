(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Created by Oskar on 2015-11-23.
 */

/**
 * Function to handle requests via XMLHttpRequest
 * @param config{Object}, object with method and url, possibly data
 * @param callback{Function}, the function to call at response
 */
function req(config, callback) {
    var r = new XMLHttpRequest();

    //add eventlistener for response
    r.addEventListener("load", function() {

        if (r.status >= 400) {
            //got error, call with errorcode
            callback(r.status);
        }

        //call the callback function with responseText
        callback(null, r.responseText);
    });

    //open a request from the config
    r.open(config.method, config.url);
    console.log(config);

    if(config.data){
        //send the data as JSON to the server
        r.setRequestHeader("Content-Type", "application/json");
        r.send(JSON.stringify(config.data));
    } else {
        //send request
        r.send(null);
    }
}


module.exports.req = req;

},{}],2:[function(require,module,exports){
/**
 * Created by Oskar on 2015-11-24.
 */

/**
 * Highscore constructor
 * @param nickname{string}, the nickname
 * @param score{string}, the score(time)
 * @constructor
 */
function Highscore(nickname, score) {
    this.nickname = nickname;
    this.score = score;
    this.highscore = [];

    //call to read highscore file from local storage
    this.readFromFile();
}

/**
 * Function to read the highscore-file from local storage
 */
Highscore.prototype.readFromFile = function() {
    var hsFile = localStorage.getItem("hs");
    if(hsFile) {
        //parse file into JSON
        var json = JSON.parse(hsFile);
        console.log(json);

        //fill the highscore-array with entries
        for (var nickname in json) {
            if(json.hasOwnProperty(nickname)) {
                this.highscore.push(json[nickname]);
            }
        }
    }
};

/**
 * Function to check if the score takes a place into the highscore
 * @returns {boolean}
 */
Highscore.prototype.isHighscore = function() {
    var isHighscore = false;
    if(this.highscore.length === 0) {
        //highscore is empty, therefore new highscore
        isHighscore = true;
    } else {
        //get the score last in the list
        var lastScore = this.highscore[this.highscore.length - 1].score;
        if(this.score < lastScore || this.highscore.length < 5) {
            isHighscore = true;
        }
    }
    return isHighscore;
};

/**
 * Function to add the score into the list
 * @returns {boolean}, added or not
 */
Highscore.prototype.addToList = function() {
    var added = false;
    //call the isHighscore to check if score should be added
    if(this.isHighscore()) {
        console.log("isHighscore, adding to list..");

        //save the nickname and score into an object
        var thisScore = {
            nickname: this.nickname,
            score: this.score
        };

        //delete the last position of the highscore array
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

/**
 * Function to save the highscore to local storage
 */
Highscore.prototype.saveToFile = function() {
    localStorage.setItem("hs", JSON.stringify(this.highscore));
};

/**
 * Function to get the highscorefragment containing the highscore-part of table
 * @returns {DocumentFragment}
 */
Highscore.prototype.createHighscoreFragment = function() {
    var frag = document.createDocumentFragment();
    var template;
    var hsNickname;
    var hsScore;
    for(var i = 0; i < this.highscore.length; i += 1) {
        //get the template for a table-row
        template = document.querySelector("#template-highscoreRow").content.cloneNode(true);
        hsNickname = template.querySelector(".hs-nickname");
        hsScore = template.querySelector(".hs-score");

        //append the nickname and score to the row
        hsNickname.appendChild(document.createTextNode(this.highscore[i].nickname));
        hsScore.appendChild(document.createTextNode(this.highscore[i].score));

        //append row to fragment
        frag.appendChild(template);
    }

    return frag;
};

module.exports = Highscore;

},{}],3:[function(require,module,exports){
/**
 * Created by Oskar on 2015-11-23.
 */
"use strict";

/**
 * Question constructor
 * @param obj{Object}, object that holds a question
 * @constructor
 */
function Question(obj) {
    this.id = obj.id;
    this.question = obj.question;
    this.alt = obj.alternatives;
}

/**
 * Functionb to present the question
 */
Question.prototype.print = function() {
    //statement to call the rightful printfunction
    if(this.alt) {
        console.log("has alternatives");
        this.printAltQuestion();
    }
    else {
        this.printQuestion();
    }
};

/**
 * Function to clear a div
 * @param div{object}, the div to clear
 */
Question.prototype.clearDiv = function(div) {
    while(div.hasChildNodes()) {
        div.removeChild(div.lastChild);
    }
};

/**
 * Function to present the querstion that has alternatives
 */
Question.prototype.printAltQuestion = function() {
    //get the template and append the alternatives
    var template = document.querySelector("#template-question-alt").content.cloneNode(true);
    template.querySelector(".qHead").appendChild(document.createTextNode(this.question));

    //call the function that handles the alternatives
    var inputFrag = this.getAltFrag();
    console.log(template.querySelector("#submit"));
    template.querySelector("#qForm").insertBefore(inputFrag, template.querySelector("#submit"));
    document.querySelector("#content").appendChild(template);
};

/**
 * Function to handle the alternatives
 * @returns {DocumentFragment}, the fragment for the alternatives
 */
Question.prototype.getAltFrag = function() {
    var inputFrag = document.createDocumentFragment();
    var input;
    var label;

    console.log(this.alt);
    for(var alt in this.alt) {
        if(this.alt.hasOwnProperty(alt)) {
            //get the template for alternatives
            input = document.querySelector("#template-alternative").content.cloneNode(true);
            console.log(input);
            //append the alternative
            input.querySelector("input").setAttribute("value", alt);
            label = input.querySelector("label");
            label.appendChild(document.createTextNode(this.alt[alt]));

            inputFrag.appendChild(input);
        }

    }
    return inputFrag;
};

/**
 * Function to present a question with text-input
 */
Question.prototype.printQuestion = function() {
    //get the template and append the question
    var template = document.querySelector("#template-question").content.cloneNode(true);
    template.querySelector(".qHead").appendChild(document.createTextNode(this.question));
    document.querySelector("#content").appendChild(template);
};

module.exports = Question;

},{}],4:[function(require,module,exports){
/**
 * Created by Oskar on 2015-11-23.
 */
"use strict";
var Question = require("./Question");
var Ajax = require("./Ajax");
var Timer = require("./Timer");
var Highscore = require("./Highscore");

/**
 * Constructor function for the Quiz
 * @param nickname{string}, nickname to use for highscore
 * @constructor
 */
function Quiz(nickname) {
    console.log(nickname);
    this.nickname = nickname;
    this.timer = undefined;
    this.question = undefined;
    this.nextURL = "http://vhost3.lnu.se:20080/question/1";
    this.button = undefined;
    this.form = undefined;
    this.totalTime = 0;

    //request the first question
    this.getQuestion();
}

/**
 * Function to send a request for a new question
 */
Quiz.prototype.getQuestion = function () {
    console.log("asking..");
    var url = this.nextURL;
    console.log(url);
    var config = {method: "GET", url: url};
    var responseFunction = this.response.bind(this);

    Ajax.req(config, responseFunction);
};

/**
 * Function to handle the response, uses as argument "callback" in a request
 * @param error{Number}, errorcode, null if no error
 * @param response{string}, response string to parse JSON from
 */
Quiz.prototype.response = function (error, response) {
    console.log("response...");

    //handle errors (404 means no more questions)
    if(error) {
        //present the gameover-view to user
        this.gameOver();
    }

    //handle the response string
    if(response) {
        console.log(response);
        //pasre to JSON
        var obj = JSON.parse(response);
        this.nextURL = obj.nextURL;
        console.log(this.nextURL);

        //statement to call the rightful function on the response
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

/**
 * Function to handle if response is a question
 * @param obj{Object}, object that holds the question
 */
Quiz.prototype.responseQuestion = function(obj) {
    var content = document.querySelector("#content");
    this.clearDiv(content);

    //create a new question from object
    this.question = new Question(obj);
    this.question.print();

    //create a new timer for question
    this.timer = new Timer(this, document.querySelector("#timer h1"), 20);
    this.timer.start();

    //Add linsteners for the form
    console.log("Adding listener..");
    this.addListener();
};

/**
 * Function to handle if response is an answer
 * @param obj{Object}, object that holds the answer
 */
Quiz.prototype.responseAnswer = function(obj) {
    var content = document.querySelector("#content");
    this.clearDiv(content);

    //Handle the template for answer
    var template = document.querySelector("#template-answer").content.cloneNode(true);
    var text = document.createTextNode(obj.message);
    template.querySelector("p").appendChild(text);

    content.appendChild(template);

    if(this.nextURL) {
        //Request a new question, but with a delay
        var newQuestion = this.getQuestion.bind(this);
        setTimeout(newQuestion, 1000);
    }
    else {
        this.gameCompleted();
    }
};

/**
 * Function to add the listener for submit
 */
Quiz.prototype.addListener = function() {
    this.button = document.querySelector("#submit");
    this.form = document.querySelector("#qForm");

    this.button.addEventListener("click",this.submit.bind(this), true);
    this.form.addEventListener("keypress", this.submit.bind(this), true);
};

/**
 * Function to handle when submit is triggered
 */
Quiz.prototype.submit = function(event) {
    //If the trigger is enter or click do the submit
    if (event.which === 13 || event.keyCode === 13 || event.type === "click") {
        console.log("got enter");
        //prevent the form to reload page on enter
        event.preventDefault();

        console.log("submitting...");
        this.totalTime += this.timer.stop();
        console.log("time:" + this.totalTime);
        var input;

        //remove the listeners to prevent double-submit
        this.button.removeEventListener("click", this.submit.bind(this));
        this.form.removeEventListener("keypress", this.submit.bind(this));

        //save input depending on the type of question
        if (document.querySelector("#answer")) {
            //get the form input
            input = document.querySelector("#answer").value;
        }
        else {
            //get the checked readiobutton
            input = document.querySelector("input[name='alternative']:checked").value;
        }

        //set the config to be sent to server and send a request
        var config = {
            method: "POST",
            url: this.nextURL,
            data: {
                answer: input
            }
        };
        var responseFunction = this.response.bind(this);
        Ajax.req(config, responseFunction);
    }
};

/**
 * Function to handle the gameOver-view and present it to user
 */
Quiz.prototype.gameOver = function() {
    //create a highscore module to show it to the user
    var hs = new Highscore(this.nickname);
    console.log("GAME OVER!!!");
    this.clearDiv(document.querySelector("#content"));

    //get the game over template
    var template = document.querySelector("#template-gameOver").content.cloneNode(true);

    //if the highscore has entries add them to the template
    if(hs.highscore.length > 0 ){
        template.querySelector("h2").appendChild(document.createTextNode("Highscore"));
        var hsFrag = hs.createHighscoreFragment();
        template.querySelector("table").appendChild(hsFrag);
    }

    //add the template to content
    document.querySelector("#content").appendChild(template);
};

/**
 * Function to handle the game completed-view and present it to the user
 */
Quiz.prototype.gameCompleted = function() {
    //create new highscore module to handle it
    var hs = new Highscore(this.nickname, this.totalTime.toFixed(3));
    var template = document.querySelector("#template-quizCompleted").content.cloneNode(true);

    //if the score makes it to the highscore, change temple to new highscore
    if(hs.addToList()) {
        console.log("you made it to the list");
        template = document.querySelector("#template-newHighscore").content.cloneNode(true);
    }

    //show the highscore if the highscore has entries
    if(hs.highscore.length > 0) {
        var h1 = template.querySelector(".time");
        var text = document.createTextNode(this.totalTime.toFixed(3));
        h1.appendChild(text);

        template.querySelector(".hs-title").appendChild(document.createTextNode("Highscore"));
        var hsFrag = hs.createHighscoreFragment();
        template.querySelector("table").appendChild(hsFrag);
    }

    this.clearDiv(document.querySelector("#content"));
    document.querySelector("#content").appendChild(template);
};

/**
 * Function to clear a specific div of childs
 * @param div{Object}, the divelement to clear
 */
Quiz.prototype.clearDiv = function(div) {
    while(div.hasChildNodes()) {
        div.removeChild(div.lastChild);
    }
};

module.exports = Quiz;

},{"./Ajax":1,"./Highscore":2,"./Question":3,"./Timer":5}],5:[function(require,module,exports){
/**
 * Created by Oskar on 2015-11-24.
 */

/**
 * Timer constructor
 * @param owner{Object}, the owner-object that created the timer
 * @param element{Object}, element to print the timer to
 * @param time{Number}, the time to count down
 * @constructor
 */
function Timer(owner, element, time) {
    this.time = time;
    this.element = element;
    this.owner = owner;
    this.startTime = new Date().getTime();
    this.interval = undefined;
}

/**
 * Function that starts an interval for the timer
 */
Timer.prototype.start = function() {
    //call the run function on each interval
    this.interval = setInterval(this.run.bind(this), 100);
};

/**
 * Function to be executed each interval of the timer
 */
Timer.prototype.run = function() {
    var now = new Date().getTime();

    //count the difference from start to now
    var diff = (now - this.startTime)/1000;

    //count the time - difference to show countdown
    var showTime = this.time - diff;

    if(diff >= this.time) {
        //time if up
        showTime = 0;
        clearInterval(this.interval);

        //call owner gameOver since time is out
        this.owner.gameOver();
    }

    //show the timer with one decimal
    this.print(showTime.toFixed(1));
};

/**
 * Function that stops the timer before its over
 * @returns {number}, the difference in decounds
 */
Timer.prototype.stop = function() {
    clearInterval(this.interval);
    var now = new Date().getTime();

    return (now - this.startTime)/1000;
};

/**
 * Function to show the timer at the given element
 * @param diff{Number} the time to be printed
 */
Timer.prototype.print = function(diff) {
    this.element.replaceChild(document.createTextNode(diff), this.element.firstChild);
};

module.exports = Timer;

},{}],6:[function(require,module,exports){
"use strict";
var Quiz = require("./Quiz");
var q;

/**
 * Function to handle the submit for nickname and start the quiz
 * @param event, the eventhandler from the listener
 */

function submit(event) {
    if (event.which === 13 || event.keyCode === 13 || event.type === "click") {
        console.log("submitting");

        //disable forms action so page wont reload with enter
        event.preventDefault();

        var input = document.querySelector("#nickname").value;

        //if nickname written, start quiz
        if(input.length > 1) {
            q = new Quiz(input);
        }
    }
}

var button = document.querySelector("#submit");
var form = document.querySelector("#qForm");

button.addEventListener("click",submit, true);
form.addEventListener("keypress", submit, true);


},{"./Quiz":4}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMS4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQWpheC5qcyIsImNsaWVudC9zb3VyY2UvanMvSGlnaHNjb3JlLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9RdWVzdGlvbi5qcyIsImNsaWVudC9zb3VyY2UvanMvUXVpei5qcyIsImNsaWVudC9zb3VyY2UvanMvVGltZXIuanMiLCJjbGllbnQvc291cmNlL2pzL2FwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTIzLlxuICovXG5cbi8qKlxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHJlcXVlc3RzIHZpYSBYTUxIdHRwUmVxdWVzdFxuICogQHBhcmFtIGNvbmZpZ3tPYmplY3R9LCBvYmplY3Qgd2l0aCBtZXRob2QgYW5kIHVybCwgcG9zc2libHkgZGF0YVxuICogQHBhcmFtIGNhbGxiYWNre0Z1bmN0aW9ufSwgdGhlIGZ1bmN0aW9uIHRvIGNhbGwgYXQgcmVzcG9uc2VcbiAqL1xuZnVuY3Rpb24gcmVxKGNvbmZpZywgY2FsbGJhY2spIHtcbiAgICB2YXIgciA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgLy9hZGQgZXZlbnRsaXN0ZW5lciBmb3IgcmVzcG9uc2VcbiAgICByLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGlmIChyLnN0YXR1cyA+PSA0MDApIHtcbiAgICAgICAgICAgIC8vZ290IGVycm9yLCBjYWxsIHdpdGggZXJyb3Jjb2RlXG4gICAgICAgICAgICBjYWxsYmFjayhyLnN0YXR1cyk7XG4gICAgICAgIH1cblxuICAgICAgICAvL2NhbGwgdGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHdpdGggcmVzcG9uc2VUZXh0XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHIucmVzcG9uc2VUZXh0KTtcbiAgICB9KTtcblxuICAgIC8vb3BlbiBhIHJlcXVlc3QgZnJvbSB0aGUgY29uZmlnXG4gICAgci5vcGVuKGNvbmZpZy5tZXRob2QsIGNvbmZpZy51cmwpO1xuICAgIGNvbnNvbGUubG9nKGNvbmZpZyk7XG5cbiAgICBpZihjb25maWcuZGF0YSl7XG4gICAgICAgIC8vc2VuZCB0aGUgZGF0YSBhcyBKU09OIHRvIHRoZSBzZXJ2ZXJcbiAgICAgICAgci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcbiAgICAgICAgci5zZW5kKEpTT04uc3RyaW5naWZ5KGNvbmZpZy5kYXRhKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy9zZW5kIHJlcXVlc3RcbiAgICAgICAgci5zZW5kKG51bGwpO1xuICAgIH1cbn1cblxuXG5tb2R1bGUuZXhwb3J0cy5yZXEgPSByZXE7XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yNC5cbiAqL1xuXG4vKipcbiAqIEhpZ2hzY29yZSBjb25zdHJ1Y3RvclxuICogQHBhcmFtIG5pY2tuYW1le3N0cmluZ30sIHRoZSBuaWNrbmFtZVxuICogQHBhcmFtIHNjb3Jle3N0cmluZ30sIHRoZSBzY29yZSh0aW1lKVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEhpZ2hzY29yZShuaWNrbmFtZSwgc2NvcmUpIHtcbiAgICB0aGlzLm5pY2tuYW1lID0gbmlja25hbWU7XG4gICAgdGhpcy5zY29yZSA9IHNjb3JlO1xuICAgIHRoaXMuaGlnaHNjb3JlID0gW107XG5cbiAgICAvL2NhbGwgdG8gcmVhZCBoaWdoc2NvcmUgZmlsZSBmcm9tIGxvY2FsIHN0b3JhZ2VcbiAgICB0aGlzLnJlYWRGcm9tRmlsZSgpO1xufVxuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHJlYWQgdGhlIGhpZ2hzY29yZS1maWxlIGZyb20gbG9jYWwgc3RvcmFnZVxuICovXG5IaWdoc2NvcmUucHJvdG90eXBlLnJlYWRGcm9tRmlsZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBoc0ZpbGUgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcImhzXCIpO1xuICAgIGlmKGhzRmlsZSkge1xuICAgICAgICAvL3BhcnNlIGZpbGUgaW50byBKU09OXG4gICAgICAgIHZhciBqc29uID0gSlNPTi5wYXJzZShoc0ZpbGUpO1xuICAgICAgICBjb25zb2xlLmxvZyhqc29uKTtcblxuICAgICAgICAvL2ZpbGwgdGhlIGhpZ2hzY29yZS1hcnJheSB3aXRoIGVudHJpZXNcbiAgICAgICAgZm9yICh2YXIgbmlja25hbWUgaW4ganNvbikge1xuICAgICAgICAgICAgaWYoanNvbi5oYXNPd25Qcm9wZXJ0eShuaWNrbmFtZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhpZ2hzY29yZS5wdXNoKGpzb25bbmlja25hbWVdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gY2hlY2sgaWYgdGhlIHNjb3JlIHRha2VzIGEgcGxhY2UgaW50byB0aGUgaGlnaHNjb3JlXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuSGlnaHNjb3JlLnByb3RvdHlwZS5pc0hpZ2hzY29yZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpc0hpZ2hzY29yZSA9IGZhbHNlO1xuICAgIGlmKHRoaXMuaGlnaHNjb3JlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAvL2hpZ2hzY29yZSBpcyBlbXB0eSwgdGhlcmVmb3JlIG5ldyBoaWdoc2NvcmVcbiAgICAgICAgaXNIaWdoc2NvcmUgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vZ2V0IHRoZSBzY29yZSBsYXN0IGluIHRoZSBsaXN0XG4gICAgICAgIHZhciBsYXN0U2NvcmUgPSB0aGlzLmhpZ2hzY29yZVt0aGlzLmhpZ2hzY29yZS5sZW5ndGggLSAxXS5zY29yZTtcbiAgICAgICAgaWYodGhpcy5zY29yZSA8IGxhc3RTY29yZSB8fCB0aGlzLmhpZ2hzY29yZS5sZW5ndGggPCA1KSB7XG4gICAgICAgICAgICBpc0hpZ2hzY29yZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGlzSGlnaHNjb3JlO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBhZGQgdGhlIHNjb3JlIGludG8gdGhlIGxpc3RcbiAqIEByZXR1cm5zIHtib29sZWFufSwgYWRkZWQgb3Igbm90XG4gKi9cbkhpZ2hzY29yZS5wcm90b3R5cGUuYWRkVG9MaXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFkZGVkID0gZmFsc2U7XG4gICAgLy9jYWxsIHRoZSBpc0hpZ2hzY29yZSB0byBjaGVjayBpZiBzY29yZSBzaG91bGQgYmUgYWRkZWRcbiAgICBpZih0aGlzLmlzSGlnaHNjb3JlKCkpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJpc0hpZ2hzY29yZSwgYWRkaW5nIHRvIGxpc3QuLlwiKTtcblxuICAgICAgICAvL3NhdmUgdGhlIG5pY2tuYW1lIGFuZCBzY29yZSBpbnRvIGFuIG9iamVjdFxuICAgICAgICB2YXIgdGhpc1Njb3JlID0ge1xuICAgICAgICAgICAgbmlja25hbWU6IHRoaXMubmlja25hbWUsXG4gICAgICAgICAgICBzY29yZTogdGhpcy5zY29yZVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vZGVsZXRlIHRoZSBsYXN0IHBvc2l0aW9uIG9mIHRoZSBoaWdoc2NvcmUgYXJyYXlcbiAgICAgICAgaWYodGhpcy5oaWdoc2NvcmUubGVuZ3RoID09PSA1KSB7XG4gICAgICAgICAgICAvL3JlbW92ZSB0aGUgb25lIGxhc3RcbiAgICAgICAgICAgIHRoaXMuaGlnaHNjb3JlLnNwbGljZSgtMSwgMSk7XG4gICAgICAgIH1cblxuICAgICAgICAvL3B1c2ggdGhlIG5ldyBhbmQgc29ydCB0aGUgYXJyYXlcbiAgICAgICAgdGhpcy5oaWdoc2NvcmUucHVzaCh0aGlzU2NvcmUpO1xuICAgICAgICB0aGlzLmhpZ2hzY29yZSA9IHRoaXMuaGlnaHNjb3JlLnNvcnQoZnVuY3Rpb24oYSxiKSB7cmV0dXJuIGEuc2NvcmUgLSBiLnNjb3JlO30pO1xuXG4gICAgICAgIC8vY2FsbCB0byBzYXZlIGl0XG4gICAgICAgIHRoaXMuc2F2ZVRvRmlsZSgpO1xuXG4gICAgICAgIGFkZGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGFkZGVkO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBzYXZlIHRoZSBoaWdoc2NvcmUgdG8gbG9jYWwgc3RvcmFnZVxuICovXG5IaWdoc2NvcmUucHJvdG90eXBlLnNhdmVUb0ZpbGUgPSBmdW5jdGlvbigpIHtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImhzXCIsIEpTT04uc3RyaW5naWZ5KHRoaXMuaGlnaHNjb3JlKSk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGdldCB0aGUgaGlnaHNjb3JlZnJhZ21lbnQgY29udGFpbmluZyB0aGUgaGlnaHNjb3JlLXBhcnQgb2YgdGFibGVcbiAqIEByZXR1cm5zIHtEb2N1bWVudEZyYWdtZW50fVxuICovXG5IaWdoc2NvcmUucHJvdG90eXBlLmNyZWF0ZUhpZ2hzY29yZUZyYWdtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIHRlbXBsYXRlO1xuICAgIHZhciBoc05pY2tuYW1lO1xuICAgIHZhciBoc1Njb3JlO1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmhpZ2hzY29yZS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAvL2dldCB0aGUgdGVtcGxhdGUgZm9yIGEgdGFibGUtcm93XG4gICAgICAgIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0ZW1wbGF0ZS1oaWdoc2NvcmVSb3dcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgIGhzTmlja25hbWUgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLW5pY2tuYW1lXCIpO1xuICAgICAgICBoc1Njb3JlID0gdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5ocy1zY29yZVwiKTtcblxuICAgICAgICAvL2FwcGVuZCB0aGUgbmlja25hbWUgYW5kIHNjb3JlIHRvIHRoZSByb3dcbiAgICAgICAgaHNOaWNrbmFtZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLmhpZ2hzY29yZVtpXS5uaWNrbmFtZSkpO1xuICAgICAgICBoc1Njb3JlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMuaGlnaHNjb3JlW2ldLnNjb3JlKSk7XG5cbiAgICAgICAgLy9hcHBlbmQgcm93IHRvIGZyYWdtZW50XG4gICAgICAgIGZyYWcuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xuICAgIH1cblxuICAgIHJldHVybiBmcmFnO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBIaWdoc2NvcmU7XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yMy5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogUXVlc3Rpb24gY29uc3RydWN0b3JcbiAqIEBwYXJhbSBvYmp7T2JqZWN0fSwgb2JqZWN0IHRoYXQgaG9sZHMgYSBxdWVzdGlvblxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFF1ZXN0aW9uKG9iaikge1xuICAgIHRoaXMuaWQgPSBvYmouaWQ7XG4gICAgdGhpcy5xdWVzdGlvbiA9IG9iai5xdWVzdGlvbjtcbiAgICB0aGlzLmFsdCA9IG9iai5hbHRlcm5hdGl2ZXM7XG59XG5cbi8qKlxuICogRnVuY3Rpb25iIHRvIHByZXNlbnQgdGhlIHF1ZXN0aW9uXG4gKi9cblF1ZXN0aW9uLnByb3RvdHlwZS5wcmludCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vc3RhdGVtZW50IHRvIGNhbGwgdGhlIHJpZ2h0ZnVsIHByaW50ZnVuY3Rpb25cbiAgICBpZih0aGlzLmFsdCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcImhhcyBhbHRlcm5hdGl2ZXNcIik7XG4gICAgICAgIHRoaXMucHJpbnRBbHRRdWVzdGlvbigpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5wcmludFF1ZXN0aW9uKCk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBjbGVhciBhIGRpdlxuICogQHBhcmFtIGRpdntvYmplY3R9LCB0aGUgZGl2IHRvIGNsZWFyXG4gKi9cblF1ZXN0aW9uLnByb3RvdHlwZS5jbGVhckRpdiA9IGZ1bmN0aW9uKGRpdikge1xuICAgIHdoaWxlKGRpdi5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgZGl2LnJlbW92ZUNoaWxkKGRpdi5sYXN0Q2hpbGQpO1xuICAgIH1cbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gcHJlc2VudCB0aGUgcXVlcnN0aW9uIHRoYXQgaGFzIGFsdGVybmF0aXZlc1xuICovXG5RdWVzdGlvbi5wcm90b3R5cGUucHJpbnRBbHRRdWVzdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIC8vZ2V0IHRoZSB0ZW1wbGF0ZSBhbmQgYXBwZW5kIHRoZSBhbHRlcm5hdGl2ZXNcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLXF1ZXN0aW9uLWFsdFwiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLnFIZWFkXCIpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMucXVlc3Rpb24pKTtcblxuICAgIC8vY2FsbCB0aGUgZnVuY3Rpb24gdGhhdCBoYW5kbGVzIHRoZSBhbHRlcm5hdGl2ZXNcbiAgICB2YXIgaW5wdXRGcmFnID0gdGhpcy5nZXRBbHRGcmFnKCk7XG4gICAgY29uc29sZS5sb2codGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIiNzdWJtaXRcIikpO1xuICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIjcUZvcm1cIikuaW5zZXJ0QmVmb3JlKGlucHV0RnJhZywgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIiNzdWJtaXRcIikpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSB0aGUgYWx0ZXJuYXRpdmVzXG4gKiBAcmV0dXJucyB7RG9jdW1lbnRGcmFnbWVudH0sIHRoZSBmcmFnbWVudCBmb3IgdGhlIGFsdGVybmF0aXZlc1xuICovXG5RdWVzdGlvbi5wcm90b3R5cGUuZ2V0QWx0RnJhZyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpbnB1dEZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIGlucHV0O1xuICAgIHZhciBsYWJlbDtcblxuICAgIGNvbnNvbGUubG9nKHRoaXMuYWx0KTtcbiAgICBmb3IodmFyIGFsdCBpbiB0aGlzLmFsdCkge1xuICAgICAgICBpZih0aGlzLmFsdC5oYXNPd25Qcm9wZXJ0eShhbHQpKSB7XG4gICAgICAgICAgICAvL2dldCB0aGUgdGVtcGxhdGUgZm9yIGFsdGVybmF0aXZlc1xuICAgICAgICAgICAgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLWFsdGVybmF0aXZlXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coaW5wdXQpO1xuICAgICAgICAgICAgLy9hcHBlbmQgdGhlIGFsdGVybmF0aXZlXG4gICAgICAgICAgICBpbnB1dC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRcIikuc2V0QXR0cmlidXRlKFwidmFsdWVcIiwgYWx0KTtcbiAgICAgICAgICAgIGxhYmVsID0gaW5wdXQucXVlcnlTZWxlY3RvcihcImxhYmVsXCIpO1xuICAgICAgICAgICAgbGFiZWwuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5hbHRbYWx0XSkpO1xuXG4gICAgICAgICAgICBpbnB1dEZyYWcuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICB9XG5cbiAgICB9XG4gICAgcmV0dXJuIGlucHV0RnJhZztcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gcHJlc2VudCBhIHF1ZXN0aW9uIHdpdGggdGV4dC1pbnB1dFxuICovXG5RdWVzdGlvbi5wcm90b3R5cGUucHJpbnRRdWVzdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIC8vZ2V0IHRoZSB0ZW1wbGF0ZSBhbmQgYXBwZW5kIHRoZSBxdWVzdGlvblxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtcXVlc3Rpb25cIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5xSGVhZFwiKS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLnF1ZXN0aW9uKSk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUXVlc3Rpb247XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yMy5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgUXVlc3Rpb24gPSByZXF1aXJlKFwiLi9RdWVzdGlvblwiKTtcbnZhciBBamF4ID0gcmVxdWlyZShcIi4vQWpheFwiKTtcbnZhciBUaW1lciA9IHJlcXVpcmUoXCIuL1RpbWVyXCIpO1xudmFyIEhpZ2hzY29yZSA9IHJlcXVpcmUoXCIuL0hpZ2hzY29yZVwiKTtcblxuLyoqXG4gKiBDb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgdGhlIFF1aXpcbiAqIEBwYXJhbSBuaWNrbmFtZXtzdHJpbmd9LCBuaWNrbmFtZSB0byB1c2UgZm9yIGhpZ2hzY29yZVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFF1aXoobmlja25hbWUpIHtcbiAgICBjb25zb2xlLmxvZyhuaWNrbmFtZSk7XG4gICAgdGhpcy5uaWNrbmFtZSA9IG5pY2tuYW1lO1xuICAgIHRoaXMudGltZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5xdWVzdGlvbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLm5leHRVUkwgPSBcImh0dHA6Ly92aG9zdDMubG51LnNlOjIwMDgwL3F1ZXN0aW9uLzFcIjtcbiAgICB0aGlzLmJ1dHRvbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmZvcm0gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy50b3RhbFRpbWUgPSAwO1xuXG4gICAgLy9yZXF1ZXN0IHRoZSBmaXJzdCBxdWVzdGlvblxuICAgIHRoaXMuZ2V0UXVlc3Rpb24oKTtcbn1cblxuLyoqXG4gKiBGdW5jdGlvbiB0byBzZW5kIGEgcmVxdWVzdCBmb3IgYSBuZXcgcXVlc3Rpb25cbiAqL1xuUXVpei5wcm90b3R5cGUuZ2V0UXVlc3Rpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgY29uc29sZS5sb2coXCJhc2tpbmcuLlwiKTtcbiAgICB2YXIgdXJsID0gdGhpcy5uZXh0VVJMO1xuICAgIGNvbnNvbGUubG9nKHVybCk7XG4gICAgdmFyIGNvbmZpZyA9IHttZXRob2Q6IFwiR0VUXCIsIHVybDogdXJsfTtcbiAgICB2YXIgcmVzcG9uc2VGdW5jdGlvbiA9IHRoaXMucmVzcG9uc2UuYmluZCh0aGlzKTtcblxuICAgIEFqYXgucmVxKGNvbmZpZywgcmVzcG9uc2VGdW5jdGlvbik7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSB0aGUgcmVzcG9uc2UsIHVzZXMgYXMgYXJndW1lbnQgXCJjYWxsYmFja1wiIGluIGEgcmVxdWVzdFxuICogQHBhcmFtIGVycm9ye051bWJlcn0sIGVycm9yY29kZSwgbnVsbCBpZiBubyBlcnJvclxuICogQHBhcmFtIHJlc3BvbnNle3N0cmluZ30sIHJlc3BvbnNlIHN0cmluZyB0byBwYXJzZSBKU09OIGZyb21cbiAqL1xuUXVpei5wcm90b3R5cGUucmVzcG9uc2UgPSBmdW5jdGlvbiAoZXJyb3IsIHJlc3BvbnNlKSB7XG4gICAgY29uc29sZS5sb2coXCJyZXNwb25zZS4uLlwiKTtcblxuICAgIC8vaGFuZGxlIGVycm9ycyAoNDA0IG1lYW5zIG5vIG1vcmUgcXVlc3Rpb25zKVxuICAgIGlmKGVycm9yKSB7XG4gICAgICAgIC8vcHJlc2VudCB0aGUgZ2FtZW92ZXItdmlldyB0byB1c2VyXG4gICAgICAgIHRoaXMuZ2FtZU92ZXIoKTtcbiAgICB9XG5cbiAgICAvL2hhbmRsZSB0aGUgcmVzcG9uc2Ugc3RyaW5nXG4gICAgaWYocmVzcG9uc2UpIHtcbiAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xuICAgICAgICAvL3Bhc3JlIHRvIEpTT05cbiAgICAgICAgdmFyIG9iaiA9IEpTT04ucGFyc2UocmVzcG9uc2UpO1xuICAgICAgICB0aGlzLm5leHRVUkwgPSBvYmoubmV4dFVSTDtcbiAgICAgICAgY29uc29sZS5sb2codGhpcy5uZXh0VVJMKTtcblxuICAgICAgICAvL3N0YXRlbWVudCB0byBjYWxsIHRoZSByaWdodGZ1bCBmdW5jdGlvbiBvbiB0aGUgcmVzcG9uc2VcbiAgICAgICAgaWYob2JqLnF1ZXN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnJlc3BvbnNlUXVlc3Rpb24ob2JqKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmKHRoaXMubmV4dFVSTCB8fCBvYmoubWVzc2FnZSA9PT0gXCJDb3JyZWN0IGFuc3dlciFcIikge1xuICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VBbnN3ZXIob2JqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgaWYgcmVzcG9uc2UgaXMgYSBxdWVzdGlvblxuICogQHBhcmFtIG9iantPYmplY3R9LCBvYmplY3QgdGhhdCBob2xkcyB0aGUgcXVlc3Rpb25cbiAqL1xuUXVpei5wcm90b3R5cGUucmVzcG9uc2VRdWVzdGlvbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBjb250ZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpO1xuICAgIHRoaXMuY2xlYXJEaXYoY29udGVudCk7XG5cbiAgICAvL2NyZWF0ZSBhIG5ldyBxdWVzdGlvbiBmcm9tIG9iamVjdFxuICAgIHRoaXMucXVlc3Rpb24gPSBuZXcgUXVlc3Rpb24ob2JqKTtcbiAgICB0aGlzLnF1ZXN0aW9uLnByaW50KCk7XG5cbiAgICAvL2NyZWF0ZSBhIG5ldyB0aW1lciBmb3IgcXVlc3Rpb25cbiAgICB0aGlzLnRpbWVyID0gbmV3IFRpbWVyKHRoaXMsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGltZXIgaDFcIiksIDIwKTtcbiAgICB0aGlzLnRpbWVyLnN0YXJ0KCk7XG5cbiAgICAvL0FkZCBsaW5zdGVuZXJzIGZvciB0aGUgZm9ybVxuICAgIGNvbnNvbGUubG9nKFwiQWRkaW5nIGxpc3RlbmVyLi5cIik7XG4gICAgdGhpcy5hZGRMaXN0ZW5lcigpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgaWYgcmVzcG9uc2UgaXMgYW4gYW5zd2VyXG4gKiBAcGFyYW0gb2Jqe09iamVjdH0sIG9iamVjdCB0aGF0IGhvbGRzIHRoZSBhbnN3ZXJcbiAqL1xuUXVpei5wcm90b3R5cGUucmVzcG9uc2VBbnN3ZXIgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29udGVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKTtcbiAgICB0aGlzLmNsZWFyRGl2KGNvbnRlbnQpO1xuXG4gICAgLy9IYW5kbGUgdGhlIHRlbXBsYXRlIGZvciBhbnN3ZXJcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLWFuc3dlclwiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKG9iai5tZXNzYWdlKTtcbiAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwicFwiKS5hcHBlbmRDaGlsZCh0ZXh0KTtcblxuICAgIGNvbnRlbnQuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xuXG4gICAgaWYodGhpcy5uZXh0VVJMKSB7XG4gICAgICAgIC8vUmVxdWVzdCBhIG5ldyBxdWVzdGlvbiwgYnV0IHdpdGggYSBkZWxheVxuICAgICAgICB2YXIgbmV3UXVlc3Rpb24gPSB0aGlzLmdldFF1ZXN0aW9uLmJpbmQodGhpcyk7XG4gICAgICAgIHNldFRpbWVvdXQobmV3UXVlc3Rpb24sIDEwMDApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5nYW1lQ29tcGxldGVkKCk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBhZGQgdGhlIGxpc3RlbmVyIGZvciBzdWJtaXRcbiAqL1xuUXVpei5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc3VibWl0XCIpO1xuICAgIHRoaXMuZm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcUZvcm1cIik7XG5cbiAgICB0aGlzLmJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIix0aGlzLnN1Ym1pdC5iaW5kKHRoaXMpLCB0cnVlKTtcbiAgICB0aGlzLmZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcImtleXByZXNzXCIsIHRoaXMuc3VibWl0LmJpbmQodGhpcyksIHRydWUpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgd2hlbiBzdWJtaXQgaXMgdHJpZ2dlcmVkXG4gKi9cblF1aXoucHJvdG90eXBlLnN1Ym1pdCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgLy9JZiB0aGUgdHJpZ2dlciBpcyBlbnRlciBvciBjbGljayBkbyB0aGUgc3VibWl0XG4gICAgaWYgKGV2ZW50LndoaWNoID09PSAxMyB8fCBldmVudC5rZXlDb2RlID09PSAxMyB8fCBldmVudC50eXBlID09PSBcImNsaWNrXCIpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJnb3QgZW50ZXJcIik7XG4gICAgICAgIC8vcHJldmVudCB0aGUgZm9ybSB0byByZWxvYWQgcGFnZSBvbiBlbnRlclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwic3VibWl0dGluZy4uLlwiKTtcbiAgICAgICAgdGhpcy50b3RhbFRpbWUgKz0gdGhpcy50aW1lci5zdG9wKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwidGltZTpcIiArIHRoaXMudG90YWxUaW1lKTtcbiAgICAgICAgdmFyIGlucHV0O1xuXG4gICAgICAgIC8vcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgdG8gcHJldmVudCBkb3VibGUtc3VibWl0XG4gICAgICAgIHRoaXMuYnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnN1Ym1pdC5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5mb3JtLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlwcmVzc1wiLCB0aGlzLnN1Ym1pdC5iaW5kKHRoaXMpKTtcblxuICAgICAgICAvL3NhdmUgaW5wdXQgZGVwZW5kaW5nIG9uIHRoZSB0eXBlIG9mIHF1ZXN0aW9uXG4gICAgICAgIGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2Fuc3dlclwiKSkge1xuICAgICAgICAgICAgLy9nZXQgdGhlIGZvcm0gaW5wdXRcbiAgICAgICAgICAgIGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNhbnN3ZXJcIikudmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvL2dldCB0aGUgY2hlY2tlZCByZWFkaW9idXR0b25cbiAgICAgICAgICAgIGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImlucHV0W25hbWU9J2FsdGVybmF0aXZlJ106Y2hlY2tlZFwiKS52YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vc2V0IHRoZSBjb25maWcgdG8gYmUgc2VudCB0byBzZXJ2ZXIgYW5kIHNlbmQgYSByZXF1ZXN0XG4gICAgICAgIHZhciBjb25maWcgPSB7XG4gICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgICAgdXJsOiB0aGlzLm5leHRVUkwsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgYW5zd2VyOiBpbnB1dFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgcmVzcG9uc2VGdW5jdGlvbiA9IHRoaXMucmVzcG9uc2UuYmluZCh0aGlzKTtcbiAgICAgICAgQWpheC5yZXEoY29uZmlnLCByZXNwb25zZUZ1bmN0aW9uKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSB0aGUgZ2FtZU92ZXItdmlldyBhbmQgcHJlc2VudCBpdCB0byB1c2VyXG4gKi9cblF1aXoucHJvdG90eXBlLmdhbWVPdmVyID0gZnVuY3Rpb24oKSB7XG4gICAgLy9jcmVhdGUgYSBoaWdoc2NvcmUgbW9kdWxlIHRvIHNob3cgaXQgdG8gdGhlIHVzZXJcbiAgICB2YXIgaHMgPSBuZXcgSGlnaHNjb3JlKHRoaXMubmlja25hbWUpO1xuICAgIGNvbnNvbGUubG9nKFwiR0FNRSBPVkVSISEhXCIpO1xuICAgIHRoaXMuY2xlYXJEaXYoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpKTtcblxuICAgIC8vZ2V0IHRoZSBnYW1lIG92ZXIgdGVtcGxhdGVcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLWdhbWVPdmVyXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgLy9pZiB0aGUgaGlnaHNjb3JlIGhhcyBlbnRyaWVzIGFkZCB0aGVtIHRvIHRoZSB0ZW1wbGF0ZVxuICAgIGlmKGhzLmhpZ2hzY29yZS5sZW5ndGggPiAwICl7XG4gICAgICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCJoMlwiKS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIkhpZ2hzY29yZVwiKSk7XG4gICAgICAgIHZhciBoc0ZyYWcgPSBocy5jcmVhdGVIaWdoc2NvcmVGcmFnbWVudCgpO1xuICAgICAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwidGFibGVcIikuYXBwZW5kQ2hpbGQoaHNGcmFnKTtcbiAgICB9XG5cbiAgICAvL2FkZCB0aGUgdGVtcGxhdGUgdG8gY29udGVudFxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSB0aGUgZ2FtZSBjb21wbGV0ZWQtdmlldyBhbmQgcHJlc2VudCBpdCB0byB0aGUgdXNlclxuICovXG5RdWl6LnByb3RvdHlwZS5nYW1lQ29tcGxldGVkID0gZnVuY3Rpb24oKSB7XG4gICAgLy9jcmVhdGUgbmV3IGhpZ2hzY29yZSBtb2R1bGUgdG8gaGFuZGxlIGl0XG4gICAgdmFyIGhzID0gbmV3IEhpZ2hzY29yZSh0aGlzLm5pY2tuYW1lLCB0aGlzLnRvdGFsVGltZS50b0ZpeGVkKDMpKTtcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLXF1aXpDb21wbGV0ZWRcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG5cbiAgICAvL2lmIHRoZSBzY29yZSBtYWtlcyBpdCB0byB0aGUgaGlnaHNjb3JlLCBjaGFuZ2UgdGVtcGxlIHRvIG5ldyBoaWdoc2NvcmVcbiAgICBpZihocy5hZGRUb0xpc3QoKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcInlvdSBtYWRlIGl0IHRvIHRoZSBsaXN0XCIpO1xuICAgICAgICB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtbmV3SGlnaHNjb3JlXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgIH1cblxuICAgIC8vc2hvdyB0aGUgaGlnaHNjb3JlIGlmIHRoZSBoaWdoc2NvcmUgaGFzIGVudHJpZXNcbiAgICBpZihocy5oaWdoc2NvcmUubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgaDEgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLnRpbWVcIik7XG4gICAgICAgIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy50b3RhbFRpbWUudG9GaXhlZCgzKSk7XG4gICAgICAgIGgxLmFwcGVuZENoaWxkKHRleHQpO1xuXG4gICAgICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuaHMtdGl0bGVcIikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJIaWdoc2NvcmVcIikpO1xuICAgICAgICB2YXIgaHNGcmFnID0gaHMuY3JlYXRlSGlnaHNjb3JlRnJhZ21lbnQoKTtcbiAgICAgICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcInRhYmxlXCIpLmFwcGVuZENoaWxkKGhzRnJhZyk7XG4gICAgfVxuXG4gICAgdGhpcy5jbGVhckRpdihkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGNsZWFyIGEgc3BlY2lmaWMgZGl2IG9mIGNoaWxkc1xuICogQHBhcmFtIGRpdntPYmplY3R9LCB0aGUgZGl2ZWxlbWVudCB0byBjbGVhclxuICovXG5RdWl6LnByb3RvdHlwZS5jbGVhckRpdiA9IGZ1bmN0aW9uKGRpdikge1xuICAgIHdoaWxlKGRpdi5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgZGl2LnJlbW92ZUNoaWxkKGRpdi5sYXN0Q2hpbGQpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUXVpejtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTI0LlxuICovXG5cbi8qKlxuICogVGltZXIgY29uc3RydWN0b3JcbiAqIEBwYXJhbSBvd25lcntPYmplY3R9LCB0aGUgb3duZXItb2JqZWN0IHRoYXQgY3JlYXRlZCB0aGUgdGltZXJcbiAqIEBwYXJhbSBlbGVtZW50e09iamVjdH0sIGVsZW1lbnQgdG8gcHJpbnQgdGhlIHRpbWVyIHRvXG4gKiBAcGFyYW0gdGltZXtOdW1iZXJ9LCB0aGUgdGltZSB0byBjb3VudCBkb3duXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVGltZXIob3duZXIsIGVsZW1lbnQsIHRpbWUpIHtcbiAgICB0aGlzLnRpbWUgPSB0aW1lO1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vd25lciA9IG93bmVyO1xuICAgIHRoaXMuc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgdGhpcy5pbnRlcnZhbCA9IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBGdW5jdGlvbiB0aGF0IHN0YXJ0cyBhbiBpbnRlcnZhbCBmb3IgdGhlIHRpbWVyXG4gKi9cblRpbWVyLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vY2FsbCB0aGUgcnVuIGZ1bmN0aW9uIG9uIGVhY2ggaW50ZXJ2YWxcbiAgICB0aGlzLmludGVydmFsID0gc2V0SW50ZXJ2YWwodGhpcy5ydW4uYmluZCh0aGlzKSwgMTAwKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gYmUgZXhlY3V0ZWQgZWFjaCBpbnRlcnZhbCBvZiB0aGUgdGltZXJcbiAqL1xuVGltZXIucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuICAgIC8vY291bnQgdGhlIGRpZmZlcmVuY2UgZnJvbSBzdGFydCB0byBub3dcbiAgICB2YXIgZGlmZiA9IChub3cgLSB0aGlzLnN0YXJ0VGltZSkvMTAwMDtcblxuICAgIC8vY291bnQgdGhlIHRpbWUgLSBkaWZmZXJlbmNlIHRvIHNob3cgY291bnRkb3duXG4gICAgdmFyIHNob3dUaW1lID0gdGhpcy50aW1lIC0gZGlmZjtcblxuICAgIGlmKGRpZmYgPj0gdGhpcy50aW1lKSB7XG4gICAgICAgIC8vdGltZSBpZiB1cFxuICAgICAgICBzaG93VGltZSA9IDA7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbCk7XG5cbiAgICAgICAgLy9jYWxsIG93bmVyIGdhbWVPdmVyIHNpbmNlIHRpbWUgaXMgb3V0XG4gICAgICAgIHRoaXMub3duZXIuZ2FtZU92ZXIoKTtcbiAgICB9XG5cbiAgICAvL3Nob3cgdGhlIHRpbWVyIHdpdGggb25lIGRlY2ltYWxcbiAgICB0aGlzLnByaW50KHNob3dUaW1lLnRvRml4ZWQoMSkpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0aGF0IHN0b3BzIHRoZSB0aW1lciBiZWZvcmUgaXRzIG92ZXJcbiAqIEByZXR1cm5zIHtudW1iZXJ9LCB0aGUgZGlmZmVyZW5jZSBpbiBkZWNvdW5kc1xuICovXG5UaW1lci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbCk7XG4gICAgdmFyIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG4gICAgcmV0dXJuIChub3cgLSB0aGlzLnN0YXJ0VGltZSkvMTAwMDtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gc2hvdyB0aGUgdGltZXIgYXQgdGhlIGdpdmVuIGVsZW1lbnRcbiAqIEBwYXJhbSBkaWZme051bWJlcn0gdGhlIHRpbWUgdG8gYmUgcHJpbnRlZFxuICovXG5UaW1lci5wcm90b3R5cGUucHJpbnQgPSBmdW5jdGlvbihkaWZmKSB7XG4gICAgdGhpcy5lbGVtZW50LnJlcGxhY2VDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkaWZmKSwgdGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUaW1lcjtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIFF1aXogPSByZXF1aXJlKFwiLi9RdWl6XCIpO1xudmFyIHE7XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHRoZSBzdWJtaXQgZm9yIG5pY2tuYW1lIGFuZCBzdGFydCB0aGUgcXVpelxuICogQHBhcmFtIGV2ZW50LCB0aGUgZXZlbnRoYW5kbGVyIGZyb20gdGhlIGxpc3RlbmVyXG4gKi9cblxuZnVuY3Rpb24gc3VibWl0KGV2ZW50KSB7XG4gICAgaWYgKGV2ZW50LndoaWNoID09PSAxMyB8fCBldmVudC5rZXlDb2RlID09PSAxMyB8fCBldmVudC50eXBlID09PSBcImNsaWNrXCIpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJzdWJtaXR0aW5nXCIpO1xuXG4gICAgICAgIC8vZGlzYWJsZSBmb3JtcyBhY3Rpb24gc28gcGFnZSB3b250IHJlbG9hZCB3aXRoIGVudGVyXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgdmFyIGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNuaWNrbmFtZVwiKS52YWx1ZTtcblxuICAgICAgICAvL2lmIG5pY2tuYW1lIHdyaXR0ZW4sIHN0YXJ0IHF1aXpcbiAgICAgICAgaWYoaW5wdXQubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgcSA9IG5ldyBRdWl6KGlucHV0KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxudmFyIGJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc3VibWl0XCIpO1xudmFyIGZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3FGb3JtXCIpO1xuXG5idXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsc3VibWl0LCB0cnVlKTtcbmZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcImtleXByZXNzXCIsIHN1Ym1pdCwgdHJ1ZSk7XG5cbiJdfQ==
