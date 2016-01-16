(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

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
"use strict";

/**
 * Created by Oskar on 2015-11-24.
 * This uses some back-end hpp-code and mysql hosted on my server.
 * The code for that can be seen but wont be pushed to github.
 */
var Ajax = require("./Ajax");

/**
 * GlobalHighscore constructor
 * @param server{string}, server used
 * @param nickname{string}, the nickname
 * @param score{string}, the score(time)
 * @constructor
 */
function GlobalHighscore(server, nickname, score) {
    this.nickname = nickname;
    this.score = score;
    this.server = server;
    this.date = new Date();
    this.highscore = [];
}

/**
 * Send the request to add the score to the server
 */
GlobalHighscore.prototype.sendToServer = function() {
    var data = {server: this.server, nickname: this.nickname, score: this.score, date: this.date};
    var config = {
        method: "POST",
        url: "//root.oskaremilsson.se/quizmasterz/add.php",
        data: data
    };

    Ajax.req(config, this.sendResponse.bind(this));
};

/**
 * Function to handle response from sending score to server
 */
GlobalHighscore.prototype.sendResponse = function(error, response) {
    if (response) {
        var config = {
            method: "POST",
            url: "//root.oskaremilsson.se/quizmasterz/read.php",
            data: {server: this.server}
        };
        Ajax.req(config, this.readResponse.bind(this));
    }
};

/**
 * Function to read the highscore-file from server storage
 */
GlobalHighscore.prototype.readResponse = function(error, response) {
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
    var tempDate;
    var tempHs;

    //options for the date-format in the  table
    var dateOptions = {
        year: "numeric", month: "numeric",
        day: "numeric", hour: "2-digit", minute: "2-digit"
    };

    for (var i = 0; i < this.highscore.length; i += 1) {
        tempHs = this.highscore[i];

        //get the template for a table-row
        template = document.querySelector("#template-highscoreRow").content.cloneNode(true);
        hsNickname = template.querySelector(".hs-nickname");
        hsScore = template.querySelector(".hs-score");
        hsDate = template.querySelector(".hs-date");

        //append the nickname and score to the row
        hsNickname.appendChild(document.createTextNode(tempHs.nickname));
        hsScore.appendChild(document.createTextNode(parseFloat(tempHs.score).toFixed(3)));

        //convert the timestamp back to date-object
        tempDate = new Date(tempHs.date);
        hsDate.appendChild(document.createTextNode(tempDate.toLocaleTimeString("sv-se", dateOptions)));

        //if the global highscore is identical with this one add the highlight class
        if (this.date.valueOf() === tempDate.valueOf() && this.nickname === tempHs.nickname) {
            template.querySelector("tr").classList.add("highlight");
        }

        //append row to fragment
        frag.appendChild(template);
    }

    return frag;
};

module.exports = GlobalHighscore;

},{"./Ajax":1}],3:[function(require,module,exports){
"use strict";

/**
 * Highscore constructor
 * @param server{string}, the server name
 * @param nickname{string}, the nickname
 * @param score{string}, the score(time)
 * @constructor
 */
function Highscore(server, nickname, score) {
    this.nickname = nickname;
    this.score = score;
    this.server = server;
    this.date = new Date();
    this.highscore = [];

    //call to read highscore file from local storage
    this.readFromFile();
}

/**
 * Function to read the highscore-file from local storage
 */
Highscore.prototype.readFromFile = function() {
    var hsFile = localStorage.getItem("hs-" + this.server);
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
        var thisScore = {
            nickname: this.nickname,
            score: this.score,
            date: this.date
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
    localStorage.setItem("hs-" + this.server, JSON.stringify(this.highscore));
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
    var hsDate;
    var tempDate;

    //options for the date-format in the  table
    var dateOptions = {
        year: "numeric", month: "numeric",
        day: "numeric", hour: "2-digit", minute: "2-digit"
    };

    for (var i = 0; i < this.highscore.length; i += 1) {
        //get the template for a table-row
        template = document.querySelector("#template-highscoreRow").content.cloneNode(true);
        hsNickname = template.querySelector(".hs-nickname");
        hsScore = template.querySelector(".hs-score");
        hsDate = template.querySelector(".hs-date");

        //append the nickname and score to the row
        hsNickname.appendChild(document.createTextNode(this.highscore[i].nickname));
        hsScore.appendChild(document.createTextNode(this.highscore[i].score));

        tempDate = new Date(this.highscore[i].date);
        hsDate.appendChild(document.createTextNode(tempDate.toLocaleTimeString("sv-se", dateOptions)));

        if (this.date.valueOf() === tempDate.valueOf()) {
            //highlight the new highscore in the list
            template.querySelector("tr").classList.add("highlight");
        }

        //append row to fragment
        frag.appendChild(template);
    }

    return frag;
};

module.exports = Highscore;

},{}],4:[function(require,module,exports){
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
 * Function to present the question
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
 * Function to present the question that has alternatives
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
"use strict";

var Question = require("./Question");
var Ajax = require("./Ajax");
var Timer = require("./Timer");
var Highscore = require("./Highscore");
var GlobalHighscore = require("./GlobalHighscore");

/**
 * Constructor function for the Quiz
 * @param nickname{string}, nickname to use for highscore
 * @param server{string}, url to server to use
 * @constructor
 */
function Quiz(nickname, server) {
    this.nickname = nickname;
    this.timer = undefined;
    this.question = undefined;
    this.nextURL = server + "/question/1" || "http://vhost3.lnu.se:20080/question/1";
    this.server = server;
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
    //document.querySelector("#wrapper").classList.remove("animate-right");
    //document.querySelector("#wrapper").classList.add("animate-left");

    var config = {method: "GET", url: this.nextURL};
    var responseFunction = this.response.bind(this);

    Ajax.req(config, responseFunction);
};

/**
 * Function to handle the response, uses as argument "callback" in a request
 * @param error{Number}, error code, null if no error
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
Quiz.prototype.gameOver = function(cause) {
    //create a highscore module to show it to the user
    var hs = new Highscore(this.server, this.nickname);
    this.clearDiv(document.querySelector("#content"));

    //get the game over template
    var template = document.querySelector("#template-quizOver").content.cloneNode(true);

    var showScore = template.querySelector(".show-score");
    template.querySelector("div").removeChild(showScore);

    //print title depending on cause
    var title;
    if (cause === "time") {
        title = document.createTextNode("You ran out of time!");
    } else {
        title = document.createTextNode("Wrong answer!");
    }

    template.querySelector("h1").appendChild(title);

    //delete the //, and cut the string at :, use the first part, then show it
    var showServer = this.server.slice(2).split(":")[0];
    template.querySelector(".server-info").appendChild(document.createTextNode("server: " + showServer));

    //if the highscore has entries add them to the template
    if (hs.highscore.length > 0) {
        var hsFrag = hs.createHighscoreFragment();
        template.querySelector("table").appendChild(hsFrag);
    }
    else {
        var label = document.createElement("label");
        label.appendChild(document.createTextNode("No highscore yet :("));
        template.querySelector("table").appendChild(label);
    }

    var globalHs = new GlobalHighscore(this.server, this.nickname);
    globalHs.sendToServer();

    //add the template to content
    document.querySelector("#content").appendChild(template);
};

/**
 * Function to handle the game completed-view and present it to the user
 */
Quiz.prototype.gameCompleted = function() {
    //create new highscore module to handle it
    var hs = new Highscore(this.server, this.nickname, this.totalTime.toFixed(3));
    var isNew = hs.addToList();

    var template = document.querySelector("#template-quizOver").content.cloneNode(true);

    //delete the //, and cut the string at :, use the first part, then show it
    var showServer = this.server.slice(2).split(":")[0];
    template.querySelector(".server-info").appendChild(document.createTextNode("server: " + showServer));

    //get the highscore if the highscore has entries
    if (hs.highscore.length > 0) {
        //get the fragment from highscore-module
        var hsFrag = hs.createHighscoreFragment();
        template.querySelector("table").appendChild(hsFrag);
    }

    if (isNew) {
        var title = document.createTextNode("New Highscore!");
        template.querySelector("h1").appendChild(title);
    }

    this.clearDiv(document.querySelector("#content"));

    var h1 = template.querySelector(".time");
    var text = document.createTextNode(this.totalTime.toFixed(3));
    h1.appendChild(text);
    document.querySelector("#content").appendChild(template);

    //add the global highscore
    var globalHs = new GlobalHighscore(this.server, this.nickname, this.totalTime.toFixed(3));
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
"use strict";

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

    //calculate percentage and add the color class
    var percentage = (showTime / this.time) * 100;
    if (percentage <= 50 && percentage > 25) {
        this.element.classList.add("timer-50");
    }
    else if (percentage <= 25) {
        this.element.classList.remove("timer-50");
        this.element.classList.add("timer-25");
    }

    if (diff >= this.time) {
        //time if up
        showTime = 0;
        clearInterval(this.interval);

        //call owner gameOver since time is out
        this.owner.gameOver("time");
    }

    //show the timer, use decimals if under 10 sec
    if (showTime <= 10) {
        this.print(showTime.toFixed(1));
    }
    else {
        this.print(showTime.toFixed(0));
    }
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
var serverURL = "//oskaremilsson.se:4001";

/**
 * Function to add event listener to the theme selector
 */
function addThemeSelector() {
    //element to change the start-info
    var descr = document.querySelector("#start-info");

    //add listener for the theme chooser
    var select = document.querySelector("#theme-selector");
    select.addEventListener("change", function() {
        var baseStyle = document.querySelector("#baseStyle");
        var loadingStyle = document.querySelector("#loadingStyle");

        //need to set globalStyle everytime since nostyle deletes that
        document.querySelector("#globalStyle").setAttribute("href", "stylesheet/globalStyle.css");

        localStorage.setItem("theme", select.value);

        //clean the description if needed
        if (descr.hasChildNodes()) {
            descr.removeChild(descr.firstChild);
        }

        //set the selected theme
        baseStyle.setAttribute("href", "stylesheet/" + select.value + ".css");
        loadingStyle.setAttribute("href", "stylesheet/" + select.value + "_loading.css");

        //add description
        if (select.value === "terminal") {
            descr.appendChild(document.createTextNode("Use keypad to choose when alternatives. OBS! Don't use mouseclick in this mode!"));
        }
        else if (select.value === "nostyle") {
            baseStyle.setAttribute("href", "");
            loadingStyle.setAttribute("href", "");

            //reset the href-tag on globalstyle to get true nostyle
            document.querySelector("#globalStyle").setAttribute("href", "");
        }

        //set nickname-input focus
        document.querySelector("input").focus();
    });
}

/**
 * Function to choose server from given name
 * @param name{string}, server-alias
 */
function pickServer(name) {
    if (name === "random") {
        serverURL = "//oskaremilsson.se:4000";
    }
    else if (name === "music") {
        serverURL = "//oskaremilsson.se:4001";
    }
    else if (name === "movie") {
        serverURL = "//oskaremilsson.se:4002";
    }
}

/**
 * Function to add event listener to the server selector
 */
function addServerSelector() {
    //add listener for the theme chooser
    var select = document.querySelector("#server-selector");
    select.addEventListener("change", function() {
        pickServer(select.value);

        localStorage.setItem("quiz", select.value);
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
            //start the quiz
            q = new Quiz(input, serverURL);
        }
    }
}

if (localStorage.getItem("theme")) {
    var theme = localStorage.getItem("theme");
    document.querySelector("#baseStyle").setAttribute("href", "stylesheet/" + theme + ".css");
    document.querySelector("#loadingStyle").setAttribute("href", "stylesheet/" + theme + "_loading.css");

    //set the theme as selected
    var themeSelector = document.querySelector("option[value='" + theme + "']");
    themeSelector.setAttribute("selected", "selected");

    if (theme === "nostyle") {
        //reset the href-tag on globalstyle to get true nostyle
        document.querySelector("#globalStyle").setAttribute("href", "");
    }
}

if (localStorage.getItem("quiz")) {
    var quiz = localStorage.getItem("quiz");
    pickServer(quiz);

    //set the quiz as selected
    var selector = document.querySelector("option[value='" + quiz + "']");
    selector.setAttribute("selected", "selected");
}

var button = document.querySelector("#submit");
var form = document.querySelector("#qForm");

//add listeners
button.addEventListener("click", submit, true);
form.addEventListener("keypress", submit, true);

//set nickname-input focus at start
document.querySelector("input").focus();

addThemeSelector();
addServerSelector();

},{"./Quiz":5}]},{},[7])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuNC4xL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQWpheC5qcyIsImNsaWVudC9zb3VyY2UvanMvR2xvYmFsSGlnaHNjb3JlLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9IaWdoc2NvcmUuanMiLCJjbGllbnQvc291cmNlL2pzL1F1ZXN0aW9uLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9RdWl6LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9UaW1lci5qcyIsImNsaWVudC9zb3VyY2UvanMvYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHJlcXVlc3RzIHZpYSBYTUxIdHRwUmVxdWVzdFxyXG4gKiBAcGFyYW0gY29uZmlne09iamVjdH0sIG9iamVjdCB3aXRoIG1ldGhvZCBhbmQgdXJsLCBwb3NzaWJseSBkYXRhXHJcbiAqIEBwYXJhbSBjYWxsYmFja3tGdW5jdGlvbn0sIHRoZSBmdW5jdGlvbiB0byBjYWxsIGF0IHJlc3BvbnNlXHJcbiAqL1xyXG5mdW5jdGlvbiByZXEoY29uZmlnLCBjYWxsYmFjaykge1xyXG4gICAgdmFyIHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuXHJcbiAgICAvL2FkZCBldmVudGxpc3RlbmVyIGZvciByZXNwb25zZVxyXG4gICAgci5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgaWYgKHIuc3RhdHVzID49IDQwMCkge1xyXG4gICAgICAgICAgICAvL2dvdCBlcnJvciwgY2FsbCB3aXRoIGVycm9yY29kZVxyXG4gICAgICAgICAgICBjYWxsYmFjayhyLnN0YXR1cyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL2NhbGwgdGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHdpdGggcmVzcG9uc2VUZXh0XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgci5yZXNwb25zZVRleHQpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy9vcGVuIGEgcmVxdWVzdCBmcm9tIHRoZSBjb25maWdcclxuICAgIHIub3Blbihjb25maWcubWV0aG9kLCBjb25maWcudXJsKTtcclxuXHJcbiAgICBpZiAoY29uZmlnLmRhdGEpIHtcclxuICAgICAgICAvL3NlbmQgdGhlIGRhdGEgYXMgSlNPTiB0byB0aGUgc2VydmVyXHJcbiAgICAgICAgci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcclxuICAgICAgICByLnNlbmQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLmRhdGEpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy9zZW5kIHJlcXVlc3RcclxuICAgICAgICByLnNlbmQobnVsbCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLnJlcSA9IHJlcTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKipcclxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTI0LlxyXG4gKiBUaGlzIHVzZXMgc29tZSBiYWNrLWVuZCBocHAtY29kZSBhbmQgbXlzcWwgaG9zdGVkIG9uIG15IHNlcnZlci5cclxuICogVGhlIGNvZGUgZm9yIHRoYXQgY2FuIGJlIHNlZW4gYnV0IHdvbnQgYmUgcHVzaGVkIHRvIGdpdGh1Yi5cclxuICovXHJcbnZhciBBamF4ID0gcmVxdWlyZShcIi4vQWpheFwiKTtcclxuXHJcbi8qKlxyXG4gKiBHbG9iYWxIaWdoc2NvcmUgY29uc3RydWN0b3JcclxuICogQHBhcmFtIHNlcnZlcntzdHJpbmd9LCBzZXJ2ZXIgdXNlZFxyXG4gKiBAcGFyYW0gbmlja25hbWV7c3RyaW5nfSwgdGhlIG5pY2tuYW1lXHJcbiAqIEBwYXJhbSBzY29yZXtzdHJpbmd9LCB0aGUgc2NvcmUodGltZSlcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBHbG9iYWxIaWdoc2NvcmUoc2VydmVyLCBuaWNrbmFtZSwgc2NvcmUpIHtcclxuICAgIHRoaXMubmlja25hbWUgPSBuaWNrbmFtZTtcclxuICAgIHRoaXMuc2NvcmUgPSBzY29yZTtcclxuICAgIHRoaXMuc2VydmVyID0gc2VydmVyO1xyXG4gICAgdGhpcy5kYXRlID0gbmV3IERhdGUoKTtcclxuICAgIHRoaXMuaGlnaHNjb3JlID0gW107XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZW5kIHRoZSByZXF1ZXN0IHRvIGFkZCB0aGUgc2NvcmUgdG8gdGhlIHNlcnZlclxyXG4gKi9cclxuR2xvYmFsSGlnaHNjb3JlLnByb3RvdHlwZS5zZW5kVG9TZXJ2ZXIgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBkYXRhID0ge3NlcnZlcjogdGhpcy5zZXJ2ZXIsIG5pY2tuYW1lOiB0aGlzLm5pY2tuYW1lLCBzY29yZTogdGhpcy5zY29yZSwgZGF0ZTogdGhpcy5kYXRlfTtcclxuICAgIHZhciBjb25maWcgPSB7XHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICB1cmw6IFwiLy9yb290Lm9za2FyZW1pbHNzb24uc2UvcXVpem1hc3RlcnovYWRkLnBocFwiLFxyXG4gICAgICAgIGRhdGE6IGRhdGFcclxuICAgIH07XHJcblxyXG4gICAgQWpheC5yZXEoY29uZmlnLCB0aGlzLnNlbmRSZXNwb25zZS5iaW5kKHRoaXMpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgcmVzcG9uc2UgZnJvbSBzZW5kaW5nIHNjb3JlIHRvIHNlcnZlclxyXG4gKi9cclxuR2xvYmFsSGlnaHNjb3JlLnByb3RvdHlwZS5zZW5kUmVzcG9uc2UgPSBmdW5jdGlvbihlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgIGlmIChyZXNwb25zZSkge1xyXG4gICAgICAgIHZhciBjb25maWcgPSB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgIHVybDogXCIvL3Jvb3Qub3NrYXJlbWlsc3Nvbi5zZS9xdWl6bWFzdGVyei9yZWFkLnBocFwiLFxyXG4gICAgICAgICAgICBkYXRhOiB7c2VydmVyOiB0aGlzLnNlcnZlcn1cclxuICAgICAgICB9O1xyXG4gICAgICAgIEFqYXgucmVxKGNvbmZpZywgdGhpcy5yZWFkUmVzcG9uc2UuYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gcmVhZCB0aGUgaGlnaHNjb3JlLWZpbGUgZnJvbSBzZXJ2ZXIgc3RvcmFnZVxyXG4gKi9cclxuR2xvYmFsSGlnaHNjb3JlLnByb3RvdHlwZS5yZWFkUmVzcG9uc2UgPSBmdW5jdGlvbihlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgIGlmIChyZXNwb25zZSkge1xyXG4gICAgICAgIC8vcGFyc2UgZmlsZSBpbnRvIEpTT05cclxuICAgICAgICB2YXIganNvbiA9IEpTT04ucGFyc2UocmVzcG9uc2UpO1xyXG5cclxuICAgICAgICAvL2ZpbGwgdGhlIGhpZ2hzY29yZS1hcnJheSB3aXRoIGVudHJpZXNcclxuICAgICAgICBmb3IgKHZhciBuaWNrbmFtZSBpbiBqc29uKSB7XHJcbiAgICAgICAgICAgIGlmIChqc29uLmhhc093blByb3BlcnR5KG5pY2tuYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5oaWdoc2NvcmUucHVzaChqc29uW25pY2tuYW1lXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucHJpbnQoKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBhcHBlbmQgdGhlIGdsb2JhbCBoaWdoc2NvcmUgdG8gdGhlIHRhYmxlXHJcbiAqL1xyXG5HbG9iYWxIaWdoc2NvcmUucHJvdG90eXBlLnByaW50ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAvL2dldCB0aGUgdGFibGVcclxuICAgIHZhciB0YWJsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZ2xvYmFsSHNcIik7XHJcblxyXG4gICAgLy9pZiB0aGUgZ2xvYmFsIGhpZ2hzY29yZSBoYXMgZW50cmllcyBhZGQgdGhlbSB0byB0aGUgdGVtcGxhdGVcclxuICAgIGlmICh0aGlzLmhpZ2hzY29yZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgdmFyIGdsb2JhbEhzRnJhZyA9IHRoaXMuY3JlYXRlSGlnaHNjb3JlRnJhZ21lbnQoKTtcclxuICAgICAgICB0YWJsZS5hcHBlbmRDaGlsZChnbG9iYWxIc0ZyYWcpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGdldCB0aGUgaGlnaHNjb3JlZnJhZ21lbnQgY29udGFpbmluZyB0aGUgaGlnaHNjb3JlLXBhcnQgb2YgdGFibGVcclxuICogQHJldHVybnMge0RvY3VtZW50RnJhZ21lbnR9XHJcbiAqL1xyXG5HbG9iYWxIaWdoc2NvcmUucHJvdG90eXBlLmNyZWF0ZUhpZ2hzY29yZUZyYWdtZW50ID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuICAgIHZhciB0ZW1wbGF0ZTtcclxuICAgIHZhciBoc05pY2tuYW1lO1xyXG4gICAgdmFyIGhzU2NvcmU7XHJcbiAgICB2YXIgaHNEYXRlO1xyXG4gICAgdmFyIHRlbXBEYXRlO1xyXG4gICAgdmFyIHRlbXBIcztcclxuXHJcbiAgICAvL29wdGlvbnMgZm9yIHRoZSBkYXRlLWZvcm1hdCBpbiB0aGUgIHRhYmxlXHJcbiAgICB2YXIgZGF0ZU9wdGlvbnMgPSB7XHJcbiAgICAgICAgeWVhcjogXCJudW1lcmljXCIsIG1vbnRoOiBcIm51bWVyaWNcIixcclxuICAgICAgICBkYXk6IFwibnVtZXJpY1wiLCBob3VyOiBcIjItZGlnaXRcIiwgbWludXRlOiBcIjItZGlnaXRcIlxyXG4gICAgfTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaGlnaHNjb3JlLmxlbmd0aDsgaSArPSAxKSB7XHJcbiAgICAgICAgdGVtcEhzID0gdGhpcy5oaWdoc2NvcmVbaV07XHJcblxyXG4gICAgICAgIC8vZ2V0IHRoZSB0ZW1wbGF0ZSBmb3IgYSB0YWJsZS1yb3dcclxuICAgICAgICB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtaGlnaHNjb3JlUm93XCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xyXG4gICAgICAgIGhzTmlja25hbWUgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLW5pY2tuYW1lXCIpO1xyXG4gICAgICAgIGhzU2NvcmUgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLXNjb3JlXCIpO1xyXG4gICAgICAgIGhzRGF0ZSA9IHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuaHMtZGF0ZVwiKTtcclxuXHJcbiAgICAgICAgLy9hcHBlbmQgdGhlIG5pY2tuYW1lIGFuZCBzY29yZSB0byB0aGUgcm93XHJcbiAgICAgICAgaHNOaWNrbmFtZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0ZW1wSHMubmlja25hbWUpKTtcclxuICAgICAgICBoc1Njb3JlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHBhcnNlRmxvYXQodGVtcEhzLnNjb3JlKS50b0ZpeGVkKDMpKSk7XHJcblxyXG4gICAgICAgIC8vY29udmVydCB0aGUgdGltZXN0YW1wIGJhY2sgdG8gZGF0ZS1vYmplY3RcclxuICAgICAgICB0ZW1wRGF0ZSA9IG5ldyBEYXRlKHRlbXBIcy5kYXRlKTtcclxuICAgICAgICBoc0RhdGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGVtcERhdGUudG9Mb2NhbGVUaW1lU3RyaW5nKFwic3Ytc2VcIiwgZGF0ZU9wdGlvbnMpKSk7XHJcblxyXG4gICAgICAgIC8vaWYgdGhlIGdsb2JhbCBoaWdoc2NvcmUgaXMgaWRlbnRpY2FsIHdpdGggdGhpcyBvbmUgYWRkIHRoZSBoaWdobGlnaHQgY2xhc3NcclxuICAgICAgICBpZiAodGhpcy5kYXRlLnZhbHVlT2YoKSA9PT0gdGVtcERhdGUudmFsdWVPZigpICYmIHRoaXMubmlja25hbWUgPT09IHRlbXBIcy5uaWNrbmFtZSkge1xyXG4gICAgICAgICAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwidHJcIikuY2xhc3NMaXN0LmFkZChcImhpZ2hsaWdodFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vYXBwZW5kIHJvdyB0byBmcmFnbWVudFxyXG4gICAgICAgIGZyYWcuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmcmFnO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBHbG9iYWxIaWdoc2NvcmU7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuLyoqXHJcbiAqIEhpZ2hzY29yZSBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0gc2VydmVye3N0cmluZ30sIHRoZSBzZXJ2ZXIgbmFtZVxyXG4gKiBAcGFyYW0gbmlja25hbWV7c3RyaW5nfSwgdGhlIG5pY2tuYW1lXHJcbiAqIEBwYXJhbSBzY29yZXtzdHJpbmd9LCB0aGUgc2NvcmUodGltZSlcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBIaWdoc2NvcmUoc2VydmVyLCBuaWNrbmFtZSwgc2NvcmUpIHtcclxuICAgIHRoaXMubmlja25hbWUgPSBuaWNrbmFtZTtcclxuICAgIHRoaXMuc2NvcmUgPSBzY29yZTtcclxuICAgIHRoaXMuc2VydmVyID0gc2VydmVyO1xyXG4gICAgdGhpcy5kYXRlID0gbmV3IERhdGUoKTtcclxuICAgIHRoaXMuaGlnaHNjb3JlID0gW107XHJcblxyXG4gICAgLy9jYWxsIHRvIHJlYWQgaGlnaHNjb3JlIGZpbGUgZnJvbSBsb2NhbCBzdG9yYWdlXHJcbiAgICB0aGlzLnJlYWRGcm9tRmlsZSgpO1xyXG59XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gcmVhZCB0aGUgaGlnaHNjb3JlLWZpbGUgZnJvbSBsb2NhbCBzdG9yYWdlXHJcbiAqL1xyXG5IaWdoc2NvcmUucHJvdG90eXBlLnJlYWRGcm9tRmlsZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIGhzRmlsZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiaHMtXCIgKyB0aGlzLnNlcnZlcik7XHJcbiAgICBpZiAoaHNGaWxlKSB7XHJcbiAgICAgICAgLy9wYXJzZSBmaWxlIGludG8gSlNPTlxyXG4gICAgICAgIHZhciBqc29uID0gSlNPTi5wYXJzZShoc0ZpbGUpO1xyXG5cclxuICAgICAgICAvL2ZpbGwgdGhlIGhpZ2hzY29yZS1hcnJheSB3aXRoIGVudHJpZXNcclxuICAgICAgICBmb3IgKHZhciBuaWNrbmFtZSBpbiBqc29uKSB7XHJcbiAgICAgICAgICAgIGlmIChqc29uLmhhc093blByb3BlcnR5KG5pY2tuYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5oaWdoc2NvcmUucHVzaChqc29uW25pY2tuYW1lXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gY2hlY2sgaWYgdGhlIHNjb3JlIHRha2VzIGEgcGxhY2UgaW50byB0aGUgaGlnaHNjb3JlXHJcbiAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gKi9cclxuSGlnaHNjb3JlLnByb3RvdHlwZS5pc0hpZ2hzY29yZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIGlzSGlnaHNjb3JlID0gZmFsc2U7XHJcbiAgICBpZiAodGhpcy5oaWdoc2NvcmUubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgLy9oaWdoc2NvcmUgaXMgZW1wdHksIHRoZXJlZm9yZSBuZXcgaGlnaHNjb3JlXHJcbiAgICAgICAgaXNIaWdoc2NvcmUgPSB0cnVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvL2dldCB0aGUgc2NvcmUgbGFzdCBpbiB0aGUgbGlzdFxyXG4gICAgICAgIHZhciBsYXN0U2NvcmUgPSB0aGlzLmhpZ2hzY29yZVt0aGlzLmhpZ2hzY29yZS5sZW5ndGggLSAxXS5zY29yZTtcclxuXHJcbiAgICAgICAgLy9jaGVjayBpZiBoaWdoc2NvcmVcclxuICAgICAgICBpZiAocGFyc2VGbG9hdCh0aGlzLnNjb3JlKSA8IHBhcnNlRmxvYXQobGFzdFNjb3JlKSB8fCB0aGlzLmhpZ2hzY29yZS5sZW5ndGggPCA1KSB7XHJcbiAgICAgICAgICAgIGlzSGlnaHNjb3JlID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGlzSGlnaHNjb3JlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGFkZCB0aGUgc2NvcmUgaW50byB0aGUgbGlzdFxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0sIGFkZGVkIG9yIG5vdFxyXG4gKi9cclxuSGlnaHNjb3JlLnByb3RvdHlwZS5hZGRUb0xpc3QgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBhZGRlZCA9IGZhbHNlO1xyXG5cclxuICAgIC8vY2FsbCB0aGUgaXNIaWdoc2NvcmUgdG8gY2hlY2sgaWYgc2NvcmUgc2hvdWxkIGJlIGFkZGVkXHJcbiAgICBpZiAodGhpcy5pc0hpZ2hzY29yZSgpKSB7XHJcbiAgICAgICAgLy9zYXZlIHRoZSBuaWNrbmFtZSwgc2NvcmUgYW5kIGRhdGVzdGFtcCBpbnRvIGFuIG9iamVjdFxyXG4gICAgICAgIHZhciB0aGlzU2NvcmUgPSB7XHJcbiAgICAgICAgICAgIG5pY2tuYW1lOiB0aGlzLm5pY2tuYW1lLFxyXG4gICAgICAgICAgICBzY29yZTogdGhpcy5zY29yZSxcclxuICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy9kZWxldGUgdGhlIGxhc3QgcG9zaXRpb24gb2YgdGhlIGhpZ2hzY29yZSBhcnJheVxyXG4gICAgICAgIGlmICh0aGlzLmhpZ2hzY29yZS5sZW5ndGggPT09IDUpIHtcclxuICAgICAgICAgICAgLy9yZW1vdmUgdGhlIG9uZSBsYXN0XHJcbiAgICAgICAgICAgIHRoaXMuaGlnaHNjb3JlLnNwbGljZSgtMSwgMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3B1c2ggdGhlIG5ldyBhbmQgc29ydCB0aGUgYXJyYXlcclxuICAgICAgICB0aGlzLmhpZ2hzY29yZS5wdXNoKHRoaXNTY29yZSk7XHJcbiAgICAgICAgdGhpcy5oaWdoc2NvcmUgPSB0aGlzLmhpZ2hzY29yZS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtyZXR1cm4gYS5zY29yZSAtIGIuc2NvcmU7fSk7XHJcblxyXG4gICAgICAgIC8vY2FsbCB0byBzYXZlIGl0XHJcbiAgICAgICAgdGhpcy5zYXZlVG9GaWxlKCk7XHJcblxyXG4gICAgICAgIGFkZGVkID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYWRkZWQ7XHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gc2F2ZSB0aGUgaGlnaHNjb3JlIHRvIGxvY2FsIHN0b3JhZ2VcclxuICovXHJcbkhpZ2hzY29yZS5wcm90b3R5cGUuc2F2ZVRvRmlsZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJocy1cIiArIHRoaXMuc2VydmVyLCBKU09OLnN0cmluZ2lmeSh0aGlzLmhpZ2hzY29yZSkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGdldCB0aGUgaGlnaHNjb3JlZnJhZ21lbnQgY29udGFpbmluZyB0aGUgaGlnaHNjb3JlLXBhcnQgb2YgdGFibGVcclxuICogQHJldHVybnMge0RvY3VtZW50RnJhZ21lbnR9XHJcbiAqL1xyXG5IaWdoc2NvcmUucHJvdG90eXBlLmNyZWF0ZUhpZ2hzY29yZUZyYWdtZW50ID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuICAgIHZhciB0ZW1wbGF0ZTtcclxuICAgIHZhciBoc05pY2tuYW1lO1xyXG4gICAgdmFyIGhzU2NvcmU7XHJcbiAgICB2YXIgaHNEYXRlO1xyXG4gICAgdmFyIHRlbXBEYXRlO1xyXG5cclxuICAgIC8vb3B0aW9ucyBmb3IgdGhlIGRhdGUtZm9ybWF0IGluIHRoZSAgdGFibGVcclxuICAgIHZhciBkYXRlT3B0aW9ucyA9IHtcclxuICAgICAgICB5ZWFyOiBcIm51bWVyaWNcIiwgbW9udGg6IFwibnVtZXJpY1wiLFxyXG4gICAgICAgIGRheTogXCJudW1lcmljXCIsIGhvdXI6IFwiMi1kaWdpdFwiLCBtaW51dGU6IFwiMi1kaWdpdFwiXHJcbiAgICB9O1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5oaWdoc2NvcmUubGVuZ3RoOyBpICs9IDEpIHtcclxuICAgICAgICAvL2dldCB0aGUgdGVtcGxhdGUgZm9yIGEgdGFibGUtcm93XHJcbiAgICAgICAgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLWhpZ2hzY29yZVJvd1wiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcclxuICAgICAgICBoc05pY2tuYW1lID0gdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5ocy1uaWNrbmFtZVwiKTtcclxuICAgICAgICBoc1Njb3JlID0gdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5ocy1zY29yZVwiKTtcclxuICAgICAgICBoc0RhdGUgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLWRhdGVcIik7XHJcblxyXG4gICAgICAgIC8vYXBwZW5kIHRoZSBuaWNrbmFtZSBhbmQgc2NvcmUgdG8gdGhlIHJvd1xyXG4gICAgICAgIGhzTmlja25hbWUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5oaWdoc2NvcmVbaV0ubmlja25hbWUpKTtcclxuICAgICAgICBoc1Njb3JlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMuaGlnaHNjb3JlW2ldLnNjb3JlKSk7XHJcblxyXG4gICAgICAgIHRlbXBEYXRlID0gbmV3IERhdGUodGhpcy5oaWdoc2NvcmVbaV0uZGF0ZSk7XHJcbiAgICAgICAgaHNEYXRlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRlbXBEYXRlLnRvTG9jYWxlVGltZVN0cmluZyhcInN2LXNlXCIsIGRhdGVPcHRpb25zKSkpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5kYXRlLnZhbHVlT2YoKSA9PT0gdGVtcERhdGUudmFsdWVPZigpKSB7XHJcbiAgICAgICAgICAgIC8vaGlnaGxpZ2h0IHRoZSBuZXcgaGlnaHNjb3JlIGluIHRoZSBsaXN0XHJcbiAgICAgICAgICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCJ0clwiKS5jbGFzc0xpc3QuYWRkKFwiaGlnaGxpZ2h0XCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9hcHBlbmQgcm93IHRvIGZyYWdtZW50XHJcbiAgICAgICAgZnJhZy5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZyYWc7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEhpZ2hzY29yZTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKipcclxuICogUXVlc3Rpb24gY29uc3RydWN0b3JcclxuICogQHBhcmFtIG9iantPYmplY3R9LCBvYmplY3QgdGhhdCBob2xkcyBhIHF1ZXN0aW9uXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gUXVlc3Rpb24ob2JqKSB7XHJcbiAgICB0aGlzLmlkID0gb2JqLmlkO1xyXG4gICAgdGhpcy5xdWVzdGlvbiA9IG9iai5xdWVzdGlvbjtcclxuICAgIHRoaXMuYWx0ID0gb2JqLmFsdGVybmF0aXZlcztcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIHByZXNlbnQgdGhlIHF1ZXN0aW9uXHJcbiAqL1xyXG5RdWVzdGlvbi5wcm90b3R5cGUucHJpbnQgPSBmdW5jdGlvbigpIHtcclxuICAgIC8vc3RhdGVtZW50IHRvIGNhbGwgdGhlIHJpZ2h0ZnVsIHByaW50ZnVuY3Rpb25cclxuICAgIGlmICh0aGlzLmFsdCkge1xyXG4gICAgICAgIHRoaXMucHJpbnRBbHRRdWVzdGlvbigpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdGhpcy5wcmludFF1ZXN0aW9uKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImlucHV0XCIpLmZvY3VzKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gY2xlYXIgYSBkaXZcclxuICogQHBhcmFtIGRpdntvYmplY3R9LCB0aGUgZGl2IHRvIGNsZWFyXHJcbiAqL1xyXG5RdWVzdGlvbi5wcm90b3R5cGUuY2xlYXJEaXYgPSBmdW5jdGlvbihkaXYpIHtcclxuICAgIHdoaWxlIChkaXYuaGFzQ2hpbGROb2RlcygpKSB7XHJcbiAgICAgICAgZGl2LnJlbW92ZUNoaWxkKGRpdi5sYXN0Q2hpbGQpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIHByZXNlbnQgdGhlIHF1ZXN0aW9uIHRoYXQgaGFzIGFsdGVybmF0aXZlc1xyXG4gKi9cclxuUXVlc3Rpb24ucHJvdG90eXBlLnByaW50QWx0UXVlc3Rpb24gPSBmdW5jdGlvbigpIHtcclxuICAgIC8vZ2V0IHRoZSB0ZW1wbGF0ZSBhbmQgYXBwZW5kIHRoZSBhbHRlcm5hdGl2ZXNcclxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtcXVlc3Rpb24tYWx0XCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xyXG4gICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5xSGVhZFwiKS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLnF1ZXN0aW9uKSk7XHJcblxyXG4gICAgLy9jYWxsIHRoZSBmdW5jdGlvbiB0aGF0IGhhbmRsZXMgdGhlIGFsdGVybmF0aXZlc1xyXG4gICAgdmFyIGlucHV0RnJhZyA9IHRoaXMuZ2V0QWx0RnJhZygpO1xyXG4gICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIiNxRm9ybVwiKS5pbnNlcnRCZWZvcmUoaW5wdXRGcmFnLCB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiI3N1Ym1pdFwiKSk7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSB0aGUgYWx0ZXJuYXRpdmVzXHJcbiAqIEByZXR1cm5zIHtEb2N1bWVudEZyYWdtZW50fSwgdGhlIGZyYWdtZW50IGZvciB0aGUgYWx0ZXJuYXRpdmVzXHJcbiAqL1xyXG5RdWVzdGlvbi5wcm90b3R5cGUuZ2V0QWx0RnJhZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIGlucHV0RnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuICAgIHZhciBpbnB1dDtcclxuICAgIHZhciBsYWJlbDtcclxuICAgIHZhciBmaXJzdCA9IHRydWU7XHJcblxyXG4gICAgZm9yICh2YXIgYWx0IGluIHRoaXMuYWx0KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuYWx0Lmhhc093blByb3BlcnR5KGFsdCkpIHtcclxuICAgICAgICAgICAgLy9nZXQgdGhlIHRlbXBsYXRlIGZvciBhbHRlcm5hdGl2ZXNcclxuICAgICAgICAgICAgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLWFsdGVybmF0aXZlXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xyXG5cclxuICAgICAgICAgICAgLy9hcHBlbmQgdGhlIGFsdGVybmF0aXZlXHJcbiAgICAgICAgICAgIGlmIChmaXJzdCkge1xyXG4gICAgICAgICAgICAgICAgaW5wdXQucXVlcnlTZWxlY3RvcihcImlucHV0XCIpLnNldEF0dHJpYnV0ZShcImNoZWNrZWRcIiwgXCJjaGVja2VkXCIpO1xyXG4gICAgICAgICAgICAgICAgZmlyc3QgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaW5wdXQucXVlcnlTZWxlY3RvcihcImlucHV0XCIpLnNldEF0dHJpYnV0ZShcInZhbHVlXCIsIGFsdCk7XHJcbiAgICAgICAgICAgIGxhYmVsID0gaW5wdXQucXVlcnlTZWxlY3RvcihcImxhYmVsXCIpO1xyXG4gICAgICAgICAgICBsYWJlbC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLmFsdFthbHRdKSk7XHJcblxyXG4gICAgICAgICAgICBpbnB1dEZyYWcuYXBwZW5kQ2hpbGQoaW5wdXQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGlucHV0RnJhZztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBwcmVzZW50IGEgcXVlc3Rpb24gd2l0aCB0ZXh0LWlucHV0XHJcbiAqL1xyXG5RdWVzdGlvbi5wcm90b3R5cGUucHJpbnRRdWVzdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLy9nZXQgdGhlIHRlbXBsYXRlIGFuZCBhcHBlbmQgdGhlIHF1ZXN0aW9uXHJcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLXF1ZXN0aW9uXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xyXG4gICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5xSGVhZFwiKS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLnF1ZXN0aW9uKSk7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgUXVlc3Rpb24gPSByZXF1aXJlKFwiLi9RdWVzdGlvblwiKTtcclxudmFyIEFqYXggPSByZXF1aXJlKFwiLi9BamF4XCIpO1xyXG52YXIgVGltZXIgPSByZXF1aXJlKFwiLi9UaW1lclwiKTtcclxudmFyIEhpZ2hzY29yZSA9IHJlcXVpcmUoXCIuL0hpZ2hzY29yZVwiKTtcclxudmFyIEdsb2JhbEhpZ2hzY29yZSA9IHJlcXVpcmUoXCIuL0dsb2JhbEhpZ2hzY29yZVwiKTtcclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgdGhlIFF1aXpcclxuICogQHBhcmFtIG5pY2tuYW1le3N0cmluZ30sIG5pY2tuYW1lIHRvIHVzZSBmb3IgaGlnaHNjb3JlXHJcbiAqIEBwYXJhbSBzZXJ2ZXJ7c3RyaW5nfSwgdXJsIHRvIHNlcnZlciB0byB1c2VcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBRdWl6KG5pY2tuYW1lLCBzZXJ2ZXIpIHtcclxuICAgIHRoaXMubmlja25hbWUgPSBuaWNrbmFtZTtcclxuICAgIHRoaXMudGltZXIgPSB1bmRlZmluZWQ7XHJcbiAgICB0aGlzLnF1ZXN0aW9uID0gdW5kZWZpbmVkO1xyXG4gICAgdGhpcy5uZXh0VVJMID0gc2VydmVyICsgXCIvcXVlc3Rpb24vMVwiIHx8IFwiaHR0cDovL3Zob3N0My5sbnUuc2U6MjAwODAvcXVlc3Rpb24vMVwiO1xyXG4gICAgdGhpcy5zZXJ2ZXIgPSBzZXJ2ZXI7XHJcbiAgICB0aGlzLmJ1dHRvbiA9IHVuZGVmaW5lZDtcclxuICAgIHRoaXMuZm9ybSA9IHVuZGVmaW5lZDtcclxuICAgIHRoaXMudG90YWxUaW1lID0gMDtcclxuXHJcbiAgICAvL3JlcXVlc3QgdGhlIGZpcnN0IHF1ZXN0aW9uXHJcbiAgICB0aGlzLmdldFF1ZXN0aW9uKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBzZW5kIGEgcmVxdWVzdCBmb3IgYSBuZXcgcXVlc3Rpb25cclxuICovXHJcblF1aXoucHJvdG90eXBlLmdldFF1ZXN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICAvL2RvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjd3JhcHBlclwiKS5jbGFzc0xpc3QucmVtb3ZlKFwiYW5pbWF0ZS1yaWdodFwiKTtcclxuICAgIC8vZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN3cmFwcGVyXCIpLmNsYXNzTGlzdC5hZGQoXCJhbmltYXRlLWxlZnRcIik7XHJcblxyXG4gICAgdmFyIGNvbmZpZyA9IHttZXRob2Q6IFwiR0VUXCIsIHVybDogdGhpcy5uZXh0VVJMfTtcclxuICAgIHZhciByZXNwb25zZUZ1bmN0aW9uID0gdGhpcy5yZXNwb25zZS5iaW5kKHRoaXMpO1xyXG5cclxuICAgIEFqYXgucmVxKGNvbmZpZywgcmVzcG9uc2VGdW5jdGlvbik7XHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHRoZSByZXNwb25zZSwgdXNlcyBhcyBhcmd1bWVudCBcImNhbGxiYWNrXCIgaW4gYSByZXF1ZXN0XHJcbiAqIEBwYXJhbSBlcnJvcntOdW1iZXJ9LCBlcnJvciBjb2RlLCBudWxsIGlmIG5vIGVycm9yXHJcbiAqIEBwYXJhbSByZXNwb25zZXtzdHJpbmd9LCByZXNwb25zZSBzdHJpbmcgdG8gcGFyc2UgSlNPTiBmcm9tXHJcbiAqL1xyXG5RdWl6LnByb3RvdHlwZS5yZXNwb25zZSA9IGZ1bmN0aW9uKGVycm9yLCByZXNwb25zZSkge1xyXG4gICAgLy9oYW5kbGUgZXJyb3JzICg0MDQgbWVhbnMgbm8gbW9yZSBxdWVzdGlvbnMpXHJcbiAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICAvL3ByZXNlbnQgdGhlIGdhbWVvdmVyLXZpZXcgdG8gdXNlclxyXG4gICAgICAgIHRoaXMuZ2FtZU92ZXIoKTtcclxuICAgIH1cclxuXHJcbiAgICAvL2hhbmRsZSB0aGUgcmVzcG9uc2Ugc3RyaW5nXHJcbiAgICBpZiAocmVzcG9uc2UpIHtcclxuICAgICAgICAvL3Bhc3JlIHRvIEpTT05cclxuICAgICAgICB2YXIgb2JqID0gSlNPTi5wYXJzZShyZXNwb25zZSk7XHJcbiAgICAgICAgdGhpcy5uZXh0VVJMID0gb2JqLm5leHRVUkw7XHJcblxyXG4gICAgICAgIC8vc3RhdGVtZW50IHRvIGNhbGwgdGhlIHJpZ2h0ZnVsIGZ1bmN0aW9uIG9uIHRoZSByZXNwb25zZVxyXG4gICAgICAgIGlmIChvYmoucXVlc3Rpb24pIHtcclxuICAgICAgICAgICAgdGhpcy5yZXNwb25zZVF1ZXN0aW9uKG9iaik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5uZXh0VVJMIHx8IG9iai5tZXNzYWdlID09PSBcIkNvcnJlY3QgYW5zd2VyIVwiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlQW5zd2VyKG9iaik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSBpZiByZXNwb25zZSBpcyBhIHF1ZXN0aW9uXHJcbiAqIEBwYXJhbSBvYmp7T2JqZWN0fSwgb2JqZWN0IHRoYXQgaG9sZHMgdGhlIHF1ZXN0aW9uXHJcbiAqL1xyXG5RdWl6LnByb3RvdHlwZS5yZXNwb25zZVF1ZXN0aW9uID0gZnVuY3Rpb24ob2JqKSB7XHJcbiAgICB2YXIgY29udGVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKTtcclxuICAgIHRoaXMuY2xlYXJEaXYoY29udGVudCk7XHJcblxyXG4gICAgLy9jcmVhdGUgYSBuZXcgcXVlc3Rpb24gZnJvbSBvYmplY3RcclxuICAgIHRoaXMucXVlc3Rpb24gPSBuZXcgUXVlc3Rpb24ob2JqKTtcclxuICAgIHRoaXMucXVlc3Rpb24ucHJpbnQoKTtcclxuXHJcbiAgICAvL2NyZWF0ZSBhIG5ldyB0aW1lciBmb3IgcXVlc3Rpb25cclxuICAgIHRoaXMudGltZXIgPSBuZXcgVGltZXIodGhpcywgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0aW1lciBoMVwiKSwgMjApO1xyXG4gICAgdGhpcy50aW1lci5zdGFydCgpO1xyXG5cclxuICAgIC8vQWRkIGxpbnN0ZW5lcnMgZm9yIHRoZSBmb3JtXHJcbiAgICB0aGlzLmFkZExpc3RlbmVyKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gaGFuZGxlIGlmIHJlc3BvbnNlIGlzIGFuIGFuc3dlclxyXG4gKiBAcGFyYW0gb2Jqe09iamVjdH0sIG9iamVjdCB0aGF0IGhvbGRzIHRoZSBhbnN3ZXJcclxuICovXHJcblF1aXoucHJvdG90eXBlLnJlc3BvbnNlQW5zd2VyID0gZnVuY3Rpb24ob2JqKSB7XHJcbiAgICB2YXIgY29udGVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKTtcclxuICAgIHRoaXMuY2xlYXJEaXYoY29udGVudCk7XHJcblxyXG4gICAgLy9IYW5kbGUgdGhlIHRlbXBsYXRlIGZvciBhbnN3ZXJcclxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtYW5zd2VyXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xyXG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShvYmoubWVzc2FnZSk7XHJcbiAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwicFwiKS5hcHBlbmRDaGlsZCh0ZXh0KTtcclxuXHJcbiAgICBjb250ZW50LmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcclxuXHJcbiAgICBpZiAodGhpcy5uZXh0VVJMKSB7XHJcbiAgICAgICAgLy9SZXF1ZXN0IGEgbmV3IHF1ZXN0aW9uLCBidXQgd2l0aCBhIGRlbGF5XHJcbiAgICAgICAgdmFyIG5ld1F1ZXN0aW9uID0gdGhpcy5nZXRRdWVzdGlvbi5iaW5kKHRoaXMpO1xyXG4gICAgICAgIHNldFRpbWVvdXQobmV3UXVlc3Rpb24sIDEwMDApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdGhpcy5nYW1lQ29tcGxldGVkKCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gYWRkIHRoZSBsaXN0ZW5lciBmb3Igc3VibWl0XHJcbiAqL1xyXG5RdWl6LnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5idXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3N1Ym1pdFwiKTtcclxuICAgIHRoaXMuZm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcUZvcm1cIik7XHJcblxyXG4gICAgdGhpcy5idXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc3VibWl0LmJpbmQodGhpcyksIHRydWUpO1xyXG4gICAgdGhpcy5mb3JtLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlwcmVzc1wiLCB0aGlzLnN1Ym1pdC5iaW5kKHRoaXMpLCB0cnVlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgd2hlbiBzdWJtaXQgaXMgdHJpZ2dlcmVkXHJcbiAqL1xyXG5RdWl6LnByb3RvdHlwZS5zdWJtaXQgPSBmdW5jdGlvbihldmVudCkge1xyXG4gICAgLy9JZiB0aGUgdHJpZ2dlciBpcyBlbnRlciBvciBjbGljayBkbyB0aGUgc3VibWl0XHJcbiAgICBpZiAoZXZlbnQud2hpY2ggPT09IDEzIHx8IGV2ZW50LmtleUNvZGUgPT09IDEzIHx8IGV2ZW50LnR5cGUgPT09IFwiY2xpY2tcIikge1xyXG4gICAgICAgIC8vcHJldmVudCB0aGUgZm9ybSB0byByZWxvYWQgcGFnZSBvbiBlbnRlclxyXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgIHRoaXMudG90YWxUaW1lICs9IHRoaXMudGltZXIuc3RvcCgpO1xyXG4gICAgICAgIHZhciBpbnB1dDtcclxuXHJcbiAgICAgICAgLy9yZW1vdmUgdGhlIGxpc3RlbmVycyB0byBwcmV2ZW50IGRvdWJsZS1zdWJtaXRcclxuICAgICAgICB0aGlzLmJ1dHRvbi5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zdWJtaXQuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy5mb3JtLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlwcmVzc1wiLCB0aGlzLnN1Ym1pdC5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgLy9zYXZlIGlucHV0IGRlcGVuZGluZyBvbiB0aGUgdHlwZSBvZiBxdWVzdGlvblxyXG4gICAgICAgIGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2Fuc3dlclwiKSkge1xyXG4gICAgICAgICAgICAvL2dldCB0aGUgZm9ybSBpbnB1dFxyXG4gICAgICAgICAgICBpbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYW5zd2VyXCIpLnZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy9nZXQgdGhlIGNoZWNrZWQgcmVhZGlvYnV0dG9uXHJcbiAgICAgICAgICAgIGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImlucHV0W25hbWU9J2FsdGVybmF0aXZlJ106Y2hlY2tlZFwiKS52YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vc2V0IHRoZSBjb25maWcgdG8gYmUgc2VudCB0byBzZXJ2ZXIgYW5kIHNlbmQgYSByZXF1ZXN0XHJcbiAgICAgICAgdmFyIGNvbmZpZyA9IHtcclxuICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgdXJsOiB0aGlzLm5leHRVUkwsXHJcbiAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgIGFuc3dlcjogaW5wdXRcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFyIHJlc3BvbnNlRnVuY3Rpb24gPSB0aGlzLnJlc3BvbnNlLmJpbmQodGhpcyk7XHJcbiAgICAgICAgQWpheC5yZXEoY29uZmlnLCByZXNwb25zZUZ1bmN0aW9uKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgdGhlIGdhbWVPdmVyLXZpZXcgYW5kIHByZXNlbnQgaXQgdG8gdXNlclxyXG4gKi9cclxuUXVpei5wcm90b3R5cGUuZ2FtZU92ZXIgPSBmdW5jdGlvbihjYXVzZSkge1xyXG4gICAgLy9jcmVhdGUgYSBoaWdoc2NvcmUgbW9kdWxlIHRvIHNob3cgaXQgdG8gdGhlIHVzZXJcclxuICAgIHZhciBocyA9IG5ldyBIaWdoc2NvcmUodGhpcy5zZXJ2ZXIsIHRoaXMubmlja25hbWUpO1xyXG4gICAgdGhpcy5jbGVhckRpdihkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikpO1xyXG5cclxuICAgIC8vZ2V0IHRoZSBnYW1lIG92ZXIgdGVtcGxhdGVcclxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtcXVpek92ZXJcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XHJcblxyXG4gICAgdmFyIHNob3dTY29yZSA9IHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuc2hvdy1zY29yZVwiKTtcclxuICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCJkaXZcIikucmVtb3ZlQ2hpbGQoc2hvd1Njb3JlKTtcclxuXHJcbiAgICAvL3ByaW50IHRpdGxlIGRlcGVuZGluZyBvbiBjYXVzZVxyXG4gICAgdmFyIHRpdGxlO1xyXG4gICAgaWYgKGNhdXNlID09PSBcInRpbWVcIikge1xyXG4gICAgICAgIHRpdGxlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJZb3UgcmFuIG91dCBvZiB0aW1lIVwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIldyb25nIGFuc3dlciFcIik7XHJcbiAgICB9XHJcblxyXG4gICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcImgxXCIpLmFwcGVuZENoaWxkKHRpdGxlKTtcclxuXHJcbiAgICAvL2RlbGV0ZSB0aGUgLy8sIGFuZCBjdXQgdGhlIHN0cmluZyBhdCA6LCB1c2UgdGhlIGZpcnN0IHBhcnQsIHRoZW4gc2hvdyBpdFxyXG4gICAgdmFyIHNob3dTZXJ2ZXIgPSB0aGlzLnNlcnZlci5zbGljZSgyKS5zcGxpdChcIjpcIilbMF07XHJcbiAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLnNlcnZlci1pbmZvXCIpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwic2VydmVyOiBcIiArIHNob3dTZXJ2ZXIpKTtcclxuXHJcbiAgICAvL2lmIHRoZSBoaWdoc2NvcmUgaGFzIGVudHJpZXMgYWRkIHRoZW0gdG8gdGhlIHRlbXBsYXRlXHJcbiAgICBpZiAoaHMuaGlnaHNjb3JlLmxlbmd0aCA+IDApIHtcclxuICAgICAgICB2YXIgaHNGcmFnID0gaHMuY3JlYXRlSGlnaHNjb3JlRnJhZ21lbnQoKTtcclxuICAgICAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwidGFibGVcIikuYXBwZW5kQ2hpbGQoaHNGcmFnKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHZhciBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsYWJlbFwiKTtcclxuICAgICAgICBsYWJlbC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIk5vIGhpZ2hzY29yZSB5ZXQgOihcIikpO1xyXG4gICAgICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCJ0YWJsZVwiKS5hcHBlbmRDaGlsZChsYWJlbCk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGdsb2JhbEhzID0gbmV3IEdsb2JhbEhpZ2hzY29yZSh0aGlzLnNlcnZlciwgdGhpcy5uaWNrbmFtZSk7XHJcbiAgICBnbG9iYWxIcy5zZW5kVG9TZXJ2ZXIoKTtcclxuXHJcbiAgICAvL2FkZCB0aGUgdGVtcGxhdGUgdG8gY29udGVudFxyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgdGhlIGdhbWUgY29tcGxldGVkLXZpZXcgYW5kIHByZXNlbnQgaXQgdG8gdGhlIHVzZXJcclxuICovXHJcblF1aXoucHJvdG90eXBlLmdhbWVDb21wbGV0ZWQgPSBmdW5jdGlvbigpIHtcclxuICAgIC8vY3JlYXRlIG5ldyBoaWdoc2NvcmUgbW9kdWxlIHRvIGhhbmRsZSBpdFxyXG4gICAgdmFyIGhzID0gbmV3IEhpZ2hzY29yZSh0aGlzLnNlcnZlciwgdGhpcy5uaWNrbmFtZSwgdGhpcy50b3RhbFRpbWUudG9GaXhlZCgzKSk7XHJcbiAgICB2YXIgaXNOZXcgPSBocy5hZGRUb0xpc3QoKTtcclxuXHJcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLXF1aXpPdmVyXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xyXG5cclxuICAgIC8vZGVsZXRlIHRoZSAvLywgYW5kIGN1dCB0aGUgc3RyaW5nIGF0IDosIHVzZSB0aGUgZmlyc3QgcGFydCwgdGhlbiBzaG93IGl0XHJcbiAgICB2YXIgc2hvd1NlcnZlciA9IHRoaXMuc2VydmVyLnNsaWNlKDIpLnNwbGl0KFwiOlwiKVswXTtcclxuICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuc2VydmVyLWluZm9cIikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJzZXJ2ZXI6IFwiICsgc2hvd1NlcnZlcikpO1xyXG5cclxuICAgIC8vZ2V0IHRoZSBoaWdoc2NvcmUgaWYgdGhlIGhpZ2hzY29yZSBoYXMgZW50cmllc1xyXG4gICAgaWYgKGhzLmhpZ2hzY29yZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgLy9nZXQgdGhlIGZyYWdtZW50IGZyb20gaGlnaHNjb3JlLW1vZHVsZVxyXG4gICAgICAgIHZhciBoc0ZyYWcgPSBocy5jcmVhdGVIaWdoc2NvcmVGcmFnbWVudCgpO1xyXG4gICAgICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCJ0YWJsZVwiKS5hcHBlbmRDaGlsZChoc0ZyYWcpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpc05ldykge1xyXG4gICAgICAgIHZhciB0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiTmV3IEhpZ2hzY29yZSFcIik7XHJcbiAgICAgICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcImgxXCIpLmFwcGVuZENoaWxkKHRpdGxlKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmNsZWFyRGl2KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKSk7XHJcblxyXG4gICAgdmFyIGgxID0gdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi50aW1lXCIpO1xyXG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLnRvdGFsVGltZS50b0ZpeGVkKDMpKTtcclxuICAgIGgxLmFwcGVuZENoaWxkKHRleHQpO1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcclxuXHJcbiAgICAvL2FkZCB0aGUgZ2xvYmFsIGhpZ2hzY29yZVxyXG4gICAgdmFyIGdsb2JhbEhzID0gbmV3IEdsb2JhbEhpZ2hzY29yZSh0aGlzLnNlcnZlciwgdGhpcy5uaWNrbmFtZSwgdGhpcy50b3RhbFRpbWUudG9GaXhlZCgzKSk7XHJcbiAgICBnbG9iYWxIcy5zZW5kVG9TZXJ2ZXIoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBjbGVhciBhIHNwZWNpZmljIGRpdiBvZiBjaGlsZHNcclxuICogQHBhcmFtIGRpdntPYmplY3R9LCB0aGUgZGl2ZWxlbWVudCB0byBjbGVhclxyXG4gKi9cclxuUXVpei5wcm90b3R5cGUuY2xlYXJEaXYgPSBmdW5jdGlvbihkaXYpIHtcclxuICAgIHdoaWxlIChkaXYuaGFzQ2hpbGROb2RlcygpKSB7XHJcbiAgICAgICAgZGl2LnJlbW92ZUNoaWxkKGRpdi5sYXN0Q2hpbGQpO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBRdWl6O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbi8qKlxyXG4gKiBUaW1lciBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0gb3duZXJ7T2JqZWN0fSwgdGhlIG93bmVyLW9iamVjdCB0aGF0IGNyZWF0ZWQgdGhlIHRpbWVyXHJcbiAqIEBwYXJhbSBlbGVtZW50e09iamVjdH0sIGVsZW1lbnQgdG8gcHJpbnQgdGhlIHRpbWVyIHRvXHJcbiAqIEBwYXJhbSB0aW1le051bWJlcn0sIHRoZSB0aW1lIHRvIGNvdW50IGRvd25cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBUaW1lcihvd25lciwgZWxlbWVudCwgdGltZSkge1xyXG4gICAgdGhpcy50aW1lID0gdGltZTtcclxuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLm93bmVyID0gb3duZXI7XHJcbiAgICB0aGlzLnN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgdGhpcy5pbnRlcnZhbCA9IHVuZGVmaW5lZDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRoYXQgc3RhcnRzIGFuIGludGVydmFsIGZvciB0aGUgdGltZXJcclxuICovXHJcblRpbWVyLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLy9jYWxsIHRoZSBydW4gZnVuY3Rpb24gb24gZWFjaCBpbnRlcnZhbFxyXG4gICAgdGhpcy5pbnRlcnZhbCA9IHNldEludGVydmFsKHRoaXMucnVuLmJpbmQodGhpcyksIDEwMCk7XHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gYmUgZXhlY3V0ZWQgZWFjaCBpbnRlcnZhbCBvZiB0aGUgdGltZXJcclxuICovXHJcblRpbWVyLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuXHJcbiAgICAvL2NvdW50IHRoZSBkaWZmZXJlbmNlIGZyb20gc3RhcnQgdG8gbm93XHJcbiAgICB2YXIgZGlmZiA9IChub3cgLSB0aGlzLnN0YXJ0VGltZSkgLyAxMDAwO1xyXG5cclxuICAgIC8vY291bnQgdGhlIHRpbWUgLSBkaWZmZXJlbmNlIHRvIHNob3cgY291bnRkb3duXHJcbiAgICB2YXIgc2hvd1RpbWUgPSB0aGlzLnRpbWUgLSBkaWZmO1xyXG5cclxuICAgIC8vY2FsY3VsYXRlIHBlcmNlbnRhZ2UgYW5kIGFkZCB0aGUgY29sb3IgY2xhc3NcclxuICAgIHZhciBwZXJjZW50YWdlID0gKHNob3dUaW1lIC8gdGhpcy50aW1lKSAqIDEwMDtcclxuICAgIGlmIChwZXJjZW50YWdlIDw9IDUwICYmIHBlcmNlbnRhZ2UgPiAyNSkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwidGltZXItNTBcIik7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChwZXJjZW50YWdlIDw9IDI1KSB7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoXCJ0aW1lci01MFwiKTtcclxuICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LmFkZChcInRpbWVyLTI1XCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChkaWZmID49IHRoaXMudGltZSkge1xyXG4gICAgICAgIC8vdGltZSBpZiB1cFxyXG4gICAgICAgIHNob3dUaW1lID0gMDtcclxuICAgICAgICBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xyXG5cclxuICAgICAgICAvL2NhbGwgb3duZXIgZ2FtZU92ZXIgc2luY2UgdGltZSBpcyBvdXRcclxuICAgICAgICB0aGlzLm93bmVyLmdhbWVPdmVyKFwidGltZVwiKTtcclxuICAgIH1cclxuXHJcbiAgICAvL3Nob3cgdGhlIHRpbWVyLCB1c2UgZGVjaW1hbHMgaWYgdW5kZXIgMTAgc2VjXHJcbiAgICBpZiAoc2hvd1RpbWUgPD0gMTApIHtcclxuICAgICAgICB0aGlzLnByaW50KHNob3dUaW1lLnRvRml4ZWQoMSkpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdGhpcy5wcmludChzaG93VGltZS50b0ZpeGVkKDApKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0aGF0IHN0b3BzIHRoZSB0aW1lciBiZWZvcmUgaXRzIG92ZXJcclxuICogQHJldHVybnMge251bWJlcn0sIHRoZSBkaWZmZXJlbmNlIGluIHNlY29uZHNcclxuICovXHJcblRpbWVyLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XHJcbiAgICBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xyXG4gICAgdmFyIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG5cclxuICAgIHJldHVybiAobm93IC0gdGhpcy5zdGFydFRpbWUpIC8gMTAwMDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBzaG93IHRoZSB0aW1lciBhdCB0aGUgZ2l2ZW4gZWxlbWVudFxyXG4gKiBAcGFyYW0gZGlmZntOdW1iZXJ9IHRoZSB0aW1lIHRvIGJlIHByaW50ZWRcclxuICovXHJcblRpbWVyLnByb3RvdHlwZS5wcmludCA9IGZ1bmN0aW9uKGRpZmYpIHtcclxuICAgIHRoaXMuZWxlbWVudC5yZXBsYWNlQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGlmZiksIHRoaXMuZWxlbWVudC5maXJzdENoaWxkKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVGltZXI7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgUXVpeiA9IHJlcXVpcmUoXCIuL1F1aXpcIik7XG52YXIgcTtcbnZhciBzZXJ2ZXJVUkwgPSBcIi8vb3NrYXJlbWlsc3Nvbi5zZTo0MDAxXCI7XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gYWRkIGV2ZW50IGxpc3RlbmVyIHRvIHRoZSB0aGVtZSBzZWxlY3RvclxuICovXG5mdW5jdGlvbiBhZGRUaGVtZVNlbGVjdG9yKCkge1xuICAgIC8vZWxlbWVudCB0byBjaGFuZ2UgdGhlIHN0YXJ0LWluZm9cbiAgICB2YXIgZGVzY3IgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3N0YXJ0LWluZm9cIik7XG5cbiAgICAvL2FkZCBsaXN0ZW5lciBmb3IgdGhlIHRoZW1lIGNob29zZXJcbiAgICB2YXIgc2VsZWN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0aGVtZS1zZWxlY3RvclwiKTtcbiAgICBzZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGJhc2VTdHlsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYmFzZVN0eWxlXCIpO1xuICAgICAgICB2YXIgbG9hZGluZ1N0eWxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNsb2FkaW5nU3R5bGVcIik7XG5cbiAgICAgICAgLy9uZWVkIHRvIHNldCBnbG9iYWxTdHlsZSBldmVyeXRpbWUgc2luY2Ugbm9zdHlsZSBkZWxldGVzIHRoYXRcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNnbG9iYWxTdHlsZVwiKS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwic3R5bGVzaGVldC9nbG9iYWxTdHlsZS5jc3NcIik7XG5cbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJ0aGVtZVwiLCBzZWxlY3QudmFsdWUpO1xuXG4gICAgICAgIC8vY2xlYW4gdGhlIGRlc2NyaXB0aW9uIGlmIG5lZWRlZFxuICAgICAgICBpZiAoZGVzY3IuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgICAgICBkZXNjci5yZW1vdmVDaGlsZChkZXNjci5maXJzdENoaWxkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vc2V0IHRoZSBzZWxlY3RlZCB0aGVtZVxuICAgICAgICBiYXNlU3R5bGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvXCIgKyBzZWxlY3QudmFsdWUgKyBcIi5jc3NcIik7XG4gICAgICAgIGxvYWRpbmdTdHlsZS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwic3R5bGVzaGVldC9cIiArIHNlbGVjdC52YWx1ZSArIFwiX2xvYWRpbmcuY3NzXCIpO1xuXG4gICAgICAgIC8vYWRkIGRlc2NyaXB0aW9uXG4gICAgICAgIGlmIChzZWxlY3QudmFsdWUgPT09IFwidGVybWluYWxcIikge1xuICAgICAgICAgICAgZGVzY3IuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJVc2Uga2V5cGFkIHRvIGNob29zZSB3aGVuIGFsdGVybmF0aXZlcy4gT0JTISBEb24ndCB1c2UgbW91c2VjbGljayBpbiB0aGlzIG1vZGUhXCIpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzZWxlY3QudmFsdWUgPT09IFwibm9zdHlsZVwiKSB7XG4gICAgICAgICAgICBiYXNlU3R5bGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcIlwiKTtcbiAgICAgICAgICAgIGxvYWRpbmdTdHlsZS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwiXCIpO1xuXG4gICAgICAgICAgICAvL3Jlc2V0IHRoZSBocmVmLXRhZyBvbiBnbG9iYWxzdHlsZSB0byBnZXQgdHJ1ZSBub3N0eWxlXG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2dsb2JhbFN0eWxlXCIpLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJcIik7XG4gICAgICAgIH1cblxuICAgICAgICAvL3NldCBuaWNrbmFtZS1pbnB1dCBmb2N1c1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRcIikuZm9jdXMoKTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBGdW5jdGlvbiB0byBjaG9vc2Ugc2VydmVyIGZyb20gZ2l2ZW4gbmFtZVxuICogQHBhcmFtIG5hbWV7c3RyaW5nfSwgc2VydmVyLWFsaWFzXG4gKi9cbmZ1bmN0aW9uIHBpY2tTZXJ2ZXIobmFtZSkge1xuICAgIGlmIChuYW1lID09PSBcInJhbmRvbVwiKSB7XG4gICAgICAgIHNlcnZlclVSTCA9IFwiLy9vc2thcmVtaWxzc29uLnNlOjQwMDBcIjtcbiAgICB9XG4gICAgZWxzZSBpZiAobmFtZSA9PT0gXCJtdXNpY1wiKSB7XG4gICAgICAgIHNlcnZlclVSTCA9IFwiLy9vc2thcmVtaWxzc29uLnNlOjQwMDFcIjtcbiAgICB9XG4gICAgZWxzZSBpZiAobmFtZSA9PT0gXCJtb3ZpZVwiKSB7XG4gICAgICAgIHNlcnZlclVSTCA9IFwiLy9vc2thcmVtaWxzc29uLnNlOjQwMDJcIjtcbiAgICB9XG59XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gYWRkIGV2ZW50IGxpc3RlbmVyIHRvIHRoZSBzZXJ2ZXIgc2VsZWN0b3JcbiAqL1xuZnVuY3Rpb24gYWRkU2VydmVyU2VsZWN0b3IoKSB7XG4gICAgLy9hZGQgbGlzdGVuZXIgZm9yIHRoZSB0aGVtZSBjaG9vc2VyXG4gICAgdmFyIHNlbGVjdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc2VydmVyLXNlbGVjdG9yXCIpO1xuICAgIHNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICBwaWNrU2VydmVyKHNlbGVjdC52YWx1ZSk7XG5cbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJxdWl6XCIsIHNlbGVjdC52YWx1ZSk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHRoZSBzdWJtaXQgZm9yIG5pY2tuYW1lIGFuZCBzdGFydCB0aGUgcXVpelxuICogQHBhcmFtIGV2ZW50LCB0aGUgZXZlbnRoYW5kbGVyIGZyb20gdGhlIGxpc3RlbmVyXG4gKi9cbmZ1bmN0aW9uIHN1Ym1pdChldmVudCkge1xuICAgIGlmIChldmVudC53aGljaCA9PT0gMTMgfHwgZXZlbnQua2V5Q29kZSA9PT0gMTMgfHwgZXZlbnQudHlwZSA9PT0gXCJjbGlja1wiKSB7XG4gICAgICAgIC8vZGlzYWJsZSBmb3JtcyBhY3Rpb24gc28gcGFnZSB3b250IHJlbG9hZCB3aXRoIGVudGVyXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgdmFyIGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNuaWNrbmFtZVwiKS52YWx1ZTtcblxuICAgICAgICAvL2lmIG5pY2tuYW1lIHdyaXR0ZW4sIHN0YXJ0IHF1aXpcbiAgICAgICAgaWYgKGlucHV0Lmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIC8vc3RhcnQgdGhlIHF1aXpcbiAgICAgICAgICAgIHEgPSBuZXcgUXVpeihpbnB1dCwgc2VydmVyVVJMKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuaWYgKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwidGhlbWVcIikpIHtcbiAgICB2YXIgdGhlbWUgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInRoZW1lXCIpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYmFzZVN0eWxlXCIpLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L1wiICsgdGhlbWUgKyBcIi5jc3NcIik7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNsb2FkaW5nU3R5bGVcIikuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvXCIgKyB0aGVtZSArIFwiX2xvYWRpbmcuY3NzXCIpO1xuXG4gICAgLy9zZXQgdGhlIHRoZW1lIGFzIHNlbGVjdGVkXG4gICAgdmFyIHRoZW1lU2VsZWN0b3IgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwib3B0aW9uW3ZhbHVlPSdcIiArIHRoZW1lICsgXCInXVwiKTtcbiAgICB0aGVtZVNlbGVjdG9yLnNldEF0dHJpYnV0ZShcInNlbGVjdGVkXCIsIFwic2VsZWN0ZWRcIik7XG5cbiAgICBpZiAodGhlbWUgPT09IFwibm9zdHlsZVwiKSB7XG4gICAgICAgIC8vcmVzZXQgdGhlIGhyZWYtdGFnIG9uIGdsb2JhbHN0eWxlIHRvIGdldCB0cnVlIG5vc3R5bGVcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNnbG9iYWxTdHlsZVwiKS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwiXCIpO1xuICAgIH1cbn1cblxuaWYgKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwicXVpelwiKSkge1xuICAgIHZhciBxdWl6ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJxdWl6XCIpO1xuICAgIHBpY2tTZXJ2ZXIocXVpeik7XG5cbiAgICAvL3NldCB0aGUgcXVpeiBhcyBzZWxlY3RlZFxuICAgIHZhciBzZWxlY3RvciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJvcHRpb25bdmFsdWU9J1wiICsgcXVpeiArIFwiJ11cIik7XG4gICAgc2VsZWN0b3Iuc2V0QXR0cmlidXRlKFwic2VsZWN0ZWRcIiwgXCJzZWxlY3RlZFwiKTtcbn1cblxudmFyIGJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc3VibWl0XCIpO1xudmFyIGZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3FGb3JtXCIpO1xuXG4vL2FkZCBsaXN0ZW5lcnNcbmJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc3VibWl0LCB0cnVlKTtcbmZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcImtleXByZXNzXCIsIHN1Ym1pdCwgdHJ1ZSk7XG5cbi8vc2V0IG5pY2tuYW1lLWlucHV0IGZvY3VzIGF0IHN0YXJ0XG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRcIikuZm9jdXMoKTtcblxuYWRkVGhlbWVTZWxlY3RvcigpO1xuYWRkU2VydmVyU2VsZWN0b3IoKTtcbiJdfQ==
