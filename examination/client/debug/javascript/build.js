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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMS4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQWpheC5qcyIsImNsaWVudC9zb3VyY2UvanMvR2xvYmFsSGlnaHNjb3JlLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9IaWdoc2NvcmUuanMiLCJjbGllbnQvc291cmNlL2pzL1F1ZXN0aW9uLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9RdWl6LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9UaW1lci5qcyIsImNsaWVudC9zb3VyY2UvanMvYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IE9za2FyIG9uIDIwMTUtMTEtMjMuXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSByZXF1ZXN0cyB2aWEgWE1MSHR0cFJlcXVlc3RcclxuICogQHBhcmFtIGNvbmZpZ3tPYmplY3R9LCBvYmplY3Qgd2l0aCBtZXRob2QgYW5kIHVybCwgcG9zc2libHkgZGF0YVxyXG4gKiBAcGFyYW0gY2FsbGJhY2t7RnVuY3Rpb259LCB0aGUgZnVuY3Rpb24gdG8gY2FsbCBhdCByZXNwb25zZVxyXG4gKi9cclxuZnVuY3Rpb24gcmVxKGNvbmZpZywgY2FsbGJhY2spIHtcclxuICAgIHZhciByID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcblxyXG4gICAgLy9hZGQgZXZlbnRsaXN0ZW5lciBmb3IgcmVzcG9uc2VcclxuICAgIHIuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIGlmIChyLnN0YXR1cyA+PSA0MDApIHtcclxuICAgICAgICAgICAgLy9nb3QgZXJyb3IsIGNhbGwgd2l0aCBlcnJvcmNvZGVcclxuICAgICAgICAgICAgY2FsbGJhY2soci5zdGF0dXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9jYWxsIHRoZSBjYWxsYmFjayBmdW5jdGlvbiB3aXRoIHJlc3BvbnNlVGV4dFxyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHIucmVzcG9uc2VUZXh0KTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vb3BlbiBhIHJlcXVlc3QgZnJvbSB0aGUgY29uZmlnXHJcbiAgICByLm9wZW4oY29uZmlnLm1ldGhvZCwgY29uZmlnLnVybCk7XHJcblxyXG4gICAgaWYgKGNvbmZpZy5kYXRhKSB7XHJcbiAgICAgICAgLy9zZW5kIHRoZSBkYXRhIGFzIEpTT04gdG8gdGhlIHNlcnZlclxyXG4gICAgICAgIHIuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb25cIik7XHJcbiAgICAgICAgci5zZW5kKEpTT04uc3RyaW5naWZ5KGNvbmZpZy5kYXRhKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vc2VuZCByZXF1ZXN0XHJcbiAgICAgICAgci5zZW5kKG51bGwpO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5yZXEgPSByZXE7XHJcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTI0LlxuICogVGhpcyB1c2VzIHNvbWUgYmFjay1lbmQgaHBwLWNvZGUgYW5kIG15c3FsIGhvc3RlZCBvbiBteSBzZXJ2ZXIuXG4gKiBUaGUgY29kZSBmb3IgdGhhdCBjYW4gYmUgc2VlbiBidXQgd29udCBiZSBwdXNoZWQgdG8gZ2l0aHViLlxuICovXG52YXIgQWpheCA9IHJlcXVpcmUoXCIuL0FqYXhcIik7XG5cbi8qKlxuICogR2xvYmFsSGlnaHNjb3JlIGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0gbmlja25hbWV7c3RyaW5nfSwgdGhlIG5pY2tuYW1lXG4gKiBAcGFyYW0gc2NvcmV7c3RyaW5nfSwgdGhlIHNjb3JlKHRpbWUpXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gR2xvYmFsSGlnaHNjb3JlKG5pY2tuYW1lLCBzY29yZSkge1xuICAgIHRoaXMubmlja25hbWUgPSBuaWNrbmFtZTtcbiAgICB0aGlzLnNjb3JlID0gc2NvcmU7XG4gICAgdGhpcy5kYXRlID0gbmV3IERhdGUoKTtcbiAgICB0aGlzLmhpZ2hzY29yZSA9IFtdO1xufVxuXG4vKipcbiAqIFNlbmQgdGhlIHJlcXVlc3QgdG8gYWRkIHRoZSBzY29yZSB0byB0aGUgc2VydmVyXG4gKi9cbkdsb2JhbEhpZ2hzY29yZS5wcm90b3R5cGUuc2VuZFRvU2VydmVyID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRhdGEgPSB7bmlja25hbWU6IHRoaXMubmlja25hbWUsIHNjb3JlOiB0aGlzLnNjb3JlLCBkYXRlOiB0aGlzLmRhdGV9O1xuICAgIHZhciBjb25maWcgPSB7XG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIHVybDogXCIvL3Jvb3Qub3NrYXJlbWlsc3Nvbi5zZS9xdWl6bWFzdGVyei9hZGQucGhwXCIsXG4gICAgICAgIGRhdGE6IGRhdGFcbiAgICB9O1xuXG4gICAgQWpheC5yZXEoY29uZmlnLCB0aGlzLlBPU1RyZXNwb25zZS5iaW5kKHRoaXMpKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHJlc3BvbnNlIGZyb20gc2VuZGluZyBzY29yZSB0byBzZXJ2ZXJcbiAqL1xuR2xvYmFsSGlnaHNjb3JlLnByb3RvdHlwZS5QT1NUcmVzcG9uc2UgPSBmdW5jdGlvbihlcnJvciwgcmVzcG9uc2UpIHtcbiAgICBpZiAocmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIGNvbmZpZyA9IHtcbiAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgICAgIHVybDogXCIvL3Jvb3Qub3NrYXJlbWlsc3Nvbi5zZS9xdWl6bWFzdGVyei9yZWFkLnBocFwiXG4gICAgICAgIH07XG4gICAgICAgIEFqYXgucmVxKGNvbmZpZywgdGhpcy5HRVRyZXNwb25zZS5iaW5kKHRoaXMpKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHJlYWQgdGhlIGhpZ2hzY29yZS1maWxlIGZyb20gc2VydmVyIHN0b3JhZ2VcbiAqL1xuR2xvYmFsSGlnaHNjb3JlLnByb3RvdHlwZS5HRVRyZXNwb25zZSA9IGZ1bmN0aW9uKGVycm9yLCByZXNwb25zZSkge1xuICAgIGlmIChyZXNwb25zZSkge1xuICAgICAgICAvL3BhcnNlIGZpbGUgaW50byBKU09OXG4gICAgICAgIHZhciBqc29uID0gSlNPTi5wYXJzZShyZXNwb25zZSk7XG5cbiAgICAgICAgLy9maWxsIHRoZSBoaWdoc2NvcmUtYXJyYXkgd2l0aCBlbnRyaWVzXG4gICAgICAgIGZvciAodmFyIG5pY2tuYW1lIGluIGpzb24pIHtcbiAgICAgICAgICAgIGlmIChqc29uLmhhc093blByb3BlcnR5KG5pY2tuYW1lKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGlnaHNjb3JlLnB1c2goanNvbltuaWNrbmFtZV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wcmludCgpO1xuICAgIH1cbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gYXBwZW5kIHRoZSBnbG9iYWwgaGlnaHNjb3JlIHRvIHRoZSB0YWJsZVxuICovXG5HbG9iYWxIaWdoc2NvcmUucHJvdG90eXBlLnByaW50ID0gZnVuY3Rpb24oKSB7XG4gICAgLy9nZXQgdGhlIHRhYmxlXG4gICAgdmFyIHRhYmxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNnbG9iYWxIc1wiKTtcblxuICAgIC8vaWYgdGhlIGdsb2JhbCBoaWdoc2NvcmUgaGFzIGVudHJpZXMgYWRkIHRoZW0gdG8gdGhlIHRlbXBsYXRlXG4gICAgaWYgKHRoaXMuaGlnaHNjb3JlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5naHMtdGl0bGVcIikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJHbG9iYWwgSGlnaHNjb3JlXCIpKTtcbiAgICAgICAgdmFyIGdsb2JhbEhzRnJhZyA9IHRoaXMuY3JlYXRlSGlnaHNjb3JlRnJhZ21lbnQoKTtcbiAgICAgICAgdGFibGUuYXBwZW5kQ2hpbGQoZ2xvYmFsSHNGcmFnKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGdldCB0aGUgaGlnaHNjb3JlZnJhZ21lbnQgY29udGFpbmluZyB0aGUgaGlnaHNjb3JlLXBhcnQgb2YgdGFibGVcbiAqIEByZXR1cm5zIHtEb2N1bWVudEZyYWdtZW50fVxuICovXG5HbG9iYWxIaWdoc2NvcmUucHJvdG90eXBlLmNyZWF0ZUhpZ2hzY29yZUZyYWdtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIHRlbXBsYXRlO1xuICAgIHZhciBoc05pY2tuYW1lO1xuICAgIHZhciBoc1Njb3JlO1xuICAgIHZhciBoc0RhdGU7XG4gICAgdmFyIHRlbXBEYXRlO1xuICAgIHZhciB0ZW1wSHM7XG5cbiAgICAvL29wdGlvbnMgZm9yIHRoZSBkYXRlLWZvcm1hdCBpbiB0aGUgIHRhYmxlXG4gICAgdmFyIGRhdGVPcHRpb25zID0ge1xuICAgICAgICB5ZWFyOiBcIm51bWVyaWNcIiwgbW9udGg6IFwibnVtZXJpY1wiLFxuICAgICAgICBkYXk6IFwibnVtZXJpY1wiLCBob3VyOiBcIjItZGlnaXRcIiwgbWludXRlOiBcIjItZGlnaXRcIlxuICAgIH07XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaGlnaHNjb3JlLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHRlbXBIcyA9IHRoaXMuaGlnaHNjb3JlW2ldO1xuXG4gICAgICAgIC8vZ2V0IHRoZSB0ZW1wbGF0ZSBmb3IgYSB0YWJsZS1yb3dcbiAgICAgICAgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLWhpZ2hzY29yZVJvd1wiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgaHNOaWNrbmFtZSA9IHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuaHMtbmlja25hbWVcIik7XG4gICAgICAgIGhzU2NvcmUgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLXNjb3JlXCIpO1xuICAgICAgICBoc0RhdGUgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLWRhdGVcIik7XG5cbiAgICAgICAgLy9hcHBlbmQgdGhlIG5pY2tuYW1lIGFuZCBzY29yZSB0byB0aGUgcm93XG4gICAgICAgIGhzTmlja25hbWUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGVtcEhzLm5pY2tuYW1lKSk7XG4gICAgICAgIGhzU2NvcmUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGVtcEhzLnNjb3JlKSk7XG5cbiAgICAgICAgLy9jb252ZXJ0IHRoZSB0aW1lc3RhbXAgYmFjayB0byBkYXRlLW9iamVjdFxuICAgICAgICB0ZW1wRGF0ZSA9IG5ldyBEYXRlKHRlbXBIcy5kYXRlKTtcbiAgICAgICAgaHNEYXRlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRlbXBEYXRlLnRvTG9jYWxlVGltZVN0cmluZyhcInN2LXNlXCIsIGRhdGVPcHRpb25zKSkpO1xuXG4gICAgICAgIC8vaWYgdGhlIGdsb2JhbCBoaWdoc2NvcmUgaXMgaWRlbnRpY2FsIHdpdGggdGhpcyBvbmUgYWRkIHRoZSBoaWdobGlnaHQgY2xhc3NcbiAgICAgICAgaWYgKHRoaXMuZGF0ZS52YWx1ZU9mKCkgPT09IHRlbXBEYXRlLnZhbHVlT2YoKSAmJiB0aGlzLm5pY2tuYW1lID09PSB0ZW1wSHMubmlja25hbWUgJiYgdGhpcy5zY29yZSA9PT0gdGVtcEhzLnNjb3JlKSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwidHJcIikuY2xhc3NMaXN0LmFkZChcImhpZ2hsaWdodFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vYXBwZW5kIHJvdyB0byBmcmFnbWVudFxuICAgICAgICBmcmFnLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnJhZztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR2xvYmFsSGlnaHNjb3JlO1xuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IE9za2FyIG9uIDIwMTUtMTEtMjQuXG4gKi9cblxuLyoqXG4gKiBIaWdoc2NvcmUgY29uc3RydWN0b3JcbiAqIEBwYXJhbSBuaWNrbmFtZXtzdHJpbmd9LCB0aGUgbmlja25hbWVcbiAqIEBwYXJhbSBzY29yZXtzdHJpbmd9LCB0aGUgc2NvcmUodGltZSlcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBIaWdoc2NvcmUobmlja25hbWUsIHNjb3JlKSB7XG4gICAgdGhpcy5uaWNrbmFtZSA9IG5pY2tuYW1lO1xuICAgIHRoaXMuc2NvcmUgPSBzY29yZTtcbiAgICB0aGlzLmhpZ2hzY29yZSA9IFtdO1xuXG4gICAgLy9jYWxsIHRvIHJlYWQgaGlnaHNjb3JlIGZpbGUgZnJvbSBsb2NhbCBzdG9yYWdlXG4gICAgdGhpcy5yZWFkRnJvbUZpbGUoKTtcbn1cblxuLyoqXG4gKiBGdW5jdGlvbiB0byByZWFkIHRoZSBoaWdoc2NvcmUtZmlsZSBmcm9tIGxvY2FsIHN0b3JhZ2VcbiAqL1xuSGlnaHNjb3JlLnByb3RvdHlwZS5yZWFkRnJvbUZpbGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaHNGaWxlID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJoc1wiKTtcbiAgICBpZiAoaHNGaWxlKSB7XG4gICAgICAgIC8vcGFyc2UgZmlsZSBpbnRvIEpTT05cbiAgICAgICAgdmFyIGpzb24gPSBKU09OLnBhcnNlKGhzRmlsZSk7XG5cbiAgICAgICAgLy9maWxsIHRoZSBoaWdoc2NvcmUtYXJyYXkgd2l0aCBlbnRyaWVzXG4gICAgICAgIGZvciAodmFyIG5pY2tuYW1lIGluIGpzb24pIHtcbiAgICAgICAgICAgIGlmIChqc29uLmhhc093blByb3BlcnR5KG5pY2tuYW1lKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGlnaHNjb3JlLnB1c2goanNvbltuaWNrbmFtZV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBjaGVjayBpZiB0aGUgc2NvcmUgdGFrZXMgYSBwbGFjZSBpbnRvIHRoZSBoaWdoc2NvcmVcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5IaWdoc2NvcmUucHJvdG90eXBlLmlzSGlnaHNjb3JlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGlzSGlnaHNjb3JlID0gZmFsc2U7XG4gICAgaWYgKHRoaXMuaGlnaHNjb3JlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAvL2hpZ2hzY29yZSBpcyBlbXB0eSwgdGhlcmVmb3JlIG5ldyBoaWdoc2NvcmVcbiAgICAgICAgaXNIaWdoc2NvcmUgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vZ2V0IHRoZSBzY29yZSBsYXN0IGluIHRoZSBsaXN0XG4gICAgICAgIHZhciBsYXN0U2NvcmUgPSB0aGlzLmhpZ2hzY29yZVt0aGlzLmhpZ2hzY29yZS5sZW5ndGggLSAxXS5zY29yZTtcblxuICAgICAgICAvL2NoZWNrIGlmIGhpZ2hzY29yZVxuICAgICAgICBpZiAocGFyc2VGbG9hdCh0aGlzLnNjb3JlKSA8IHBhcnNlRmxvYXQobGFzdFNjb3JlKSB8fCB0aGlzLmhpZ2hzY29yZS5sZW5ndGggPCA1KSB7XG4gICAgICAgICAgICBpc0hpZ2hzY29yZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaXNIaWdoc2NvcmU7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGFkZCB0aGUgc2NvcmUgaW50byB0aGUgbGlzdFxuICogQHJldHVybnMge2Jvb2xlYW59LCBhZGRlZCBvciBub3RcbiAqL1xuSGlnaHNjb3JlLnByb3RvdHlwZS5hZGRUb0xpc3QgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYWRkZWQgPSBmYWxzZTtcblxuICAgIC8vY2FsbCB0aGUgaXNIaWdoc2NvcmUgdG8gY2hlY2sgaWYgc2NvcmUgc2hvdWxkIGJlIGFkZGVkXG4gICAgaWYgKHRoaXMuaXNIaWdoc2NvcmUoKSkge1xuICAgICAgICAvL3NhdmUgdGhlIG5pY2tuYW1lLCBzY29yZSBhbmQgZGF0ZXN0YW1wIGludG8gYW4gb2JqZWN0XG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgdmFyIHRoaXNTY29yZSA9IHtcbiAgICAgICAgICAgIG5pY2tuYW1lOiB0aGlzLm5pY2tuYW1lLFxuICAgICAgICAgICAgc2NvcmU6IHRoaXMuc2NvcmUsXG4gICAgICAgICAgICBkYXRlOiBkYXRlXG4gICAgICAgIH07XG5cbiAgICAgICAgLy9kZWxldGUgdGhlIGxhc3QgcG9zaXRpb24gb2YgdGhlIGhpZ2hzY29yZSBhcnJheVxuICAgICAgICBpZiAodGhpcy5oaWdoc2NvcmUubGVuZ3RoID09PSA1KSB7XG4gICAgICAgICAgICAvL3JlbW92ZSB0aGUgb25lIGxhc3RcbiAgICAgICAgICAgIHRoaXMuaGlnaHNjb3JlLnNwbGljZSgtMSwgMSk7XG4gICAgICAgIH1cblxuICAgICAgICAvL3B1c2ggdGhlIG5ldyBhbmQgc29ydCB0aGUgYXJyYXlcbiAgICAgICAgdGhpcy5oaWdoc2NvcmUucHVzaCh0aGlzU2NvcmUpO1xuICAgICAgICB0aGlzLmhpZ2hzY29yZSA9IHRoaXMuaGlnaHNjb3JlLnNvcnQoZnVuY3Rpb24oYSwgYikge3JldHVybiBhLnNjb3JlIC0gYi5zY29yZTt9KTtcblxuICAgICAgICAvL2NhbGwgdG8gc2F2ZSBpdFxuICAgICAgICB0aGlzLnNhdmVUb0ZpbGUoKTtcblxuICAgICAgICBhZGRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFkZGVkO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBzYXZlIHRoZSBoaWdoc2NvcmUgdG8gbG9jYWwgc3RvcmFnZVxuICovXG5IaWdoc2NvcmUucHJvdG90eXBlLnNhdmVUb0ZpbGUgPSBmdW5jdGlvbigpIHtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImhzXCIsIEpTT04uc3RyaW5naWZ5KHRoaXMuaGlnaHNjb3JlKSk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGdldCB0aGUgaGlnaHNjb3JlZnJhZ21lbnQgY29udGFpbmluZyB0aGUgaGlnaHNjb3JlLXBhcnQgb2YgdGFibGVcbiAqIEByZXR1cm5zIHtEb2N1bWVudEZyYWdtZW50fVxuICovXG5IaWdoc2NvcmUucHJvdG90eXBlLmNyZWF0ZUhpZ2hzY29yZUZyYWdtZW50ID0gZnVuY3Rpb24oaXNOZXcpIHtcbiAgICB2YXIgZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB2YXIgdGVtcGxhdGU7XG4gICAgdmFyIGhzTmlja25hbWU7XG4gICAgdmFyIGhzU2NvcmU7XG4gICAgdmFyIGhzRGF0ZTtcbiAgICB2YXIgZGF0ZTtcbiAgICB2YXIgbGF0ZXN0RW50cnkgPSBuZXcgRGF0ZSh0aGlzLmhpZ2hzY29yZVswXS5kYXRlKTtcbiAgICB2YXIgaGlnaGxpZ2h0SW5kZXggPSAwO1xuXG4gICAgLy9vcHRpb25zIGZvciB0aGUgZGF0ZS1mb3JtYXQgaW4gdGhlICB0YWJsZVxuICAgIHZhciBkYXRlT3B0aW9ucyA9IHtcbiAgICAgICAgeWVhcjogXCJudW1lcmljXCIsIG1vbnRoOiBcIm51bWVyaWNcIixcbiAgICAgICAgZGF5OiBcIm51bWVyaWNcIiwgaG91cjogXCIyLWRpZ2l0XCIsIG1pbnV0ZTogXCIyLWRpZ2l0XCJcbiAgICB9O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmhpZ2hzY29yZS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAvL2dldCB0aGUgdGVtcGxhdGUgZm9yIGEgdGFibGUtcm93XG4gICAgICAgIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0ZW1wbGF0ZS1oaWdoc2NvcmVSb3dcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgIGhzTmlja25hbWUgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLW5pY2tuYW1lXCIpO1xuICAgICAgICBoc1Njb3JlID0gdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5ocy1zY29yZVwiKTtcbiAgICAgICAgaHNEYXRlID0gdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5ocy1kYXRlXCIpO1xuXG4gICAgICAgIC8vYXBwZW5kIHRoZSBuaWNrbmFtZSBhbmQgc2NvcmUgdG8gdGhlIHJvd1xuICAgICAgICBoc05pY2tuYW1lLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMuaGlnaHNjb3JlW2ldLm5pY2tuYW1lKSk7XG4gICAgICAgIGhzU2NvcmUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5oaWdoc2NvcmVbaV0uc2NvcmUpKTtcblxuICAgICAgICBkYXRlID0gbmV3IERhdGUodGhpcy5oaWdoc2NvcmVbaV0uZGF0ZSk7XG4gICAgICAgIGhzRGF0ZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRlLnRvTG9jYWxlVGltZVN0cmluZyhcInN2LXNlXCIsIGRhdGVPcHRpb25zKSkpO1xuXG4gICAgICAgIGlmIChpc05ldykge1xuICAgICAgICAgICAgLy9jaGVjayBmb3IgdGhlIGxldGVzdCBlbnRyeVxuICAgICAgICAgICAgaWYgKGRhdGUudmFsdWVPZigpID4gbGF0ZXN0RW50cnkudmFsdWVPZigpKSB7XG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0SW5kZXggPSBpO1xuICAgICAgICAgICAgICAgIGxhdGVzdEVudHJ5ID0gZGF0ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vYXBwZW5kIHJvdyB0byBmcmFnbWVudFxuICAgICAgICBmcmFnLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcbiAgICB9XG5cbiAgICBpZiAoaXNOZXcpIHtcbiAgICAgICAgLy9oaWdobGlnaHQgdGhlIG5ldyBoaWdoc2NvcmUgaW4gdGhlIGxpc3RcbiAgICAgICAgZnJhZy5xdWVyeVNlbGVjdG9yQWxsKFwidHJcIilbaGlnaGxpZ2h0SW5kZXhdLmNsYXNzTGlzdC5hZGQoXCJoaWdobGlnaHRcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZyYWc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhpZ2hzY29yZTtcbiIsIlxuLyoqXG4gKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTIzLlxuICovXG5cInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBRdWVzdGlvbiBjb25zdHJ1Y3RvclxuICogQHBhcmFtIG9iantPYmplY3R9LCBvYmplY3QgdGhhdCBob2xkcyBhIHF1ZXN0aW9uXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gUXVlc3Rpb24ob2JqKSB7XG4gICAgdGhpcy5pZCA9IG9iai5pZDtcbiAgICB0aGlzLnF1ZXN0aW9uID0gb2JqLnF1ZXN0aW9uO1xuICAgIHRoaXMuYWx0ID0gb2JqLmFsdGVybmF0aXZlcztcbn1cblxuLyoqXG4gKiBGdW5jdGlvbmIgdG8gcHJlc2VudCB0aGUgcXVlc3Rpb25cbiAqL1xuUXVlc3Rpb24ucHJvdG90eXBlLnByaW50ID0gZnVuY3Rpb24oKSB7XG4gICAgLy9zdGF0ZW1lbnQgdG8gY2FsbCB0aGUgcmlnaHRmdWwgcHJpbnRmdW5jdGlvblxuICAgIGlmICh0aGlzLmFsdCkge1xuICAgICAgICB0aGlzLnByaW50QWx0UXVlc3Rpb24oKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMucHJpbnRRdWVzdGlvbigpO1xuICAgIH1cblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJpbnB1dFwiKS5mb2N1cygpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBjbGVhciBhIGRpdlxuICogQHBhcmFtIGRpdntvYmplY3R9LCB0aGUgZGl2IHRvIGNsZWFyXG4gKi9cblF1ZXN0aW9uLnByb3RvdHlwZS5jbGVhckRpdiA9IGZ1bmN0aW9uKGRpdikge1xuICAgIHdoaWxlIChkaXYuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgIGRpdi5yZW1vdmVDaGlsZChkaXYubGFzdENoaWxkKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHByZXNlbnQgdGhlIHF1ZXJzdGlvbiB0aGF0IGhhcyBhbHRlcm5hdGl2ZXNcbiAqL1xuUXVlc3Rpb24ucHJvdG90eXBlLnByaW50QWx0UXVlc3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICAvL2dldCB0aGUgdGVtcGxhdGUgYW5kIGFwcGVuZCB0aGUgYWx0ZXJuYXRpdmVzXG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0ZW1wbGF0ZS1xdWVzdGlvbi1hbHRcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5xSGVhZFwiKS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLnF1ZXN0aW9uKSk7XG5cbiAgICAvL2NhbGwgdGhlIGZ1bmN0aW9uIHRoYXQgaGFuZGxlcyB0aGUgYWx0ZXJuYXRpdmVzXG4gICAgdmFyIGlucHV0RnJhZyA9IHRoaXMuZ2V0QWx0RnJhZygpO1xuICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIjcUZvcm1cIikuaW5zZXJ0QmVmb3JlKGlucHV0RnJhZywgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIiNzdWJtaXRcIikpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSB0aGUgYWx0ZXJuYXRpdmVzXG4gKiBAcmV0dXJucyB7RG9jdW1lbnRGcmFnbWVudH0sIHRoZSBmcmFnbWVudCBmb3IgdGhlIGFsdGVybmF0aXZlc1xuICovXG5RdWVzdGlvbi5wcm90b3R5cGUuZ2V0QWx0RnJhZyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpbnB1dEZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIGlucHV0O1xuICAgIHZhciBsYWJlbDtcbiAgICB2YXIgZmlyc3QgPSB0cnVlO1xuXG4gICAgZm9yICh2YXIgYWx0IGluIHRoaXMuYWx0KSB7XG4gICAgICAgIGlmICh0aGlzLmFsdC5oYXNPd25Qcm9wZXJ0eShhbHQpKSB7XG4gICAgICAgICAgICAvL2dldCB0aGUgdGVtcGxhdGUgZm9yIGFsdGVybmF0aXZlc1xuICAgICAgICAgICAgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLWFsdGVybmF0aXZlXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgICAgICAgICAvL2FwcGVuZCB0aGUgYWx0ZXJuYXRpdmVcbiAgICAgICAgICAgIGlmIChmaXJzdCkge1xuICAgICAgICAgICAgICAgIGlucHV0LnF1ZXJ5U2VsZWN0b3IoXCJpbnB1dFwiKS5zZXRBdHRyaWJ1dGUoXCJjaGVja2VkXCIsIFwiY2hlY2tlZFwiKTtcbiAgICAgICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbnB1dC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRcIikuc2V0QXR0cmlidXRlKFwidmFsdWVcIiwgYWx0KTtcbiAgICAgICAgICAgIGxhYmVsID0gaW5wdXQucXVlcnlTZWxlY3RvcihcImxhYmVsXCIpO1xuICAgICAgICAgICAgbGFiZWwuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5hbHRbYWx0XSkpO1xuXG4gICAgICAgICAgICBpbnB1dEZyYWcuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICByZXR1cm4gaW5wdXRGcmFnO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBwcmVzZW50IGEgcXVlc3Rpb24gd2l0aCB0ZXh0LWlucHV0XG4gKi9cblF1ZXN0aW9uLnByb3RvdHlwZS5wcmludFF1ZXN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgLy9nZXQgdGhlIHRlbXBsYXRlIGFuZCBhcHBlbmQgdGhlIHF1ZXN0aW9uXG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0ZW1wbGF0ZS1xdWVzdGlvblwiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLnFIZWFkXCIpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMucXVlc3Rpb24pKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbjtcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IE9za2FyIG9uIDIwMTUtMTEtMjMuXHJcbiAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxudmFyIFF1ZXN0aW9uID0gcmVxdWlyZShcIi4vUXVlc3Rpb25cIik7XHJcbnZhciBBamF4ID0gcmVxdWlyZShcIi4vQWpheFwiKTtcclxudmFyIFRpbWVyID0gcmVxdWlyZShcIi4vVGltZXJcIik7XHJcbnZhciBIaWdoc2NvcmUgPSByZXF1aXJlKFwiLi9IaWdoc2NvcmVcIik7XHJcbnZhciBHbG9iYWxIaWdoc2NvcmUgPSByZXF1aXJlKFwiLi9HbG9iYWxIaWdoc2NvcmVcIik7XHJcblxyXG4vKipcclxuICogQ29uc3RydWN0b3IgZnVuY3Rpb24gZm9yIHRoZSBRdWl6XHJcbiAqIEBwYXJhbSBuaWNrbmFtZXtzdHJpbmd9LCBuaWNrbmFtZSB0byB1c2UgZm9yIGhpZ2hzY29yZVxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIFF1aXoobmlja25hbWUpIHtcclxuICAgIHRoaXMubmlja25hbWUgPSBuaWNrbmFtZTtcclxuICAgIHRoaXMudGltZXIgPSB1bmRlZmluZWQ7XHJcbiAgICB0aGlzLnF1ZXN0aW9uID0gdW5kZWZpbmVkO1xyXG4gICAgdGhpcy5uZXh0VVJMID0gXCJodHRwOi8vdmhvc3QzLmxudS5zZToyMDA4MC9xdWVzdGlvbi8xXCI7XHJcbiAgICB0aGlzLmJ1dHRvbiA9IHVuZGVmaW5lZDtcclxuICAgIHRoaXMuZm9ybSA9IHVuZGVmaW5lZDtcclxuICAgIHRoaXMudG90YWxUaW1lID0gMDtcclxuXHJcbiAgICAvL3JlcXVlc3QgdGhlIGZpcnN0IHF1ZXN0aW9uXHJcbiAgICB0aGlzLmdldFF1ZXN0aW9uKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBzZW5kIGEgcmVxdWVzdCBmb3IgYSBuZXcgcXVlc3Rpb25cclxuICovXHJcblF1aXoucHJvdG90eXBlLmdldFF1ZXN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgY29uZmlnID0ge21ldGhvZDogXCJHRVRcIiwgdXJsOiB0aGlzLm5leHRVUkx9O1xyXG4gICAgdmFyIHJlc3BvbnNlRnVuY3Rpb24gPSB0aGlzLnJlc3BvbnNlLmJpbmQodGhpcyk7XHJcblxyXG4gICAgQWpheC5yZXEoY29uZmlnLCByZXNwb25zZUZ1bmN0aW9uKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgdGhlIHJlc3BvbnNlLCB1c2VzIGFzIGFyZ3VtZW50IFwiY2FsbGJhY2tcIiBpbiBhIHJlcXVlc3RcclxuICogQHBhcmFtIGVycm9ye051bWJlcn0sIGVycm9yY29kZSwgbnVsbCBpZiBubyBlcnJvclxyXG4gKiBAcGFyYW0gcmVzcG9uc2V7c3RyaW5nfSwgcmVzcG9uc2Ugc3RyaW5nIHRvIHBhcnNlIEpTT04gZnJvbVxyXG4gKi9cclxuUXVpei5wcm90b3R5cGUucmVzcG9uc2UgPSBmdW5jdGlvbihlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgIC8vaGFuZGxlIGVycm9ycyAoNDA0IG1lYW5zIG5vIG1vcmUgcXVlc3Rpb25zKVxyXG4gICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgLy9wcmVzZW50IHRoZSBnYW1lb3Zlci12aWV3IHRvIHVzZXJcclxuICAgICAgICB0aGlzLmdhbWVPdmVyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9oYW5kbGUgdGhlIHJlc3BvbnNlIHN0cmluZ1xyXG4gICAgaWYgKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgLy9wYXNyZSB0byBKU09OXHJcbiAgICAgICAgdmFyIG9iaiA9IEpTT04ucGFyc2UocmVzcG9uc2UpO1xyXG4gICAgICAgIHRoaXMubmV4dFVSTCA9IG9iai5uZXh0VVJMO1xyXG5cclxuICAgICAgICAvL3N0YXRlbWVudCB0byBjYWxsIHRoZSByaWdodGZ1bCBmdW5jdGlvbiBvbiB0aGUgcmVzcG9uc2VcclxuICAgICAgICBpZiAob2JqLnF1ZXN0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVzcG9uc2VRdWVzdGlvbihvYmopO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubmV4dFVSTCB8fCBvYmoubWVzc2FnZSA9PT0gXCJDb3JyZWN0IGFuc3dlciFcIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZUFuc3dlcihvYmopO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgaWYgcmVzcG9uc2UgaXMgYSBxdWVzdGlvblxyXG4gKiBAcGFyYW0gb2Jqe09iamVjdH0sIG9iamVjdCB0aGF0IGhvbGRzIHRoZSBxdWVzdGlvblxyXG4gKi9cclxuUXVpei5wcm90b3R5cGUucmVzcG9uc2VRdWVzdGlvbiA9IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgdmFyIGNvbnRlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIik7XHJcbiAgICB0aGlzLmNsZWFyRGl2KGNvbnRlbnQpO1xyXG5cclxuICAgIC8vY3JlYXRlIGEgbmV3IHF1ZXN0aW9uIGZyb20gb2JqZWN0XHJcbiAgICB0aGlzLnF1ZXN0aW9uID0gbmV3IFF1ZXN0aW9uKG9iaik7XHJcbiAgICB0aGlzLnF1ZXN0aW9uLnByaW50KCk7XHJcblxyXG4gICAgLy9jcmVhdGUgYSBuZXcgdGltZXIgZm9yIHF1ZXN0aW9uXHJcbiAgICB0aGlzLnRpbWVyID0gbmV3IFRpbWVyKHRoaXMsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGltZXIgaDFcIiksIDIwKTtcclxuICAgIHRoaXMudGltZXIuc3RhcnQoKTtcclxuXHJcbiAgICAvL0FkZCBsaW5zdGVuZXJzIGZvciB0aGUgZm9ybVxyXG4gICAgdGhpcy5hZGRMaXN0ZW5lcigpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSBpZiByZXNwb25zZSBpcyBhbiBhbnN3ZXJcclxuICogQHBhcmFtIG9iantPYmplY3R9LCBvYmplY3QgdGhhdCBob2xkcyB0aGUgYW5zd2VyXHJcbiAqL1xyXG5RdWl6LnByb3RvdHlwZS5yZXNwb25zZUFuc3dlciA9IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgdmFyIGNvbnRlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIik7XHJcbiAgICB0aGlzLmNsZWFyRGl2KGNvbnRlbnQpO1xyXG5cclxuICAgIC8vSGFuZGxlIHRoZSB0ZW1wbGF0ZSBmb3IgYW5zd2VyXHJcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLWFuc3dlclwiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcclxuICAgIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUob2JqLm1lc3NhZ2UpO1xyXG4gICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcInBcIikuYXBwZW5kQ2hpbGQodGV4dCk7XHJcblxyXG4gICAgY29udGVudC5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XHJcblxyXG4gICAgaWYgKHRoaXMubmV4dFVSTCkge1xyXG4gICAgICAgIC8vUmVxdWVzdCBhIG5ldyBxdWVzdGlvbiwgYnV0IHdpdGggYSBkZWxheVxyXG4gICAgICAgIHZhciBuZXdRdWVzdGlvbiA9IHRoaXMuZ2V0UXVlc3Rpb24uYmluZCh0aGlzKTtcclxuICAgICAgICBzZXRUaW1lb3V0KG5ld1F1ZXN0aW9uLCAxMDAwKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZ2FtZUNvbXBsZXRlZCgpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGFkZCB0aGUgbGlzdGVuZXIgZm9yIHN1Ym1pdFxyXG4gKi9cclxuUXVpei5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzdWJtaXRcIik7XHJcbiAgICB0aGlzLmZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3FGb3JtXCIpO1xyXG5cclxuICAgIHRoaXMuYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnN1Ym1pdC5iaW5kKHRoaXMpLCB0cnVlKTtcclxuICAgIHRoaXMuZm9ybS5hZGRFdmVudExpc3RlbmVyKFwia2V5cHJlc3NcIiwgdGhpcy5zdWJtaXQuYmluZCh0aGlzKSwgdHJ1ZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHdoZW4gc3VibWl0IGlzIHRyaWdnZXJlZFxyXG4gKi9cclxuUXVpei5wcm90b3R5cGUuc3VibWl0ID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgIC8vSWYgdGhlIHRyaWdnZXIgaXMgZW50ZXIgb3IgY2xpY2sgZG8gdGhlIHN1Ym1pdFxyXG4gICAgaWYgKGV2ZW50LndoaWNoID09PSAxMyB8fCBldmVudC5rZXlDb2RlID09PSAxMyB8fCBldmVudC50eXBlID09PSBcImNsaWNrXCIpIHtcclxuICAgICAgICAvL3ByZXZlbnQgdGhlIGZvcm0gdG8gcmVsb2FkIHBhZ2Ugb24gZW50ZXJcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICB0aGlzLnRvdGFsVGltZSArPSB0aGlzLnRpbWVyLnN0b3AoKTtcclxuICAgICAgICB2YXIgaW5wdXQ7XHJcblxyXG4gICAgICAgIC8vcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgdG8gcHJldmVudCBkb3VibGUtc3VibWl0XHJcbiAgICAgICAgdGhpcy5idXR0b24ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc3VibWl0LmJpbmQodGhpcykpO1xyXG4gICAgICAgIHRoaXMuZm9ybS5yZW1vdmVFdmVudExpc3RlbmVyKFwia2V5cHJlc3NcIiwgdGhpcy5zdWJtaXQuYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIC8vc2F2ZSBpbnB1dCBkZXBlbmRpbmcgb24gdGhlIHR5cGUgb2YgcXVlc3Rpb25cclxuICAgICAgICBpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNhbnN3ZXJcIikpIHtcclxuICAgICAgICAgICAgLy9nZXQgdGhlIGZvcm0gaW5wdXRcclxuICAgICAgICAgICAgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2Fuc3dlclwiKS52YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vZ2V0IHRoZSBjaGVja2VkIHJlYWRpb2J1dHRvblxyXG4gICAgICAgICAgICBpbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJpbnB1dFtuYW1lPSdhbHRlcm5hdGl2ZSddOmNoZWNrZWRcIikudmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3NldCB0aGUgY29uZmlnIHRvIGJlIHNlbnQgdG8gc2VydmVyIGFuZCBzZW5kIGEgcmVxdWVzdFxyXG4gICAgICAgIHZhciBjb25maWcgPSB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgIHVybDogdGhpcy5uZXh0VVJMLFxyXG4gICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICBhbnN3ZXI6IGlucHV0XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciByZXNwb25zZUZ1bmN0aW9uID0gdGhpcy5yZXNwb25zZS5iaW5kKHRoaXMpO1xyXG4gICAgICAgIEFqYXgucmVxKGNvbmZpZywgcmVzcG9uc2VGdW5jdGlvbik7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHRoZSBnYW1lT3Zlci12aWV3IGFuZCBwcmVzZW50IGl0IHRvIHVzZXJcclxuICovXHJcblF1aXoucHJvdG90eXBlLmdhbWVPdmVyID0gZnVuY3Rpb24oKSB7XHJcbiAgICAvL2NyZWF0ZSBhIGhpZ2hzY29yZSBtb2R1bGUgdG8gc2hvdyBpdCB0byB0aGUgdXNlclxyXG4gICAgdmFyIGhzID0gbmV3IEhpZ2hzY29yZSh0aGlzLm5pY2tuYW1lKTtcclxuICAgIHRoaXMuY2xlYXJEaXYoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpKTtcclxuXHJcbiAgICAvL2dldCB0aGUgZ2FtZSBvdmVyIHRlbXBsYXRlXHJcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLWdhbWVPdmVyXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xyXG5cclxuICAgIC8vaWYgdGhlIGhpZ2hzY29yZSBoYXMgZW50cmllcyBhZGQgdGhlbSB0byB0aGUgdGVtcGxhdGVcclxuICAgIGlmIChocy5oaWdoc2NvcmUubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuaHMtdGl0bGVcIikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJIaWdoc2NvcmVcIikpO1xyXG4gICAgICAgIHZhciBoc0ZyYWcgPSBocy5jcmVhdGVIaWdoc2NvcmVGcmFnbWVudCgpO1xyXG4gICAgICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCJ0YWJsZVwiKS5hcHBlbmRDaGlsZChoc0ZyYWcpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBnbG9iYWxIcyA9IG5ldyBHbG9iYWxIaWdoc2NvcmUodGhpcy5uaWNrbmFtZSk7XHJcbiAgICBnbG9iYWxIcy5zZW5kVG9TZXJ2ZXIoKTtcclxuXHJcbiAgICAvL2FkZCB0aGUgdGVtcGxhdGUgdG8gY29udGVudFxyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgdGhlIGdhbWUgY29tcGxldGVkLXZpZXcgYW5kIHByZXNlbnQgaXQgdG8gdGhlIHVzZXJcclxuICovXHJcblF1aXoucHJvdG90eXBlLmdhbWVDb21wbGV0ZWQgPSBmdW5jdGlvbigpIHtcclxuICAgIC8vY3JlYXRlIG5ldyBoaWdoc2NvcmUgbW9kdWxlIHRvIGhhbmRsZSBpdFxyXG4gICAgdmFyIGhzID0gbmV3IEhpZ2hzY29yZSh0aGlzLm5pY2tuYW1lLCB0aGlzLnRvdGFsVGltZS50b0ZpeGVkKDMpKTtcclxuICAgIHZhciBpc05ldyA9IGhzLmFkZFRvTGlzdCgpO1xyXG5cclxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtcXVpekNvbXBsZXRlZFwiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcclxuXHJcbiAgICAvL2dldCB0aGUgaGlnaHNjb3JlIGlmIHRoZSBoaWdoc2NvcmUgaGFzIGVudHJpZXNcclxuICAgIGlmIChocy5oaWdoc2NvcmUubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuaHMtdGl0bGVcIikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJIaWdoc2NvcmVcIikpO1xyXG4gICAgICAgIHZhciBoc0ZyYWcgPSBocy5jcmVhdGVIaWdoc2NvcmVGcmFnbWVudChpc05ldyk7XHJcbiAgICAgICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcInRhYmxlXCIpLmFwcGVuZENoaWxkKGhzRnJhZyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlzTmV3KSB7XHJcbiAgICAgICAgdmFyIG5ld0hTID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImgxXCIpO1xyXG4gICAgICAgIG5ld0hTLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiTmV3IEhpZ2hzY29yZSFcIikpO1xyXG4gICAgICAgIHZhciBkaXYgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiZGl2XCIpO1xyXG4gICAgICAgIGRpdi5pbnNlcnRCZWZvcmUobmV3SFMsIGRpdi5maXJzdENoaWxkKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmNsZWFyRGl2KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKSk7XHJcblxyXG4gICAgdmFyIGgxID0gdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi50aW1lXCIpO1xyXG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLnRvdGFsVGltZS50b0ZpeGVkKDMpKTtcclxuICAgIGgxLmFwcGVuZENoaWxkKHRleHQpO1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcclxuXHJcbiAgICAvL2FkZCB0aGUgZ2xvYmFsIGhpZ2hzY29yZVxyXG4gICAgdmFyIGdsb2JhbEhzID0gbmV3IEdsb2JhbEhpZ2hzY29yZSh0aGlzLm5pY2tuYW1lLCB0aGlzLnRvdGFsVGltZS50b0ZpeGVkKDMpKTtcclxuICAgIGdsb2JhbEhzLnNlbmRUb1NlcnZlcigpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGNsZWFyIGEgc3BlY2lmaWMgZGl2IG9mIGNoaWxkc1xyXG4gKiBAcGFyYW0gZGl2e09iamVjdH0sIHRoZSBkaXZlbGVtZW50IHRvIGNsZWFyXHJcbiAqL1xyXG5RdWl6LnByb3RvdHlwZS5jbGVhckRpdiA9IGZ1bmN0aW9uKGRpdikge1xyXG4gICAgd2hpbGUgKGRpdi5oYXNDaGlsZE5vZGVzKCkpIHtcclxuICAgICAgICBkaXYucmVtb3ZlQ2hpbGQoZGl2Lmxhc3RDaGlsZCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFF1aXo7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IE9za2FyIG9uIDIwMTUtMTEtMjQuXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFRpbWVyIGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSBvd25lcntPYmplY3R9LCB0aGUgb3duZXItb2JqZWN0IHRoYXQgY3JlYXRlZCB0aGUgdGltZXJcclxuICogQHBhcmFtIGVsZW1lbnR7T2JqZWN0fSwgZWxlbWVudCB0byBwcmludCB0aGUgdGltZXIgdG9cclxuICogQHBhcmFtIHRpbWV7TnVtYmVyfSwgdGhlIHRpbWUgdG8gY291bnQgZG93blxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIFRpbWVyKG93bmVyLCBlbGVtZW50LCB0aW1lKSB7XHJcbiAgICB0aGlzLnRpbWUgPSB0aW1lO1xyXG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcclxuICAgIHRoaXMub3duZXIgPSBvd25lcjtcclxuICAgIHRoaXMuc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICB0aGlzLmludGVydmFsID0gdW5kZWZpbmVkO1xyXG59XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdGhhdCBzdGFydHMgYW4gaW50ZXJ2YWwgZm9yIHRoZSB0aW1lclxyXG4gKi9cclxuVGltZXIucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAvL2NhbGwgdGhlIHJ1biBmdW5jdGlvbiBvbiBlYWNoIGludGVydmFsXHJcbiAgICB0aGlzLmludGVydmFsID0gc2V0SW50ZXJ2YWwodGhpcy5ydW4uYmluZCh0aGlzKSwgMTAwKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBiZSBleGVjdXRlZCBlYWNoIGludGVydmFsIG9mIHRoZSB0aW1lclxyXG4gKi9cclxuVGltZXIucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG5cclxuICAgIC8vY291bnQgdGhlIGRpZmZlcmVuY2UgZnJvbSBzdGFydCB0byBub3dcclxuICAgIHZhciBkaWZmID0gKG5vdyAtIHRoaXMuc3RhcnRUaW1lKSAvIDEwMDA7XHJcblxyXG4gICAgLy9jb3VudCB0aGUgdGltZSAtIGRpZmZlcmVuY2UgdG8gc2hvdyBjb3VudGRvd25cclxuICAgIHZhciBzaG93VGltZSA9IHRoaXMudGltZSAtIGRpZmY7XHJcblxyXG4gICAgaWYgKGRpZmYgPj0gdGhpcy50aW1lKSB7XHJcbiAgICAgICAgLy90aW1lIGlmIHVwXHJcbiAgICAgICAgc2hvd1RpbWUgPSAwO1xyXG4gICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbCk7XHJcblxyXG4gICAgICAgIC8vY2FsbCBvd25lciBnYW1lT3ZlciBzaW5jZSB0aW1lIGlzIG91dFxyXG4gICAgICAgIHRoaXMub3duZXIuZ2FtZU92ZXIoKTtcclxuICAgIH1cclxuXHJcbiAgICAvL3Nob3cgdGhlIHRpbWVyIHdpdGggb25lIGRlY2ltYWxcclxuICAgIHRoaXMucHJpbnQoc2hvd1RpbWUudG9GaXhlZCgxKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdGhhdCBzdG9wcyB0aGUgdGltZXIgYmVmb3JlIGl0cyBvdmVyXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9LCB0aGUgZGlmZmVyZW5jZSBpbiBzZWNvbmRzXHJcbiAqL1xyXG5UaW1lci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsKTtcclxuICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuXHJcbiAgICByZXR1cm4gKG5vdyAtIHRoaXMuc3RhcnRUaW1lKSAvIDEwMDA7XHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gc2hvdyB0aGUgdGltZXIgYXQgdGhlIGdpdmVuIGVsZW1lbnRcclxuICogQHBhcmFtIGRpZmZ7TnVtYmVyfSB0aGUgdGltZSB0byBiZSBwcmludGVkXHJcbiAqL1xyXG5UaW1lci5wcm90b3R5cGUucHJpbnQgPSBmdW5jdGlvbihkaWZmKSB7XHJcbiAgICB0aGlzLmVsZW1lbnQucmVwbGFjZUNoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRpZmYpLCB0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRpbWVyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBRdWl6ID0gcmVxdWlyZShcIi4vUXVpelwiKTtcbnZhciBxO1xuXG5mdW5jdGlvbiBhZGRUaGVtZVNlbGVjdG9yKCkge1xuICAgIC8vZWxlbWVudCB0byBjaGFuZ2UgdGhlIHN0YXJ0LWluZm9cbiAgICB2YXIgZGVzY3IgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3N0YXJ0LWluZm9cIik7XG5cbiAgICAvL2FkZCBsaXN0ZW5lciBmb3IgdGhlIHRoZW1lIGNob29zZXJcbiAgICB2YXIgc2VsZWN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0aGVtZS1zZWxlY3RvclwiKTtcbiAgICBzZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGJhc2VTdHlsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYmFzZVN0eWxlXCIpO1xuICAgICAgICB2YXIgbG9hZGluZ1N0eWxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNsb2FkaW5nU3R5bGVcIik7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwidGhlbWVcIiwgc2VsZWN0LnZhbHVlKTtcbiAgICAgICAgaWYgKHNlbGVjdC52YWx1ZSA9PT0gXCJwbGF5ZnVsXCIpIHtcbiAgICAgICAgICAgIGJhc2VTdHlsZS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwic3R5bGVzaGVldC9wbGF5ZnVsLmNzc1wiKTtcbiAgICAgICAgICAgIGxvYWRpbmdTdHlsZS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwic3R5bGVzaGVldC9wbGF5ZnVsX2xvYWRpbmcuY3NzXCIpO1xuXG4gICAgICAgICAgICBpZiAoZGVzY3IuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgICAgICAgICAgZGVzY3IucmVtb3ZlQ2hpbGQoZGVzY3IuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2VsZWN0LnZhbHVlID09PSBcImhhY2tlclwiKSB7XG4gICAgICAgICAgICBiYXNlU3R5bGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvaGFja2VyLmNzc1wiKTtcbiAgICAgICAgICAgIGxvYWRpbmdTdHlsZS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwic3R5bGVzaGVldC9oYWNrZXJfbG9hZGluZy5jc3NcIik7XG5cbiAgICAgICAgICAgIGlmIChkZXNjci5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgICAgICAgICBkZXNjci5yZW1vdmVDaGlsZChkZXNjci5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzZWxlY3QudmFsdWUgPT09IFwidGVybWluYWxcIikge1xuICAgICAgICAgICAgYmFzZVN0eWxlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L3Rlcm1pbmFsLmNzc1wiKTtcbiAgICAgICAgICAgIGxvYWRpbmdTdHlsZS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwic3R5bGVzaGVldC90ZXJtaW5hbF9sb2FkaW5nLmNzc1wiKTtcblxuICAgICAgICAgICAgZGVzY3IuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJVc2Uga2V5cGFkIHRvIGNob29zZSB3aGVuIGFsdGVybmF0aXZlcy4gT0JTISBEb24ndCB1c2UgbW91c2VjbGljayBpbiB0aGlzIG1vZGUhXCIpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzZWxlY3QudmFsdWUgPT09IFwibm9zdHlsZVwiKSB7XG4gICAgICAgICAgICBiYXNlU3R5bGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvbm9zdHlsZS5jc3NcIik7XG4gICAgICAgICAgICBsb2FkaW5nU3R5bGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvbm9zdHlsZV9sb2FkaW5nLmNzc1wiKTtcblxuICAgICAgICAgICAgaWYgKGRlc2NyLmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgICAgICAgICAgIGRlc2NyLnJlbW92ZUNoaWxkKGRlc2NyLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy9zZXQgbmlja25hbWUtaW5wdXQgZm9jdXNcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImlucHV0XCIpLmZvY3VzKCk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHRoZSBzdWJtaXQgZm9yIG5pY2tuYW1lIGFuZCBzdGFydCB0aGUgcXVpelxuICogQHBhcmFtIGV2ZW50LCB0aGUgZXZlbnRoYW5kbGVyIGZyb20gdGhlIGxpc3RlbmVyXG4gKi9cbmZ1bmN0aW9uIHN1Ym1pdChldmVudCkge1xuICAgIGlmIChldmVudC53aGljaCA9PT0gMTMgfHwgZXZlbnQua2V5Q29kZSA9PT0gMTMgfHwgZXZlbnQudHlwZSA9PT0gXCJjbGlja1wiKSB7XG4gICAgICAgIC8vZGlzYWJsZSBmb3JtcyBhY3Rpb24gc28gcGFnZSB3b250IHJlbG9hZCB3aXRoIGVudGVyXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgdmFyIGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNuaWNrbmFtZVwiKS52YWx1ZTtcblxuICAgICAgICAvL2lmIG5pY2tuYW1lIHdyaXR0ZW4sIHN0YXJ0IHF1aXpcbiAgICAgICAgaWYgKGlucHV0Lmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIHEgPSBuZXcgUXVpeihpbnB1dCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmlmIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInRoZW1lXCIpKSB7XG4gICAgdmFyIHRoZW1lID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJ0aGVtZVwiKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2Jhc2VTdHlsZVwiKS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwic3R5bGVzaGVldC9cIiArIHRoZW1lICsgXCIuY3NzXCIpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbG9hZGluZ1N0eWxlXCIpLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L1wiICsgdGhlbWUgKyBcIl9sb2FkaW5nLmNzc1wiKTtcbn1cblxudmFyIGJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc3VibWl0XCIpO1xudmFyIGZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3FGb3JtXCIpO1xuXG5idXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHN1Ym1pdCwgdHJ1ZSk7XG5mb3JtLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlwcmVzc1wiLCBzdWJtaXQsIHRydWUpO1xuXG4vL3NldCBuaWNrbmFtZS1pbnB1dCBmb2N1cyBhdCBzdGFydFxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImlucHV0XCIpLmZvY3VzKCk7XG5cbmFkZFRoZW1lU2VsZWN0b3IoKTtcbiJdfQ==
