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
    if(this.alt) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMS4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQWpheC5qcyIsImNsaWVudC9zb3VyY2UvanMvR2xvYmFsSGlnaHNjb3JlLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9IaWdoc2NvcmUuanMiLCJjbGllbnQvc291cmNlL2pzL1F1ZXN0aW9uLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9RdWl6LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9UaW1lci5qcyIsImNsaWVudC9zb3VyY2UvanMvYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IE9za2FyIG9uIDIwMTUtMTEtMjMuXG4gKi9cblxuLyoqXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgcmVxdWVzdHMgdmlhIFhNTEh0dHBSZXF1ZXN0XG4gKiBAcGFyYW0gY29uZmlne09iamVjdH0sIG9iamVjdCB3aXRoIG1ldGhvZCBhbmQgdXJsLCBwb3NzaWJseSBkYXRhXG4gKiBAcGFyYW0gY2FsbGJhY2t7RnVuY3Rpb259LCB0aGUgZnVuY3Rpb24gdG8gY2FsbCBhdCByZXNwb25zZVxuICovXG5mdW5jdGlvbiByZXEoY29uZmlnLCBjYWxsYmFjaykge1xuICAgIHZhciByID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAvL2FkZCBldmVudGxpc3RlbmVyIGZvciByZXNwb25zZVxuICAgIHIuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgaWYgKHIuc3RhdHVzID49IDQwMCkge1xuICAgICAgICAgICAgLy9nb3QgZXJyb3IsIGNhbGwgd2l0aCBlcnJvcmNvZGVcbiAgICAgICAgICAgIGNhbGxiYWNrKHIuc3RhdHVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vY2FsbCB0aGUgY2FsbGJhY2sgZnVuY3Rpb24gd2l0aCByZXNwb25zZVRleHRcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgci5yZXNwb25zZVRleHQpO1xuICAgIH0pO1xuXG4gICAgLy9vcGVuIGEgcmVxdWVzdCBmcm9tIHRoZSBjb25maWdcbiAgICByLm9wZW4oY29uZmlnLm1ldGhvZCwgY29uZmlnLnVybCk7XG5cbiAgICBpZiAoY29uZmlnLmRhdGEpIHtcbiAgICAgICAgLy9zZW5kIHRoZSBkYXRhIGFzIEpTT04gdG8gdGhlIHNlcnZlclxuICAgICAgICByLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uXCIpO1xuICAgICAgICByLnNlbmQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLmRhdGEpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvL3NlbmQgcmVxdWVzdFxuICAgICAgICByLnNlbmQobnVsbCk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cy5yZXEgPSByZXE7XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yNC5cbiAqL1xudmFyIEFqYXggPSByZXF1aXJlKFwiLi9BamF4XCIpO1xuXG4vKipcbiAqIEdsb2JhbEhpZ2hzY29yZSBjb25zdHJ1Y3RvclxuICogQHBhcmFtIG5pY2tuYW1le3N0cmluZ30sIHRoZSBuaWNrbmFtZVxuICogQHBhcmFtIHNjb3Jle3N0cmluZ30sIHRoZSBzY29yZSh0aW1lKVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEdsb2JhbEhpZ2hzY29yZShuaWNrbmFtZSwgc2NvcmUpIHtcbiAgICB0aGlzLm5pY2tuYW1lID0gbmlja25hbWU7XG4gICAgdGhpcy5zY29yZSA9IHNjb3JlO1xuICAgIHRoaXMuaGlnaHNjb3JlID0gW107XG59XG5cbi8qKlxuICogU2VuZCB0aGUgcmVxdWVzdCB0byBhZGQgdGhlIHNjb3JlIHRvIHRoZSBzZXJ2ZXJcbiAqL1xuR2xvYmFsSGlnaHNjb3JlLnByb3RvdHlwZS5zZW5kVG9TZXJ2ZXIgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgdmFyIGRhdGEgPSB7bmlja25hbWU6IHRoaXMubmlja25hbWUsIHNjb3JlOiB0aGlzLnNjb3JlLCBkYXRlOiBkYXRlfTtcbiAgICB2YXIgY29uZmlnID0ge1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICB1cmw6IFwiLy9yb290Lm9za2FyZW1pbHNzb24uc2UvcXVpem1hc3RlcnovYWRkLnBocFwiLFxuICAgICAgICBkYXRhOiBkYXRhXG4gICAgfTtcblxuICAgIEFqYXgucmVxKGNvbmZpZywgdGhpcy5QT1NUcmVzcG9uc2UuYmluZCh0aGlzKSk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSByZXNwb25zZSBmcm9tIHNlbmRpbmcgc2NvcmUgdG8gc2VydmVyXG4gKi9cbkdsb2JhbEhpZ2hzY29yZS5wcm90b3R5cGUuUE9TVHJlc3BvbnNlID0gZnVuY3Rpb24oZXJyb3IsIHJlc3BvbnNlKSB7XG4gICAgaWYgKHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciBjb25maWcgPSB7XG4gICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgICAgICAgICB1cmw6IFwiLy9yb290Lm9za2FyZW1pbHNzb24uc2UvcXVpem1hc3RlcnovcmVhZC5waHBcIlxuICAgICAgICB9O1xuICAgICAgICBBamF4LnJlcShjb25maWcsIHRoaXMuR0VUcmVzcG9uc2UuYmluZCh0aGlzKSk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byByZWFkIHRoZSBoaWdoc2NvcmUtZmlsZSBmcm9tIHNlcnZlciBzdG9yYWdlXG4gKi9cbkdsb2JhbEhpZ2hzY29yZS5wcm90b3R5cGUuR0VUcmVzcG9uc2UgPSBmdW5jdGlvbihlcnJvciwgcmVzcG9uc2UpIHtcbiAgICBpZiAocmVzcG9uc2UpIHtcbiAgICAgICAgLy9wYXJzZSBmaWxlIGludG8gSlNPTlxuICAgICAgICB2YXIganNvbiA9IEpTT04ucGFyc2UocmVzcG9uc2UpO1xuXG4gICAgICAgIC8vZmlsbCB0aGUgaGlnaHNjb3JlLWFycmF5IHdpdGggZW50cmllc1xuICAgICAgICBmb3IgKHZhciBuaWNrbmFtZSBpbiBqc29uKSB7XG4gICAgICAgICAgICBpZiAoanNvbi5oYXNPd25Qcm9wZXJ0eShuaWNrbmFtZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhpZ2hzY29yZS5wdXNoKGpzb25bbmlja25hbWVdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucHJpbnQoKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGFwcGVuZCB0aGUgZ2xvYmFsIGhpZ2hzY29yZSB0byB0aGUgdGFibGVcbiAqL1xuR2xvYmFsSGlnaHNjb3JlLnByb3RvdHlwZS5wcmludCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vZ2V0IHRoZSB0YWJsZVxuICAgIHZhciB0YWJsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZ2xvYmFsSHNcIik7XG5cbiAgICAvL2lmIHRoZSBnbG9iYWwgaGlnaHNjb3JlIGhhcyBlbnRyaWVzIGFkZCB0aGVtIHRvIHRoZSB0ZW1wbGF0ZVxuICAgIGlmICh0aGlzLmhpZ2hzY29yZS5sZW5ndGggPiAwKSB7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZ2hzLXRpdGxlXCIpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiR2xvYmFsIEhpZ2hzY29yZVwiKSk7XG4gICAgICAgIHZhciBnbG9iYWxIc0ZyYWcgPSB0aGlzLmNyZWF0ZUhpZ2hzY29yZUZyYWdtZW50KCk7XG4gICAgICAgIHRhYmxlLmFwcGVuZENoaWxkKGdsb2JhbEhzRnJhZyk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBnZXQgdGhlIGhpZ2hzY29yZWZyYWdtZW50IGNvbnRhaW5pbmcgdGhlIGhpZ2hzY29yZS1wYXJ0IG9mIHRhYmxlXG4gKiBAcmV0dXJucyB7RG9jdW1lbnRGcmFnbWVudH1cbiAqL1xuR2xvYmFsSGlnaHNjb3JlLnByb3RvdHlwZS5jcmVhdGVIaWdoc2NvcmVGcmFnbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIHZhciB0ZW1wbGF0ZTtcbiAgICB2YXIgaHNOaWNrbmFtZTtcbiAgICB2YXIgaHNTY29yZTtcbiAgICB2YXIgaHNEYXRlO1xuICAgIHZhciBkYXRlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmhpZ2hzY29yZS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAvL2dldCB0aGUgdGVtcGxhdGUgZm9yIGEgdGFibGUtcm93XG4gICAgICAgIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0ZW1wbGF0ZS1oaWdoc2NvcmVSb3dcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgIGhzTmlja25hbWUgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLW5pY2tuYW1lXCIpO1xuICAgICAgICBoc1Njb3JlID0gdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5ocy1zY29yZVwiKTtcbiAgICAgICAgaHNEYXRlID0gdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5ocy1kYXRlXCIpO1xuXG4gICAgICAgIC8vYXBwZW5kIHRoZSBuaWNrbmFtZSBhbmQgc2NvcmUgdG8gdGhlIHJvd1xuICAgICAgICBoc05pY2tuYW1lLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMuaGlnaHNjb3JlW2ldLm5pY2tuYW1lKSk7XG4gICAgICAgIGhzU2NvcmUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5oaWdoc2NvcmVbaV0uc2NvcmUpKTtcblxuICAgICAgICBkYXRlID0gbmV3IERhdGUodGhpcy5oaWdoc2NvcmVbaV0uZGF0ZSk7XG4gICAgICAgIGhzRGF0ZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRlLnRvRGF0ZVN0cmluZygpKSk7XG5cbiAgICAgICAgLy9hcHBlbmQgcm93IHRvIGZyYWdtZW50XG4gICAgICAgIGZyYWcuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xuICAgIH1cblxuICAgIHJldHVybiBmcmFnO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBHbG9iYWxIaWdoc2NvcmU7XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yNC5cbiAqL1xuXG4vKipcbiAqIEhpZ2hzY29yZSBjb25zdHJ1Y3RvclxuICogQHBhcmFtIG5pY2tuYW1le3N0cmluZ30sIHRoZSBuaWNrbmFtZVxuICogQHBhcmFtIHNjb3Jle3N0cmluZ30sIHRoZSBzY29yZSh0aW1lKVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEhpZ2hzY29yZShuaWNrbmFtZSwgc2NvcmUpIHtcbiAgICB0aGlzLm5pY2tuYW1lID0gbmlja25hbWU7XG4gICAgdGhpcy5zY29yZSA9IHNjb3JlO1xuICAgIHRoaXMuaGlnaHNjb3JlID0gW107XG5cbiAgICAvL2NhbGwgdG8gcmVhZCBoaWdoc2NvcmUgZmlsZSBmcm9tIGxvY2FsIHN0b3JhZ2VcbiAgICB0aGlzLnJlYWRGcm9tRmlsZSgpO1xufVxuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHJlYWQgdGhlIGhpZ2hzY29yZS1maWxlIGZyb20gbG9jYWwgc3RvcmFnZVxuICovXG5IaWdoc2NvcmUucHJvdG90eXBlLnJlYWRGcm9tRmlsZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBoc0ZpbGUgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcImhzXCIpO1xuICAgIGlmIChoc0ZpbGUpIHtcbiAgICAgICAgLy9wYXJzZSBmaWxlIGludG8gSlNPTlxuICAgICAgICB2YXIganNvbiA9IEpTT04ucGFyc2UoaHNGaWxlKTtcblxuICAgICAgICAvL2ZpbGwgdGhlIGhpZ2hzY29yZS1hcnJheSB3aXRoIGVudHJpZXNcbiAgICAgICAgZm9yICh2YXIgbmlja25hbWUgaW4ganNvbikge1xuICAgICAgICAgICAgaWYgKGpzb24uaGFzT3duUHJvcGVydHkobmlja25hbWUpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oaWdoc2NvcmUucHVzaChqc29uW25pY2tuYW1lXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGNoZWNrIGlmIHRoZSBzY29yZSB0YWtlcyBhIHBsYWNlIGludG8gdGhlIGhpZ2hzY29yZVxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbkhpZ2hzY29yZS5wcm90b3R5cGUuaXNIaWdoc2NvcmUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXNIaWdoc2NvcmUgPSBmYWxzZTtcbiAgICBpZiAodGhpcy5oaWdoc2NvcmUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIC8vaGlnaHNjb3JlIGlzIGVtcHR5LCB0aGVyZWZvcmUgbmV3IGhpZ2hzY29yZVxuICAgICAgICBpc0hpZ2hzY29yZSA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy9nZXQgdGhlIHNjb3JlIGxhc3QgaW4gdGhlIGxpc3RcbiAgICAgICAgdmFyIGxhc3RTY29yZSA9IHRoaXMuaGlnaHNjb3JlW3RoaXMuaGlnaHNjb3JlLmxlbmd0aCAtIDFdLnNjb3JlO1xuXG4gICAgICAgIC8vY2hlY2sgaWYgaGlnaHNjb3JlXG4gICAgICAgIGlmIChwYXJzZUZsb2F0KHRoaXMuc2NvcmUpIDwgcGFyc2VGbG9hdChsYXN0U2NvcmUpIHx8IHRoaXMuaGlnaHNjb3JlLmxlbmd0aCA8IDUpIHtcbiAgICAgICAgICAgIGlzSGlnaHNjb3JlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBpc0hpZ2hzY29yZTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gYWRkIHRoZSBzY29yZSBpbnRvIHRoZSBsaXN0XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0sIGFkZGVkIG9yIG5vdFxuICovXG5IaWdoc2NvcmUucHJvdG90eXBlLmFkZFRvTGlzdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhZGRlZCA9IGZhbHNlO1xuXG4gICAgLy9jYWxsIHRoZSBpc0hpZ2hzY29yZSB0byBjaGVjayBpZiBzY29yZSBzaG91bGQgYmUgYWRkZWRcbiAgICBpZiAodGhpcy5pc0hpZ2hzY29yZSgpKSB7XG4gICAgICAgIC8vc2F2ZSB0aGUgbmlja25hbWUsIHNjb3JlIGFuZCBkYXRlc3RhbXAgaW50byBhbiBvYmplY3RcbiAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICB2YXIgdGhpc1Njb3JlID0ge1xuICAgICAgICAgICAgbmlja25hbWU6IHRoaXMubmlja25hbWUsXG4gICAgICAgICAgICBzY29yZTogdGhpcy5zY29yZSxcbiAgICAgICAgICAgIGRhdGU6IGRhdGVcbiAgICAgICAgfTtcblxuICAgICAgICAvL2RlbGV0ZSB0aGUgbGFzdCBwb3NpdGlvbiBvZiB0aGUgaGlnaHNjb3JlIGFycmF5XG4gICAgICAgIGlmICh0aGlzLmhpZ2hzY29yZS5sZW5ndGggPT09IDUpIHtcbiAgICAgICAgICAgIC8vcmVtb3ZlIHRoZSBvbmUgbGFzdFxuICAgICAgICAgICAgdGhpcy5oaWdoc2NvcmUuc3BsaWNlKC0xLCAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vcHVzaCB0aGUgbmV3IGFuZCBzb3J0IHRoZSBhcnJheVxuICAgICAgICB0aGlzLmhpZ2hzY29yZS5wdXNoKHRoaXNTY29yZSk7XG4gICAgICAgIHRoaXMuaGlnaHNjb3JlID0gdGhpcy5oaWdoc2NvcmUuc29ydChmdW5jdGlvbihhLCBiKSB7cmV0dXJuIGEuc2NvcmUgLSBiLnNjb3JlO30pO1xuXG4gICAgICAgIC8vY2FsbCB0byBzYXZlIGl0XG4gICAgICAgIHRoaXMuc2F2ZVRvRmlsZSgpO1xuXG4gICAgICAgIGFkZGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gYWRkZWQ7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHNhdmUgdGhlIGhpZ2hzY29yZSB0byBsb2NhbCBzdG9yYWdlXG4gKi9cbkhpZ2hzY29yZS5wcm90b3R5cGUuc2F2ZVRvRmlsZSA9IGZ1bmN0aW9uKCkge1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiaHNcIiwgSlNPTi5zdHJpbmdpZnkodGhpcy5oaWdoc2NvcmUpKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gZ2V0IHRoZSBoaWdoc2NvcmVmcmFnbWVudCBjb250YWluaW5nIHRoZSBoaWdoc2NvcmUtcGFydCBvZiB0YWJsZVxuICogQHJldHVybnMge0RvY3VtZW50RnJhZ21lbnR9XG4gKi9cbkhpZ2hzY29yZS5wcm90b3R5cGUuY3JlYXRlSGlnaHNjb3JlRnJhZ21lbnQgPSBmdW5jdGlvbihpc05ldykge1xuICAgIHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIHZhciB0ZW1wbGF0ZTtcbiAgICB2YXIgaHNOaWNrbmFtZTtcbiAgICB2YXIgaHNTY29yZTtcbiAgICB2YXIgaHNEYXRlO1xuICAgIHZhciBkYXRlO1xuICAgIHZhciBsYXRlc3RFbnRyeSA9IG5ldyBEYXRlKHRoaXMuaGlnaHNjb3JlWzBdLmRhdGUpO1xuICAgIHZhciBoaWdobGlnaHRJbmRleCA9IDA7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaGlnaHNjb3JlLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIC8vZ2V0IHRoZSB0ZW1wbGF0ZSBmb3IgYSB0YWJsZS1yb3dcbiAgICAgICAgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLWhpZ2hzY29yZVJvd1wiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgaHNOaWNrbmFtZSA9IHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuaHMtbmlja25hbWVcIik7XG4gICAgICAgIGhzU2NvcmUgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLXNjb3JlXCIpO1xuICAgICAgICBoc0RhdGUgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLWRhdGVcIik7XG5cbiAgICAgICAgLy9hcHBlbmQgdGhlIG5pY2tuYW1lIGFuZCBzY29yZSB0byB0aGUgcm93XG4gICAgICAgIGhzTmlja25hbWUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5oaWdoc2NvcmVbaV0ubmlja25hbWUpKTtcbiAgICAgICAgaHNTY29yZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLmhpZ2hzY29yZVtpXS5zY29yZSkpO1xuXG4gICAgICAgIGRhdGUgPSBuZXcgRGF0ZSh0aGlzLmhpZ2hzY29yZVtpXS5kYXRlKTtcbiAgICAgICAgaHNEYXRlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGUudG9EYXRlU3RyaW5nKCkpKTtcblxuICAgICAgICBpZiAoaXNOZXcpIHtcbiAgICAgICAgICAgIC8vY2hlY2sgZm9yIHRoZSBsZXRlc3QgZW50cnlcbiAgICAgICAgICAgIGlmIChkYXRlLnZhbHVlT2YoKSA+IGxhdGVzdEVudHJ5LnZhbHVlT2YoKSkge1xuICAgICAgICAgICAgICAgIGhpZ2hsaWdodEluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICBsYXRlc3RFbnRyeSA9IGRhdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvL2FwcGVuZCByb3cgdG8gZnJhZ21lbnRcbiAgICAgICAgZnJhZy5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG4gICAgfVxuXG4gICAgaWYgKGlzTmV3KSB7XG4gICAgICAgIC8vaGlnaGxpZ2h0IHRoZSBuZXcgaGlnaHNjb3JlIGluIHRoZSBsaXN0XG4gICAgICAgIGZyYWcucXVlcnlTZWxlY3RvckFsbChcInRyXCIpW2hpZ2hsaWdodEluZGV4XS5jbGFzc0xpc3QuYWRkKFwiaGlnaGxpZ2h0XCIpO1xuICAgIH1cblxuICAgIHJldHVybiBmcmFnO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBIaWdoc2NvcmU7XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yMy5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogUXVlc3Rpb24gY29uc3RydWN0b3JcbiAqIEBwYXJhbSBvYmp7T2JqZWN0fSwgb2JqZWN0IHRoYXQgaG9sZHMgYSBxdWVzdGlvblxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFF1ZXN0aW9uKG9iaikge1xuICAgIHRoaXMuaWQgPSBvYmouaWQ7XG4gICAgdGhpcy5xdWVzdGlvbiA9IG9iai5xdWVzdGlvbjtcbiAgICB0aGlzLmFsdCA9IG9iai5hbHRlcm5hdGl2ZXM7XG59XG5cbi8qKlxuICogRnVuY3Rpb25iIHRvIHByZXNlbnQgdGhlIHF1ZXN0aW9uXG4gKi9cblF1ZXN0aW9uLnByb3RvdHlwZS5wcmludCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vc3RhdGVtZW50IHRvIGNhbGwgdGhlIHJpZ2h0ZnVsIHByaW50ZnVuY3Rpb25cbiAgICBpZih0aGlzLmFsdCkge1xuICAgICAgICB0aGlzLnByaW50QWx0UXVlc3Rpb24oKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMucHJpbnRRdWVzdGlvbigpO1xuICAgIH1cblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJpbnB1dFwiKS5mb2N1cygpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBjbGVhciBhIGRpdlxuICogQHBhcmFtIGRpdntvYmplY3R9LCB0aGUgZGl2IHRvIGNsZWFyXG4gKi9cblF1ZXN0aW9uLnByb3RvdHlwZS5jbGVhckRpdiA9IGZ1bmN0aW9uKGRpdikge1xuICAgIHdoaWxlKGRpdi5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgZGl2LnJlbW92ZUNoaWxkKGRpdi5sYXN0Q2hpbGQpO1xuICAgIH1cbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gcHJlc2VudCB0aGUgcXVlcnN0aW9uIHRoYXQgaGFzIGFsdGVybmF0aXZlc1xuICovXG5RdWVzdGlvbi5wcm90b3R5cGUucHJpbnRBbHRRdWVzdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIC8vZ2V0IHRoZSB0ZW1wbGF0ZSBhbmQgYXBwZW5kIHRoZSBhbHRlcm5hdGl2ZXNcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLXF1ZXN0aW9uLWFsdFwiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLnFIZWFkXCIpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMucXVlc3Rpb24pKTtcblxuICAgIC8vY2FsbCB0aGUgZnVuY3Rpb24gdGhhdCBoYW5kbGVzIHRoZSBhbHRlcm5hdGl2ZXNcbiAgICB2YXIgaW5wdXRGcmFnID0gdGhpcy5nZXRBbHRGcmFnKCk7XG4gICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIiNxRm9ybVwiKS5pbnNlcnRCZWZvcmUoaW5wdXRGcmFnLCB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiI3N1Ym1pdFwiKSk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHRoZSBhbHRlcm5hdGl2ZXNcbiAqIEByZXR1cm5zIHtEb2N1bWVudEZyYWdtZW50fSwgdGhlIGZyYWdtZW50IGZvciB0aGUgYWx0ZXJuYXRpdmVzXG4gKi9cblF1ZXN0aW9uLnByb3RvdHlwZS5nZXRBbHRGcmFnID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGlucHV0RnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB2YXIgaW5wdXQ7XG4gICAgdmFyIGxhYmVsO1xuICAgIHZhciBmaXJzdCA9IHRydWU7XG5cbiAgICBmb3IgKHZhciBhbHQgaW4gdGhpcy5hbHQpIHtcbiAgICAgICAgaWYgKHRoaXMuYWx0Lmhhc093blByb3BlcnR5KGFsdCkpIHtcbiAgICAgICAgICAgIC8vZ2V0IHRoZSB0ZW1wbGF0ZSBmb3IgYWx0ZXJuYXRpdmVzXG4gICAgICAgICAgICBpbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtYWx0ZXJuYXRpdmVcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICAvL2FwcGVuZCB0aGUgYWx0ZXJuYXRpdmVcbiAgICAgICAgICAgIGlmIChmaXJzdCkge1xuICAgICAgICAgICAgICAgIGlucHV0LnF1ZXJ5U2VsZWN0b3IoXCJpbnB1dFwiKS5zZXRBdHRyaWJ1dGUoXCJjaGVja2VkXCIsIFwiY2hlY2tlZFwiKTtcbiAgICAgICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbnB1dC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRcIikuc2V0QXR0cmlidXRlKFwidmFsdWVcIiwgYWx0KTtcbiAgICAgICAgICAgIGxhYmVsID0gaW5wdXQucXVlcnlTZWxlY3RvcihcImxhYmVsXCIpO1xuICAgICAgICAgICAgbGFiZWwuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5hbHRbYWx0XSkpO1xuXG4gICAgICAgICAgICBpbnB1dEZyYWcuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICB9XG5cbiAgICB9XG4gICAgcmV0dXJuIGlucHV0RnJhZztcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gcHJlc2VudCBhIHF1ZXN0aW9uIHdpdGggdGV4dC1pbnB1dFxuICovXG5RdWVzdGlvbi5wcm90b3R5cGUucHJpbnRRdWVzdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIC8vZ2V0IHRoZSB0ZW1wbGF0ZSBhbmQgYXBwZW5kIHRoZSBxdWVzdGlvblxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtcXVlc3Rpb25cIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5xSGVhZFwiKS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLnF1ZXN0aW9uKSk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUXVlc3Rpb247XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yMy5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgUXVlc3Rpb24gPSByZXF1aXJlKFwiLi9RdWVzdGlvblwiKTtcbnZhciBBamF4ID0gcmVxdWlyZShcIi4vQWpheFwiKTtcbnZhciBUaW1lciA9IHJlcXVpcmUoXCIuL1RpbWVyXCIpO1xudmFyIEhpZ2hzY29yZSA9IHJlcXVpcmUoXCIuL0hpZ2hzY29yZVwiKTtcbnZhciBHbG9iYWxIaWdoc2NvcmUgPSByZXF1aXJlKFwiLi9HbG9iYWxIaWdoc2NvcmVcIik7XG5cbi8qKlxuICogQ29uc3RydWN0b3IgZnVuY3Rpb24gZm9yIHRoZSBRdWl6XG4gKiBAcGFyYW0gbmlja25hbWV7c3RyaW5nfSwgbmlja25hbWUgdG8gdXNlIGZvciBoaWdoc2NvcmVcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBRdWl6KG5pY2tuYW1lKSB7XG4gICAgdGhpcy5uaWNrbmFtZSA9IG5pY2tuYW1lO1xuICAgIHRoaXMudGltZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5xdWVzdGlvbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLm5leHRVUkwgPSBcImh0dHA6Ly92aG9zdDMubG51LnNlOjIwMDgwL3F1ZXN0aW9uLzFcIjtcbiAgICB0aGlzLmJ1dHRvbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmZvcm0gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy50b3RhbFRpbWUgPSAwO1xuXG4gICAgLy9yZXF1ZXN0IHRoZSBmaXJzdCBxdWVzdGlvblxuICAgIHRoaXMuZ2V0UXVlc3Rpb24oKTtcbn1cblxuLyoqXG4gKiBGdW5jdGlvbiB0byBzZW5kIGEgcmVxdWVzdCBmb3IgYSBuZXcgcXVlc3Rpb25cbiAqL1xuUXVpei5wcm90b3R5cGUuZ2V0UXVlc3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgY29uZmlnID0ge21ldGhvZDogXCJHRVRcIiwgdXJsOiB0aGlzLm5leHRVUkx9O1xuICAgIHZhciByZXNwb25zZUZ1bmN0aW9uID0gdGhpcy5yZXNwb25zZS5iaW5kKHRoaXMpO1xuXG4gICAgQWpheC5yZXEoY29uZmlnLCByZXNwb25zZUZ1bmN0aW9uKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHRoZSByZXNwb25zZSwgdXNlcyBhcyBhcmd1bWVudCBcImNhbGxiYWNrXCIgaW4gYSByZXF1ZXN0XG4gKiBAcGFyYW0gZXJyb3J7TnVtYmVyfSwgZXJyb3Jjb2RlLCBudWxsIGlmIG5vIGVycm9yXG4gKiBAcGFyYW0gcmVzcG9uc2V7c3RyaW5nfSwgcmVzcG9uc2Ugc3RyaW5nIHRvIHBhcnNlIEpTT04gZnJvbVxuICovXG5RdWl6LnByb3RvdHlwZS5yZXNwb25zZSA9IGZ1bmN0aW9uKGVycm9yLCByZXNwb25zZSkge1xuICAgIC8vaGFuZGxlIGVycm9ycyAoNDA0IG1lYW5zIG5vIG1vcmUgcXVlc3Rpb25zKVxuICAgIGlmIChlcnJvcikge1xuICAgICAgICAvL3ByZXNlbnQgdGhlIGdhbWVvdmVyLXZpZXcgdG8gdXNlclxuICAgICAgICB0aGlzLmdhbWVPdmVyKCk7XG4gICAgfVxuXG4gICAgLy9oYW5kbGUgdGhlIHJlc3BvbnNlIHN0cmluZ1xuICAgIGlmIChyZXNwb25zZSkge1xuICAgICAgICAvL3Bhc3JlIHRvIEpTT05cbiAgICAgICAgdmFyIG9iaiA9IEpTT04ucGFyc2UocmVzcG9uc2UpO1xuICAgICAgICB0aGlzLm5leHRVUkwgPSBvYmoubmV4dFVSTDtcblxuICAgICAgICAvL3N0YXRlbWVudCB0byBjYWxsIHRoZSByaWdodGZ1bCBmdW5jdGlvbiBvbiB0aGUgcmVzcG9uc2VcbiAgICAgICAgaWYgKG9iai5xdWVzdGlvbikge1xuICAgICAgICAgICAgdGhpcy5yZXNwb25zZVF1ZXN0aW9uKG9iaik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAodGhpcy5uZXh0VVJMIHx8IG9iai5tZXNzYWdlID09PSBcIkNvcnJlY3QgYW5zd2VyIVwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZUFuc3dlcihvYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSBpZiByZXNwb25zZSBpcyBhIHF1ZXN0aW9uXG4gKiBAcGFyYW0gb2Jqe09iamVjdH0sIG9iamVjdCB0aGF0IGhvbGRzIHRoZSBxdWVzdGlvblxuICovXG5RdWl6LnByb3RvdHlwZS5yZXNwb25zZVF1ZXN0aW9uID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGNvbnRlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIik7XG4gICAgdGhpcy5jbGVhckRpdihjb250ZW50KTtcblxuICAgIC8vY3JlYXRlIGEgbmV3IHF1ZXN0aW9uIGZyb20gb2JqZWN0XG4gICAgdGhpcy5xdWVzdGlvbiA9IG5ldyBRdWVzdGlvbihvYmopO1xuICAgIHRoaXMucXVlc3Rpb24ucHJpbnQoKTtcblxuICAgIC8vY3JlYXRlIGEgbmV3IHRpbWVyIGZvciBxdWVzdGlvblxuICAgIHRoaXMudGltZXIgPSBuZXcgVGltZXIodGhpcywgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0aW1lciBoMVwiKSwgMjApO1xuICAgIHRoaXMudGltZXIuc3RhcnQoKTtcblxuICAgIC8vQWRkIGxpbnN0ZW5lcnMgZm9yIHRoZSBmb3JtXG4gICAgdGhpcy5hZGRMaXN0ZW5lcigpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgaWYgcmVzcG9uc2UgaXMgYW4gYW5zd2VyXG4gKiBAcGFyYW0gb2Jqe09iamVjdH0sIG9iamVjdCB0aGF0IGhvbGRzIHRoZSBhbnN3ZXJcbiAqL1xuUXVpei5wcm90b3R5cGUucmVzcG9uc2VBbnN3ZXIgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29udGVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKTtcbiAgICB0aGlzLmNsZWFyRGl2KGNvbnRlbnQpO1xuXG4gICAgLy9IYW5kbGUgdGhlIHRlbXBsYXRlIGZvciBhbnN3ZXJcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLWFuc3dlclwiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKG9iai5tZXNzYWdlKTtcbiAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwicFwiKS5hcHBlbmRDaGlsZCh0ZXh0KTtcblxuICAgIGNvbnRlbnQuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xuXG4gICAgaWYgKHRoaXMubmV4dFVSTCkge1xuICAgICAgICAvL1JlcXVlc3QgYSBuZXcgcXVlc3Rpb24sIGJ1dCB3aXRoIGEgZGVsYXlcbiAgICAgICAgdmFyIG5ld1F1ZXN0aW9uID0gdGhpcy5nZXRRdWVzdGlvbi5iaW5kKHRoaXMpO1xuICAgICAgICBzZXRUaW1lb3V0KG5ld1F1ZXN0aW9uLCAxMDAwKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMuZ2FtZUNvbXBsZXRlZCgpO1xuICAgIH1cbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gYWRkIHRoZSBsaXN0ZW5lciBmb3Igc3VibWl0XG4gKi9cblF1aXoucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5idXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3N1Ym1pdFwiKTtcbiAgICB0aGlzLmZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3FGb3JtXCIpO1xuXG4gICAgdGhpcy5idXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc3VibWl0LmJpbmQodGhpcyksIHRydWUpO1xuICAgIHRoaXMuZm9ybS5hZGRFdmVudExpc3RlbmVyKFwia2V5cHJlc3NcIiwgdGhpcy5zdWJtaXQuYmluZCh0aGlzKSwgdHJ1ZSk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSB3aGVuIHN1Ym1pdCBpcyB0cmlnZ2VyZWRcbiAqL1xuUXVpei5wcm90b3R5cGUuc3VibWl0ID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAvL0lmIHRoZSB0cmlnZ2VyIGlzIGVudGVyIG9yIGNsaWNrIGRvIHRoZSBzdWJtaXRcbiAgICBpZiAoZXZlbnQud2hpY2ggPT09IDEzIHx8IGV2ZW50LmtleUNvZGUgPT09IDEzIHx8IGV2ZW50LnR5cGUgPT09IFwiY2xpY2tcIikge1xuICAgICAgICAvL3ByZXZlbnQgdGhlIGZvcm0gdG8gcmVsb2FkIHBhZ2Ugb24gZW50ZXJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB0aGlzLnRvdGFsVGltZSArPSB0aGlzLnRpbWVyLnN0b3AoKTtcbiAgICAgICAgdmFyIGlucHV0O1xuXG4gICAgICAgIC8vcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgdG8gcHJldmVudCBkb3VibGUtc3VibWl0XG4gICAgICAgIHRoaXMuYnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnN1Ym1pdC5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5mb3JtLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlwcmVzc1wiLCB0aGlzLnN1Ym1pdC5iaW5kKHRoaXMpKTtcblxuICAgICAgICAvL3NhdmUgaW5wdXQgZGVwZW5kaW5nIG9uIHRoZSB0eXBlIG9mIHF1ZXN0aW9uXG4gICAgICAgIGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2Fuc3dlclwiKSkge1xuICAgICAgICAgICAgLy9nZXQgdGhlIGZvcm0gaW5wdXRcbiAgICAgICAgICAgIGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNhbnN3ZXJcIikudmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvL2dldCB0aGUgY2hlY2tlZCByZWFkaW9idXR0b25cbiAgICAgICAgICAgIGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImlucHV0W25hbWU9J2FsdGVybmF0aXZlJ106Y2hlY2tlZFwiKS52YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vc2V0IHRoZSBjb25maWcgdG8gYmUgc2VudCB0byBzZXJ2ZXIgYW5kIHNlbmQgYSByZXF1ZXN0XG4gICAgICAgIHZhciBjb25maWcgPSB7XG4gICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgICAgdXJsOiB0aGlzLm5leHRVUkwsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgYW5zd2VyOiBpbnB1dFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgcmVzcG9uc2VGdW5jdGlvbiA9IHRoaXMucmVzcG9uc2UuYmluZCh0aGlzKTtcbiAgICAgICAgQWpheC5yZXEoY29uZmlnLCByZXNwb25zZUZ1bmN0aW9uKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSB0aGUgZ2FtZU92ZXItdmlldyBhbmQgcHJlc2VudCBpdCB0byB1c2VyXG4gKi9cblF1aXoucHJvdG90eXBlLmdhbWVPdmVyID0gZnVuY3Rpb24oKSB7XG4gICAgLy9jcmVhdGUgYSBoaWdoc2NvcmUgbW9kdWxlIHRvIHNob3cgaXQgdG8gdGhlIHVzZXJcbiAgICB2YXIgaHMgPSBuZXcgSGlnaHNjb3JlKHRoaXMubmlja25hbWUpO1xuICAgIHRoaXMuY2xlYXJEaXYoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpKTtcblxuICAgIC8vZ2V0IHRoZSBnYW1lIG92ZXIgdGVtcGxhdGVcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLWdhbWVPdmVyXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgLy9pZiB0aGUgaGlnaHNjb3JlIGhhcyBlbnRyaWVzIGFkZCB0aGVtIHRvIHRoZSB0ZW1wbGF0ZVxuICAgIGlmIChocy5oaWdoc2NvcmUubGVuZ3RoID4gMCkge1xuICAgICAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLXRpdGxlXCIpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiSGlnaHNjb3JlXCIpKTtcbiAgICAgICAgdmFyIGhzRnJhZyA9IGhzLmNyZWF0ZUhpZ2hzY29yZUZyYWdtZW50KCk7XG4gICAgICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCJ0YWJsZVwiKS5hcHBlbmRDaGlsZChoc0ZyYWcpO1xuICAgIH1cblxuICAgIHZhciBnbG9iYWxIcyA9IG5ldyBHbG9iYWxIaWdoc2NvcmUodGhpcy5uaWNrbmFtZSk7XG4gICAgZ2xvYmFsSHMuc2VuZFRvU2VydmVyKCk7XG5cbiAgICAvL2FkZCB0aGUgdGVtcGxhdGUgdG8gY29udGVudFxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSB0aGUgZ2FtZSBjb21wbGV0ZWQtdmlldyBhbmQgcHJlc2VudCBpdCB0byB0aGUgdXNlclxuICovXG5RdWl6LnByb3RvdHlwZS5nYW1lQ29tcGxldGVkID0gZnVuY3Rpb24oKSB7XG4gICAgLy9jcmVhdGUgbmV3IGhpZ2hzY29yZSBtb2R1bGUgdG8gaGFuZGxlIGl0XG4gICAgdmFyIGhzID0gbmV3IEhpZ2hzY29yZSh0aGlzLm5pY2tuYW1lLCB0aGlzLnRvdGFsVGltZS50b0ZpeGVkKDMpKTtcbiAgICB2YXIgaXNOZXcgPSBocy5hZGRUb0xpc3QoKTtcblxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtcXVpekNvbXBsZXRlZFwiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcblxuICAgIC8vZ2V0IHRoZSBoaWdoc2NvcmUgaWYgdGhlIGhpZ2hzY29yZSBoYXMgZW50cmllc1xuICAgIGlmIChocy5oaWdoc2NvcmUubGVuZ3RoID4gMCkge1xuICAgICAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLXRpdGxlXCIpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiSGlnaHNjb3JlXCIpKTtcbiAgICAgICAgdmFyIGhzRnJhZyA9IGhzLmNyZWF0ZUhpZ2hzY29yZUZyYWdtZW50KGlzTmV3KTtcbiAgICAgICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcInRhYmxlXCIpLmFwcGVuZENoaWxkKGhzRnJhZyk7XG4gICAgfVxuXG4gICAgaWYgKGlzTmV3KSB7XG4gICAgICAgIHZhciBuZXdIUyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJoMVwiKTtcbiAgICAgICAgbmV3SFMuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJOZXcgSGlnaHNjb3JlIVwiKSk7XG4gICAgICAgIHZhciBkaXYgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiZGl2XCIpO1xuICAgICAgICBkaXYuaW5zZXJ0QmVmb3JlKG5ld0hTLCBkaXYuZmlyc3RDaGlsZCk7XG4gICAgfVxuXG4gICAgdGhpcy5jbGVhckRpdihkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikpO1xuXG4gICAgdmFyIGgxID0gdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi50aW1lXCIpO1xuICAgIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy50b3RhbFRpbWUudG9GaXhlZCgzKSk7XG4gICAgaDEuYXBwZW5kQ2hpbGQodGV4dCk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcblxuICAgIC8vYWRkIHRoZSBnbG9iYWwgaGlnaHNjb3JlXG4gICAgdmFyIGdsb2JhbEhzID0gbmV3IEdsb2JhbEhpZ2hzY29yZSh0aGlzLm5pY2tuYW1lLCB0aGlzLnRvdGFsVGltZS50b0ZpeGVkKDMpKTtcbiAgICBnbG9iYWxIcy5zZW5kVG9TZXJ2ZXIoKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gY2xlYXIgYSBzcGVjaWZpYyBkaXYgb2YgY2hpbGRzXG4gKiBAcGFyYW0gZGl2e09iamVjdH0sIHRoZSBkaXZlbGVtZW50IHRvIGNsZWFyXG4gKi9cblF1aXoucHJvdG90eXBlLmNsZWFyRGl2ID0gZnVuY3Rpb24oZGl2KSB7XG4gICAgd2hpbGUgKGRpdi5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgZGl2LnJlbW92ZUNoaWxkKGRpdi5sYXN0Q2hpbGQpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUXVpejtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTI0LlxuICovXG5cbi8qKlxuICogVGltZXIgY29uc3RydWN0b3JcbiAqIEBwYXJhbSBvd25lcntPYmplY3R9LCB0aGUgb3duZXItb2JqZWN0IHRoYXQgY3JlYXRlZCB0aGUgdGltZXJcbiAqIEBwYXJhbSBlbGVtZW50e09iamVjdH0sIGVsZW1lbnQgdG8gcHJpbnQgdGhlIHRpbWVyIHRvXG4gKiBAcGFyYW0gdGltZXtOdW1iZXJ9LCB0aGUgdGltZSB0byBjb3VudCBkb3duXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVGltZXIob3duZXIsIGVsZW1lbnQsIHRpbWUpIHtcbiAgICB0aGlzLnRpbWUgPSB0aW1lO1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vd25lciA9IG93bmVyO1xuICAgIHRoaXMuc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgdGhpcy5pbnRlcnZhbCA9IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBGdW5jdGlvbiB0aGF0IHN0YXJ0cyBhbiBpbnRlcnZhbCBmb3IgdGhlIHRpbWVyXG4gKi9cblRpbWVyLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vY2FsbCB0aGUgcnVuIGZ1bmN0aW9uIG9uIGVhY2ggaW50ZXJ2YWxcbiAgICB0aGlzLmludGVydmFsID0gc2V0SW50ZXJ2YWwodGhpcy5ydW4uYmluZCh0aGlzKSwgMTAwKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gYmUgZXhlY3V0ZWQgZWFjaCBpbnRlcnZhbCBvZiB0aGUgdGltZXJcbiAqL1xuVGltZXIucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuICAgIC8vY291bnQgdGhlIGRpZmZlcmVuY2UgZnJvbSBzdGFydCB0byBub3dcbiAgICB2YXIgZGlmZiA9IChub3cgLSB0aGlzLnN0YXJ0VGltZSkgLyAxMDAwO1xuXG4gICAgLy9jb3VudCB0aGUgdGltZSAtIGRpZmZlcmVuY2UgdG8gc2hvdyBjb3VudGRvd25cbiAgICB2YXIgc2hvd1RpbWUgPSB0aGlzLnRpbWUgLSBkaWZmO1xuXG4gICAgaWYgKGRpZmYgPj0gdGhpcy50aW1lKSB7XG4gICAgICAgIC8vdGltZSBpZiB1cFxuICAgICAgICBzaG93VGltZSA9IDA7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbCk7XG5cbiAgICAgICAgLy9jYWxsIG93bmVyIGdhbWVPdmVyIHNpbmNlIHRpbWUgaXMgb3V0XG4gICAgICAgIHRoaXMub3duZXIuZ2FtZU92ZXIoKTtcbiAgICB9XG5cbiAgICAvL3Nob3cgdGhlIHRpbWVyIHdpdGggb25lIGRlY2ltYWxcbiAgICB0aGlzLnByaW50KHNob3dUaW1lLnRvRml4ZWQoMSkpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0aGF0IHN0b3BzIHRoZSB0aW1lciBiZWZvcmUgaXRzIG92ZXJcbiAqIEByZXR1cm5zIHtudW1iZXJ9LCB0aGUgZGlmZmVyZW5jZSBpbiBzZWNvbmRzXG4gKi9cblRpbWVyLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XG4gICAgY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsKTtcbiAgICB2YXIgbm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cbiAgICByZXR1cm4gKG5vdyAtIHRoaXMuc3RhcnRUaW1lKSAvIDEwMDA7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHNob3cgdGhlIHRpbWVyIGF0IHRoZSBnaXZlbiBlbGVtZW50XG4gKiBAcGFyYW0gZGlmZntOdW1iZXJ9IHRoZSB0aW1lIHRvIGJlIHByaW50ZWRcbiAqL1xuVGltZXIucHJvdG90eXBlLnByaW50ID0gZnVuY3Rpb24oZGlmZikge1xuICAgIHRoaXMuZWxlbWVudC5yZXBsYWNlQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGlmZiksIHRoaXMuZWxlbWVudC5maXJzdENoaWxkKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVGltZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBRdWl6ID0gcmVxdWlyZShcIi4vUXVpelwiKTtcbnZhciBxO1xuXG5mdW5jdGlvbiBhZGRUaGVtZVNlbGVjdG9yKCkge1xuICAgIC8vYWRkIGxpc3RlbmVyIGZvciB0aGUgdGhlbWUgY2hvb3NlclxuICAgIHZhciBzZWxlY3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RoZW1lLXNlbGVjdG9yXCIpO1xuICAgIHNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYmFzZVN0eWxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNiYXNlU3R5bGVcIik7XG4gICAgICAgIHZhciBsb2FkaW5nU3R5bGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2xvYWRpbmdTdHlsZVwiKTtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJ0aGVtZVwiLCBzZWxlY3QudmFsdWUpO1xuICAgICAgICBpZiAoc2VsZWN0LnZhbHVlID09PSBcInBsYXlmdWxcIikge1xuICAgICAgICAgICAgYmFzZVN0eWxlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L3BsYXlmdWwuY3NzXCIpO1xuICAgICAgICAgICAgbG9hZGluZ1N0eWxlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L3BsYXlmdWxfbG9hZGluZy5jc3NcIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2VsZWN0LnZhbHVlID09PSBcImhhY2tlclwiKSB7XG4gICAgICAgICAgICBiYXNlU3R5bGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvaGFja2VyLmNzc1wiKTtcbiAgICAgICAgICAgIGxvYWRpbmdTdHlsZS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwic3R5bGVzaGVldC9oYWNrZXJfbG9hZGluZy5jc3NcIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2VsZWN0LnZhbHVlID09PSBcInRlcm1pbmFsXCIpIHtcbiAgICAgICAgICAgIGJhc2VTdHlsZS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwic3R5bGVzaGVldC90ZXJtaW5hbC5jc3NcIik7XG4gICAgICAgICAgICBsb2FkaW5nU3R5bGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvdGVybWluYWxfbG9hZGluZy5jc3NcIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2VsZWN0LnZhbHVlID09PSBcIm5vc3R5bGVcIikge1xuICAgICAgICAgICAgYmFzZVN0eWxlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L25vc3R5bGUuY3NzXCIpO1xuICAgICAgICAgICAgbG9hZGluZ1N0eWxlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L25vc3R5bGVfbG9hZGluZy5jc3NcIik7XG4gICAgICAgIH1cblxuICAgICAgICAvL3NldCBuaWNrbmFtZS1pbnB1dCBmb2N1c1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRcIikuZm9jdXMoKTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgdGhlIHN1Ym1pdCBmb3Igbmlja25hbWUgYW5kIHN0YXJ0IHRoZSBxdWl6XG4gKiBAcGFyYW0gZXZlbnQsIHRoZSBldmVudGhhbmRsZXIgZnJvbSB0aGUgbGlzdGVuZXJcbiAqL1xuZnVuY3Rpb24gc3VibWl0KGV2ZW50KSB7XG4gICAgaWYgKGV2ZW50LndoaWNoID09PSAxMyB8fCBldmVudC5rZXlDb2RlID09PSAxMyB8fCBldmVudC50eXBlID09PSBcImNsaWNrXCIpIHtcbiAgICAgICAgLy9kaXNhYmxlIGZvcm1zIGFjdGlvbiBzbyBwYWdlIHdvbnQgcmVsb2FkIHdpdGggZW50ZXJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25pY2tuYW1lXCIpLnZhbHVlO1xuXG4gICAgICAgIC8vaWYgbmlja25hbWUgd3JpdHRlbiwgc3RhcnQgcXVpelxuICAgICAgICBpZiAoaW5wdXQubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgcSA9IG5ldyBRdWl6KGlucHV0KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuaWYgKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwidGhlbWVcIikpIHtcbiAgICB2YXIgdGhlbWUgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInRoZW1lXCIpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYmFzZVN0eWxlXCIpLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L1wiICsgdGhlbWUgKyBcIi5jc3NcIik7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNsb2FkaW5nU3R5bGVcIikuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvXCIgKyB0aGVtZSArIFwiX2xvYWRpbmcuY3NzXCIpO1xufVxuXG52YXIgYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzdWJtaXRcIik7XG52YXIgZm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcUZvcm1cIik7XG5cbmJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc3VibWl0LCB0cnVlKTtcbmZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcImtleXByZXNzXCIsIHN1Ym1pdCwgdHJ1ZSk7XG5cbi8vc2V0IG5pY2tuYW1lLWlucHV0IGZvY3VzIGF0IHN0YXJ0XG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRcIikuZm9jdXMoKTtcblxuYWRkVGhlbWVTZWxlY3RvcigpO1xuIl19
