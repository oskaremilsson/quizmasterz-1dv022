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

    if (config.data) {
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
 * This uses some back-end hpp-code and mysql hosted on my server.
 * The code for that can be seen but wont be pushed to github.
 */
var Ajax = require("./Ajax");

/**
 * GlobalHighscore constructor
 * @param nickname{string}, the nickname
 * @param score{string}, the score(time)
 * @constructor
 */
function GlobalHighscore(nickname, score) {
    this.nickname = nickname;
    this.score = score;
    this.highscore = [];
}

/**
 * Send the request to add the score to the server
 */
GlobalHighscore.prototype.sendToServer = function() {
    var date = new Date();
    var data = {nickname: this.nickname, score: this.score, date: date};
    var config = {
        method: "POST",
        url: "//root.oskaremilsson.se/quizmasterz/add.php",
        data: data
    };

    Ajax.req(config, this.POSTresponse.bind(this));
};

/**
 * Function to handle response from sending score to server
 */
GlobalHighscore.prototype.POSTresponse = function(error, response) {
    if (response) {
        var config = {
            method: "GET",
            url: "//root.oskaremilsson.se/quizmasterz/read.php"
        };
        Ajax.req(config, this.GETresponse.bind(this));
    }
};

/**
 * Function to read the highscore-file from server storage
 */
GlobalHighscore.prototype.GETresponse = function(error, response) {
    if (response) {
        //parse file into JSON
        var json = JSON.parse(response);

        //fill the highscore-array with entries
        for (var nickname in json) {
            if (json.hasOwnProperty(nickname)) {
                this.highscore.push(json[nickname]);
            }
        }

        this.print();
    }
};

/**
 * Function to append the global highscore to the table
 */
GlobalHighscore.prototype.print = function() {
    //get the table
    var table = document.querySelector("#globalHs");

    //if the global highscore has entries add them to the template
    if (this.highscore.length > 0) {
        document.querySelector(".ghs-title").appendChild(document.createTextNode("Global Highscore"));
        var globalHsFrag = this.createHighscoreFragment();
        table.appendChild(globalHsFrag);
    }
};

/**
 * Function to get the highscorefragment containing the highscore-part of table
 * @returns {DocumentFragment}
 */
GlobalHighscore.prototype.createHighscoreFragment = function() {
    var frag = document.createDocumentFragment();
    var template;
    var hsNickname;
    var hsScore;
    var hsDate;
    var date;

    for (var i = 0; i < this.highscore.length; i += 1) {
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

        //append row to fragment
        frag.appendChild(template);
    }

    return frag;
};

module.exports = GlobalHighscore;

},{"./Ajax":1}],3:[function(require,module,exports){
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
    if (hsFile) {
        //parse file into JSON
        var json = JSON.parse(hsFile);

        //fill the highscore-array with entries
        for (var nickname in json) {
            if (json.hasOwnProperty(nickname)) {
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
    if (this.highscore.length === 0) {
        //highscore is empty, therefore new highscore
        isHighscore = true;
    } else {
        //get the score last in the list
        var lastScore = this.highscore[this.highscore.length - 1].score;

        //check if highscore
        if (parseFloat(this.score) < parseFloat(lastScore) || this.highscore.length < 5) {
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
    if (this.isHighscore()) {
        //save the nickname, score and datestamp into an object
        var date = new Date();
        var thisScore = {
            nickname: this.nickname,
            score: this.score,
            date: date
        };

        //delete the last position of the highscore array
        if (this.highscore.length === 5) {
            //remove the one last
            this.highscore.splice(-1, 1);
        }

        //push the new and sort the array
        this.highscore.push(thisScore);
        this.highscore = this.highscore.sort(function(a, b) {return a.score - b.score;});

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

    for (var i = 0; i < this.highscore.length; i += 1) {
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

        if (isNew) {
            //check for the letest entry
            if (date.valueOf() > latestEntry.valueOf()) {
                highlightIndex = i;
                latestEntry = date;
            }
        }

        //append row to fragment
        frag.appendChild(template);
    }

    if (isNew) {
        //highlight the new highscore in the list
        frag.querySelectorAll("tr")[highlightIndex].classList.add("highlight");
    }

    return frag;
};

module.exports = Highscore;

},{}],4:[function(require,module,exports){
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
    if (this.alt) {
        this.printAltQuestion();
    }
    else {
        this.printQuestion();
    }

    document.querySelector("input").focus();
};

/**
 * Function to clear a div
 * @param div{object}, the div to clear
 */
Question.prototype.clearDiv = function(div) {
    while (div.hasChildNodes()) {
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
    var first = true;

    for (var alt in this.alt) {
        if (this.alt.hasOwnProperty(alt)) {
            //get the template for alternatives
            input = document.querySelector("#template-alternative").content.cloneNode(true);

            //append the alternative
            if (first) {
                input.querySelector("input").setAttribute("checked", "checked");
                first = false;
            }

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

},{}],5:[function(require,module,exports){
/**
 * Created by Oskar on 2015-11-23.
 */
"use strict";
var Question = require("./Question");
var Ajax = require("./Ajax");
var Timer = require("./Timer");
var Highscore = require("./Highscore");
var GlobalHighscore = require("./GlobalHighscore");

/**
 * Constructor function for the Quiz
 * @param nickname{string}, nickname to use for highscore
 * @constructor
 */
function Quiz(nickname) {
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
Quiz.prototype.getQuestion = function() {
    var config = {method: "GET", url: this.nextURL};
    var responseFunction = this.response.bind(this);

    Ajax.req(config, responseFunction);
};

/**
 * Function to handle the response, uses as argument "callback" in a request
 * @param error{Number}, errorcode, null if no error
 * @param response{string}, response string to parse JSON from
 */
Quiz.prototype.response = function(error, response) {
    //handle errors (404 means no more questions)
    if (error) {
        //present the gameover-view to user
        this.gameOver();
    }

    //handle the response string
    if (response) {
        //pasre to JSON
        var obj = JSON.parse(response);
        this.nextURL = obj.nextURL;

        //statement to call the rightful function on the response
        if (obj.question) {
            this.responseQuestion(obj);
        }
        else {
            if (this.nextURL || obj.message === "Correct answer!") {
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

    if (this.nextURL) {
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

    this.button.addEventListener("click", this.submit.bind(this), true);
    this.form.addEventListener("keypress", this.submit.bind(this), true);
};

/**
 * Function to handle when submit is triggered
 */
Quiz.prototype.submit = function(event) {
    //If the trigger is enter or click do the submit
    if (event.which === 13 || event.keyCode === 13 || event.type === "click") {
        //prevent the form to reload page on enter
        event.preventDefault();

        this.totalTime += this.timer.stop();
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
    this.clearDiv(document.querySelector("#content"));

    //get the game over template
    var template = document.querySelector("#template-gameOver").content.cloneNode(true);

    //if the highscore has entries add them to the template
    if (hs.highscore.length > 0) {
        template.querySelector(".hs-title").appendChild(document.createTextNode("Highscore"));
        var hsFrag = hs.createHighscoreFragment();
        template.querySelector("table").appendChild(hsFrag);
    }

    var globalHs = new GlobalHighscore(this.nickname);
    globalHs.sendToServer();

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
    if (hs.highscore.length > 0) {
        template.querySelector(".hs-title").appendChild(document.createTextNode("Highscore"));
        var hsFrag = hs.createHighscoreFragment(isNew);
        template.querySelector("table").appendChild(hsFrag);
    }

    if (isNew) {
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

    //add the global highscore
    var globalHs = new GlobalHighscore(this.nickname, this.totalTime.toFixed(3));
    globalHs.sendToServer();
};

/**
 * Function to clear a specific div of childs
 * @param div{Object}, the divelement to clear
 */
Quiz.prototype.clearDiv = function(div) {
    while (div.hasChildNodes()) {
        div.removeChild(div.lastChild);
    }
};

module.exports = Quiz;

},{"./Ajax":1,"./GlobalHighscore":2,"./Highscore":3,"./Question":4,"./Timer":6}],6:[function(require,module,exports){
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
    var diff = (now - this.startTime) / 1000;

    //count the time - difference to show countdown
    var showTime = this.time - diff;

    if (diff >= this.time) {
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
 * @returns {number}, the difference in seconds
 */
Timer.prototype.stop = function() {
    clearInterval(this.interval);
    var now = new Date().getTime();

    return (now - this.startTime) / 1000;
};

/**
 * Function to show the timer at the given element
 * @param diff{Number} the time to be printed
 */
Timer.prototype.print = function(diff) {
    this.element.replaceChild(document.createTextNode(diff), this.element.firstChild);
};

module.exports = Timer;

},{}],7:[function(require,module,exports){
"use strict";
var Quiz = require("./Quiz");
var q;

function addThemeSelector() {
    //add listener for the theme chooser
    var select = document.querySelector("#theme-selector");
    select.addEventListener("change", function() {
        var baseStyle = document.querySelector("#baseStyle");
        var loadingStyle = document.querySelector("#loadingStyle");
        localStorage.setItem("theme", select.value);
        if (select.value === "playful") {
            baseStyle.setAttribute("href", "stylesheet/playful.css");
            loadingStyle.setAttribute("href", "stylesheet/playful_loading.css");
        }
        else if (select.value === "hacker") {
            baseStyle.setAttribute("href", "stylesheet/hacker.css");
            loadingStyle.setAttribute("href", "stylesheet/hacker_loading.css");
        }
        else if (select.value === "terminal") {
            baseStyle.setAttribute("href", "stylesheet/terminal.css");
            loadingStyle.setAttribute("href", "stylesheet/terminal_loading.css");
        }
        else if (select.value === "nostyle") {
            baseStyle.setAttribute("href", "stylesheet/nostyle.css");
            loadingStyle.setAttribute("href", "stylesheet/nostyle_loading.css");
        }

        //set nickname-input focus
        document.querySelector("input").focus();
    });
}

/**
 * Function to handle the submit for nickname and start the quiz
 * @param event, the eventhandler from the listener
 */
function submit(event) {
    if (event.which === 13 || event.keyCode === 13 || event.type === "click") {
        //disable forms action so page wont reload with enter
        event.preventDefault();

        var input = document.querySelector("#nickname").value;

        //if nickname written, start quiz
        if (input.length > 1) {
            q = new Quiz(input);
        }
    }
}

if (localStorage.getItem("theme")) {
    var theme = localStorage.getItem("theme");
    document.querySelector("#baseStyle").setAttribute("href", "stylesheet/" + theme + ".css");
    document.querySelector("#loadingStyle").setAttribute("href", "stylesheet/" + theme + "_loading.css");
}

var button = document.querySelector("#submit");
var form = document.querySelector("#qForm");

button.addEventListener("click", submit, true);
form.addEventListener("keypress", submit, true);

//set nickname-input focus at start
document.querySelector("input").focus();

addThemeSelector();

},{"./Quiz":5}]},{},[7])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMS4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQWpheC5qcyIsImNsaWVudC9zb3VyY2UvanMvR2xvYmFsSGlnaHNjb3JlLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9IaWdoc2NvcmUuanMiLCJjbGllbnQvc291cmNlL2pzL1F1ZXN0aW9uLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9RdWl6LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9UaW1lci5qcyIsImNsaWVudC9zb3VyY2UvanMvYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yMy5cbiAqL1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSByZXF1ZXN0cyB2aWEgWE1MSHR0cFJlcXVlc3RcbiAqIEBwYXJhbSBjb25maWd7T2JqZWN0fSwgb2JqZWN0IHdpdGggbWV0aG9kIGFuZCB1cmwsIHBvc3NpYmx5IGRhdGFcbiAqIEBwYXJhbSBjYWxsYmFja3tGdW5jdGlvbn0sIHRoZSBmdW5jdGlvbiB0byBjYWxsIGF0IHJlc3BvbnNlXG4gKi9cbmZ1bmN0aW9uIHJlcShjb25maWcsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIC8vYWRkIGV2ZW50bGlzdGVuZXIgZm9yIHJlc3BvbnNlXG4gICAgci5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCBmdW5jdGlvbigpIHtcblxuICAgICAgICBpZiAoci5zdGF0dXMgPj0gNDAwKSB7XG4gICAgICAgICAgICAvL2dvdCBlcnJvciwgY2FsbCB3aXRoIGVycm9yY29kZVxuICAgICAgICAgICAgY2FsbGJhY2soci5zdGF0dXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9jYWxsIHRoZSBjYWxsYmFjayBmdW5jdGlvbiB3aXRoIHJlc3BvbnNlVGV4dFxuICAgICAgICBjYWxsYmFjayhudWxsLCByLnJlc3BvbnNlVGV4dCk7XG4gICAgfSk7XG5cbiAgICAvL29wZW4gYSByZXF1ZXN0IGZyb20gdGhlIGNvbmZpZ1xuICAgIHIub3Blbihjb25maWcubWV0aG9kLCBjb25maWcudXJsKTtcblxuICAgIGlmIChjb25maWcuZGF0YSkge1xuICAgICAgICAvL3NlbmQgdGhlIGRhdGEgYXMgSlNPTiB0byB0aGUgc2VydmVyXG4gICAgICAgIHIuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb25cIik7XG4gICAgICAgIHIuc2VuZChKU09OLnN0cmluZ2lmeShjb25maWcuZGF0YSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vc2VuZCByZXF1ZXN0XG4gICAgICAgIHIuc2VuZChudWxsKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzLnJlcSA9IHJlcTtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTI0LlxuICogVGhpcyB1c2VzIHNvbWUgYmFjay1lbmQgaHBwLWNvZGUgYW5kIG15c3FsIGhvc3RlZCBvbiBteSBzZXJ2ZXIuXG4gKiBUaGUgY29kZSBmb3IgdGhhdCBjYW4gYmUgc2VlbiBidXQgd29udCBiZSBwdXNoZWQgdG8gZ2l0aHViLlxuICovXG52YXIgQWpheCA9IHJlcXVpcmUoXCIuL0FqYXhcIik7XG5cbi8qKlxuICogR2xvYmFsSGlnaHNjb3JlIGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0gbmlja25hbWV7c3RyaW5nfSwgdGhlIG5pY2tuYW1lXG4gKiBAcGFyYW0gc2NvcmV7c3RyaW5nfSwgdGhlIHNjb3JlKHRpbWUpXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gR2xvYmFsSGlnaHNjb3JlKG5pY2tuYW1lLCBzY29yZSkge1xuICAgIHRoaXMubmlja25hbWUgPSBuaWNrbmFtZTtcbiAgICB0aGlzLnNjb3JlID0gc2NvcmU7XG4gICAgdGhpcy5oaWdoc2NvcmUgPSBbXTtcbn1cblxuLyoqXG4gKiBTZW5kIHRoZSByZXF1ZXN0IHRvIGFkZCB0aGUgc2NvcmUgdG8gdGhlIHNlcnZlclxuICovXG5HbG9iYWxIaWdoc2NvcmUucHJvdG90eXBlLnNlbmRUb1NlcnZlciA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICB2YXIgZGF0YSA9IHtuaWNrbmFtZTogdGhpcy5uaWNrbmFtZSwgc2NvcmU6IHRoaXMuc2NvcmUsIGRhdGU6IGRhdGV9O1xuICAgIHZhciBjb25maWcgPSB7XG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIHVybDogXCIvL3Jvb3Qub3NrYXJlbWlsc3Nvbi5zZS9xdWl6bWFzdGVyei9hZGQucGhwXCIsXG4gICAgICAgIGRhdGE6IGRhdGFcbiAgICB9O1xuXG4gICAgQWpheC5yZXEoY29uZmlnLCB0aGlzLlBPU1RyZXNwb25zZS5iaW5kKHRoaXMpKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHJlc3BvbnNlIGZyb20gc2VuZGluZyBzY29yZSB0byBzZXJ2ZXJcbiAqL1xuR2xvYmFsSGlnaHNjb3JlLnByb3RvdHlwZS5QT1NUcmVzcG9uc2UgPSBmdW5jdGlvbihlcnJvciwgcmVzcG9uc2UpIHtcbiAgICBpZiAocmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIGNvbmZpZyA9IHtcbiAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgICAgIHVybDogXCIvL3Jvb3Qub3NrYXJlbWlsc3Nvbi5zZS9xdWl6bWFzdGVyei9yZWFkLnBocFwiXG4gICAgICAgIH07XG4gICAgICAgIEFqYXgucmVxKGNvbmZpZywgdGhpcy5HRVRyZXNwb25zZS5iaW5kKHRoaXMpKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHJlYWQgdGhlIGhpZ2hzY29yZS1maWxlIGZyb20gc2VydmVyIHN0b3JhZ2VcbiAqL1xuR2xvYmFsSGlnaHNjb3JlLnByb3RvdHlwZS5HRVRyZXNwb25zZSA9IGZ1bmN0aW9uKGVycm9yLCByZXNwb25zZSkge1xuICAgIGlmIChyZXNwb25zZSkge1xuICAgICAgICAvL3BhcnNlIGZpbGUgaW50byBKU09OXG4gICAgICAgIHZhciBqc29uID0gSlNPTi5wYXJzZShyZXNwb25zZSk7XG5cbiAgICAgICAgLy9maWxsIHRoZSBoaWdoc2NvcmUtYXJyYXkgd2l0aCBlbnRyaWVzXG4gICAgICAgIGZvciAodmFyIG5pY2tuYW1lIGluIGpzb24pIHtcbiAgICAgICAgICAgIGlmIChqc29uLmhhc093blByb3BlcnR5KG5pY2tuYW1lKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGlnaHNjb3JlLnB1c2goanNvbltuaWNrbmFtZV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wcmludCgpO1xuICAgIH1cbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gYXBwZW5kIHRoZSBnbG9iYWwgaGlnaHNjb3JlIHRvIHRoZSB0YWJsZVxuICovXG5HbG9iYWxIaWdoc2NvcmUucHJvdG90eXBlLnByaW50ID0gZnVuY3Rpb24oKSB7XG4gICAgLy9nZXQgdGhlIHRhYmxlXG4gICAgdmFyIHRhYmxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNnbG9iYWxIc1wiKTtcblxuICAgIC8vaWYgdGhlIGdsb2JhbCBoaWdoc2NvcmUgaGFzIGVudHJpZXMgYWRkIHRoZW0gdG8gdGhlIHRlbXBsYXRlXG4gICAgaWYgKHRoaXMuaGlnaHNjb3JlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5naHMtdGl0bGVcIikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJHbG9iYWwgSGlnaHNjb3JlXCIpKTtcbiAgICAgICAgdmFyIGdsb2JhbEhzRnJhZyA9IHRoaXMuY3JlYXRlSGlnaHNjb3JlRnJhZ21lbnQoKTtcbiAgICAgICAgdGFibGUuYXBwZW5kQ2hpbGQoZ2xvYmFsSHNGcmFnKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGdldCB0aGUgaGlnaHNjb3JlZnJhZ21lbnQgY29udGFpbmluZyB0aGUgaGlnaHNjb3JlLXBhcnQgb2YgdGFibGVcbiAqIEByZXR1cm5zIHtEb2N1bWVudEZyYWdtZW50fVxuICovXG5HbG9iYWxIaWdoc2NvcmUucHJvdG90eXBlLmNyZWF0ZUhpZ2hzY29yZUZyYWdtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIHRlbXBsYXRlO1xuICAgIHZhciBoc05pY2tuYW1lO1xuICAgIHZhciBoc1Njb3JlO1xuICAgIHZhciBoc0RhdGU7XG4gICAgdmFyIGRhdGU7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaGlnaHNjb3JlLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIC8vZ2V0IHRoZSB0ZW1wbGF0ZSBmb3IgYSB0YWJsZS1yb3dcbiAgICAgICAgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLWhpZ2hzY29yZVJvd1wiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgaHNOaWNrbmFtZSA9IHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuaHMtbmlja25hbWVcIik7XG4gICAgICAgIGhzU2NvcmUgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLXNjb3JlXCIpO1xuICAgICAgICBoc0RhdGUgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLWRhdGVcIik7XG5cbiAgICAgICAgLy9hcHBlbmQgdGhlIG5pY2tuYW1lIGFuZCBzY29yZSB0byB0aGUgcm93XG4gICAgICAgIGhzTmlja25hbWUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5oaWdoc2NvcmVbaV0ubmlja25hbWUpKTtcbiAgICAgICAgaHNTY29yZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLmhpZ2hzY29yZVtpXS5zY29yZSkpO1xuXG4gICAgICAgIGRhdGUgPSBuZXcgRGF0ZSh0aGlzLmhpZ2hzY29yZVtpXS5kYXRlKTtcbiAgICAgICAgaHNEYXRlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGUudG9EYXRlU3RyaW5nKCkpKTtcblxuICAgICAgICAvL2FwcGVuZCByb3cgdG8gZnJhZ21lbnRcbiAgICAgICAgZnJhZy5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZyYWc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdsb2JhbEhpZ2hzY29yZTtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTI0LlxuICovXG5cbi8qKlxuICogSGlnaHNjb3JlIGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0gbmlja25hbWV7c3RyaW5nfSwgdGhlIG5pY2tuYW1lXG4gKiBAcGFyYW0gc2NvcmV7c3RyaW5nfSwgdGhlIHNjb3JlKHRpbWUpXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gSGlnaHNjb3JlKG5pY2tuYW1lLCBzY29yZSkge1xuICAgIHRoaXMubmlja25hbWUgPSBuaWNrbmFtZTtcbiAgICB0aGlzLnNjb3JlID0gc2NvcmU7XG4gICAgdGhpcy5oaWdoc2NvcmUgPSBbXTtcblxuICAgIC8vY2FsbCB0byByZWFkIGhpZ2hzY29yZSBmaWxlIGZyb20gbG9jYWwgc3RvcmFnZVxuICAgIHRoaXMucmVhZEZyb21GaWxlKCk7XG59XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gcmVhZCB0aGUgaGlnaHNjb3JlLWZpbGUgZnJvbSBsb2NhbCBzdG9yYWdlXG4gKi9cbkhpZ2hzY29yZS5wcm90b3R5cGUucmVhZEZyb21GaWxlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGhzRmlsZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiaHNcIik7XG4gICAgaWYgKGhzRmlsZSkge1xuICAgICAgICAvL3BhcnNlIGZpbGUgaW50byBKU09OXG4gICAgICAgIHZhciBqc29uID0gSlNPTi5wYXJzZShoc0ZpbGUpO1xuXG4gICAgICAgIC8vZmlsbCB0aGUgaGlnaHNjb3JlLWFycmF5IHdpdGggZW50cmllc1xuICAgICAgICBmb3IgKHZhciBuaWNrbmFtZSBpbiBqc29uKSB7XG4gICAgICAgICAgICBpZiAoanNvbi5oYXNPd25Qcm9wZXJ0eShuaWNrbmFtZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhpZ2hzY29yZS5wdXNoKGpzb25bbmlja25hbWVdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gY2hlY2sgaWYgdGhlIHNjb3JlIHRha2VzIGEgcGxhY2UgaW50byB0aGUgaGlnaHNjb3JlXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuSGlnaHNjb3JlLnByb3RvdHlwZS5pc0hpZ2hzY29yZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpc0hpZ2hzY29yZSA9IGZhbHNlO1xuICAgIGlmICh0aGlzLmhpZ2hzY29yZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgLy9oaWdoc2NvcmUgaXMgZW1wdHksIHRoZXJlZm9yZSBuZXcgaGlnaHNjb3JlXG4gICAgICAgIGlzSGlnaHNjb3JlID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvL2dldCB0aGUgc2NvcmUgbGFzdCBpbiB0aGUgbGlzdFxuICAgICAgICB2YXIgbGFzdFNjb3JlID0gdGhpcy5oaWdoc2NvcmVbdGhpcy5oaWdoc2NvcmUubGVuZ3RoIC0gMV0uc2NvcmU7XG5cbiAgICAgICAgLy9jaGVjayBpZiBoaWdoc2NvcmVcbiAgICAgICAgaWYgKHBhcnNlRmxvYXQodGhpcy5zY29yZSkgPCBwYXJzZUZsb2F0KGxhc3RTY29yZSkgfHwgdGhpcy5oaWdoc2NvcmUubGVuZ3RoIDwgNSkge1xuICAgICAgICAgICAgaXNIaWdoc2NvcmUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGlzSGlnaHNjb3JlO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBhZGQgdGhlIHNjb3JlIGludG8gdGhlIGxpc3RcbiAqIEByZXR1cm5zIHtib29sZWFufSwgYWRkZWQgb3Igbm90XG4gKi9cbkhpZ2hzY29yZS5wcm90b3R5cGUuYWRkVG9MaXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFkZGVkID0gZmFsc2U7XG5cbiAgICAvL2NhbGwgdGhlIGlzSGlnaHNjb3JlIHRvIGNoZWNrIGlmIHNjb3JlIHNob3VsZCBiZSBhZGRlZFxuICAgIGlmICh0aGlzLmlzSGlnaHNjb3JlKCkpIHtcbiAgICAgICAgLy9zYXZlIHRoZSBuaWNrbmFtZSwgc2NvcmUgYW5kIGRhdGVzdGFtcCBpbnRvIGFuIG9iamVjdFxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgIHZhciB0aGlzU2NvcmUgPSB7XG4gICAgICAgICAgICBuaWNrbmFtZTogdGhpcy5uaWNrbmFtZSxcbiAgICAgICAgICAgIHNjb3JlOiB0aGlzLnNjb3JlLFxuICAgICAgICAgICAgZGF0ZTogZGF0ZVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vZGVsZXRlIHRoZSBsYXN0IHBvc2l0aW9uIG9mIHRoZSBoaWdoc2NvcmUgYXJyYXlcbiAgICAgICAgaWYgKHRoaXMuaGlnaHNjb3JlLmxlbmd0aCA9PT0gNSkge1xuICAgICAgICAgICAgLy9yZW1vdmUgdGhlIG9uZSBsYXN0XG4gICAgICAgICAgICB0aGlzLmhpZ2hzY29yZS5zcGxpY2UoLTEsIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9wdXNoIHRoZSBuZXcgYW5kIHNvcnQgdGhlIGFycmF5XG4gICAgICAgIHRoaXMuaGlnaHNjb3JlLnB1c2godGhpc1Njb3JlKTtcbiAgICAgICAgdGhpcy5oaWdoc2NvcmUgPSB0aGlzLmhpZ2hzY29yZS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtyZXR1cm4gYS5zY29yZSAtIGIuc2NvcmU7fSk7XG5cbiAgICAgICAgLy9jYWxsIHRvIHNhdmUgaXRcbiAgICAgICAgdGhpcy5zYXZlVG9GaWxlKCk7XG5cbiAgICAgICAgYWRkZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBhZGRlZDtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gc2F2ZSB0aGUgaGlnaHNjb3JlIHRvIGxvY2FsIHN0b3JhZ2VcbiAqL1xuSGlnaHNjb3JlLnByb3RvdHlwZS5zYXZlVG9GaWxlID0gZnVuY3Rpb24oKSB7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJoc1wiLCBKU09OLnN0cmluZ2lmeSh0aGlzLmhpZ2hzY29yZSkpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBnZXQgdGhlIGhpZ2hzY29yZWZyYWdtZW50IGNvbnRhaW5pbmcgdGhlIGhpZ2hzY29yZS1wYXJ0IG9mIHRhYmxlXG4gKiBAcmV0dXJucyB7RG9jdW1lbnRGcmFnbWVudH1cbiAqL1xuSGlnaHNjb3JlLnByb3RvdHlwZS5jcmVhdGVIaWdoc2NvcmVGcmFnbWVudCA9IGZ1bmN0aW9uKGlzTmV3KSB7XG4gICAgdmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIHRlbXBsYXRlO1xuICAgIHZhciBoc05pY2tuYW1lO1xuICAgIHZhciBoc1Njb3JlO1xuICAgIHZhciBoc0RhdGU7XG4gICAgdmFyIGRhdGU7XG4gICAgdmFyIGxhdGVzdEVudHJ5ID0gbmV3IERhdGUodGhpcy5oaWdoc2NvcmVbMF0uZGF0ZSk7XG4gICAgdmFyIGhpZ2hsaWdodEluZGV4ID0gMDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5oaWdoc2NvcmUubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgLy9nZXQgdGhlIHRlbXBsYXRlIGZvciBhIHRhYmxlLXJvd1xuICAgICAgICB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtaGlnaHNjb3JlUm93XCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICBoc05pY2tuYW1lID0gdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5ocy1uaWNrbmFtZVwiKTtcbiAgICAgICAgaHNTY29yZSA9IHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuaHMtc2NvcmVcIik7XG4gICAgICAgIGhzRGF0ZSA9IHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuaHMtZGF0ZVwiKTtcblxuICAgICAgICAvL2FwcGVuZCB0aGUgbmlja25hbWUgYW5kIHNjb3JlIHRvIHRoZSByb3dcbiAgICAgICAgaHNOaWNrbmFtZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLmhpZ2hzY29yZVtpXS5uaWNrbmFtZSkpO1xuICAgICAgICBoc1Njb3JlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMuaGlnaHNjb3JlW2ldLnNjb3JlKSk7XG5cbiAgICAgICAgZGF0ZSA9IG5ldyBEYXRlKHRoaXMuaGlnaHNjb3JlW2ldLmRhdGUpO1xuICAgICAgICBoc0RhdGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0ZS50b0RhdGVTdHJpbmcoKSkpO1xuXG4gICAgICAgIGlmIChpc05ldykge1xuICAgICAgICAgICAgLy9jaGVjayBmb3IgdGhlIGxldGVzdCBlbnRyeVxuICAgICAgICAgICAgaWYgKGRhdGUudmFsdWVPZigpID4gbGF0ZXN0RW50cnkudmFsdWVPZigpKSB7XG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0SW5kZXggPSBpO1xuICAgICAgICAgICAgICAgIGxhdGVzdEVudHJ5ID0gZGF0ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vYXBwZW5kIHJvdyB0byBmcmFnbWVudFxuICAgICAgICBmcmFnLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcbiAgICB9XG5cbiAgICBpZiAoaXNOZXcpIHtcbiAgICAgICAgLy9oaWdobGlnaHQgdGhlIG5ldyBoaWdoc2NvcmUgaW4gdGhlIGxpc3RcbiAgICAgICAgZnJhZy5xdWVyeVNlbGVjdG9yQWxsKFwidHJcIilbaGlnaGxpZ2h0SW5kZXhdLmNsYXNzTGlzdC5hZGQoXCJoaWdobGlnaHRcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZyYWc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhpZ2hzY29yZTtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTIzLlxuICovXG5cInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBRdWVzdGlvbiBjb25zdHJ1Y3RvclxuICogQHBhcmFtIG9iantPYmplY3R9LCBvYmplY3QgdGhhdCBob2xkcyBhIHF1ZXN0aW9uXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gUXVlc3Rpb24ob2JqKSB7XG4gICAgdGhpcy5pZCA9IG9iai5pZDtcbiAgICB0aGlzLnF1ZXN0aW9uID0gb2JqLnF1ZXN0aW9uO1xuICAgIHRoaXMuYWx0ID0gb2JqLmFsdGVybmF0aXZlcztcbn1cblxuLyoqXG4gKiBGdW5jdGlvbmIgdG8gcHJlc2VudCB0aGUgcXVlc3Rpb25cbiAqL1xuUXVlc3Rpb24ucHJvdG90eXBlLnByaW50ID0gZnVuY3Rpb24oKSB7XG4gICAgLy9zdGF0ZW1lbnQgdG8gY2FsbCB0aGUgcmlnaHRmdWwgcHJpbnRmdW5jdGlvblxuICAgIGlmICh0aGlzLmFsdCkge1xuICAgICAgICB0aGlzLnByaW50QWx0UXVlc3Rpb24oKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMucHJpbnRRdWVzdGlvbigpO1xuICAgIH1cblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJpbnB1dFwiKS5mb2N1cygpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBjbGVhciBhIGRpdlxuICogQHBhcmFtIGRpdntvYmplY3R9LCB0aGUgZGl2IHRvIGNsZWFyXG4gKi9cblF1ZXN0aW9uLnByb3RvdHlwZS5jbGVhckRpdiA9IGZ1bmN0aW9uKGRpdikge1xuICAgIHdoaWxlIChkaXYuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgIGRpdi5yZW1vdmVDaGlsZChkaXYubGFzdENoaWxkKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHByZXNlbnQgdGhlIHF1ZXJzdGlvbiB0aGF0IGhhcyBhbHRlcm5hdGl2ZXNcbiAqL1xuUXVlc3Rpb24ucHJvdG90eXBlLnByaW50QWx0UXVlc3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICAvL2dldCB0aGUgdGVtcGxhdGUgYW5kIGFwcGVuZCB0aGUgYWx0ZXJuYXRpdmVzXG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0ZW1wbGF0ZS1xdWVzdGlvbi1hbHRcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5xSGVhZFwiKS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLnF1ZXN0aW9uKSk7XG5cbiAgICAvL2NhbGwgdGhlIGZ1bmN0aW9uIHRoYXQgaGFuZGxlcyB0aGUgYWx0ZXJuYXRpdmVzXG4gICAgdmFyIGlucHV0RnJhZyA9IHRoaXMuZ2V0QWx0RnJhZygpO1xuICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIjcUZvcm1cIikuaW5zZXJ0QmVmb3JlKGlucHV0RnJhZywgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIiNzdWJtaXRcIikpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSB0aGUgYWx0ZXJuYXRpdmVzXG4gKiBAcmV0dXJucyB7RG9jdW1lbnRGcmFnbWVudH0sIHRoZSBmcmFnbWVudCBmb3IgdGhlIGFsdGVybmF0aXZlc1xuICovXG5RdWVzdGlvbi5wcm90b3R5cGUuZ2V0QWx0RnJhZyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpbnB1dEZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIGlucHV0O1xuICAgIHZhciBsYWJlbDtcbiAgICB2YXIgZmlyc3QgPSB0cnVlO1xuXG4gICAgZm9yICh2YXIgYWx0IGluIHRoaXMuYWx0KSB7XG4gICAgICAgIGlmICh0aGlzLmFsdC5oYXNPd25Qcm9wZXJ0eShhbHQpKSB7XG4gICAgICAgICAgICAvL2dldCB0aGUgdGVtcGxhdGUgZm9yIGFsdGVybmF0aXZlc1xuICAgICAgICAgICAgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLWFsdGVybmF0aXZlXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgICAgICAgICAvL2FwcGVuZCB0aGUgYWx0ZXJuYXRpdmVcbiAgICAgICAgICAgIGlmIChmaXJzdCkge1xuICAgICAgICAgICAgICAgIGlucHV0LnF1ZXJ5U2VsZWN0b3IoXCJpbnB1dFwiKS5zZXRBdHRyaWJ1dGUoXCJjaGVja2VkXCIsIFwiY2hlY2tlZFwiKTtcbiAgICAgICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbnB1dC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRcIikuc2V0QXR0cmlidXRlKFwidmFsdWVcIiwgYWx0KTtcbiAgICAgICAgICAgIGxhYmVsID0gaW5wdXQucXVlcnlTZWxlY3RvcihcImxhYmVsXCIpO1xuICAgICAgICAgICAgbGFiZWwuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5hbHRbYWx0XSkpO1xuXG4gICAgICAgICAgICBpbnB1dEZyYWcuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICByZXR1cm4gaW5wdXRGcmFnO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBwcmVzZW50IGEgcXVlc3Rpb24gd2l0aCB0ZXh0LWlucHV0XG4gKi9cblF1ZXN0aW9uLnByb3RvdHlwZS5wcmludFF1ZXN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgLy9nZXQgdGhlIHRlbXBsYXRlIGFuZCBhcHBlbmQgdGhlIHF1ZXN0aW9uXG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0ZW1wbGF0ZS1xdWVzdGlvblwiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLnFIZWFkXCIpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMucXVlc3Rpb24pKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbjtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTIzLlxuICovXG5cInVzZSBzdHJpY3RcIjtcbnZhciBRdWVzdGlvbiA9IHJlcXVpcmUoXCIuL1F1ZXN0aW9uXCIpO1xudmFyIEFqYXggPSByZXF1aXJlKFwiLi9BamF4XCIpO1xudmFyIFRpbWVyID0gcmVxdWlyZShcIi4vVGltZXJcIik7XG52YXIgSGlnaHNjb3JlID0gcmVxdWlyZShcIi4vSGlnaHNjb3JlXCIpO1xudmFyIEdsb2JhbEhpZ2hzY29yZSA9IHJlcXVpcmUoXCIuL0dsb2JhbEhpZ2hzY29yZVwiKTtcblxuLyoqXG4gKiBDb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgdGhlIFF1aXpcbiAqIEBwYXJhbSBuaWNrbmFtZXtzdHJpbmd9LCBuaWNrbmFtZSB0byB1c2UgZm9yIGhpZ2hzY29yZVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFF1aXoobmlja25hbWUpIHtcbiAgICB0aGlzLm5pY2tuYW1lID0gbmlja25hbWU7XG4gICAgdGhpcy50aW1lciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnF1ZXN0aW9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMubmV4dFVSTCA9IFwiaHR0cDovL3Zob3N0My5sbnUuc2U6MjAwODAvcXVlc3Rpb24vMVwiO1xuICAgIHRoaXMuYnV0dG9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuZm9ybSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnRvdGFsVGltZSA9IDA7XG5cbiAgICAvL3JlcXVlc3QgdGhlIGZpcnN0IHF1ZXN0aW9uXG4gICAgdGhpcy5nZXRRdWVzdGlvbigpO1xufVxuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHNlbmQgYSByZXF1ZXN0IGZvciBhIG5ldyBxdWVzdGlvblxuICovXG5RdWl6LnByb3RvdHlwZS5nZXRRdWVzdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjb25maWcgPSB7bWV0aG9kOiBcIkdFVFwiLCB1cmw6IHRoaXMubmV4dFVSTH07XG4gICAgdmFyIHJlc3BvbnNlRnVuY3Rpb24gPSB0aGlzLnJlc3BvbnNlLmJpbmQodGhpcyk7XG5cbiAgICBBamF4LnJlcShjb25maWcsIHJlc3BvbnNlRnVuY3Rpb24pO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgdGhlIHJlc3BvbnNlLCB1c2VzIGFzIGFyZ3VtZW50IFwiY2FsbGJhY2tcIiBpbiBhIHJlcXVlc3RcbiAqIEBwYXJhbSBlcnJvcntOdW1iZXJ9LCBlcnJvcmNvZGUsIG51bGwgaWYgbm8gZXJyb3JcbiAqIEBwYXJhbSByZXNwb25zZXtzdHJpbmd9LCByZXNwb25zZSBzdHJpbmcgdG8gcGFyc2UgSlNPTiBmcm9tXG4gKi9cblF1aXoucHJvdG90eXBlLnJlc3BvbnNlID0gZnVuY3Rpb24oZXJyb3IsIHJlc3BvbnNlKSB7XG4gICAgLy9oYW5kbGUgZXJyb3JzICg0MDQgbWVhbnMgbm8gbW9yZSBxdWVzdGlvbnMpXG4gICAgaWYgKGVycm9yKSB7XG4gICAgICAgIC8vcHJlc2VudCB0aGUgZ2FtZW92ZXItdmlldyB0byB1c2VyXG4gICAgICAgIHRoaXMuZ2FtZU92ZXIoKTtcbiAgICB9XG5cbiAgICAvL2hhbmRsZSB0aGUgcmVzcG9uc2Ugc3RyaW5nXG4gICAgaWYgKHJlc3BvbnNlKSB7XG4gICAgICAgIC8vcGFzcmUgdG8gSlNPTlxuICAgICAgICB2YXIgb2JqID0gSlNPTi5wYXJzZShyZXNwb25zZSk7XG4gICAgICAgIHRoaXMubmV4dFVSTCA9IG9iai5uZXh0VVJMO1xuXG4gICAgICAgIC8vc3RhdGVtZW50IHRvIGNhbGwgdGhlIHJpZ2h0ZnVsIGZ1bmN0aW9uIG9uIHRoZSByZXNwb25zZVxuICAgICAgICBpZiAob2JqLnF1ZXN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnJlc3BvbnNlUXVlc3Rpb24ob2JqKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm5leHRVUkwgfHwgb2JqLm1lc3NhZ2UgPT09IFwiQ29ycmVjdCBhbnN3ZXIhXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlQW5zd2VyKG9iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gaGFuZGxlIGlmIHJlc3BvbnNlIGlzIGEgcXVlc3Rpb25cbiAqIEBwYXJhbSBvYmp7T2JqZWN0fSwgb2JqZWN0IHRoYXQgaG9sZHMgdGhlIHF1ZXN0aW9uXG4gKi9cblF1aXoucHJvdG90eXBlLnJlc3BvbnNlUXVlc3Rpb24gPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29udGVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKTtcbiAgICB0aGlzLmNsZWFyRGl2KGNvbnRlbnQpO1xuXG4gICAgLy9jcmVhdGUgYSBuZXcgcXVlc3Rpb24gZnJvbSBvYmplY3RcbiAgICB0aGlzLnF1ZXN0aW9uID0gbmV3IFF1ZXN0aW9uKG9iaik7XG4gICAgdGhpcy5xdWVzdGlvbi5wcmludCgpO1xuXG4gICAgLy9jcmVhdGUgYSBuZXcgdGltZXIgZm9yIHF1ZXN0aW9uXG4gICAgdGhpcy50aW1lciA9IG5ldyBUaW1lcih0aGlzLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RpbWVyIGgxXCIpLCAyMCk7XG4gICAgdGhpcy50aW1lci5zdGFydCgpO1xuXG4gICAgLy9BZGQgbGluc3RlbmVycyBmb3IgdGhlIGZvcm1cbiAgICB0aGlzLmFkZExpc3RlbmVyKCk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSBpZiByZXNwb25zZSBpcyBhbiBhbnN3ZXJcbiAqIEBwYXJhbSBvYmp7T2JqZWN0fSwgb2JqZWN0IHRoYXQgaG9sZHMgdGhlIGFuc3dlclxuICovXG5RdWl6LnByb3RvdHlwZS5yZXNwb25zZUFuc3dlciA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBjb250ZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpO1xuICAgIHRoaXMuY2xlYXJEaXYoY29udGVudCk7XG5cbiAgICAvL0hhbmRsZSB0aGUgdGVtcGxhdGUgZm9yIGFuc3dlclxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtYW5zd2VyXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUob2JqLm1lc3NhZ2UpO1xuICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCJwXCIpLmFwcGVuZENoaWxkKHRleHQpO1xuXG4gICAgY29udGVudC5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG5cbiAgICBpZiAodGhpcy5uZXh0VVJMKSB7XG4gICAgICAgIC8vUmVxdWVzdCBhIG5ldyBxdWVzdGlvbiwgYnV0IHdpdGggYSBkZWxheVxuICAgICAgICB2YXIgbmV3UXVlc3Rpb24gPSB0aGlzLmdldFF1ZXN0aW9uLmJpbmQodGhpcyk7XG4gICAgICAgIHNldFRpbWVvdXQobmV3UXVlc3Rpb24sIDEwMDApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5nYW1lQ29tcGxldGVkKCk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBhZGQgdGhlIGxpc3RlbmVyIGZvciBzdWJtaXRcbiAqL1xuUXVpei5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc3VibWl0XCIpO1xuICAgIHRoaXMuZm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcUZvcm1cIik7XG5cbiAgICB0aGlzLmJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zdWJtaXQuYmluZCh0aGlzKSwgdHJ1ZSk7XG4gICAgdGhpcy5mb3JtLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlwcmVzc1wiLCB0aGlzLnN1Ym1pdC5iaW5kKHRoaXMpLCB0cnVlKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHdoZW4gc3VibWl0IGlzIHRyaWdnZXJlZFxuICovXG5RdWl6LnByb3RvdHlwZS5zdWJtaXQgPSBmdW5jdGlvbihldmVudCkge1xuICAgIC8vSWYgdGhlIHRyaWdnZXIgaXMgZW50ZXIgb3IgY2xpY2sgZG8gdGhlIHN1Ym1pdFxuICAgIGlmIChldmVudC53aGljaCA9PT0gMTMgfHwgZXZlbnQua2V5Q29kZSA9PT0gMTMgfHwgZXZlbnQudHlwZSA9PT0gXCJjbGlja1wiKSB7XG4gICAgICAgIC8vcHJldmVudCB0aGUgZm9ybSB0byByZWxvYWQgcGFnZSBvbiBlbnRlclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIHRoaXMudG90YWxUaW1lICs9IHRoaXMudGltZXIuc3RvcCgpO1xuICAgICAgICB2YXIgaW5wdXQ7XG5cbiAgICAgICAgLy9yZW1vdmUgdGhlIGxpc3RlbmVycyB0byBwcmV2ZW50IGRvdWJsZS1zdWJtaXRcbiAgICAgICAgdGhpcy5idXR0b24ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc3VibWl0LmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmZvcm0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleXByZXNzXCIsIHRoaXMuc3VibWl0LmJpbmQodGhpcykpO1xuXG4gICAgICAgIC8vc2F2ZSBpbnB1dCBkZXBlbmRpbmcgb24gdGhlIHR5cGUgb2YgcXVlc3Rpb25cbiAgICAgICAgaWYgKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYW5zd2VyXCIpKSB7XG4gICAgICAgICAgICAvL2dldCB0aGUgZm9ybSBpbnB1dFxuICAgICAgICAgICAgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2Fuc3dlclwiKS52YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vZ2V0IHRoZSBjaGVja2VkIHJlYWRpb2J1dHRvblxuICAgICAgICAgICAgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRbbmFtZT0nYWx0ZXJuYXRpdmUnXTpjaGVja2VkXCIpLnZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9zZXQgdGhlIGNvbmZpZyB0byBiZSBzZW50IHRvIHNlcnZlciBhbmQgc2VuZCBhIHJlcXVlc3RcbiAgICAgICAgdmFyIGNvbmZpZyA9IHtcbiAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgICB1cmw6IHRoaXMubmV4dFVSTCxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBhbnN3ZXI6IGlucHV0XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciByZXNwb25zZUZ1bmN0aW9uID0gdGhpcy5yZXNwb25zZS5iaW5kKHRoaXMpO1xuICAgICAgICBBamF4LnJlcShjb25maWcsIHJlc3BvbnNlRnVuY3Rpb24pO1xuICAgIH1cbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHRoZSBnYW1lT3Zlci12aWV3IGFuZCBwcmVzZW50IGl0IHRvIHVzZXJcbiAqL1xuUXVpei5wcm90b3R5cGUuZ2FtZU92ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAvL2NyZWF0ZSBhIGhpZ2hzY29yZSBtb2R1bGUgdG8gc2hvdyBpdCB0byB0aGUgdXNlclxuICAgIHZhciBocyA9IG5ldyBIaWdoc2NvcmUodGhpcy5uaWNrbmFtZSk7XG4gICAgdGhpcy5jbGVhckRpdihkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikpO1xuXG4gICAgLy9nZXQgdGhlIGdhbWUgb3ZlciB0ZW1wbGF0ZVxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtZ2FtZU92ZXJcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG5cbiAgICAvL2lmIHRoZSBoaWdoc2NvcmUgaGFzIGVudHJpZXMgYWRkIHRoZW0gdG8gdGhlIHRlbXBsYXRlXG4gICAgaWYgKGhzLmhpZ2hzY29yZS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuaHMtdGl0bGVcIikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJIaWdoc2NvcmVcIikpO1xuICAgICAgICB2YXIgaHNGcmFnID0gaHMuY3JlYXRlSGlnaHNjb3JlRnJhZ21lbnQoKTtcbiAgICAgICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcInRhYmxlXCIpLmFwcGVuZENoaWxkKGhzRnJhZyk7XG4gICAgfVxuXG4gICAgdmFyIGdsb2JhbEhzID0gbmV3IEdsb2JhbEhpZ2hzY29yZSh0aGlzLm5pY2tuYW1lKTtcbiAgICBnbG9iYWxIcy5zZW5kVG9TZXJ2ZXIoKTtcblxuICAgIC8vYWRkIHRoZSB0ZW1wbGF0ZSB0byBjb250ZW50XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHRoZSBnYW1lIGNvbXBsZXRlZC12aWV3IGFuZCBwcmVzZW50IGl0IHRvIHRoZSB1c2VyXG4gKi9cblF1aXoucHJvdG90eXBlLmdhbWVDb21wbGV0ZWQgPSBmdW5jdGlvbigpIHtcbiAgICAvL2NyZWF0ZSBuZXcgaGlnaHNjb3JlIG1vZHVsZSB0byBoYW5kbGUgaXRcbiAgICB2YXIgaHMgPSBuZXcgSGlnaHNjb3JlKHRoaXMubmlja25hbWUsIHRoaXMudG90YWxUaW1lLnRvRml4ZWQoMykpO1xuICAgIHZhciBpc05ldyA9IGhzLmFkZFRvTGlzdCgpO1xuXG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0ZW1wbGF0ZS1xdWl6Q29tcGxldGVkXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgLy9nZXQgdGhlIGhpZ2hzY29yZSBpZiB0aGUgaGlnaHNjb3JlIGhhcyBlbnRyaWVzXG4gICAgaWYgKGhzLmhpZ2hzY29yZS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuaHMtdGl0bGVcIikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJIaWdoc2NvcmVcIikpO1xuICAgICAgICB2YXIgaHNGcmFnID0gaHMuY3JlYXRlSGlnaHNjb3JlRnJhZ21lbnQoaXNOZXcpO1xuICAgICAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwidGFibGVcIikuYXBwZW5kQ2hpbGQoaHNGcmFnKTtcbiAgICB9XG5cbiAgICBpZiAoaXNOZXcpIHtcbiAgICAgICAgdmFyIG5ld0hTID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImgxXCIpO1xuICAgICAgICBuZXdIUy5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIk5ldyBIaWdoc2NvcmUhXCIpKTtcbiAgICAgICAgdmFyIGRpdiA9IHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCJkaXZcIik7XG4gICAgICAgIGRpdi5pbnNlcnRCZWZvcmUobmV3SFMsIGRpdi5maXJzdENoaWxkKTtcbiAgICB9XG5cbiAgICB0aGlzLmNsZWFyRGl2KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKSk7XG5cbiAgICB2YXIgaDEgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLnRpbWVcIik7XG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLnRvdGFsVGltZS50b0ZpeGVkKDMpKTtcbiAgICBoMS5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xuXG4gICAgLy9hZGQgdGhlIGdsb2JhbCBoaWdoc2NvcmVcbiAgICB2YXIgZ2xvYmFsSHMgPSBuZXcgR2xvYmFsSGlnaHNjb3JlKHRoaXMubmlja25hbWUsIHRoaXMudG90YWxUaW1lLnRvRml4ZWQoMykpO1xuICAgIGdsb2JhbEhzLnNlbmRUb1NlcnZlcigpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBjbGVhciBhIHNwZWNpZmljIGRpdiBvZiBjaGlsZHNcbiAqIEBwYXJhbSBkaXZ7T2JqZWN0fSwgdGhlIGRpdmVsZW1lbnQgdG8gY2xlYXJcbiAqL1xuUXVpei5wcm90b3R5cGUuY2xlYXJEaXYgPSBmdW5jdGlvbihkaXYpIHtcbiAgICB3aGlsZSAoZGl2Lmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgICBkaXYucmVtb3ZlQ2hpbGQoZGl2Lmxhc3RDaGlsZCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBRdWl6O1xuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IE9za2FyIG9uIDIwMTUtMTEtMjQuXG4gKi9cblxuLyoqXG4gKiBUaW1lciBjb25zdHJ1Y3RvclxuICogQHBhcmFtIG93bmVye09iamVjdH0sIHRoZSBvd25lci1vYmplY3QgdGhhdCBjcmVhdGVkIHRoZSB0aW1lclxuICogQHBhcmFtIGVsZW1lbnR7T2JqZWN0fSwgZWxlbWVudCB0byBwcmludCB0aGUgdGltZXIgdG9cbiAqIEBwYXJhbSB0aW1le051bWJlcn0sIHRoZSB0aW1lIHRvIGNvdW50IGRvd25cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBUaW1lcihvd25lciwgZWxlbWVudCwgdGltZSkge1xuICAgIHRoaXMudGltZSA9IHRpbWU7XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm93bmVyID0gb3duZXI7XG4gICAgdGhpcy5zdGFydFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICB0aGlzLmludGVydmFsID0gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIEZ1bmN0aW9uIHRoYXQgc3RhcnRzIGFuIGludGVydmFsIGZvciB0aGUgdGltZXJcbiAqL1xuVGltZXIucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgLy9jYWxsIHRoZSBydW4gZnVuY3Rpb24gb24gZWFjaCBpbnRlcnZhbFxuICAgIHRoaXMuaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCh0aGlzLnJ1bi5iaW5kKHRoaXMpLCAxMDApO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBiZSBleGVjdXRlZCBlYWNoIGludGVydmFsIG9mIHRoZSB0aW1lclxuICovXG5UaW1lci5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG4gICAgLy9jb3VudCB0aGUgZGlmZmVyZW5jZSBmcm9tIHN0YXJ0IHRvIG5vd1xuICAgIHZhciBkaWZmID0gKG5vdyAtIHRoaXMuc3RhcnRUaW1lKSAvIDEwMDA7XG5cbiAgICAvL2NvdW50IHRoZSB0aW1lIC0gZGlmZmVyZW5jZSB0byBzaG93IGNvdW50ZG93blxuICAgIHZhciBzaG93VGltZSA9IHRoaXMudGltZSAtIGRpZmY7XG5cbiAgICBpZiAoZGlmZiA+PSB0aGlzLnRpbWUpIHtcbiAgICAgICAgLy90aW1lIGlmIHVwXG4gICAgICAgIHNob3dUaW1lID0gMDtcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsKTtcblxuICAgICAgICAvL2NhbGwgb3duZXIgZ2FtZU92ZXIgc2luY2UgdGltZSBpcyBvdXRcbiAgICAgICAgdGhpcy5vd25lci5nYW1lT3ZlcigpO1xuICAgIH1cblxuICAgIC8vc2hvdyB0aGUgdGltZXIgd2l0aCBvbmUgZGVjaW1hbFxuICAgIHRoaXMucHJpbnQoc2hvd1RpbWUudG9GaXhlZCgxKSk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRoYXQgc3RvcHMgdGhlIHRpbWVyIGJlZm9yZSBpdHMgb3ZlclxuICogQHJldHVybnMge251bWJlcn0sIHRoZSBkaWZmZXJlbmNlIGluIHNlY29uZHNcbiAqL1xuVGltZXIucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgICBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xuICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuICAgIHJldHVybiAobm93IC0gdGhpcy5zdGFydFRpbWUpIC8gMTAwMDtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gc2hvdyB0aGUgdGltZXIgYXQgdGhlIGdpdmVuIGVsZW1lbnRcbiAqIEBwYXJhbSBkaWZme051bWJlcn0gdGhlIHRpbWUgdG8gYmUgcHJpbnRlZFxuICovXG5UaW1lci5wcm90b3R5cGUucHJpbnQgPSBmdW5jdGlvbihkaWZmKSB7XG4gICAgdGhpcy5lbGVtZW50LnJlcGxhY2VDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkaWZmKSwgdGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUaW1lcjtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIFF1aXogPSByZXF1aXJlKFwiLi9RdWl6XCIpO1xudmFyIHE7XG5cbmZ1bmN0aW9uIGFkZFRoZW1lU2VsZWN0b3IoKSB7XG4gICAgLy9hZGQgbGlzdGVuZXIgZm9yIHRoZSB0aGVtZSBjaG9vc2VyXG4gICAgdmFyIHNlbGVjdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGhlbWUtc2VsZWN0b3JcIik7XG4gICAgc2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBiYXNlU3R5bGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2Jhc2VTdHlsZVwiKTtcbiAgICAgICAgdmFyIGxvYWRpbmdTdHlsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbG9hZGluZ1N0eWxlXCIpO1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcInRoZW1lXCIsIHNlbGVjdC52YWx1ZSk7XG4gICAgICAgIGlmIChzZWxlY3QudmFsdWUgPT09IFwicGxheWZ1bFwiKSB7XG4gICAgICAgICAgICBiYXNlU3R5bGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvcGxheWZ1bC5jc3NcIik7XG4gICAgICAgICAgICBsb2FkaW5nU3R5bGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvcGxheWZ1bF9sb2FkaW5nLmNzc1wiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzZWxlY3QudmFsdWUgPT09IFwiaGFja2VyXCIpIHtcbiAgICAgICAgICAgIGJhc2VTdHlsZS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwic3R5bGVzaGVldC9oYWNrZXIuY3NzXCIpO1xuICAgICAgICAgICAgbG9hZGluZ1N0eWxlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L2hhY2tlcl9sb2FkaW5nLmNzc1wiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzZWxlY3QudmFsdWUgPT09IFwidGVybWluYWxcIikge1xuICAgICAgICAgICAgYmFzZVN0eWxlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L3Rlcm1pbmFsLmNzc1wiKTtcbiAgICAgICAgICAgIGxvYWRpbmdTdHlsZS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwic3R5bGVzaGVldC90ZXJtaW5hbF9sb2FkaW5nLmNzc1wiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzZWxlY3QudmFsdWUgPT09IFwibm9zdHlsZVwiKSB7XG4gICAgICAgICAgICBiYXNlU3R5bGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvbm9zdHlsZS5jc3NcIik7XG4gICAgICAgICAgICBsb2FkaW5nU3R5bGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvbm9zdHlsZV9sb2FkaW5nLmNzc1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vc2V0IG5pY2tuYW1lLWlucHV0IGZvY3VzXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJpbnB1dFwiKS5mb2N1cygpO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSB0aGUgc3VibWl0IGZvciBuaWNrbmFtZSBhbmQgc3RhcnQgdGhlIHF1aXpcbiAqIEBwYXJhbSBldmVudCwgdGhlIGV2ZW50aGFuZGxlciBmcm9tIHRoZSBsaXN0ZW5lclxuICovXG5mdW5jdGlvbiBzdWJtaXQoZXZlbnQpIHtcbiAgICBpZiAoZXZlbnQud2hpY2ggPT09IDEzIHx8IGV2ZW50LmtleUNvZGUgPT09IDEzIHx8IGV2ZW50LnR5cGUgPT09IFwiY2xpY2tcIikge1xuICAgICAgICAvL2Rpc2FibGUgZm9ybXMgYWN0aW9uIHNvIHBhZ2Ugd29udCByZWxvYWQgd2l0aCBlbnRlclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmlja25hbWVcIikudmFsdWU7XG5cbiAgICAgICAgLy9pZiBuaWNrbmFtZSB3cml0dGVuLCBzdGFydCBxdWl6XG4gICAgICAgIGlmIChpbnB1dC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBxID0gbmV3IFF1aXooaW5wdXQpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5pZiAobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJ0aGVtZVwiKSkge1xuICAgIHZhciB0aGVtZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwidGhlbWVcIik7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNiYXNlU3R5bGVcIikuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvXCIgKyB0aGVtZSArIFwiLmNzc1wiKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2xvYWRpbmdTdHlsZVwiKS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwic3R5bGVzaGVldC9cIiArIHRoZW1lICsgXCJfbG9hZGluZy5jc3NcIik7XG59XG5cbnZhciBidXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3N1Ym1pdFwiKTtcbnZhciBmb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNxRm9ybVwiKTtcblxuYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzdWJtaXQsIHRydWUpO1xuZm9ybS5hZGRFdmVudExpc3RlbmVyKFwia2V5cHJlc3NcIiwgc3VibWl0LCB0cnVlKTtcblxuLy9zZXQgbmlja25hbWUtaW5wdXQgZm9jdXMgYXQgc3RhcnRcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJpbnB1dFwiKS5mb2N1cygpO1xuXG5hZGRUaGVtZVNlbGVjdG9yKCk7XG4iXX0=
