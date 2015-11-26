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
        //save the nickname, score and datestamp into an object
        var date = new Date();
        var thisScore = {
            nickname: this.nickname,
            score: this.score,
            date: date
        };
        console.log(thisScore);
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
Highscore.prototype.createHighscoreFragment = function(isNew) {
    var frag = document.createDocumentFragment();
    var template;
    var hsNickname;
    var hsScore;
    var hsDate;
    var date;
    var latestEntry = new Date(this.highscore[0].date);
    var highlightIndex = 0;

    for(var i = 0; i < this.highscore.length; i += 1) {
        //get the template for a table-row
        template = document.querySelector("#template-highscoreRow").content.cloneNode(true);
        hsNickname = template.querySelector(".hs-nickname");
        hsScore = template.querySelector(".hs-score");
        hsDate = template.querySelector(".hs-date");

        //append the nickname and score to the row
        hsNickname.appendChild(document.createTextNode(this.highscore[i].nickname));
        hsScore.appendChild(document.createTextNode(this.highscore[i].score));

        date = new Date(this.highscore[i].date);
        hsDate.appendChild(document.createTextNode(date.toDateString()));

        if(date.valueOf() > latestEntry.valueOf()) {
            highlightIndex = i;
            latestEntry = date;
        }

        //append row to fragment
        frag.appendChild(template);
    }

    if(isNew) {
        frag.querySelectorAll("tr")[highlightIndex].classList.add("highlight");
        console.log("Highlighta position: " + highlightIndex);
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
    var isNew = hs.addToList();

    var template = document.querySelector("#template-quizCompleted").content.cloneNode(true);

    //get the highscore if the highscore has entries
    if(hs.highscore.length > 0) {
        template.querySelector(".hs-title").appendChild(document.createTextNode("Highscore"));
        var hsFrag = hs.createHighscoreFragment(isNew);
        template.querySelector("table").appendChild(hsFrag);
    }

    if(isNew) {
        console.log("you made it to the list");
        var newHS = document.createElement("h1");
        newHS.appendChild(document.createTextNode("New Highscore!"));
        var div = template.querySelector("div");
        div.insertBefore(newHS, div.firstChild);
    }

    this.clearDiv(document.querySelector("#content"));

    var h1 = template.querySelector(".time");
    var text = document.createTextNode(this.totalTime.toFixed(3));
    h1.appendChild(text);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMS4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQWpheC5qcyIsImNsaWVudC9zb3VyY2UvanMvSGlnaHNjb3JlLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9RdWVzdGlvbi5qcyIsImNsaWVudC9zb3VyY2UvanMvUXVpei5qcyIsImNsaWVudC9zb3VyY2UvanMvVGltZXIuanMiLCJjbGllbnQvc291cmNlL2pzL2FwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yMy5cbiAqL1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSByZXF1ZXN0cyB2aWEgWE1MSHR0cFJlcXVlc3RcbiAqIEBwYXJhbSBjb25maWd7T2JqZWN0fSwgb2JqZWN0IHdpdGggbWV0aG9kIGFuZCB1cmwsIHBvc3NpYmx5IGRhdGFcbiAqIEBwYXJhbSBjYWxsYmFja3tGdW5jdGlvbn0sIHRoZSBmdW5jdGlvbiB0byBjYWxsIGF0IHJlc3BvbnNlXG4gKi9cbmZ1bmN0aW9uIHJlcShjb25maWcsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIC8vYWRkIGV2ZW50bGlzdGVuZXIgZm9yIHJlc3BvbnNlXG4gICAgci5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCBmdW5jdGlvbigpIHtcblxuICAgICAgICBpZiAoci5zdGF0dXMgPj0gNDAwKSB7XG4gICAgICAgICAgICAvL2dvdCBlcnJvciwgY2FsbCB3aXRoIGVycm9yY29kZVxuICAgICAgICAgICAgY2FsbGJhY2soci5zdGF0dXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9jYWxsIHRoZSBjYWxsYmFjayBmdW5jdGlvbiB3aXRoIHJlc3BvbnNlVGV4dFxuICAgICAgICBjYWxsYmFjayhudWxsLCByLnJlc3BvbnNlVGV4dCk7XG4gICAgfSk7XG5cbiAgICAvL29wZW4gYSByZXF1ZXN0IGZyb20gdGhlIGNvbmZpZ1xuICAgIHIub3Blbihjb25maWcubWV0aG9kLCBjb25maWcudXJsKTtcbiAgICBjb25zb2xlLmxvZyhjb25maWcpO1xuXG4gICAgaWYoY29uZmlnLmRhdGEpe1xuICAgICAgICAvL3NlbmQgdGhlIGRhdGEgYXMgSlNPTiB0byB0aGUgc2VydmVyXG4gICAgICAgIHIuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb25cIik7XG4gICAgICAgIHIuc2VuZChKU09OLnN0cmluZ2lmeShjb25maWcuZGF0YSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vc2VuZCByZXF1ZXN0XG4gICAgICAgIHIuc2VuZChudWxsKTtcbiAgICB9XG59XG5cblxubW9kdWxlLmV4cG9ydHMucmVxID0gcmVxO1xuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IE9za2FyIG9uIDIwMTUtMTEtMjQuXG4gKi9cblxuLyoqXG4gKiBIaWdoc2NvcmUgY29uc3RydWN0b3JcbiAqIEBwYXJhbSBuaWNrbmFtZXtzdHJpbmd9LCB0aGUgbmlja25hbWVcbiAqIEBwYXJhbSBzY29yZXtzdHJpbmd9LCB0aGUgc2NvcmUodGltZSlcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBIaWdoc2NvcmUobmlja25hbWUsIHNjb3JlKSB7XG4gICAgdGhpcy5uaWNrbmFtZSA9IG5pY2tuYW1lO1xuICAgIHRoaXMuc2NvcmUgPSBzY29yZTtcbiAgICB0aGlzLmhpZ2hzY29yZSA9IFtdO1xuXG4gICAgLy9jYWxsIHRvIHJlYWQgaGlnaHNjb3JlIGZpbGUgZnJvbSBsb2NhbCBzdG9yYWdlXG4gICAgdGhpcy5yZWFkRnJvbUZpbGUoKTtcbn1cblxuLyoqXG4gKiBGdW5jdGlvbiB0byByZWFkIHRoZSBoaWdoc2NvcmUtZmlsZSBmcm9tIGxvY2FsIHN0b3JhZ2VcbiAqL1xuSGlnaHNjb3JlLnByb3RvdHlwZS5yZWFkRnJvbUZpbGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaHNGaWxlID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJoc1wiKTtcbiAgICBpZihoc0ZpbGUpIHtcbiAgICAgICAgLy9wYXJzZSBmaWxlIGludG8gSlNPTlxuICAgICAgICB2YXIganNvbiA9IEpTT04ucGFyc2UoaHNGaWxlKTtcbiAgICAgICAgY29uc29sZS5sb2coanNvbik7XG5cbiAgICAgICAgLy9maWxsIHRoZSBoaWdoc2NvcmUtYXJyYXkgd2l0aCBlbnRyaWVzXG4gICAgICAgIGZvciAodmFyIG5pY2tuYW1lIGluIGpzb24pIHtcbiAgICAgICAgICAgIGlmKGpzb24uaGFzT3duUHJvcGVydHkobmlja25hbWUpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oaWdoc2NvcmUucHVzaChqc29uW25pY2tuYW1lXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGNoZWNrIGlmIHRoZSBzY29yZSB0YWtlcyBhIHBsYWNlIGludG8gdGhlIGhpZ2hzY29yZVxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbkhpZ2hzY29yZS5wcm90b3R5cGUuaXNIaWdoc2NvcmUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXNIaWdoc2NvcmUgPSBmYWxzZTtcbiAgICBpZih0aGlzLmhpZ2hzY29yZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgLy9oaWdoc2NvcmUgaXMgZW1wdHksIHRoZXJlZm9yZSBuZXcgaGlnaHNjb3JlXG4gICAgICAgIGlzSGlnaHNjb3JlID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvL2dldCB0aGUgc2NvcmUgbGFzdCBpbiB0aGUgbGlzdFxuICAgICAgICB2YXIgbGFzdFNjb3JlID0gdGhpcy5oaWdoc2NvcmVbdGhpcy5oaWdoc2NvcmUubGVuZ3RoIC0gMV0uc2NvcmU7XG4gICAgICAgIGlmKHRoaXMuc2NvcmUgPCBsYXN0U2NvcmUgfHwgdGhpcy5oaWdoc2NvcmUubGVuZ3RoIDwgNSkge1xuICAgICAgICAgICAgaXNIaWdoc2NvcmUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpc0hpZ2hzY29yZTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gYWRkIHRoZSBzY29yZSBpbnRvIHRoZSBsaXN0XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0sIGFkZGVkIG9yIG5vdFxuICovXG5IaWdoc2NvcmUucHJvdG90eXBlLmFkZFRvTGlzdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhZGRlZCA9IGZhbHNlO1xuICAgIC8vY2FsbCB0aGUgaXNIaWdoc2NvcmUgdG8gY2hlY2sgaWYgc2NvcmUgc2hvdWxkIGJlIGFkZGVkXG4gICAgaWYodGhpcy5pc0hpZ2hzY29yZSgpKSB7XG4gICAgICAgIC8vc2F2ZSB0aGUgbmlja25hbWUsIHNjb3JlIGFuZCBkYXRlc3RhbXAgaW50byBhbiBvYmplY3RcbiAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICB2YXIgdGhpc1Njb3JlID0ge1xuICAgICAgICAgICAgbmlja25hbWU6IHRoaXMubmlja25hbWUsXG4gICAgICAgICAgICBzY29yZTogdGhpcy5zY29yZSxcbiAgICAgICAgICAgIGRhdGU6IGRhdGVcbiAgICAgICAgfTtcbiAgICAgICAgY29uc29sZS5sb2codGhpc1Njb3JlKTtcbiAgICAgICAgLy9kZWxldGUgdGhlIGxhc3QgcG9zaXRpb24gb2YgdGhlIGhpZ2hzY29yZSBhcnJheVxuICAgICAgICBpZih0aGlzLmhpZ2hzY29yZS5sZW5ndGggPT09IDUpIHtcbiAgICAgICAgICAgIC8vcmVtb3ZlIHRoZSBvbmUgbGFzdFxuICAgICAgICAgICAgdGhpcy5oaWdoc2NvcmUuc3BsaWNlKC0xLCAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vcHVzaCB0aGUgbmV3IGFuZCBzb3J0IHRoZSBhcnJheVxuICAgICAgICB0aGlzLmhpZ2hzY29yZS5wdXNoKHRoaXNTY29yZSk7XG4gICAgICAgIHRoaXMuaGlnaHNjb3JlID0gdGhpcy5oaWdoc2NvcmUuc29ydChmdW5jdGlvbihhLGIpIHtyZXR1cm4gYS5zY29yZSAtIGIuc2NvcmU7fSk7XG5cbiAgICAgICAgLy9jYWxsIHRvIHNhdmUgaXRcbiAgICAgICAgdGhpcy5zYXZlVG9GaWxlKCk7XG5cbiAgICAgICAgYWRkZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gYWRkZWQ7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHNhdmUgdGhlIGhpZ2hzY29yZSB0byBsb2NhbCBzdG9yYWdlXG4gKi9cbkhpZ2hzY29yZS5wcm90b3R5cGUuc2F2ZVRvRmlsZSA9IGZ1bmN0aW9uKCkge1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiaHNcIiwgSlNPTi5zdHJpbmdpZnkodGhpcy5oaWdoc2NvcmUpKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gZ2V0IHRoZSBoaWdoc2NvcmVmcmFnbWVudCBjb250YWluaW5nIHRoZSBoaWdoc2NvcmUtcGFydCBvZiB0YWJsZVxuICogQHJldHVybnMge0RvY3VtZW50RnJhZ21lbnR9XG4gKi9cbkhpZ2hzY29yZS5wcm90b3R5cGUuY3JlYXRlSGlnaHNjb3JlRnJhZ21lbnQgPSBmdW5jdGlvbihpc05ldykge1xuICAgIHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIHZhciB0ZW1wbGF0ZTtcbiAgICB2YXIgaHNOaWNrbmFtZTtcbiAgICB2YXIgaHNTY29yZTtcbiAgICB2YXIgaHNEYXRlO1xuICAgIHZhciBkYXRlO1xuICAgIHZhciBsYXRlc3RFbnRyeSA9IG5ldyBEYXRlKHRoaXMuaGlnaHNjb3JlWzBdLmRhdGUpO1xuICAgIHZhciBoaWdobGlnaHRJbmRleCA9IDA7XG5cbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5oaWdoc2NvcmUubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgLy9nZXQgdGhlIHRlbXBsYXRlIGZvciBhIHRhYmxlLXJvd1xuICAgICAgICB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtaGlnaHNjb3JlUm93XCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICBoc05pY2tuYW1lID0gdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5ocy1uaWNrbmFtZVwiKTtcbiAgICAgICAgaHNTY29yZSA9IHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuaHMtc2NvcmVcIik7XG4gICAgICAgIGhzRGF0ZSA9IHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuaHMtZGF0ZVwiKTtcblxuICAgICAgICAvL2FwcGVuZCB0aGUgbmlja25hbWUgYW5kIHNjb3JlIHRvIHRoZSByb3dcbiAgICAgICAgaHNOaWNrbmFtZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLmhpZ2hzY29yZVtpXS5uaWNrbmFtZSkpO1xuICAgICAgICBoc1Njb3JlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMuaGlnaHNjb3JlW2ldLnNjb3JlKSk7XG5cbiAgICAgICAgZGF0ZSA9IG5ldyBEYXRlKHRoaXMuaGlnaHNjb3JlW2ldLmRhdGUpO1xuICAgICAgICBoc0RhdGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0ZS50b0RhdGVTdHJpbmcoKSkpO1xuXG4gICAgICAgIGlmKGRhdGUudmFsdWVPZigpID4gbGF0ZXN0RW50cnkudmFsdWVPZigpKSB7XG4gICAgICAgICAgICBoaWdobGlnaHRJbmRleCA9IGk7XG4gICAgICAgICAgICBsYXRlc3RFbnRyeSA9IGRhdGU7XG4gICAgICAgIH1cblxuICAgICAgICAvL2FwcGVuZCByb3cgdG8gZnJhZ21lbnRcbiAgICAgICAgZnJhZy5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG4gICAgfVxuXG4gICAgaWYoaXNOZXcpIHtcbiAgICAgICAgZnJhZy5xdWVyeVNlbGVjdG9yQWxsKFwidHJcIilbaGlnaGxpZ2h0SW5kZXhdLmNsYXNzTGlzdC5hZGQoXCJoaWdobGlnaHRcIik7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiSGlnaGxpZ2h0YSBwb3NpdGlvbjogXCIgKyBoaWdobGlnaHRJbmRleCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZyYWc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhpZ2hzY29yZTtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTIzLlxuICovXG5cInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBRdWVzdGlvbiBjb25zdHJ1Y3RvclxuICogQHBhcmFtIG9iantPYmplY3R9LCBvYmplY3QgdGhhdCBob2xkcyBhIHF1ZXN0aW9uXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gUXVlc3Rpb24ob2JqKSB7XG4gICAgdGhpcy5pZCA9IG9iai5pZDtcbiAgICB0aGlzLnF1ZXN0aW9uID0gb2JqLnF1ZXN0aW9uO1xuICAgIHRoaXMuYWx0ID0gb2JqLmFsdGVybmF0aXZlcztcbn1cblxuLyoqXG4gKiBGdW5jdGlvbmIgdG8gcHJlc2VudCB0aGUgcXVlc3Rpb25cbiAqL1xuUXVlc3Rpb24ucHJvdG90eXBlLnByaW50ID0gZnVuY3Rpb24oKSB7XG4gICAgLy9zdGF0ZW1lbnQgdG8gY2FsbCB0aGUgcmlnaHRmdWwgcHJpbnRmdW5jdGlvblxuICAgIGlmKHRoaXMuYWx0KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiaGFzIGFsdGVybmF0aXZlc1wiKTtcbiAgICAgICAgdGhpcy5wcmludEFsdFF1ZXN0aW9uKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLnByaW50UXVlc3Rpb24oKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGNsZWFyIGEgZGl2XG4gKiBAcGFyYW0gZGl2e29iamVjdH0sIHRoZSBkaXYgdG8gY2xlYXJcbiAqL1xuUXVlc3Rpb24ucHJvdG90eXBlLmNsZWFyRGl2ID0gZnVuY3Rpb24oZGl2KSB7XG4gICAgd2hpbGUoZGl2Lmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgICBkaXYucmVtb3ZlQ2hpbGQoZGl2Lmxhc3RDaGlsZCk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBwcmVzZW50IHRoZSBxdWVyc3Rpb24gdGhhdCBoYXMgYWx0ZXJuYXRpdmVzXG4gKi9cblF1ZXN0aW9uLnByb3RvdHlwZS5wcmludEFsdFF1ZXN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgLy9nZXQgdGhlIHRlbXBsYXRlIGFuZCBhcHBlbmQgdGhlIGFsdGVybmF0aXZlc1xuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtcXVlc3Rpb24tYWx0XCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIucUhlYWRcIikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5xdWVzdGlvbikpO1xuXG4gICAgLy9jYWxsIHRoZSBmdW5jdGlvbiB0aGF0IGhhbmRsZXMgdGhlIGFsdGVybmF0aXZlc1xuICAgIHZhciBpbnB1dEZyYWcgPSB0aGlzLmdldEFsdEZyYWcoKTtcbiAgICBjb25zb2xlLmxvZyh0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiI3N1Ym1pdFwiKSk7XG4gICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIiNxRm9ybVwiKS5pbnNlcnRCZWZvcmUoaW5wdXRGcmFnLCB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiI3N1Ym1pdFwiKSk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHRoZSBhbHRlcm5hdGl2ZXNcbiAqIEByZXR1cm5zIHtEb2N1bWVudEZyYWdtZW50fSwgdGhlIGZyYWdtZW50IGZvciB0aGUgYWx0ZXJuYXRpdmVzXG4gKi9cblF1ZXN0aW9uLnByb3RvdHlwZS5nZXRBbHRGcmFnID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGlucHV0RnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB2YXIgaW5wdXQ7XG4gICAgdmFyIGxhYmVsO1xuXG4gICAgY29uc29sZS5sb2codGhpcy5hbHQpO1xuICAgIGZvcih2YXIgYWx0IGluIHRoaXMuYWx0KSB7XG4gICAgICAgIGlmKHRoaXMuYWx0Lmhhc093blByb3BlcnR5KGFsdCkpIHtcbiAgICAgICAgICAgIC8vZ2V0IHRoZSB0ZW1wbGF0ZSBmb3IgYWx0ZXJuYXRpdmVzXG4gICAgICAgICAgICBpbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtYWx0ZXJuYXRpdmVcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhpbnB1dCk7XG4gICAgICAgICAgICAvL2FwcGVuZCB0aGUgYWx0ZXJuYXRpdmVcbiAgICAgICAgICAgIGlucHV0LnF1ZXJ5U2VsZWN0b3IoXCJpbnB1dFwiKS5zZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiLCBhbHQpO1xuICAgICAgICAgICAgbGFiZWwgPSBpbnB1dC5xdWVyeVNlbGVjdG9yKFwibGFiZWxcIik7XG4gICAgICAgICAgICBsYWJlbC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLmFsdFthbHRdKSk7XG5cbiAgICAgICAgICAgIGlucHV0RnJhZy5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgIH1cblxuICAgIH1cbiAgICByZXR1cm4gaW5wdXRGcmFnO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBwcmVzZW50IGEgcXVlc3Rpb24gd2l0aCB0ZXh0LWlucHV0XG4gKi9cblF1ZXN0aW9uLnByb3RvdHlwZS5wcmludFF1ZXN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgLy9nZXQgdGhlIHRlbXBsYXRlIGFuZCBhcHBlbmQgdGhlIHF1ZXN0aW9uXG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0ZW1wbGF0ZS1xdWVzdGlvblwiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLnFIZWFkXCIpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMucXVlc3Rpb24pKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbjtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTIzLlxuICovXG5cInVzZSBzdHJpY3RcIjtcbnZhciBRdWVzdGlvbiA9IHJlcXVpcmUoXCIuL1F1ZXN0aW9uXCIpO1xudmFyIEFqYXggPSByZXF1aXJlKFwiLi9BamF4XCIpO1xudmFyIFRpbWVyID0gcmVxdWlyZShcIi4vVGltZXJcIik7XG52YXIgSGlnaHNjb3JlID0gcmVxdWlyZShcIi4vSGlnaHNjb3JlXCIpO1xuXG4vKipcbiAqIENvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciB0aGUgUXVpelxuICogQHBhcmFtIG5pY2tuYW1le3N0cmluZ30sIG5pY2tuYW1lIHRvIHVzZSBmb3IgaGlnaHNjb3JlXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gUXVpeihuaWNrbmFtZSkge1xuICAgIGNvbnNvbGUubG9nKG5pY2tuYW1lKTtcbiAgICB0aGlzLm5pY2tuYW1lID0gbmlja25hbWU7XG4gICAgdGhpcy50aW1lciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnF1ZXN0aW9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMubmV4dFVSTCA9IFwiaHR0cDovL3Zob3N0My5sbnUuc2U6MjAwODAvcXVlc3Rpb24vMVwiO1xuICAgIHRoaXMuYnV0dG9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuZm9ybSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnRvdGFsVGltZSA9IDA7XG5cbiAgICAvL3JlcXVlc3QgdGhlIGZpcnN0IHF1ZXN0aW9uXG4gICAgdGhpcy5nZXRRdWVzdGlvbigpO1xufVxuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHNlbmQgYSByZXF1ZXN0IGZvciBhIG5ldyBxdWVzdGlvblxuICovXG5RdWl6LnByb3RvdHlwZS5nZXRRdWVzdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zb2xlLmxvZyhcImFza2luZy4uXCIpO1xuICAgIHZhciB1cmwgPSB0aGlzLm5leHRVUkw7XG4gICAgY29uc29sZS5sb2codXJsKTtcbiAgICB2YXIgY29uZmlnID0ge21ldGhvZDogXCJHRVRcIiwgdXJsOiB1cmx9O1xuICAgIHZhciByZXNwb25zZUZ1bmN0aW9uID0gdGhpcy5yZXNwb25zZS5iaW5kKHRoaXMpO1xuXG4gICAgQWpheC5yZXEoY29uZmlnLCByZXNwb25zZUZ1bmN0aW9uKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHRoZSByZXNwb25zZSwgdXNlcyBhcyBhcmd1bWVudCBcImNhbGxiYWNrXCIgaW4gYSByZXF1ZXN0XG4gKiBAcGFyYW0gZXJyb3J7TnVtYmVyfSwgZXJyb3Jjb2RlLCBudWxsIGlmIG5vIGVycm9yXG4gKiBAcGFyYW0gcmVzcG9uc2V7c3RyaW5nfSwgcmVzcG9uc2Ugc3RyaW5nIHRvIHBhcnNlIEpTT04gZnJvbVxuICovXG5RdWl6LnByb3RvdHlwZS5yZXNwb25zZSA9IGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcbiAgICBjb25zb2xlLmxvZyhcInJlc3BvbnNlLi4uXCIpO1xuXG4gICAgLy9oYW5kbGUgZXJyb3JzICg0MDQgbWVhbnMgbm8gbW9yZSBxdWVzdGlvbnMpXG4gICAgaWYoZXJyb3IpIHtcbiAgICAgICAgLy9wcmVzZW50IHRoZSBnYW1lb3Zlci12aWV3IHRvIHVzZXJcbiAgICAgICAgdGhpcy5nYW1lT3ZlcigpO1xuICAgIH1cblxuICAgIC8vaGFuZGxlIHRoZSByZXNwb25zZSBzdHJpbmdcbiAgICBpZihyZXNwb25zZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XG4gICAgICAgIC8vcGFzcmUgdG8gSlNPTlxuICAgICAgICB2YXIgb2JqID0gSlNPTi5wYXJzZShyZXNwb25zZSk7XG4gICAgICAgIHRoaXMubmV4dFVSTCA9IG9iai5uZXh0VVJMO1xuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLm5leHRVUkwpO1xuXG4gICAgICAgIC8vc3RhdGVtZW50IHRvIGNhbGwgdGhlIHJpZ2h0ZnVsIGZ1bmN0aW9uIG9uIHRoZSByZXNwb25zZVxuICAgICAgICBpZihvYmoucXVlc3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMucmVzcG9uc2VRdWVzdGlvbihvYmopO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYodGhpcy5uZXh0VVJMIHx8IG9iai5tZXNzYWdlID09PSBcIkNvcnJlY3QgYW5zd2VyIVwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZUFuc3dlcihvYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSBpZiByZXNwb25zZSBpcyBhIHF1ZXN0aW9uXG4gKiBAcGFyYW0gb2Jqe09iamVjdH0sIG9iamVjdCB0aGF0IGhvbGRzIHRoZSBxdWVzdGlvblxuICovXG5RdWl6LnByb3RvdHlwZS5yZXNwb25zZVF1ZXN0aW9uID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGNvbnRlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIik7XG4gICAgdGhpcy5jbGVhckRpdihjb250ZW50KTtcblxuICAgIC8vY3JlYXRlIGEgbmV3IHF1ZXN0aW9uIGZyb20gb2JqZWN0XG4gICAgdGhpcy5xdWVzdGlvbiA9IG5ldyBRdWVzdGlvbihvYmopO1xuICAgIHRoaXMucXVlc3Rpb24ucHJpbnQoKTtcblxuICAgIC8vY3JlYXRlIGEgbmV3IHRpbWVyIGZvciBxdWVzdGlvblxuICAgIHRoaXMudGltZXIgPSBuZXcgVGltZXIodGhpcywgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0aW1lciBoMVwiKSwgMjApO1xuICAgIHRoaXMudGltZXIuc3RhcnQoKTtcblxuICAgIC8vQWRkIGxpbnN0ZW5lcnMgZm9yIHRoZSBmb3JtXG4gICAgY29uc29sZS5sb2coXCJBZGRpbmcgbGlzdGVuZXIuLlwiKTtcbiAgICB0aGlzLmFkZExpc3RlbmVyKCk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSBpZiByZXNwb25zZSBpcyBhbiBhbnN3ZXJcbiAqIEBwYXJhbSBvYmp7T2JqZWN0fSwgb2JqZWN0IHRoYXQgaG9sZHMgdGhlIGFuc3dlclxuICovXG5RdWl6LnByb3RvdHlwZS5yZXNwb25zZUFuc3dlciA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBjb250ZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpO1xuICAgIHRoaXMuY2xlYXJEaXYoY29udGVudCk7XG5cbiAgICAvL0hhbmRsZSB0aGUgdGVtcGxhdGUgZm9yIGFuc3dlclxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtYW5zd2VyXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUob2JqLm1lc3NhZ2UpO1xuICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCJwXCIpLmFwcGVuZENoaWxkKHRleHQpO1xuXG4gICAgY29udGVudC5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG5cbiAgICBpZih0aGlzLm5leHRVUkwpIHtcbiAgICAgICAgLy9SZXF1ZXN0IGEgbmV3IHF1ZXN0aW9uLCBidXQgd2l0aCBhIGRlbGF5XG4gICAgICAgIHZhciBuZXdRdWVzdGlvbiA9IHRoaXMuZ2V0UXVlc3Rpb24uYmluZCh0aGlzKTtcbiAgICAgICAgc2V0VGltZW91dChuZXdRdWVzdGlvbiwgMTAwMCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLmdhbWVDb21wbGV0ZWQoKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGFkZCB0aGUgbGlzdGVuZXIgZm9yIHN1Ym1pdFxuICovXG5RdWl6LnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzdWJtaXRcIik7XG4gICAgdGhpcy5mb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNxRm9ybVwiKTtcblxuICAgIHRoaXMuYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLHRoaXMuc3VibWl0LmJpbmQodGhpcyksIHRydWUpO1xuICAgIHRoaXMuZm9ybS5hZGRFdmVudExpc3RlbmVyKFwia2V5cHJlc3NcIiwgdGhpcy5zdWJtaXQuYmluZCh0aGlzKSwgdHJ1ZSk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSB3aGVuIHN1Ym1pdCBpcyB0cmlnZ2VyZWRcbiAqL1xuUXVpei5wcm90b3R5cGUuc3VibWl0ID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAvL0lmIHRoZSB0cmlnZ2VyIGlzIGVudGVyIG9yIGNsaWNrIGRvIHRoZSBzdWJtaXRcbiAgICBpZiAoZXZlbnQud2hpY2ggPT09IDEzIHx8IGV2ZW50LmtleUNvZGUgPT09IDEzIHx8IGV2ZW50LnR5cGUgPT09IFwiY2xpY2tcIikge1xuICAgICAgICBjb25zb2xlLmxvZyhcImdvdCBlbnRlclwiKTtcbiAgICAgICAgLy9wcmV2ZW50IHRoZSBmb3JtIHRvIHJlbG9hZCBwYWdlIG9uIGVudGVyXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJzdWJtaXR0aW5nLi4uXCIpO1xuICAgICAgICB0aGlzLnRvdGFsVGltZSArPSB0aGlzLnRpbWVyLnN0b3AoKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJ0aW1lOlwiICsgdGhpcy50b3RhbFRpbWUpO1xuICAgICAgICB2YXIgaW5wdXQ7XG5cbiAgICAgICAgLy9yZW1vdmUgdGhlIGxpc3RlbmVycyB0byBwcmV2ZW50IGRvdWJsZS1zdWJtaXRcbiAgICAgICAgdGhpcy5idXR0b24ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc3VibWl0LmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmZvcm0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleXByZXNzXCIsIHRoaXMuc3VibWl0LmJpbmQodGhpcykpO1xuXG4gICAgICAgIC8vc2F2ZSBpbnB1dCBkZXBlbmRpbmcgb24gdGhlIHR5cGUgb2YgcXVlc3Rpb25cbiAgICAgICAgaWYgKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYW5zd2VyXCIpKSB7XG4gICAgICAgICAgICAvL2dldCB0aGUgZm9ybSBpbnB1dFxuICAgICAgICAgICAgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2Fuc3dlclwiKS52YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vZ2V0IHRoZSBjaGVja2VkIHJlYWRpb2J1dHRvblxuICAgICAgICAgICAgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRbbmFtZT0nYWx0ZXJuYXRpdmUnXTpjaGVja2VkXCIpLnZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9zZXQgdGhlIGNvbmZpZyB0byBiZSBzZW50IHRvIHNlcnZlciBhbmQgc2VuZCBhIHJlcXVlc3RcbiAgICAgICAgdmFyIGNvbmZpZyA9IHtcbiAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgICB1cmw6IHRoaXMubmV4dFVSTCxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBhbnN3ZXI6IGlucHV0XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciByZXNwb25zZUZ1bmN0aW9uID0gdGhpcy5yZXNwb25zZS5iaW5kKHRoaXMpO1xuICAgICAgICBBamF4LnJlcShjb25maWcsIHJlc3BvbnNlRnVuY3Rpb24pO1xuICAgIH1cbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHRoZSBnYW1lT3Zlci12aWV3IGFuZCBwcmVzZW50IGl0IHRvIHVzZXJcbiAqL1xuUXVpei5wcm90b3R5cGUuZ2FtZU92ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAvL2NyZWF0ZSBhIGhpZ2hzY29yZSBtb2R1bGUgdG8gc2hvdyBpdCB0byB0aGUgdXNlclxuICAgIHZhciBocyA9IG5ldyBIaWdoc2NvcmUodGhpcy5uaWNrbmFtZSk7XG4gICAgY29uc29sZS5sb2coXCJHQU1FIE9WRVIhISFcIik7XG4gICAgdGhpcy5jbGVhckRpdihkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikpO1xuXG4gICAgLy9nZXQgdGhlIGdhbWUgb3ZlciB0ZW1wbGF0ZVxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtZ2FtZU92ZXJcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG5cbiAgICAvL2lmIHRoZSBoaWdoc2NvcmUgaGFzIGVudHJpZXMgYWRkIHRoZW0gdG8gdGhlIHRlbXBsYXRlXG4gICAgaWYoaHMuaGlnaHNjb3JlLmxlbmd0aCA+IDAgKXtcbiAgICAgICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcImgyXCIpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiSGlnaHNjb3JlXCIpKTtcbiAgICAgICAgdmFyIGhzRnJhZyA9IGhzLmNyZWF0ZUhpZ2hzY29yZUZyYWdtZW50KCk7XG4gICAgICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCJ0YWJsZVwiKS5hcHBlbmRDaGlsZChoc0ZyYWcpO1xuICAgIH1cblxuICAgIC8vYWRkIHRoZSB0ZW1wbGF0ZSB0byBjb250ZW50XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHRoZSBnYW1lIGNvbXBsZXRlZC12aWV3IGFuZCBwcmVzZW50IGl0IHRvIHRoZSB1c2VyXG4gKi9cblF1aXoucHJvdG90eXBlLmdhbWVDb21wbGV0ZWQgPSBmdW5jdGlvbigpIHtcbiAgICAvL2NyZWF0ZSBuZXcgaGlnaHNjb3JlIG1vZHVsZSB0byBoYW5kbGUgaXRcbiAgICB2YXIgaHMgPSBuZXcgSGlnaHNjb3JlKHRoaXMubmlja25hbWUsIHRoaXMudG90YWxUaW1lLnRvRml4ZWQoMykpO1xuICAgIHZhciBpc05ldyA9IGhzLmFkZFRvTGlzdCgpO1xuXG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0ZW1wbGF0ZS1xdWl6Q29tcGxldGVkXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgLy9nZXQgdGhlIGhpZ2hzY29yZSBpZiB0aGUgaGlnaHNjb3JlIGhhcyBlbnRyaWVzXG4gICAgaWYoaHMuaGlnaHNjb3JlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5ocy10aXRsZVwiKS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIkhpZ2hzY29yZVwiKSk7XG4gICAgICAgIHZhciBoc0ZyYWcgPSBocy5jcmVhdGVIaWdoc2NvcmVGcmFnbWVudChpc05ldyk7XG4gICAgICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCJ0YWJsZVwiKS5hcHBlbmRDaGlsZChoc0ZyYWcpO1xuICAgIH1cblxuICAgIGlmKGlzTmV3KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwieW91IG1hZGUgaXQgdG8gdGhlIGxpc3RcIik7XG4gICAgICAgIHZhciBuZXdIUyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJoMVwiKTtcbiAgICAgICAgbmV3SFMuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJOZXcgSGlnaHNjb3JlIVwiKSk7XG4gICAgICAgIHZhciBkaXYgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiZGl2XCIpO1xuICAgICAgICBkaXYuaW5zZXJ0QmVmb3JlKG5ld0hTLCBkaXYuZmlyc3RDaGlsZCk7XG4gICAgfVxuXG4gICAgdGhpcy5jbGVhckRpdihkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikpO1xuXG4gICAgdmFyIGgxID0gdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi50aW1lXCIpO1xuICAgIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy50b3RhbFRpbWUudG9GaXhlZCgzKSk7XG4gICAgaDEuYXBwZW5kQ2hpbGQodGV4dCk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gY2xlYXIgYSBzcGVjaWZpYyBkaXYgb2YgY2hpbGRzXG4gKiBAcGFyYW0gZGl2e09iamVjdH0sIHRoZSBkaXZlbGVtZW50IHRvIGNsZWFyXG4gKi9cblF1aXoucHJvdG90eXBlLmNsZWFyRGl2ID0gZnVuY3Rpb24oZGl2KSB7XG4gICAgd2hpbGUoZGl2Lmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgICBkaXYucmVtb3ZlQ2hpbGQoZGl2Lmxhc3RDaGlsZCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBRdWl6O1xuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IE9za2FyIG9uIDIwMTUtMTEtMjQuXG4gKi9cblxuLyoqXG4gKiBUaW1lciBjb25zdHJ1Y3RvclxuICogQHBhcmFtIG93bmVye09iamVjdH0sIHRoZSBvd25lci1vYmplY3QgdGhhdCBjcmVhdGVkIHRoZSB0aW1lclxuICogQHBhcmFtIGVsZW1lbnR7T2JqZWN0fSwgZWxlbWVudCB0byBwcmludCB0aGUgdGltZXIgdG9cbiAqIEBwYXJhbSB0aW1le051bWJlcn0sIHRoZSB0aW1lIHRvIGNvdW50IGRvd25cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBUaW1lcihvd25lciwgZWxlbWVudCwgdGltZSkge1xuICAgIHRoaXMudGltZSA9IHRpbWU7XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm93bmVyID0gb3duZXI7XG4gICAgdGhpcy5zdGFydFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICB0aGlzLmludGVydmFsID0gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIEZ1bmN0aW9uIHRoYXQgc3RhcnRzIGFuIGludGVydmFsIGZvciB0aGUgdGltZXJcbiAqL1xuVGltZXIucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgLy9jYWxsIHRoZSBydW4gZnVuY3Rpb24gb24gZWFjaCBpbnRlcnZhbFxuICAgIHRoaXMuaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCh0aGlzLnJ1bi5iaW5kKHRoaXMpLCAxMDApO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBiZSBleGVjdXRlZCBlYWNoIGludGVydmFsIG9mIHRoZSB0aW1lclxuICovXG5UaW1lci5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG4gICAgLy9jb3VudCB0aGUgZGlmZmVyZW5jZSBmcm9tIHN0YXJ0IHRvIG5vd1xuICAgIHZhciBkaWZmID0gKG5vdyAtIHRoaXMuc3RhcnRUaW1lKS8xMDAwO1xuXG4gICAgLy9jb3VudCB0aGUgdGltZSAtIGRpZmZlcmVuY2UgdG8gc2hvdyBjb3VudGRvd25cbiAgICB2YXIgc2hvd1RpbWUgPSB0aGlzLnRpbWUgLSBkaWZmO1xuXG4gICAgaWYoZGlmZiA+PSB0aGlzLnRpbWUpIHtcbiAgICAgICAgLy90aW1lIGlmIHVwXG4gICAgICAgIHNob3dUaW1lID0gMDtcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsKTtcblxuICAgICAgICAvL2NhbGwgb3duZXIgZ2FtZU92ZXIgc2luY2UgdGltZSBpcyBvdXRcbiAgICAgICAgdGhpcy5vd25lci5nYW1lT3ZlcigpO1xuICAgIH1cblxuICAgIC8vc2hvdyB0aGUgdGltZXIgd2l0aCBvbmUgZGVjaW1hbFxuICAgIHRoaXMucHJpbnQoc2hvd1RpbWUudG9GaXhlZCgxKSk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRoYXQgc3RvcHMgdGhlIHRpbWVyIGJlZm9yZSBpdHMgb3ZlclxuICogQHJldHVybnMge251bWJlcn0sIHRoZSBkaWZmZXJlbmNlIGluIGRlY291bmRzXG4gKi9cblRpbWVyLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XG4gICAgY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsKTtcbiAgICB2YXIgbm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cbiAgICByZXR1cm4gKG5vdyAtIHRoaXMuc3RhcnRUaW1lKS8xMDAwO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBzaG93IHRoZSB0aW1lciBhdCB0aGUgZ2l2ZW4gZWxlbWVudFxuICogQHBhcmFtIGRpZmZ7TnVtYmVyfSB0aGUgdGltZSB0byBiZSBwcmludGVkXG4gKi9cblRpbWVyLnByb3RvdHlwZS5wcmludCA9IGZ1bmN0aW9uKGRpZmYpIHtcbiAgICB0aGlzLmVsZW1lbnQucmVwbGFjZUNoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRpZmYpLCB0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRpbWVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgUXVpeiA9IHJlcXVpcmUoXCIuL1F1aXpcIik7XG52YXIgcTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgdGhlIHN1Ym1pdCBmb3Igbmlja25hbWUgYW5kIHN0YXJ0IHRoZSBxdWl6XG4gKiBAcGFyYW0gZXZlbnQsIHRoZSBldmVudGhhbmRsZXIgZnJvbSB0aGUgbGlzdGVuZXJcbiAqL1xuXG5mdW5jdGlvbiBzdWJtaXQoZXZlbnQpIHtcbiAgICBpZiAoZXZlbnQud2hpY2ggPT09IDEzIHx8IGV2ZW50LmtleUNvZGUgPT09IDEzIHx8IGV2ZW50LnR5cGUgPT09IFwiY2xpY2tcIikge1xuICAgICAgICBjb25zb2xlLmxvZyhcInN1Ym1pdHRpbmdcIik7XG5cbiAgICAgICAgLy9kaXNhYmxlIGZvcm1zIGFjdGlvbiBzbyBwYWdlIHdvbnQgcmVsb2FkIHdpdGggZW50ZXJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25pY2tuYW1lXCIpLnZhbHVlO1xuXG4gICAgICAgIC8vaWYgbmlja25hbWUgd3JpdHRlbiwgc3RhcnQgcXVpelxuICAgICAgICBpZihpbnB1dC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBxID0gbmV3IFF1aXooaW5wdXQpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG52YXIgYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzdWJtaXRcIik7XG52YXIgZm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcUZvcm1cIik7XG5cbmJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIixzdWJtaXQsIHRydWUpO1xuZm9ybS5hZGRFdmVudExpc3RlbmVyKFwia2V5cHJlc3NcIiwgc3VibWl0LCB0cnVlKTtcblxuIl19
