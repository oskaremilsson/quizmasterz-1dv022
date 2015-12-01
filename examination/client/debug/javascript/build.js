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
    this.date = new Date();
    this.highscore = [];
}

/**
 * Send the request to add the score to the server
 */
GlobalHighscore.prototype.sendToServer = function() {
    var data = {nickname: this.nickname, score: this.score, date: this.date};
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
        hsScore.appendChild(document.createTextNode(tempHs.score));

        //convert the timestamp back to date-object
        tempDate = new Date(tempHs.date);
        hsDate.appendChild(document.createTextNode(tempDate.toLocaleTimeString("sv-se", dateOptions)));

        //if the global highscore is identical with this one add the highlight class
        if (this.date.valueOf() === tempDate.valueOf() && this.nickname === tempHs.nickname && this.score === tempHs.score) {
            template.querySelector("tr").classList.add("highlight");
        }

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

        date = new Date(this.highscore[i].date);
        hsDate.appendChild(document.createTextNode(date.toLocaleTimeString("sv-se", dateOptions)));

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
 *
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
    //element to change the start-info
    var descr = document.querySelector("#start-info");

    //add listener for the theme chooser
    var select = document.querySelector("#theme-selector");
    select.addEventListener("change", function() {
        var baseStyle = document.querySelector("#baseStyle");
        var loadingStyle = document.querySelector("#loadingStyle");
        localStorage.setItem("theme", select.value);
        if (select.value === "playful") {
            baseStyle.setAttribute("href", "stylesheet/playful.css");
            loadingStyle.setAttribute("href", "stylesheet/playful_loading.css");

            if (descr.hasChildNodes()) {
                descr.removeChild(descr.firstChild);
            }
        }
        else if (select.value === "hacker") {
            baseStyle.setAttribute("href", "stylesheet/hacker.css");
            loadingStyle.setAttribute("href", "stylesheet/hacker_loading.css");

            if (descr.hasChildNodes()) {
                descr.removeChild(descr.firstChild);
            }
        }
        else if (select.value === "terminal") {
            baseStyle.setAttribute("href", "stylesheet/terminal.css");
            loadingStyle.setAttribute("href", "stylesheet/terminal_loading.css");

            descr.appendChild(document.createTextNode("Use keypad to choose when alternatives. OBS! Don't use mouseclick in this mode!"));
        }
        else if (select.value === "nostyle") {
            baseStyle.setAttribute("href", "stylesheet/nostyle.css");
            loadingStyle.setAttribute("href", "stylesheet/nostyle_loading.css");

            if (descr.hasChildNodes()) {
                descr.removeChild(descr.firstChild);
            }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMS4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQWpheC5qcyIsImNsaWVudC9zb3VyY2UvanMvR2xvYmFsSGlnaHNjb3JlLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9IaWdoc2NvcmUuanMiLCJjbGllbnQvc291cmNlL2pzL1F1ZXN0aW9uLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9RdWl6LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9UaW1lci5qcyIsImNsaWVudC9zb3VyY2UvanMvYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IE9za2FyIG9uIDIwMTUtMTEtMjMuXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSByZXF1ZXN0cyB2aWEgWE1MSHR0cFJlcXVlc3RcclxuICogQHBhcmFtIGNvbmZpZ3tPYmplY3R9LCBvYmplY3Qgd2l0aCBtZXRob2QgYW5kIHVybCwgcG9zc2libHkgZGF0YVxyXG4gKiBAcGFyYW0gY2FsbGJhY2t7RnVuY3Rpb259LCB0aGUgZnVuY3Rpb24gdG8gY2FsbCBhdCByZXNwb25zZVxyXG4gKi9cclxuZnVuY3Rpb24gcmVxKGNvbmZpZywgY2FsbGJhY2spIHtcclxuICAgIHZhciByID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcblxyXG4gICAgLy9hZGQgZXZlbnRsaXN0ZW5lciBmb3IgcmVzcG9uc2VcclxuICAgIHIuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIGlmIChyLnN0YXR1cyA+PSA0MDApIHtcclxuICAgICAgICAgICAgLy9nb3QgZXJyb3IsIGNhbGwgd2l0aCBlcnJvcmNvZGVcclxuICAgICAgICAgICAgY2FsbGJhY2soci5zdGF0dXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9jYWxsIHRoZSBjYWxsYmFjayBmdW5jdGlvbiB3aXRoIHJlc3BvbnNlVGV4dFxyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHIucmVzcG9uc2VUZXh0KTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vb3BlbiBhIHJlcXVlc3QgZnJvbSB0aGUgY29uZmlnXHJcbiAgICByLm9wZW4oY29uZmlnLm1ldGhvZCwgY29uZmlnLnVybCk7XHJcblxyXG4gICAgaWYgKGNvbmZpZy5kYXRhKSB7XHJcbiAgICAgICAgLy9zZW5kIHRoZSBkYXRhIGFzIEpTT04gdG8gdGhlIHNlcnZlclxyXG4gICAgICAgIHIuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb25cIik7XHJcbiAgICAgICAgci5zZW5kKEpTT04uc3RyaW5naWZ5KGNvbmZpZy5kYXRhKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vc2VuZCByZXF1ZXN0XHJcbiAgICAgICAgci5zZW5kKG51bGwpO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5yZXEgPSByZXE7XHJcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTI0LlxuICogVGhpcyB1c2VzIHNvbWUgYmFjay1lbmQgaHBwLWNvZGUgYW5kIG15c3FsIGhvc3RlZCBvbiBteSBzZXJ2ZXIuXG4gKiBUaGUgY29kZSBmb3IgdGhhdCBjYW4gYmUgc2VlbiBidXQgd29udCBiZSBwdXNoZWQgdG8gZ2l0aHViLlxuICovXG52YXIgQWpheCA9IHJlcXVpcmUoXCIuL0FqYXhcIik7XG5cbi8qKlxuICogR2xvYmFsSGlnaHNjb3JlIGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0gbmlja25hbWV7c3RyaW5nfSwgdGhlIG5pY2tuYW1lXG4gKiBAcGFyYW0gc2NvcmV7c3RyaW5nfSwgdGhlIHNjb3JlKHRpbWUpXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gR2xvYmFsSGlnaHNjb3JlKG5pY2tuYW1lLCBzY29yZSkge1xuICAgIHRoaXMubmlja25hbWUgPSBuaWNrbmFtZTtcbiAgICB0aGlzLnNjb3JlID0gc2NvcmU7XG4gICAgdGhpcy5kYXRlID0gbmV3IERhdGUoKTtcbiAgICB0aGlzLmhpZ2hzY29yZSA9IFtdO1xufVxuXG4vKipcbiAqIFNlbmQgdGhlIHJlcXVlc3QgdG8gYWRkIHRoZSBzY29yZSB0byB0aGUgc2VydmVyXG4gKi9cbkdsb2JhbEhpZ2hzY29yZS5wcm90b3R5cGUuc2VuZFRvU2VydmVyID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRhdGEgPSB7bmlja25hbWU6IHRoaXMubmlja25hbWUsIHNjb3JlOiB0aGlzLnNjb3JlLCBkYXRlOiB0aGlzLmRhdGV9O1xuICAgIHZhciBjb25maWcgPSB7XG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIHVybDogXCIvL3Jvb3Qub3NrYXJlbWlsc3Nvbi5zZS9xdWl6bWFzdGVyei9hZGQucGhwXCIsXG4gICAgICAgIGRhdGE6IGRhdGFcbiAgICB9O1xuXG4gICAgQWpheC5yZXEoY29uZmlnLCB0aGlzLlBPU1RyZXNwb25zZS5iaW5kKHRoaXMpKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHJlc3BvbnNlIGZyb20gc2VuZGluZyBzY29yZSB0byBzZXJ2ZXJcbiAqL1xuR2xvYmFsSGlnaHNjb3JlLnByb3RvdHlwZS5QT1NUcmVzcG9uc2UgPSBmdW5jdGlvbihlcnJvciwgcmVzcG9uc2UpIHtcbiAgICBpZiAocmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIGNvbmZpZyA9IHtcbiAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgICAgIHVybDogXCIvL3Jvb3Qub3NrYXJlbWlsc3Nvbi5zZS9xdWl6bWFzdGVyei9yZWFkLnBocFwiXG4gICAgICAgIH07XG4gICAgICAgIEFqYXgucmVxKGNvbmZpZywgdGhpcy5HRVRyZXNwb25zZS5iaW5kKHRoaXMpKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHJlYWQgdGhlIGhpZ2hzY29yZS1maWxlIGZyb20gc2VydmVyIHN0b3JhZ2VcbiAqL1xuR2xvYmFsSGlnaHNjb3JlLnByb3RvdHlwZS5HRVRyZXNwb25zZSA9IGZ1bmN0aW9uKGVycm9yLCByZXNwb25zZSkge1xuICAgIGlmIChyZXNwb25zZSkge1xuICAgICAgICAvL3BhcnNlIGZpbGUgaW50byBKU09OXG4gICAgICAgIHZhciBqc29uID0gSlNPTi5wYXJzZShyZXNwb25zZSk7XG5cbiAgICAgICAgLy9maWxsIHRoZSBoaWdoc2NvcmUtYXJyYXkgd2l0aCBlbnRyaWVzXG4gICAgICAgIGZvciAodmFyIG5pY2tuYW1lIGluIGpzb24pIHtcbiAgICAgICAgICAgIGlmIChqc29uLmhhc093blByb3BlcnR5KG5pY2tuYW1lKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGlnaHNjb3JlLnB1c2goanNvbltuaWNrbmFtZV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wcmludCgpO1xuICAgIH1cbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gYXBwZW5kIHRoZSBnbG9iYWwgaGlnaHNjb3JlIHRvIHRoZSB0YWJsZVxuICovXG5HbG9iYWxIaWdoc2NvcmUucHJvdG90eXBlLnByaW50ID0gZnVuY3Rpb24oKSB7XG4gICAgLy9nZXQgdGhlIHRhYmxlXG4gICAgdmFyIHRhYmxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNnbG9iYWxIc1wiKTtcblxuICAgIC8vaWYgdGhlIGdsb2JhbCBoaWdoc2NvcmUgaGFzIGVudHJpZXMgYWRkIHRoZW0gdG8gdGhlIHRlbXBsYXRlXG4gICAgaWYgKHRoaXMuaGlnaHNjb3JlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5naHMtdGl0bGVcIikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJHbG9iYWwgSGlnaHNjb3JlXCIpKTtcbiAgICAgICAgdmFyIGdsb2JhbEhzRnJhZyA9IHRoaXMuY3JlYXRlSGlnaHNjb3JlRnJhZ21lbnQoKTtcbiAgICAgICAgdGFibGUuYXBwZW5kQ2hpbGQoZ2xvYmFsSHNGcmFnKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGdldCB0aGUgaGlnaHNjb3JlZnJhZ21lbnQgY29udGFpbmluZyB0aGUgaGlnaHNjb3JlLXBhcnQgb2YgdGFibGVcbiAqIEByZXR1cm5zIHtEb2N1bWVudEZyYWdtZW50fVxuICovXG5HbG9iYWxIaWdoc2NvcmUucHJvdG90eXBlLmNyZWF0ZUhpZ2hzY29yZUZyYWdtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIHRlbXBsYXRlO1xuICAgIHZhciBoc05pY2tuYW1lO1xuICAgIHZhciBoc1Njb3JlO1xuICAgIHZhciBoc0RhdGU7XG4gICAgdmFyIHRlbXBEYXRlO1xuICAgIHZhciB0ZW1wSHM7XG5cbiAgICAvL29wdGlvbnMgZm9yIHRoZSBkYXRlLWZvcm1hdCBpbiB0aGUgIHRhYmxlXG4gICAgdmFyIGRhdGVPcHRpb25zID0ge1xuICAgICAgICB5ZWFyOiBcIm51bWVyaWNcIiwgbW9udGg6IFwibnVtZXJpY1wiLFxuICAgICAgICBkYXk6IFwibnVtZXJpY1wiLCBob3VyOiBcIjItZGlnaXRcIiwgbWludXRlOiBcIjItZGlnaXRcIlxuICAgIH07XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaGlnaHNjb3JlLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHRlbXBIcyA9IHRoaXMuaGlnaHNjb3JlW2ldO1xuXG4gICAgICAgIC8vZ2V0IHRoZSB0ZW1wbGF0ZSBmb3IgYSB0YWJsZS1yb3dcbiAgICAgICAgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLWhpZ2hzY29yZVJvd1wiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgaHNOaWNrbmFtZSA9IHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuaHMtbmlja25hbWVcIik7XG4gICAgICAgIGhzU2NvcmUgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLXNjb3JlXCIpO1xuICAgICAgICBoc0RhdGUgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLWRhdGVcIik7XG5cbiAgICAgICAgLy9hcHBlbmQgdGhlIG5pY2tuYW1lIGFuZCBzY29yZSB0byB0aGUgcm93XG4gICAgICAgIGhzTmlja25hbWUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGVtcEhzLm5pY2tuYW1lKSk7XG4gICAgICAgIGhzU2NvcmUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGVtcEhzLnNjb3JlKSk7XG5cbiAgICAgICAgLy9jb252ZXJ0IHRoZSB0aW1lc3RhbXAgYmFjayB0byBkYXRlLW9iamVjdFxuICAgICAgICB0ZW1wRGF0ZSA9IG5ldyBEYXRlKHRlbXBIcy5kYXRlKTtcbiAgICAgICAgaHNEYXRlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRlbXBEYXRlLnRvTG9jYWxlVGltZVN0cmluZyhcInN2LXNlXCIsIGRhdGVPcHRpb25zKSkpO1xuXG4gICAgICAgIC8vaWYgdGhlIGdsb2JhbCBoaWdoc2NvcmUgaXMgaWRlbnRpY2FsIHdpdGggdGhpcyBvbmUgYWRkIHRoZSBoaWdobGlnaHQgY2xhc3NcbiAgICAgICAgaWYgKHRoaXMuZGF0ZS52YWx1ZU9mKCkgPT09IHRlbXBEYXRlLnZhbHVlT2YoKSAmJiB0aGlzLm5pY2tuYW1lID09PSB0ZW1wSHMubmlja25hbWUgJiYgdGhpcy5zY29yZSA9PT0gdGVtcEhzLnNjb3JlKSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwidHJcIikuY2xhc3NMaXN0LmFkZChcImhpZ2hsaWdodFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vYXBwZW5kIHJvdyB0byBmcmFnbWVudFxuICAgICAgICBmcmFnLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnJhZztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR2xvYmFsSGlnaHNjb3JlO1xuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yNC5cclxuICovXHJcblxyXG4vKipcclxuICogSGlnaHNjb3JlIGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSBuaWNrbmFtZXtzdHJpbmd9LCB0aGUgbmlja25hbWVcclxuICogQHBhcmFtIHNjb3Jle3N0cmluZ30sIHRoZSBzY29yZSh0aW1lKVxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIEhpZ2hzY29yZShuaWNrbmFtZSwgc2NvcmUpIHtcclxuICAgIHRoaXMubmlja25hbWUgPSBuaWNrbmFtZTtcclxuICAgIHRoaXMuc2NvcmUgPSBzY29yZTtcclxuICAgIHRoaXMuaGlnaHNjb3JlID0gW107XHJcblxyXG4gICAgLy9jYWxsIHRvIHJlYWQgaGlnaHNjb3JlIGZpbGUgZnJvbSBsb2NhbCBzdG9yYWdlXHJcbiAgICB0aGlzLnJlYWRGcm9tRmlsZSgpO1xyXG59XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gcmVhZCB0aGUgaGlnaHNjb3JlLWZpbGUgZnJvbSBsb2NhbCBzdG9yYWdlXHJcbiAqL1xyXG5IaWdoc2NvcmUucHJvdG90eXBlLnJlYWRGcm9tRmlsZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIGhzRmlsZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiaHNcIik7XHJcbiAgICBpZiAoaHNGaWxlKSB7XHJcbiAgICAgICAgLy9wYXJzZSBmaWxlIGludG8gSlNPTlxyXG4gICAgICAgIHZhciBqc29uID0gSlNPTi5wYXJzZShoc0ZpbGUpO1xyXG5cclxuICAgICAgICAvL2ZpbGwgdGhlIGhpZ2hzY29yZS1hcnJheSB3aXRoIGVudHJpZXNcclxuICAgICAgICBmb3IgKHZhciBuaWNrbmFtZSBpbiBqc29uKSB7XHJcbiAgICAgICAgICAgIGlmIChqc29uLmhhc093blByb3BlcnR5KG5pY2tuYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5oaWdoc2NvcmUucHVzaChqc29uW25pY2tuYW1lXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gY2hlY2sgaWYgdGhlIHNjb3JlIHRha2VzIGEgcGxhY2UgaW50byB0aGUgaGlnaHNjb3JlXHJcbiAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gKi9cclxuSGlnaHNjb3JlLnByb3RvdHlwZS5pc0hpZ2hzY29yZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIGlzSGlnaHNjb3JlID0gZmFsc2U7XHJcbiAgICBpZiAodGhpcy5oaWdoc2NvcmUubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgLy9oaWdoc2NvcmUgaXMgZW1wdHksIHRoZXJlZm9yZSBuZXcgaGlnaHNjb3JlXHJcbiAgICAgICAgaXNIaWdoc2NvcmUgPSB0cnVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvL2dldCB0aGUgc2NvcmUgbGFzdCBpbiB0aGUgbGlzdFxyXG4gICAgICAgIHZhciBsYXN0U2NvcmUgPSB0aGlzLmhpZ2hzY29yZVt0aGlzLmhpZ2hzY29yZS5sZW5ndGggLSAxXS5zY29yZTtcclxuXHJcbiAgICAgICAgLy9jaGVjayBpZiBoaWdoc2NvcmVcclxuICAgICAgICBpZiAocGFyc2VGbG9hdCh0aGlzLnNjb3JlKSA8IHBhcnNlRmxvYXQobGFzdFNjb3JlKSB8fCB0aGlzLmhpZ2hzY29yZS5sZW5ndGggPCA1KSB7XHJcbiAgICAgICAgICAgIGlzSGlnaHNjb3JlID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGlzSGlnaHNjb3JlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGFkZCB0aGUgc2NvcmUgaW50byB0aGUgbGlzdFxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0sIGFkZGVkIG9yIG5vdFxyXG4gKi9cclxuSGlnaHNjb3JlLnByb3RvdHlwZS5hZGRUb0xpc3QgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBhZGRlZCA9IGZhbHNlO1xyXG5cclxuICAgIC8vY2FsbCB0aGUgaXNIaWdoc2NvcmUgdG8gY2hlY2sgaWYgc2NvcmUgc2hvdWxkIGJlIGFkZGVkXHJcbiAgICBpZiAodGhpcy5pc0hpZ2hzY29yZSgpKSB7XHJcbiAgICAgICAgLy9zYXZlIHRoZSBuaWNrbmFtZSwgc2NvcmUgYW5kIGRhdGVzdGFtcCBpbnRvIGFuIG9iamVjdFxyXG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcclxuICAgICAgICB2YXIgdGhpc1Njb3JlID0ge1xyXG4gICAgICAgICAgICBuaWNrbmFtZTogdGhpcy5uaWNrbmFtZSxcclxuICAgICAgICAgICAgc2NvcmU6IHRoaXMuc2NvcmUsXHJcbiAgICAgICAgICAgIGRhdGU6IGRhdGVcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvL2RlbGV0ZSB0aGUgbGFzdCBwb3NpdGlvbiBvZiB0aGUgaGlnaHNjb3JlIGFycmF5XHJcbiAgICAgICAgaWYgKHRoaXMuaGlnaHNjb3JlLmxlbmd0aCA9PT0gNSkge1xyXG4gICAgICAgICAgICAvL3JlbW92ZSB0aGUgb25lIGxhc3RcclxuICAgICAgICAgICAgdGhpcy5oaWdoc2NvcmUuc3BsaWNlKC0xLCAxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vcHVzaCB0aGUgbmV3IGFuZCBzb3J0IHRoZSBhcnJheVxyXG4gICAgICAgIHRoaXMuaGlnaHNjb3JlLnB1c2godGhpc1Njb3JlKTtcclxuICAgICAgICB0aGlzLmhpZ2hzY29yZSA9IHRoaXMuaGlnaHNjb3JlLnNvcnQoZnVuY3Rpb24oYSwgYikge3JldHVybiBhLnNjb3JlIC0gYi5zY29yZTt9KTtcclxuXHJcbiAgICAgICAgLy9jYWxsIHRvIHNhdmUgaXRcclxuICAgICAgICB0aGlzLnNhdmVUb0ZpbGUoKTtcclxuXHJcbiAgICAgICAgYWRkZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhZGRlZDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBzYXZlIHRoZSBoaWdoc2NvcmUgdG8gbG9jYWwgc3RvcmFnZVxyXG4gKi9cclxuSGlnaHNjb3JlLnByb3RvdHlwZS5zYXZlVG9GaWxlID0gZnVuY3Rpb24oKSB7XHJcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImhzXCIsIEpTT04uc3RyaW5naWZ5KHRoaXMuaGlnaHNjb3JlKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gZ2V0IHRoZSBoaWdoc2NvcmVmcmFnbWVudCBjb250YWluaW5nIHRoZSBoaWdoc2NvcmUtcGFydCBvZiB0YWJsZVxyXG4gKiBAcmV0dXJucyB7RG9jdW1lbnRGcmFnbWVudH1cclxuICovXHJcbkhpZ2hzY29yZS5wcm90b3R5cGUuY3JlYXRlSGlnaHNjb3JlRnJhZ21lbnQgPSBmdW5jdGlvbihpc05ldykge1xyXG4gICAgdmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcbiAgICB2YXIgdGVtcGxhdGU7XHJcbiAgICB2YXIgaHNOaWNrbmFtZTtcclxuICAgIHZhciBoc1Njb3JlO1xyXG4gICAgdmFyIGhzRGF0ZTtcclxuICAgIHZhciBkYXRlO1xyXG4gICAgdmFyIGxhdGVzdEVudHJ5ID0gbmV3IERhdGUodGhpcy5oaWdoc2NvcmVbMF0uZGF0ZSk7XHJcbiAgICB2YXIgaGlnaGxpZ2h0SW5kZXggPSAwO1xyXG5cclxuICAgIC8vb3B0aW9ucyBmb3IgdGhlIGRhdGUtZm9ybWF0IGluIHRoZSAgdGFibGVcclxuICAgIHZhciBkYXRlT3B0aW9ucyA9IHtcclxuICAgICAgICB5ZWFyOiBcIm51bWVyaWNcIiwgbW9udGg6IFwibnVtZXJpY1wiLFxyXG4gICAgICAgIGRheTogXCJudW1lcmljXCIsIGhvdXI6IFwiMi1kaWdpdFwiLCBtaW51dGU6IFwiMi1kaWdpdFwiXHJcbiAgICB9O1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5oaWdoc2NvcmUubGVuZ3RoOyBpICs9IDEpIHtcclxuICAgICAgICAvL2dldCB0aGUgdGVtcGxhdGUgZm9yIGEgdGFibGUtcm93XHJcbiAgICAgICAgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLWhpZ2hzY29yZVJvd1wiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcclxuICAgICAgICBoc05pY2tuYW1lID0gdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5ocy1uaWNrbmFtZVwiKTtcclxuICAgICAgICBoc1Njb3JlID0gdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5ocy1zY29yZVwiKTtcclxuICAgICAgICBoc0RhdGUgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLWRhdGVcIik7XHJcblxyXG4gICAgICAgIC8vYXBwZW5kIHRoZSBuaWNrbmFtZSBhbmQgc2NvcmUgdG8gdGhlIHJvd1xyXG4gICAgICAgIGhzTmlja25hbWUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5oaWdoc2NvcmVbaV0ubmlja25hbWUpKTtcclxuICAgICAgICBoc1Njb3JlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMuaGlnaHNjb3JlW2ldLnNjb3JlKSk7XHJcblxyXG4gICAgICAgIGRhdGUgPSBuZXcgRGF0ZSh0aGlzLmhpZ2hzY29yZVtpXS5kYXRlKTtcclxuICAgICAgICBoc0RhdGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0ZS50b0xvY2FsZVRpbWVTdHJpbmcoXCJzdi1zZVwiLCBkYXRlT3B0aW9ucykpKTtcclxuXHJcbiAgICAgICAgaWYgKGlzTmV3KSB7XHJcbiAgICAgICAgICAgIC8vY2hlY2sgZm9yIHRoZSBsZXRlc3QgZW50cnlcclxuICAgICAgICAgICAgaWYgKGRhdGUudmFsdWVPZigpID4gbGF0ZXN0RW50cnkudmFsdWVPZigpKSB7XHJcbiAgICAgICAgICAgICAgICBoaWdobGlnaHRJbmRleCA9IGk7XHJcbiAgICAgICAgICAgICAgICBsYXRlc3RFbnRyeSA9IGRhdGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vYXBwZW5kIHJvdyB0byBmcmFnbWVudFxyXG4gICAgICAgIGZyYWcuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpc05ldykge1xyXG4gICAgICAgIC8vaGlnaGxpZ2h0IHRoZSBuZXcgaGlnaHNjb3JlIGluIHRoZSBsaXN0XHJcbiAgICAgICAgZnJhZy5xdWVyeVNlbGVjdG9yQWxsKFwidHJcIilbaGlnaGxpZ2h0SW5kZXhdLmNsYXNzTGlzdC5hZGQoXCJoaWdobGlnaHRcIik7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZyYWc7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEhpZ2hzY29yZTtcclxuIiwiXG4vKipcbiAqXG4gKiBDcmVhdGVkIGJ5IE9za2FyIG9uIDIwMTUtMTEtMjMuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIFF1ZXN0aW9uIGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0gb2Jqe09iamVjdH0sIG9iamVjdCB0aGF0IGhvbGRzIGEgcXVlc3Rpb25cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBRdWVzdGlvbihvYmopIHtcbiAgICB0aGlzLmlkID0gb2JqLmlkO1xuICAgIHRoaXMucXVlc3Rpb24gPSBvYmoucXVlc3Rpb247XG4gICAgdGhpcy5hbHQgPSBvYmouYWx0ZXJuYXRpdmVzO1xufVxuXG4vKipcbiAqIEZ1bmN0aW9uYiB0byBwcmVzZW50IHRoZSBxdWVzdGlvblxuICovXG5RdWVzdGlvbi5wcm90b3R5cGUucHJpbnQgPSBmdW5jdGlvbigpIHtcbiAgICAvL3N0YXRlbWVudCB0byBjYWxsIHRoZSByaWdodGZ1bCBwcmludGZ1bmN0aW9uXG4gICAgaWYgKHRoaXMuYWx0KSB7XG4gICAgICAgIHRoaXMucHJpbnRBbHRRdWVzdGlvbigpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5wcmludFF1ZXN0aW9uKCk7XG4gICAgfVxuXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImlucHV0XCIpLmZvY3VzKCk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGNsZWFyIGEgZGl2XG4gKiBAcGFyYW0gZGl2e29iamVjdH0sIHRoZSBkaXYgdG8gY2xlYXJcbiAqL1xuUXVlc3Rpb24ucHJvdG90eXBlLmNsZWFyRGl2ID0gZnVuY3Rpb24oZGl2KSB7XG4gICAgd2hpbGUgKGRpdi5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgZGl2LnJlbW92ZUNoaWxkKGRpdi5sYXN0Q2hpbGQpO1xuICAgIH1cbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gcHJlc2VudCB0aGUgcXVlcnN0aW9uIHRoYXQgaGFzIGFsdGVybmF0aXZlc1xuICovXG5RdWVzdGlvbi5wcm90b3R5cGUucHJpbnRBbHRRdWVzdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIC8vZ2V0IHRoZSB0ZW1wbGF0ZSBhbmQgYXBwZW5kIHRoZSBhbHRlcm5hdGl2ZXNcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLXF1ZXN0aW9uLWFsdFwiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLnFIZWFkXCIpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMucXVlc3Rpb24pKTtcblxuICAgIC8vY2FsbCB0aGUgZnVuY3Rpb24gdGhhdCBoYW5kbGVzIHRoZSBhbHRlcm5hdGl2ZXNcbiAgICB2YXIgaW5wdXRGcmFnID0gdGhpcy5nZXRBbHRGcmFnKCk7XG4gICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIiNxRm9ybVwiKS5pbnNlcnRCZWZvcmUoaW5wdXRGcmFnLCB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiI3N1Ym1pdFwiKSk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHRoZSBhbHRlcm5hdGl2ZXNcbiAqIEByZXR1cm5zIHtEb2N1bWVudEZyYWdtZW50fSwgdGhlIGZyYWdtZW50IGZvciB0aGUgYWx0ZXJuYXRpdmVzXG4gKi9cblF1ZXN0aW9uLnByb3RvdHlwZS5nZXRBbHRGcmFnID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGlucHV0RnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB2YXIgaW5wdXQ7XG4gICAgdmFyIGxhYmVsO1xuICAgIHZhciBmaXJzdCA9IHRydWU7XG5cbiAgICBmb3IgKHZhciBhbHQgaW4gdGhpcy5hbHQpIHtcbiAgICAgICAgaWYgKHRoaXMuYWx0Lmhhc093blByb3BlcnR5KGFsdCkpIHtcbiAgICAgICAgICAgIC8vZ2V0IHRoZSB0ZW1wbGF0ZSBmb3IgYWx0ZXJuYXRpdmVzXG4gICAgICAgICAgICBpbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtYWx0ZXJuYXRpdmVcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG5cbiAgICAgICAgICAgIC8vYXBwZW5kIHRoZSBhbHRlcm5hdGl2ZVxuICAgICAgICAgICAgaWYgKGZpcnN0KSB7XG4gICAgICAgICAgICAgICAgaW5wdXQucXVlcnlTZWxlY3RvcihcImlucHV0XCIpLnNldEF0dHJpYnV0ZShcImNoZWNrZWRcIiwgXCJjaGVja2VkXCIpO1xuICAgICAgICAgICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlucHV0LnF1ZXJ5U2VsZWN0b3IoXCJpbnB1dFwiKS5zZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiLCBhbHQpO1xuICAgICAgICAgICAgbGFiZWwgPSBpbnB1dC5xdWVyeVNlbGVjdG9yKFwibGFiZWxcIik7XG4gICAgICAgICAgICBsYWJlbC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLmFsdFthbHRdKSk7XG5cbiAgICAgICAgICAgIGlucHV0RnJhZy5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHJldHVybiBpbnB1dEZyYWc7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHByZXNlbnQgYSBxdWVzdGlvbiB3aXRoIHRleHQtaW5wdXRcbiAqL1xuUXVlc3Rpb24ucHJvdG90eXBlLnByaW50UXVlc3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICAvL2dldCB0aGUgdGVtcGxhdGUgYW5kIGFwcGVuZCB0aGUgcXVlc3Rpb25cbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLXF1ZXN0aW9uXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIucUhlYWRcIikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5xdWVzdGlvbikpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXN0aW9uO1xuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yMy5cclxuICovXHJcblwidXNlIHN0cmljdFwiO1xyXG52YXIgUXVlc3Rpb24gPSByZXF1aXJlKFwiLi9RdWVzdGlvblwiKTtcclxudmFyIEFqYXggPSByZXF1aXJlKFwiLi9BamF4XCIpO1xyXG52YXIgVGltZXIgPSByZXF1aXJlKFwiLi9UaW1lclwiKTtcclxudmFyIEhpZ2hzY29yZSA9IHJlcXVpcmUoXCIuL0hpZ2hzY29yZVwiKTtcclxudmFyIEdsb2JhbEhpZ2hzY29yZSA9IHJlcXVpcmUoXCIuL0dsb2JhbEhpZ2hzY29yZVwiKTtcclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgdGhlIFF1aXpcclxuICogQHBhcmFtIG5pY2tuYW1le3N0cmluZ30sIG5pY2tuYW1lIHRvIHVzZSBmb3IgaGlnaHNjb3JlXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gUXVpeihuaWNrbmFtZSkge1xyXG4gICAgdGhpcy5uaWNrbmFtZSA9IG5pY2tuYW1lO1xyXG4gICAgdGhpcy50aW1lciA9IHVuZGVmaW5lZDtcclxuICAgIHRoaXMucXVlc3Rpb24gPSB1bmRlZmluZWQ7XHJcbiAgICB0aGlzLm5leHRVUkwgPSBcImh0dHA6Ly92aG9zdDMubG51LnNlOjIwMDgwL3F1ZXN0aW9uLzFcIjtcclxuICAgIHRoaXMuYnV0dG9uID0gdW5kZWZpbmVkO1xyXG4gICAgdGhpcy5mb3JtID0gdW5kZWZpbmVkO1xyXG4gICAgdGhpcy50b3RhbFRpbWUgPSAwO1xyXG5cclxuICAgIC8vcmVxdWVzdCB0aGUgZmlyc3QgcXVlc3Rpb25cclxuICAgIHRoaXMuZ2V0UXVlc3Rpb24oKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIHNlbmQgYSByZXF1ZXN0IGZvciBhIG5ldyBxdWVzdGlvblxyXG4gKi9cclxuUXVpei5wcm90b3R5cGUuZ2V0UXVlc3Rpb24gPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBjb25maWcgPSB7bWV0aG9kOiBcIkdFVFwiLCB1cmw6IHRoaXMubmV4dFVSTH07XHJcbiAgICB2YXIgcmVzcG9uc2VGdW5jdGlvbiA9IHRoaXMucmVzcG9uc2UuYmluZCh0aGlzKTtcclxuXHJcbiAgICBBamF4LnJlcShjb25maWcsIHJlc3BvbnNlRnVuY3Rpb24pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSB0aGUgcmVzcG9uc2UsIHVzZXMgYXMgYXJndW1lbnQgXCJjYWxsYmFja1wiIGluIGEgcmVxdWVzdFxyXG4gKiBAcGFyYW0gZXJyb3J7TnVtYmVyfSwgZXJyb3Jjb2RlLCBudWxsIGlmIG5vIGVycm9yXHJcbiAqIEBwYXJhbSByZXNwb25zZXtzdHJpbmd9LCByZXNwb25zZSBzdHJpbmcgdG8gcGFyc2UgSlNPTiBmcm9tXHJcbiAqL1xyXG5RdWl6LnByb3RvdHlwZS5yZXNwb25zZSA9IGZ1bmN0aW9uKGVycm9yLCByZXNwb25zZSkge1xyXG4gICAgLy9oYW5kbGUgZXJyb3JzICg0MDQgbWVhbnMgbm8gbW9yZSBxdWVzdGlvbnMpXHJcbiAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICAvL3ByZXNlbnQgdGhlIGdhbWVvdmVyLXZpZXcgdG8gdXNlclxyXG4gICAgICAgIHRoaXMuZ2FtZU92ZXIoKTtcclxuICAgIH1cclxuXHJcbiAgICAvL2hhbmRsZSB0aGUgcmVzcG9uc2Ugc3RyaW5nXHJcbiAgICBpZiAocmVzcG9uc2UpIHtcclxuICAgICAgICAvL3Bhc3JlIHRvIEpTT05cclxuICAgICAgICB2YXIgb2JqID0gSlNPTi5wYXJzZShyZXNwb25zZSk7XHJcbiAgICAgICAgdGhpcy5uZXh0VVJMID0gb2JqLm5leHRVUkw7XHJcblxyXG4gICAgICAgIC8vc3RhdGVtZW50IHRvIGNhbGwgdGhlIHJpZ2h0ZnVsIGZ1bmN0aW9uIG9uIHRoZSByZXNwb25zZVxyXG4gICAgICAgIGlmIChvYmoucXVlc3Rpb24pIHtcclxuICAgICAgICAgICAgdGhpcy5yZXNwb25zZVF1ZXN0aW9uKG9iaik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5uZXh0VVJMIHx8IG9iai5tZXNzYWdlID09PSBcIkNvcnJlY3QgYW5zd2VyIVwiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlQW5zd2VyKG9iaik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSBpZiByZXNwb25zZSBpcyBhIHF1ZXN0aW9uXHJcbiAqIEBwYXJhbSBvYmp7T2JqZWN0fSwgb2JqZWN0IHRoYXQgaG9sZHMgdGhlIHF1ZXN0aW9uXHJcbiAqL1xyXG5RdWl6LnByb3RvdHlwZS5yZXNwb25zZVF1ZXN0aW9uID0gZnVuY3Rpb24ob2JqKSB7XHJcbiAgICB2YXIgY29udGVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKTtcclxuICAgIHRoaXMuY2xlYXJEaXYoY29udGVudCk7XHJcblxyXG4gICAgLy9jcmVhdGUgYSBuZXcgcXVlc3Rpb24gZnJvbSBvYmplY3RcclxuICAgIHRoaXMucXVlc3Rpb24gPSBuZXcgUXVlc3Rpb24ob2JqKTtcclxuICAgIHRoaXMucXVlc3Rpb24ucHJpbnQoKTtcclxuXHJcbiAgICAvL2NyZWF0ZSBhIG5ldyB0aW1lciBmb3IgcXVlc3Rpb25cclxuICAgIHRoaXMudGltZXIgPSBuZXcgVGltZXIodGhpcywgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0aW1lciBoMVwiKSwgMjApO1xyXG4gICAgdGhpcy50aW1lci5zdGFydCgpO1xyXG5cclxuICAgIC8vQWRkIGxpbnN0ZW5lcnMgZm9yIHRoZSBmb3JtXHJcbiAgICB0aGlzLmFkZExpc3RlbmVyKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gaGFuZGxlIGlmIHJlc3BvbnNlIGlzIGFuIGFuc3dlclxyXG4gKiBAcGFyYW0gb2Jqe09iamVjdH0sIG9iamVjdCB0aGF0IGhvbGRzIHRoZSBhbnN3ZXJcclxuICovXHJcblF1aXoucHJvdG90eXBlLnJlc3BvbnNlQW5zd2VyID0gZnVuY3Rpb24ob2JqKSB7XHJcbiAgICB2YXIgY29udGVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKTtcclxuICAgIHRoaXMuY2xlYXJEaXYoY29udGVudCk7XHJcblxyXG4gICAgLy9IYW5kbGUgdGhlIHRlbXBsYXRlIGZvciBhbnN3ZXJcclxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtYW5zd2VyXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xyXG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShvYmoubWVzc2FnZSk7XHJcbiAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwicFwiKS5hcHBlbmRDaGlsZCh0ZXh0KTtcclxuXHJcbiAgICBjb250ZW50LmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcclxuXHJcbiAgICBpZiAodGhpcy5uZXh0VVJMKSB7XHJcbiAgICAgICAgLy9SZXF1ZXN0IGEgbmV3IHF1ZXN0aW9uLCBidXQgd2l0aCBhIGRlbGF5XHJcbiAgICAgICAgdmFyIG5ld1F1ZXN0aW9uID0gdGhpcy5nZXRRdWVzdGlvbi5iaW5kKHRoaXMpO1xyXG4gICAgICAgIHNldFRpbWVvdXQobmV3UXVlc3Rpb24sIDEwMDApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdGhpcy5nYW1lQ29tcGxldGVkKCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gYWRkIHRoZSBsaXN0ZW5lciBmb3Igc3VibWl0XHJcbiAqL1xyXG5RdWl6LnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5idXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3N1Ym1pdFwiKTtcclxuICAgIHRoaXMuZm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcUZvcm1cIik7XHJcblxyXG4gICAgdGhpcy5idXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc3VibWl0LmJpbmQodGhpcyksIHRydWUpO1xyXG4gICAgdGhpcy5mb3JtLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlwcmVzc1wiLCB0aGlzLnN1Ym1pdC5iaW5kKHRoaXMpLCB0cnVlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgd2hlbiBzdWJtaXQgaXMgdHJpZ2dlcmVkXHJcbiAqL1xyXG5RdWl6LnByb3RvdHlwZS5zdWJtaXQgPSBmdW5jdGlvbihldmVudCkge1xyXG4gICAgLy9JZiB0aGUgdHJpZ2dlciBpcyBlbnRlciBvciBjbGljayBkbyB0aGUgc3VibWl0XHJcbiAgICBpZiAoZXZlbnQud2hpY2ggPT09IDEzIHx8IGV2ZW50LmtleUNvZGUgPT09IDEzIHx8IGV2ZW50LnR5cGUgPT09IFwiY2xpY2tcIikge1xyXG4gICAgICAgIC8vcHJldmVudCB0aGUgZm9ybSB0byByZWxvYWQgcGFnZSBvbiBlbnRlclxyXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgIHRoaXMudG90YWxUaW1lICs9IHRoaXMudGltZXIuc3RvcCgpO1xyXG4gICAgICAgIHZhciBpbnB1dDtcclxuXHJcbiAgICAgICAgLy9yZW1vdmUgdGhlIGxpc3RlbmVycyB0byBwcmV2ZW50IGRvdWJsZS1zdWJtaXRcclxuICAgICAgICB0aGlzLmJ1dHRvbi5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zdWJtaXQuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy5mb3JtLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlwcmVzc1wiLCB0aGlzLnN1Ym1pdC5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgLy9zYXZlIGlucHV0IGRlcGVuZGluZyBvbiB0aGUgdHlwZSBvZiBxdWVzdGlvblxyXG4gICAgICAgIGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2Fuc3dlclwiKSkge1xyXG4gICAgICAgICAgICAvL2dldCB0aGUgZm9ybSBpbnB1dFxyXG4gICAgICAgICAgICBpbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYW5zd2VyXCIpLnZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy9nZXQgdGhlIGNoZWNrZWQgcmVhZGlvYnV0dG9uXHJcbiAgICAgICAgICAgIGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImlucHV0W25hbWU9J2FsdGVybmF0aXZlJ106Y2hlY2tlZFwiKS52YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vc2V0IHRoZSBjb25maWcgdG8gYmUgc2VudCB0byBzZXJ2ZXIgYW5kIHNlbmQgYSByZXF1ZXN0XHJcbiAgICAgICAgdmFyIGNvbmZpZyA9IHtcclxuICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgdXJsOiB0aGlzLm5leHRVUkwsXHJcbiAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgIGFuc3dlcjogaW5wdXRcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFyIHJlc3BvbnNlRnVuY3Rpb24gPSB0aGlzLnJlc3BvbnNlLmJpbmQodGhpcyk7XHJcbiAgICAgICAgQWpheC5yZXEoY29uZmlnLCByZXNwb25zZUZ1bmN0aW9uKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgdGhlIGdhbWVPdmVyLXZpZXcgYW5kIHByZXNlbnQgaXQgdG8gdXNlclxyXG4gKi9cclxuUXVpei5wcm90b3R5cGUuZ2FtZU92ZXIgPSBmdW5jdGlvbigpIHtcclxuICAgIC8vY3JlYXRlIGEgaGlnaHNjb3JlIG1vZHVsZSB0byBzaG93IGl0IHRvIHRoZSB1c2VyXHJcbiAgICB2YXIgaHMgPSBuZXcgSGlnaHNjb3JlKHRoaXMubmlja25hbWUpO1xyXG4gICAgdGhpcy5jbGVhckRpdihkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikpO1xyXG5cclxuICAgIC8vZ2V0IHRoZSBnYW1lIG92ZXIgdGVtcGxhdGVcclxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtZ2FtZU92ZXJcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XHJcblxyXG4gICAgLy9pZiB0aGUgaGlnaHNjb3JlIGhhcyBlbnRyaWVzIGFkZCB0aGVtIHRvIHRoZSB0ZW1wbGF0ZVxyXG4gICAgaWYgKGhzLmhpZ2hzY29yZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5ocy10aXRsZVwiKS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIkhpZ2hzY29yZVwiKSk7XHJcbiAgICAgICAgdmFyIGhzRnJhZyA9IGhzLmNyZWF0ZUhpZ2hzY29yZUZyYWdtZW50KCk7XHJcbiAgICAgICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcInRhYmxlXCIpLmFwcGVuZENoaWxkKGhzRnJhZyk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGdsb2JhbEhzID0gbmV3IEdsb2JhbEhpZ2hzY29yZSh0aGlzLm5pY2tuYW1lKTtcclxuICAgIGdsb2JhbEhzLnNlbmRUb1NlcnZlcigpO1xyXG5cclxuICAgIC8vYWRkIHRoZSB0ZW1wbGF0ZSB0byBjb250ZW50XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSB0aGUgZ2FtZSBjb21wbGV0ZWQtdmlldyBhbmQgcHJlc2VudCBpdCB0byB0aGUgdXNlclxyXG4gKi9cclxuUXVpei5wcm90b3R5cGUuZ2FtZUNvbXBsZXRlZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLy9jcmVhdGUgbmV3IGhpZ2hzY29yZSBtb2R1bGUgdG8gaGFuZGxlIGl0XHJcbiAgICB2YXIgaHMgPSBuZXcgSGlnaHNjb3JlKHRoaXMubmlja25hbWUsIHRoaXMudG90YWxUaW1lLnRvRml4ZWQoMykpO1xyXG4gICAgdmFyIGlzTmV3ID0gaHMuYWRkVG9MaXN0KCk7XHJcblxyXG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0ZW1wbGF0ZS1xdWl6Q29tcGxldGVkXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xyXG5cclxuICAgIC8vZ2V0IHRoZSBoaWdoc2NvcmUgaWYgdGhlIGhpZ2hzY29yZSBoYXMgZW50cmllc1xyXG4gICAgaWYgKGhzLmhpZ2hzY29yZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5ocy10aXRsZVwiKS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIkhpZ2hzY29yZVwiKSk7XHJcbiAgICAgICAgdmFyIGhzRnJhZyA9IGhzLmNyZWF0ZUhpZ2hzY29yZUZyYWdtZW50KGlzTmV3KTtcclxuICAgICAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwidGFibGVcIikuYXBwZW5kQ2hpbGQoaHNGcmFnKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaXNOZXcpIHtcclxuICAgICAgICB2YXIgbmV3SFMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaDFcIik7XHJcbiAgICAgICAgbmV3SFMuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJOZXcgSGlnaHNjb3JlIVwiKSk7XHJcbiAgICAgICAgdmFyIGRpdiA9IHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCJkaXZcIik7XHJcbiAgICAgICAgZGl2Lmluc2VydEJlZm9yZShuZXdIUywgZGl2LmZpcnN0Q2hpbGQpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuY2xlYXJEaXYoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpKTtcclxuXHJcbiAgICB2YXIgaDEgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLnRpbWVcIik7XHJcbiAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMudG90YWxUaW1lLnRvRml4ZWQoMykpO1xyXG4gICAgaDEuYXBwZW5kQ2hpbGQodGV4dCk7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xyXG5cclxuICAgIC8vYWRkIHRoZSBnbG9iYWwgaGlnaHNjb3JlXHJcbiAgICB2YXIgZ2xvYmFsSHMgPSBuZXcgR2xvYmFsSGlnaHNjb3JlKHRoaXMubmlja25hbWUsIHRoaXMudG90YWxUaW1lLnRvRml4ZWQoMykpO1xyXG4gICAgZ2xvYmFsSHMuc2VuZFRvU2VydmVyKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gY2xlYXIgYSBzcGVjaWZpYyBkaXYgb2YgY2hpbGRzXHJcbiAqIEBwYXJhbSBkaXZ7T2JqZWN0fSwgdGhlIGRpdmVsZW1lbnQgdG8gY2xlYXJcclxuICovXHJcblF1aXoucHJvdG90eXBlLmNsZWFyRGl2ID0gZnVuY3Rpb24oZGl2KSB7XHJcbiAgICB3aGlsZSAoZGl2Lmhhc0NoaWxkTm9kZXMoKSkge1xyXG4gICAgICAgIGRpdi5yZW1vdmVDaGlsZChkaXYubGFzdENoaWxkKTtcclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUXVpejtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yNC5cclxuICovXHJcblxyXG4vKipcclxuICogVGltZXIgY29uc3RydWN0b3JcclxuICogQHBhcmFtIG93bmVye09iamVjdH0sIHRoZSBvd25lci1vYmplY3QgdGhhdCBjcmVhdGVkIHRoZSB0aW1lclxyXG4gKiBAcGFyYW0gZWxlbWVudHtPYmplY3R9LCBlbGVtZW50IHRvIHByaW50IHRoZSB0aW1lciB0b1xyXG4gKiBAcGFyYW0gdGltZXtOdW1iZXJ9LCB0aGUgdGltZSB0byBjb3VudCBkb3duXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gVGltZXIob3duZXIsIGVsZW1lbnQsIHRpbWUpIHtcclxuICAgIHRoaXMudGltZSA9IHRpbWU7XHJcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xyXG4gICAgdGhpcy5vd25lciA9IG93bmVyO1xyXG4gICAgdGhpcy5zdGFydFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgIHRoaXMuaW50ZXJ2YWwgPSB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0aGF0IHN0YXJ0cyBhbiBpbnRlcnZhbCBmb3IgdGhlIHRpbWVyXHJcbiAqL1xyXG5UaW1lci5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcclxuICAgIC8vY2FsbCB0aGUgcnVuIGZ1bmN0aW9uIG9uIGVhY2ggaW50ZXJ2YWxcclxuICAgIHRoaXMuaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCh0aGlzLnJ1bi5iaW5kKHRoaXMpLCAxMDApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGJlIGV4ZWN1dGVkIGVhY2ggaW50ZXJ2YWwgb2YgdGhlIHRpbWVyXHJcbiAqL1xyXG5UaW1lci5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgbm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcblxyXG4gICAgLy9jb3VudCB0aGUgZGlmZmVyZW5jZSBmcm9tIHN0YXJ0IHRvIG5vd1xyXG4gICAgdmFyIGRpZmYgPSAobm93IC0gdGhpcy5zdGFydFRpbWUpIC8gMTAwMDtcclxuXHJcbiAgICAvL2NvdW50IHRoZSB0aW1lIC0gZGlmZmVyZW5jZSB0byBzaG93IGNvdW50ZG93blxyXG4gICAgdmFyIHNob3dUaW1lID0gdGhpcy50aW1lIC0gZGlmZjtcclxuXHJcbiAgICBpZiAoZGlmZiA+PSB0aGlzLnRpbWUpIHtcclxuICAgICAgICAvL3RpbWUgaWYgdXBcclxuICAgICAgICBzaG93VGltZSA9IDA7XHJcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsKTtcclxuXHJcbiAgICAgICAgLy9jYWxsIG93bmVyIGdhbWVPdmVyIHNpbmNlIHRpbWUgaXMgb3V0XHJcbiAgICAgICAgdGhpcy5vd25lci5nYW1lT3ZlcigpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vc2hvdyB0aGUgdGltZXIgd2l0aCBvbmUgZGVjaW1hbFxyXG4gICAgdGhpcy5wcmludChzaG93VGltZS50b0ZpeGVkKDEpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0aGF0IHN0b3BzIHRoZSB0aW1lciBiZWZvcmUgaXRzIG92ZXJcclxuICogQHJldHVybnMge251bWJlcn0sIHRoZSBkaWZmZXJlbmNlIGluIHNlY29uZHNcclxuICovXHJcblRpbWVyLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XHJcbiAgICBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xyXG4gICAgdmFyIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG5cclxuICAgIHJldHVybiAobm93IC0gdGhpcy5zdGFydFRpbWUpIC8gMTAwMDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBzaG93IHRoZSB0aW1lciBhdCB0aGUgZ2l2ZW4gZWxlbWVudFxyXG4gKiBAcGFyYW0gZGlmZntOdW1iZXJ9IHRoZSB0aW1lIHRvIGJlIHByaW50ZWRcclxuICovXHJcblRpbWVyLnByb3RvdHlwZS5wcmludCA9IGZ1bmN0aW9uKGRpZmYpIHtcclxuICAgIHRoaXMuZWxlbWVudC5yZXBsYWNlQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGlmZiksIHRoaXMuZWxlbWVudC5maXJzdENoaWxkKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVGltZXI7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIFF1aXogPSByZXF1aXJlKFwiLi9RdWl6XCIpO1xudmFyIHE7XG5cbmZ1bmN0aW9uIGFkZFRoZW1lU2VsZWN0b3IoKSB7XG4gICAgLy9lbGVtZW50IHRvIGNoYW5nZSB0aGUgc3RhcnQtaW5mb1xuICAgIHZhciBkZXNjciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc3RhcnQtaW5mb1wiKTtcblxuICAgIC8vYWRkIGxpc3RlbmVyIGZvciB0aGUgdGhlbWUgY2hvb3NlclxuICAgIHZhciBzZWxlY3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RoZW1lLXNlbGVjdG9yXCIpO1xuICAgIHNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYmFzZVN0eWxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNiYXNlU3R5bGVcIik7XG4gICAgICAgIHZhciBsb2FkaW5nU3R5bGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2xvYWRpbmdTdHlsZVwiKTtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJ0aGVtZVwiLCBzZWxlY3QudmFsdWUpO1xuICAgICAgICBpZiAoc2VsZWN0LnZhbHVlID09PSBcInBsYXlmdWxcIikge1xuICAgICAgICAgICAgYmFzZVN0eWxlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L3BsYXlmdWwuY3NzXCIpO1xuICAgICAgICAgICAgbG9hZGluZ1N0eWxlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L3BsYXlmdWxfbG9hZGluZy5jc3NcIik7XG5cbiAgICAgICAgICAgIGlmIChkZXNjci5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgICAgICAgICBkZXNjci5yZW1vdmVDaGlsZChkZXNjci5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzZWxlY3QudmFsdWUgPT09IFwiaGFja2VyXCIpIHtcbiAgICAgICAgICAgIGJhc2VTdHlsZS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwic3R5bGVzaGVldC9oYWNrZXIuY3NzXCIpO1xuICAgICAgICAgICAgbG9hZGluZ1N0eWxlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L2hhY2tlcl9sb2FkaW5nLmNzc1wiKTtcblxuICAgICAgICAgICAgaWYgKGRlc2NyLmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgICAgICAgICAgIGRlc2NyLnJlbW92ZUNoaWxkKGRlc2NyLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNlbGVjdC52YWx1ZSA9PT0gXCJ0ZXJtaW5hbFwiKSB7XG4gICAgICAgICAgICBiYXNlU3R5bGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvdGVybWluYWwuY3NzXCIpO1xuICAgICAgICAgICAgbG9hZGluZ1N0eWxlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L3Rlcm1pbmFsX2xvYWRpbmcuY3NzXCIpO1xuXG4gICAgICAgICAgICBkZXNjci5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlVzZSBrZXlwYWQgdG8gY2hvb3NlIHdoZW4gYWx0ZXJuYXRpdmVzLiBPQlMhIERvbid0IHVzZSBtb3VzZWNsaWNrIGluIHRoaXMgbW9kZSFcIikpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNlbGVjdC52YWx1ZSA9PT0gXCJub3N0eWxlXCIpIHtcbiAgICAgICAgICAgIGJhc2VTdHlsZS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwic3R5bGVzaGVldC9ub3N0eWxlLmNzc1wiKTtcbiAgICAgICAgICAgIGxvYWRpbmdTdHlsZS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwic3R5bGVzaGVldC9ub3N0eWxlX2xvYWRpbmcuY3NzXCIpO1xuXG4gICAgICAgICAgICBpZiAoZGVzY3IuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgICAgICAgICAgZGVzY3IucmVtb3ZlQ2hpbGQoZGVzY3IuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvL3NldCBuaWNrbmFtZS1pbnB1dCBmb2N1c1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRcIikuZm9jdXMoKTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgdGhlIHN1Ym1pdCBmb3Igbmlja25hbWUgYW5kIHN0YXJ0IHRoZSBxdWl6XG4gKiBAcGFyYW0gZXZlbnQsIHRoZSBldmVudGhhbmRsZXIgZnJvbSB0aGUgbGlzdGVuZXJcbiAqL1xuZnVuY3Rpb24gc3VibWl0KGV2ZW50KSB7XG4gICAgaWYgKGV2ZW50LndoaWNoID09PSAxMyB8fCBldmVudC5rZXlDb2RlID09PSAxMyB8fCBldmVudC50eXBlID09PSBcImNsaWNrXCIpIHtcbiAgICAgICAgLy9kaXNhYmxlIGZvcm1zIGFjdGlvbiBzbyBwYWdlIHdvbnQgcmVsb2FkIHdpdGggZW50ZXJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25pY2tuYW1lXCIpLnZhbHVlO1xuXG4gICAgICAgIC8vaWYgbmlja25hbWUgd3JpdHRlbiwgc3RhcnQgcXVpelxuICAgICAgICBpZiAoaW5wdXQubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgcSA9IG5ldyBRdWl6KGlucHV0KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuaWYgKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwidGhlbWVcIikpIHtcbiAgICB2YXIgdGhlbWUgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInRoZW1lXCIpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYmFzZVN0eWxlXCIpLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L1wiICsgdGhlbWUgKyBcIi5jc3NcIik7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNsb2FkaW5nU3R5bGVcIikuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvXCIgKyB0aGVtZSArIFwiX2xvYWRpbmcuY3NzXCIpO1xufVxuXG52YXIgYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzdWJtaXRcIik7XG52YXIgZm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcUZvcm1cIik7XG5cbmJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc3VibWl0LCB0cnVlKTtcbmZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcImtleXByZXNzXCIsIHN1Ym1pdCwgdHJ1ZSk7XG5cbi8vc2V0IG5pY2tuYW1lLWlucHV0IGZvY3VzIGF0IHN0YXJ0XG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRcIikuZm9jdXMoKTtcblxuYWRkVGhlbWVTZWxlY3RvcigpO1xuIl19
