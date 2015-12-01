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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMS4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQWpheC5qcyIsImNsaWVudC9zb3VyY2UvanMvR2xvYmFsSGlnaHNjb3JlLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9IaWdoc2NvcmUuanMiLCJjbGllbnQvc291cmNlL2pzL1F1ZXN0aW9uLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9RdWl6LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9UaW1lci5qcyIsImNsaWVudC9zb3VyY2UvanMvYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yMy5cclxuICovXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHJlcXVlc3RzIHZpYSBYTUxIdHRwUmVxdWVzdFxyXG4gKiBAcGFyYW0gY29uZmlne09iamVjdH0sIG9iamVjdCB3aXRoIG1ldGhvZCBhbmQgdXJsLCBwb3NzaWJseSBkYXRhXHJcbiAqIEBwYXJhbSBjYWxsYmFja3tGdW5jdGlvbn0sIHRoZSBmdW5jdGlvbiB0byBjYWxsIGF0IHJlc3BvbnNlXHJcbiAqL1xyXG5mdW5jdGlvbiByZXEoY29uZmlnLCBjYWxsYmFjaykge1xyXG4gICAgdmFyIHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuXHJcbiAgICAvL2FkZCBldmVudGxpc3RlbmVyIGZvciByZXNwb25zZVxyXG4gICAgci5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgaWYgKHIuc3RhdHVzID49IDQwMCkge1xyXG4gICAgICAgICAgICAvL2dvdCBlcnJvciwgY2FsbCB3aXRoIGVycm9yY29kZVxyXG4gICAgICAgICAgICBjYWxsYmFjayhyLnN0YXR1cyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL2NhbGwgdGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHdpdGggcmVzcG9uc2VUZXh0XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgci5yZXNwb25zZVRleHQpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy9vcGVuIGEgcmVxdWVzdCBmcm9tIHRoZSBjb25maWdcclxuICAgIHIub3Blbihjb25maWcubWV0aG9kLCBjb25maWcudXJsKTtcclxuXHJcbiAgICBpZiAoY29uZmlnLmRhdGEpIHtcclxuICAgICAgICAvL3NlbmQgdGhlIGRhdGEgYXMgSlNPTiB0byB0aGUgc2VydmVyXHJcbiAgICAgICAgci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcclxuICAgICAgICByLnNlbmQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLmRhdGEpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy9zZW5kIHJlcXVlc3RcclxuICAgICAgICByLnNlbmQobnVsbCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLnJlcSA9IHJlcTtcclxuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IE9za2FyIG9uIDIwMTUtMTEtMjQuXG4gKiBUaGlzIHVzZXMgc29tZSBiYWNrLWVuZCBocHAtY29kZSBhbmQgbXlzcWwgaG9zdGVkIG9uIG15IHNlcnZlci5cbiAqIFRoZSBjb2RlIGZvciB0aGF0IGNhbiBiZSBzZWVuIGJ1dCB3b250IGJlIHB1c2hlZCB0byBnaXRodWIuXG4gKi9cbnZhciBBamF4ID0gcmVxdWlyZShcIi4vQWpheFwiKTtcblxuLyoqXG4gKiBHbG9iYWxIaWdoc2NvcmUgY29uc3RydWN0b3JcbiAqIEBwYXJhbSBuaWNrbmFtZXtzdHJpbmd9LCB0aGUgbmlja25hbWVcbiAqIEBwYXJhbSBzY29yZXtzdHJpbmd9LCB0aGUgc2NvcmUodGltZSlcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBHbG9iYWxIaWdoc2NvcmUobmlja25hbWUsIHNjb3JlKSB7XG4gICAgdGhpcy5uaWNrbmFtZSA9IG5pY2tuYW1lO1xuICAgIHRoaXMuc2NvcmUgPSBzY29yZTtcbiAgICB0aGlzLmhpZ2hzY29yZSA9IFtdO1xufVxuXG4vKipcbiAqIFNlbmQgdGhlIHJlcXVlc3QgdG8gYWRkIHRoZSBzY29yZSB0byB0aGUgc2VydmVyXG4gKi9cbkdsb2JhbEhpZ2hzY29yZS5wcm90b3R5cGUuc2VuZFRvU2VydmVyID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIHZhciBkYXRhID0ge25pY2tuYW1lOiB0aGlzLm5pY2tuYW1lLCBzY29yZTogdGhpcy5zY29yZSwgZGF0ZTogZGF0ZX07XG4gICAgdmFyIGNvbmZpZyA9IHtcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgdXJsOiBcIi8vcm9vdC5vc2thcmVtaWxzc29uLnNlL3F1aXptYXN0ZXJ6L2FkZC5waHBcIixcbiAgICAgICAgZGF0YTogZGF0YVxuICAgIH07XG5cbiAgICBBamF4LnJlcShjb25maWcsIHRoaXMuUE9TVHJlc3BvbnNlLmJpbmQodGhpcykpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgcmVzcG9uc2UgZnJvbSBzZW5kaW5nIHNjb3JlIHRvIHNlcnZlclxuICovXG5HbG9iYWxIaWdoc2NvcmUucHJvdG90eXBlLlBPU1RyZXNwb25zZSA9IGZ1bmN0aW9uKGVycm9yLCByZXNwb25zZSkge1xuICAgIGlmIChyZXNwb25zZSkge1xuICAgICAgICB2YXIgY29uZmlnID0ge1xuICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgICAgICAgICAgdXJsOiBcIi8vcm9vdC5vc2thcmVtaWxzc29uLnNlL3F1aXptYXN0ZXJ6L3JlYWQucGhwXCJcbiAgICAgICAgfTtcbiAgICAgICAgQWpheC5yZXEoY29uZmlnLCB0aGlzLkdFVHJlc3BvbnNlLmJpbmQodGhpcykpO1xuICAgIH1cbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gcmVhZCB0aGUgaGlnaHNjb3JlLWZpbGUgZnJvbSBzZXJ2ZXIgc3RvcmFnZVxuICovXG5HbG9iYWxIaWdoc2NvcmUucHJvdG90eXBlLkdFVHJlc3BvbnNlID0gZnVuY3Rpb24oZXJyb3IsIHJlc3BvbnNlKSB7XG4gICAgaWYgKHJlc3BvbnNlKSB7XG4gICAgICAgIC8vcGFyc2UgZmlsZSBpbnRvIEpTT05cbiAgICAgICAgdmFyIGpzb24gPSBKU09OLnBhcnNlKHJlc3BvbnNlKTtcblxuICAgICAgICAvL2ZpbGwgdGhlIGhpZ2hzY29yZS1hcnJheSB3aXRoIGVudHJpZXNcbiAgICAgICAgZm9yICh2YXIgbmlja25hbWUgaW4ganNvbikge1xuICAgICAgICAgICAgaWYgKGpzb24uaGFzT3duUHJvcGVydHkobmlja25hbWUpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oaWdoc2NvcmUucHVzaChqc29uW25pY2tuYW1lXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnByaW50KCk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBhcHBlbmQgdGhlIGdsb2JhbCBoaWdoc2NvcmUgdG8gdGhlIHRhYmxlXG4gKi9cbkdsb2JhbEhpZ2hzY29yZS5wcm90b3R5cGUucHJpbnQgPSBmdW5jdGlvbigpIHtcbiAgICAvL2dldCB0aGUgdGFibGVcbiAgICB2YXIgdGFibGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2dsb2JhbEhzXCIpO1xuXG4gICAgLy9pZiB0aGUgZ2xvYmFsIGhpZ2hzY29yZSBoYXMgZW50cmllcyBhZGQgdGhlbSB0byB0aGUgdGVtcGxhdGVcbiAgICBpZiAodGhpcy5oaWdoc2NvcmUubGVuZ3RoID4gMCkge1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmdocy10aXRsZVwiKS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIkdsb2JhbCBIaWdoc2NvcmVcIikpO1xuICAgICAgICB2YXIgZ2xvYmFsSHNGcmFnID0gdGhpcy5jcmVhdGVIaWdoc2NvcmVGcmFnbWVudCgpO1xuICAgICAgICB0YWJsZS5hcHBlbmRDaGlsZChnbG9iYWxIc0ZyYWcpO1xuICAgIH1cbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gZ2V0IHRoZSBoaWdoc2NvcmVmcmFnbWVudCBjb250YWluaW5nIHRoZSBoaWdoc2NvcmUtcGFydCBvZiB0YWJsZVxuICogQHJldHVybnMge0RvY3VtZW50RnJhZ21lbnR9XG4gKi9cbkdsb2JhbEhpZ2hzY29yZS5wcm90b3R5cGUuY3JlYXRlSGlnaHNjb3JlRnJhZ21lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB2YXIgdGVtcGxhdGU7XG4gICAgdmFyIGhzTmlja25hbWU7XG4gICAgdmFyIGhzU2NvcmU7XG4gICAgdmFyIGhzRGF0ZTtcbiAgICB2YXIgZGF0ZTtcblxuICAgIC8vb3B0aW9ucyBmb3IgdGhlIGRhdGUtZm9ybWF0IGluIHRoZSAgdGFibGVcbiAgICB2YXIgZGF0ZU9wdGlvbnMgPSB7XG4gICAgICAgIHllYXI6IFwibnVtZXJpY1wiLCBtb250aDogXCJudW1lcmljXCIsXG4gICAgICAgIGRheTogXCJudW1lcmljXCIsIGhvdXI6IFwiMi1kaWdpdFwiLCBtaW51dGU6IFwiMi1kaWdpdFwiXG4gICAgfTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5oaWdoc2NvcmUubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgLy9nZXQgdGhlIHRlbXBsYXRlIGZvciBhIHRhYmxlLXJvd1xuICAgICAgICB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtaGlnaHNjb3JlUm93XCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICBoc05pY2tuYW1lID0gdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5ocy1uaWNrbmFtZVwiKTtcbiAgICAgICAgaHNTY29yZSA9IHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuaHMtc2NvcmVcIik7XG4gICAgICAgIGhzRGF0ZSA9IHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuaHMtZGF0ZVwiKTtcblxuICAgICAgICAvL2FwcGVuZCB0aGUgbmlja25hbWUgYW5kIHNjb3JlIHRvIHRoZSByb3dcbiAgICAgICAgaHNOaWNrbmFtZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLmhpZ2hzY29yZVtpXS5uaWNrbmFtZSkpO1xuICAgICAgICBoc1Njb3JlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMuaGlnaHNjb3JlW2ldLnNjb3JlKSk7XG5cbiAgICAgICAgZGF0ZSA9IG5ldyBEYXRlKHRoaXMuaGlnaHNjb3JlW2ldLmRhdGUpO1xuICAgICAgICBoc0RhdGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0ZS50b0xvY2FsZVRpbWVTdHJpbmcoXCJzdi1zZVwiLCBkYXRlT3B0aW9ucykpKTtcblxuICAgICAgICAvL2FwcGVuZCByb3cgdG8gZnJhZ21lbnRcbiAgICAgICAgZnJhZy5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZyYWc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdsb2JhbEhpZ2hzY29yZTtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTI0LlxuICovXG5cbi8qKlxuICogSGlnaHNjb3JlIGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0gbmlja25hbWV7c3RyaW5nfSwgdGhlIG5pY2tuYW1lXG4gKiBAcGFyYW0gc2NvcmV7c3RyaW5nfSwgdGhlIHNjb3JlKHRpbWUpXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gSGlnaHNjb3JlKG5pY2tuYW1lLCBzY29yZSkge1xuICAgIHRoaXMubmlja25hbWUgPSBuaWNrbmFtZTtcbiAgICB0aGlzLnNjb3JlID0gc2NvcmU7XG4gICAgdGhpcy5oaWdoc2NvcmUgPSBbXTtcblxuICAgIC8vY2FsbCB0byByZWFkIGhpZ2hzY29yZSBmaWxlIGZyb20gbG9jYWwgc3RvcmFnZVxuICAgIHRoaXMucmVhZEZyb21GaWxlKCk7XG59XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gcmVhZCB0aGUgaGlnaHNjb3JlLWZpbGUgZnJvbSBsb2NhbCBzdG9yYWdlXG4gKi9cbkhpZ2hzY29yZS5wcm90b3R5cGUucmVhZEZyb21GaWxlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGhzRmlsZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiaHNcIik7XG4gICAgaWYgKGhzRmlsZSkge1xuICAgICAgICAvL3BhcnNlIGZpbGUgaW50byBKU09OXG4gICAgICAgIHZhciBqc29uID0gSlNPTi5wYXJzZShoc0ZpbGUpO1xuXG4gICAgICAgIC8vZmlsbCB0aGUgaGlnaHNjb3JlLWFycmF5IHdpdGggZW50cmllc1xuICAgICAgICBmb3IgKHZhciBuaWNrbmFtZSBpbiBqc29uKSB7XG4gICAgICAgICAgICBpZiAoanNvbi5oYXNPd25Qcm9wZXJ0eShuaWNrbmFtZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhpZ2hzY29yZS5wdXNoKGpzb25bbmlja25hbWVdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gY2hlY2sgaWYgdGhlIHNjb3JlIHRha2VzIGEgcGxhY2UgaW50byB0aGUgaGlnaHNjb3JlXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuSGlnaHNjb3JlLnByb3RvdHlwZS5pc0hpZ2hzY29yZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpc0hpZ2hzY29yZSA9IGZhbHNlO1xuICAgIGlmICh0aGlzLmhpZ2hzY29yZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgLy9oaWdoc2NvcmUgaXMgZW1wdHksIHRoZXJlZm9yZSBuZXcgaGlnaHNjb3JlXG4gICAgICAgIGlzSGlnaHNjb3JlID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvL2dldCB0aGUgc2NvcmUgbGFzdCBpbiB0aGUgbGlzdFxuICAgICAgICB2YXIgbGFzdFNjb3JlID0gdGhpcy5oaWdoc2NvcmVbdGhpcy5oaWdoc2NvcmUubGVuZ3RoIC0gMV0uc2NvcmU7XG5cbiAgICAgICAgLy9jaGVjayBpZiBoaWdoc2NvcmVcbiAgICAgICAgaWYgKHBhcnNlRmxvYXQodGhpcy5zY29yZSkgPCBwYXJzZUZsb2F0KGxhc3RTY29yZSkgfHwgdGhpcy5oaWdoc2NvcmUubGVuZ3RoIDwgNSkge1xuICAgICAgICAgICAgaXNIaWdoc2NvcmUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGlzSGlnaHNjb3JlO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBhZGQgdGhlIHNjb3JlIGludG8gdGhlIGxpc3RcbiAqIEByZXR1cm5zIHtib29sZWFufSwgYWRkZWQgb3Igbm90XG4gKi9cbkhpZ2hzY29yZS5wcm90b3R5cGUuYWRkVG9MaXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFkZGVkID0gZmFsc2U7XG5cbiAgICAvL2NhbGwgdGhlIGlzSGlnaHNjb3JlIHRvIGNoZWNrIGlmIHNjb3JlIHNob3VsZCBiZSBhZGRlZFxuICAgIGlmICh0aGlzLmlzSGlnaHNjb3JlKCkpIHtcbiAgICAgICAgLy9zYXZlIHRoZSBuaWNrbmFtZSwgc2NvcmUgYW5kIGRhdGVzdGFtcCBpbnRvIGFuIG9iamVjdFxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgIHZhciB0aGlzU2NvcmUgPSB7XG4gICAgICAgICAgICBuaWNrbmFtZTogdGhpcy5uaWNrbmFtZSxcbiAgICAgICAgICAgIHNjb3JlOiB0aGlzLnNjb3JlLFxuICAgICAgICAgICAgZGF0ZTogZGF0ZVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vZGVsZXRlIHRoZSBsYXN0IHBvc2l0aW9uIG9mIHRoZSBoaWdoc2NvcmUgYXJyYXlcbiAgICAgICAgaWYgKHRoaXMuaGlnaHNjb3JlLmxlbmd0aCA9PT0gNSkge1xuICAgICAgICAgICAgLy9yZW1vdmUgdGhlIG9uZSBsYXN0XG4gICAgICAgICAgICB0aGlzLmhpZ2hzY29yZS5zcGxpY2UoLTEsIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9wdXNoIHRoZSBuZXcgYW5kIHNvcnQgdGhlIGFycmF5XG4gICAgICAgIHRoaXMuaGlnaHNjb3JlLnB1c2godGhpc1Njb3JlKTtcbiAgICAgICAgdGhpcy5oaWdoc2NvcmUgPSB0aGlzLmhpZ2hzY29yZS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtyZXR1cm4gYS5zY29yZSAtIGIuc2NvcmU7fSk7XG5cbiAgICAgICAgLy9jYWxsIHRvIHNhdmUgaXRcbiAgICAgICAgdGhpcy5zYXZlVG9GaWxlKCk7XG5cbiAgICAgICAgYWRkZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBhZGRlZDtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gc2F2ZSB0aGUgaGlnaHNjb3JlIHRvIGxvY2FsIHN0b3JhZ2VcbiAqL1xuSGlnaHNjb3JlLnByb3RvdHlwZS5zYXZlVG9GaWxlID0gZnVuY3Rpb24oKSB7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJoc1wiLCBKU09OLnN0cmluZ2lmeSh0aGlzLmhpZ2hzY29yZSkpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBnZXQgdGhlIGhpZ2hzY29yZWZyYWdtZW50IGNvbnRhaW5pbmcgdGhlIGhpZ2hzY29yZS1wYXJ0IG9mIHRhYmxlXG4gKiBAcmV0dXJucyB7RG9jdW1lbnRGcmFnbWVudH1cbiAqL1xuSGlnaHNjb3JlLnByb3RvdHlwZS5jcmVhdGVIaWdoc2NvcmVGcmFnbWVudCA9IGZ1bmN0aW9uKGlzTmV3KSB7XG4gICAgdmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIHRlbXBsYXRlO1xuICAgIHZhciBoc05pY2tuYW1lO1xuICAgIHZhciBoc1Njb3JlO1xuICAgIHZhciBoc0RhdGU7XG4gICAgdmFyIGRhdGU7XG4gICAgdmFyIGxhdGVzdEVudHJ5ID0gbmV3IERhdGUodGhpcy5oaWdoc2NvcmVbMF0uZGF0ZSk7XG4gICAgdmFyIGhpZ2hsaWdodEluZGV4ID0gMDtcblxuICAgIC8vb3B0aW9ucyBmb3IgdGhlIGRhdGUtZm9ybWF0IGluIHRoZSAgdGFibGVcbiAgICB2YXIgZGF0ZU9wdGlvbnMgPSB7XG4gICAgICAgIHllYXI6IFwibnVtZXJpY1wiLCBtb250aDogXCJudW1lcmljXCIsXG4gICAgICAgIGRheTogXCJudW1lcmljXCIsIGhvdXI6IFwiMi1kaWdpdFwiLCBtaW51dGU6IFwiMi1kaWdpdFwiXG4gICAgfTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5oaWdoc2NvcmUubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgLy9nZXQgdGhlIHRlbXBsYXRlIGZvciBhIHRhYmxlLXJvd1xuICAgICAgICB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtaGlnaHNjb3JlUm93XCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICBoc05pY2tuYW1lID0gdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5ocy1uaWNrbmFtZVwiKTtcbiAgICAgICAgaHNTY29yZSA9IHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuaHMtc2NvcmVcIik7XG4gICAgICAgIGhzRGF0ZSA9IHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuaHMtZGF0ZVwiKTtcblxuICAgICAgICAvL2FwcGVuZCB0aGUgbmlja25hbWUgYW5kIHNjb3JlIHRvIHRoZSByb3dcbiAgICAgICAgaHNOaWNrbmFtZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLmhpZ2hzY29yZVtpXS5uaWNrbmFtZSkpO1xuICAgICAgICBoc1Njb3JlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMuaGlnaHNjb3JlW2ldLnNjb3JlKSk7XG5cbiAgICAgICAgZGF0ZSA9IG5ldyBEYXRlKHRoaXMuaGlnaHNjb3JlW2ldLmRhdGUpO1xuICAgICAgICBoc0RhdGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0ZS50b0xvY2FsZVRpbWVTdHJpbmcoXCJzdi1zZVwiLCBkYXRlT3B0aW9ucykpKTtcblxuICAgICAgICBpZiAoaXNOZXcpIHtcbiAgICAgICAgICAgIC8vY2hlY2sgZm9yIHRoZSBsZXRlc3QgZW50cnlcbiAgICAgICAgICAgIGlmIChkYXRlLnZhbHVlT2YoKSA+IGxhdGVzdEVudHJ5LnZhbHVlT2YoKSkge1xuICAgICAgICAgICAgICAgIGhpZ2hsaWdodEluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICBsYXRlc3RFbnRyeSA9IGRhdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvL2FwcGVuZCByb3cgdG8gZnJhZ21lbnRcbiAgICAgICAgZnJhZy5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG4gICAgfVxuXG4gICAgaWYgKGlzTmV3KSB7XG4gICAgICAgIC8vaGlnaGxpZ2h0IHRoZSBuZXcgaGlnaHNjb3JlIGluIHRoZSBsaXN0XG4gICAgICAgIGZyYWcucXVlcnlTZWxlY3RvckFsbChcInRyXCIpW2hpZ2hsaWdodEluZGV4XS5jbGFzc0xpc3QuYWRkKFwiaGlnaGxpZ2h0XCIpO1xuICAgIH1cblxuICAgIHJldHVybiBmcmFnO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBIaWdoc2NvcmU7XG4iLCJcbi8qKlxuICpcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yMy5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogUXVlc3Rpb24gY29uc3RydWN0b3JcbiAqIEBwYXJhbSBvYmp7T2JqZWN0fSwgb2JqZWN0IHRoYXQgaG9sZHMgYSBxdWVzdGlvblxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFF1ZXN0aW9uKG9iaikge1xuICAgIHRoaXMuaWQgPSBvYmouaWQ7XG4gICAgdGhpcy5xdWVzdGlvbiA9IG9iai5xdWVzdGlvbjtcbiAgICB0aGlzLmFsdCA9IG9iai5hbHRlcm5hdGl2ZXM7XG59XG5cbi8qKlxuICogRnVuY3Rpb25iIHRvIHByZXNlbnQgdGhlIHF1ZXN0aW9uXG4gKi9cblF1ZXN0aW9uLnByb3RvdHlwZS5wcmludCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vc3RhdGVtZW50IHRvIGNhbGwgdGhlIHJpZ2h0ZnVsIHByaW50ZnVuY3Rpb25cbiAgICBpZiAodGhpcy5hbHQpIHtcbiAgICAgICAgdGhpcy5wcmludEFsdFF1ZXN0aW9uKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLnByaW50UXVlc3Rpb24oKTtcbiAgICB9XG5cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRcIikuZm9jdXMoKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gY2xlYXIgYSBkaXZcbiAqIEBwYXJhbSBkaXZ7b2JqZWN0fSwgdGhlIGRpdiB0byBjbGVhclxuICovXG5RdWVzdGlvbi5wcm90b3R5cGUuY2xlYXJEaXYgPSBmdW5jdGlvbihkaXYpIHtcbiAgICB3aGlsZSAoZGl2Lmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgICBkaXYucmVtb3ZlQ2hpbGQoZGl2Lmxhc3RDaGlsZCk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBwcmVzZW50IHRoZSBxdWVyc3Rpb24gdGhhdCBoYXMgYWx0ZXJuYXRpdmVzXG4gKi9cblF1ZXN0aW9uLnByb3RvdHlwZS5wcmludEFsdFF1ZXN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgLy9nZXQgdGhlIHRlbXBsYXRlIGFuZCBhcHBlbmQgdGhlIGFsdGVybmF0aXZlc1xuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtcXVlc3Rpb24tYWx0XCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIucUhlYWRcIikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5xdWVzdGlvbikpO1xuXG4gICAgLy9jYWxsIHRoZSBmdW5jdGlvbiB0aGF0IGhhbmRsZXMgdGhlIGFsdGVybmF0aXZlc1xuICAgIHZhciBpbnB1dEZyYWcgPSB0aGlzLmdldEFsdEZyYWcoKTtcbiAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiI3FGb3JtXCIpLmluc2VydEJlZm9yZShpbnB1dEZyYWcsIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIjc3VibWl0XCIpKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgdGhlIGFsdGVybmF0aXZlc1xuICogQHJldHVybnMge0RvY3VtZW50RnJhZ21lbnR9LCB0aGUgZnJhZ21lbnQgZm9yIHRoZSBhbHRlcm5hdGl2ZXNcbiAqL1xuUXVlc3Rpb24ucHJvdG90eXBlLmdldEFsdEZyYWcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaW5wdXRGcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIHZhciBpbnB1dDtcbiAgICB2YXIgbGFiZWw7XG4gICAgdmFyIGZpcnN0ID0gdHJ1ZTtcblxuICAgIGZvciAodmFyIGFsdCBpbiB0aGlzLmFsdCkge1xuICAgICAgICBpZiAodGhpcy5hbHQuaGFzT3duUHJvcGVydHkoYWx0KSkge1xuICAgICAgICAgICAgLy9nZXQgdGhlIHRlbXBsYXRlIGZvciBhbHRlcm5hdGl2ZXNcbiAgICAgICAgICAgIGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0ZW1wbGF0ZS1hbHRlcm5hdGl2ZVwiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcblxuICAgICAgICAgICAgLy9hcHBlbmQgdGhlIGFsdGVybmF0aXZlXG4gICAgICAgICAgICBpZiAoZmlyc3QpIHtcbiAgICAgICAgICAgICAgICBpbnB1dC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRcIikuc2V0QXR0cmlidXRlKFwiY2hlY2tlZFwiLCBcImNoZWNrZWRcIik7XG4gICAgICAgICAgICAgICAgZmlyc3QgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaW5wdXQucXVlcnlTZWxlY3RvcihcImlucHV0XCIpLnNldEF0dHJpYnV0ZShcInZhbHVlXCIsIGFsdCk7XG4gICAgICAgICAgICBsYWJlbCA9IGlucHV0LnF1ZXJ5U2VsZWN0b3IoXCJsYWJlbFwiKTtcbiAgICAgICAgICAgIGxhYmVsLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMuYWx0W2FsdF0pKTtcblxuICAgICAgICAgICAgaW5wdXRGcmFnLmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcmV0dXJuIGlucHV0RnJhZztcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gcHJlc2VudCBhIHF1ZXN0aW9uIHdpdGggdGV4dC1pbnB1dFxuICovXG5RdWVzdGlvbi5wcm90b3R5cGUucHJpbnRRdWVzdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIC8vZ2V0IHRoZSB0ZW1wbGF0ZSBhbmQgYXBwZW5kIHRoZSBxdWVzdGlvblxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtcXVlc3Rpb25cIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5xSGVhZFwiKS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLnF1ZXN0aW9uKSk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUXVlc3Rpb247XG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTIzLlxyXG4gKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBRdWVzdGlvbiA9IHJlcXVpcmUoXCIuL1F1ZXN0aW9uXCIpO1xyXG52YXIgQWpheCA9IHJlcXVpcmUoXCIuL0FqYXhcIik7XHJcbnZhciBUaW1lciA9IHJlcXVpcmUoXCIuL1RpbWVyXCIpO1xyXG52YXIgSGlnaHNjb3JlID0gcmVxdWlyZShcIi4vSGlnaHNjb3JlXCIpO1xyXG52YXIgR2xvYmFsSGlnaHNjb3JlID0gcmVxdWlyZShcIi4vR2xvYmFsSGlnaHNjb3JlXCIpO1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciB0aGUgUXVpelxyXG4gKiBAcGFyYW0gbmlja25hbWV7c3RyaW5nfSwgbmlja25hbWUgdG8gdXNlIGZvciBoaWdoc2NvcmVcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBRdWl6KG5pY2tuYW1lKSB7XHJcbiAgICB0aGlzLm5pY2tuYW1lID0gbmlja25hbWU7XHJcbiAgICB0aGlzLnRpbWVyID0gdW5kZWZpbmVkO1xyXG4gICAgdGhpcy5xdWVzdGlvbiA9IHVuZGVmaW5lZDtcclxuICAgIHRoaXMubmV4dFVSTCA9IFwiaHR0cDovL3Zob3N0My5sbnUuc2U6MjAwODAvcXVlc3Rpb24vMVwiO1xyXG4gICAgdGhpcy5idXR0b24gPSB1bmRlZmluZWQ7XHJcbiAgICB0aGlzLmZvcm0gPSB1bmRlZmluZWQ7XHJcbiAgICB0aGlzLnRvdGFsVGltZSA9IDA7XHJcblxyXG4gICAgLy9yZXF1ZXN0IHRoZSBmaXJzdCBxdWVzdGlvblxyXG4gICAgdGhpcy5nZXRRdWVzdGlvbigpO1xyXG59XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gc2VuZCBhIHJlcXVlc3QgZm9yIGEgbmV3IHF1ZXN0aW9uXHJcbiAqL1xyXG5RdWl6LnByb3RvdHlwZS5nZXRRdWVzdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIGNvbmZpZyA9IHttZXRob2Q6IFwiR0VUXCIsIHVybDogdGhpcy5uZXh0VVJMfTtcclxuICAgIHZhciByZXNwb25zZUZ1bmN0aW9uID0gdGhpcy5yZXNwb25zZS5iaW5kKHRoaXMpO1xyXG5cclxuICAgIEFqYXgucmVxKGNvbmZpZywgcmVzcG9uc2VGdW5jdGlvbik7XHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHRoZSByZXNwb25zZSwgdXNlcyBhcyBhcmd1bWVudCBcImNhbGxiYWNrXCIgaW4gYSByZXF1ZXN0XHJcbiAqIEBwYXJhbSBlcnJvcntOdW1iZXJ9LCBlcnJvcmNvZGUsIG51bGwgaWYgbm8gZXJyb3JcclxuICogQHBhcmFtIHJlc3BvbnNle3N0cmluZ30sIHJlc3BvbnNlIHN0cmluZyB0byBwYXJzZSBKU09OIGZyb21cclxuICovXHJcblF1aXoucHJvdG90eXBlLnJlc3BvbnNlID0gZnVuY3Rpb24oZXJyb3IsIHJlc3BvbnNlKSB7XHJcbiAgICAvL2hhbmRsZSBlcnJvcnMgKDQwNCBtZWFucyBubyBtb3JlIHF1ZXN0aW9ucylcclxuICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIC8vcHJlc2VudCB0aGUgZ2FtZW92ZXItdmlldyB0byB1c2VyXHJcbiAgICAgICAgdGhpcy5nYW1lT3ZlcigpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vaGFuZGxlIHRoZSByZXNwb25zZSBzdHJpbmdcclxuICAgIGlmIChyZXNwb25zZSkge1xyXG4gICAgICAgIC8vcGFzcmUgdG8gSlNPTlxyXG4gICAgICAgIHZhciBvYmogPSBKU09OLnBhcnNlKHJlc3BvbnNlKTtcclxuICAgICAgICB0aGlzLm5leHRVUkwgPSBvYmoubmV4dFVSTDtcclxuXHJcbiAgICAgICAgLy9zdGF0ZW1lbnQgdG8gY2FsbCB0aGUgcmlnaHRmdWwgZnVuY3Rpb24gb24gdGhlIHJlc3BvbnNlXHJcbiAgICAgICAgaWYgKG9iai5xdWVzdGlvbikge1xyXG4gICAgICAgICAgICB0aGlzLnJlc3BvbnNlUXVlc3Rpb24ob2JqKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm5leHRVUkwgfHwgb2JqLm1lc3NhZ2UgPT09IFwiQ29ycmVjdCBhbnN3ZXIhXCIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VBbnN3ZXIob2JqKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gaGFuZGxlIGlmIHJlc3BvbnNlIGlzIGEgcXVlc3Rpb25cclxuICogQHBhcmFtIG9iantPYmplY3R9LCBvYmplY3QgdGhhdCBob2xkcyB0aGUgcXVlc3Rpb25cclxuICovXHJcblF1aXoucHJvdG90eXBlLnJlc3BvbnNlUXVlc3Rpb24gPSBmdW5jdGlvbihvYmopIHtcclxuICAgIHZhciBjb250ZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpO1xyXG4gICAgdGhpcy5jbGVhckRpdihjb250ZW50KTtcclxuXHJcbiAgICAvL2NyZWF0ZSBhIG5ldyBxdWVzdGlvbiBmcm9tIG9iamVjdFxyXG4gICAgdGhpcy5xdWVzdGlvbiA9IG5ldyBRdWVzdGlvbihvYmopO1xyXG4gICAgdGhpcy5xdWVzdGlvbi5wcmludCgpO1xyXG5cclxuICAgIC8vY3JlYXRlIGEgbmV3IHRpbWVyIGZvciBxdWVzdGlvblxyXG4gICAgdGhpcy50aW1lciA9IG5ldyBUaW1lcih0aGlzLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RpbWVyIGgxXCIpLCAyMCk7XHJcbiAgICB0aGlzLnRpbWVyLnN0YXJ0KCk7XHJcblxyXG4gICAgLy9BZGQgbGluc3RlbmVycyBmb3IgdGhlIGZvcm1cclxuICAgIHRoaXMuYWRkTGlzdGVuZXIoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgaWYgcmVzcG9uc2UgaXMgYW4gYW5zd2VyXHJcbiAqIEBwYXJhbSBvYmp7T2JqZWN0fSwgb2JqZWN0IHRoYXQgaG9sZHMgdGhlIGFuc3dlclxyXG4gKi9cclxuUXVpei5wcm90b3R5cGUucmVzcG9uc2VBbnN3ZXIgPSBmdW5jdGlvbihvYmopIHtcclxuICAgIHZhciBjb250ZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpO1xyXG4gICAgdGhpcy5jbGVhckRpdihjb250ZW50KTtcclxuXHJcbiAgICAvL0hhbmRsZSB0aGUgdGVtcGxhdGUgZm9yIGFuc3dlclxyXG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0ZW1wbGF0ZS1hbnN3ZXJcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XHJcbiAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKG9iai5tZXNzYWdlKTtcclxuICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCJwXCIpLmFwcGVuZENoaWxkKHRleHQpO1xyXG5cclxuICAgIGNvbnRlbnQuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xyXG5cclxuICAgIGlmICh0aGlzLm5leHRVUkwpIHtcclxuICAgICAgICAvL1JlcXVlc3QgYSBuZXcgcXVlc3Rpb24sIGJ1dCB3aXRoIGEgZGVsYXlcclxuICAgICAgICB2YXIgbmV3UXVlc3Rpb24gPSB0aGlzLmdldFF1ZXN0aW9uLmJpbmQodGhpcyk7XHJcbiAgICAgICAgc2V0VGltZW91dChuZXdRdWVzdGlvbiwgMTAwMCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICB0aGlzLmdhbWVDb21wbGV0ZWQoKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBhZGQgdGhlIGxpc3RlbmVyIGZvciBzdWJtaXRcclxuICovXHJcblF1aXoucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc3VibWl0XCIpO1xyXG4gICAgdGhpcy5mb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNxRm9ybVwiKTtcclxuXHJcbiAgICB0aGlzLmJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zdWJtaXQuYmluZCh0aGlzKSwgdHJ1ZSk7XHJcbiAgICB0aGlzLmZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcImtleXByZXNzXCIsIHRoaXMuc3VibWl0LmJpbmQodGhpcyksIHRydWUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSB3aGVuIHN1Ym1pdCBpcyB0cmlnZ2VyZWRcclxuICovXHJcblF1aXoucHJvdG90eXBlLnN1Ym1pdCA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAvL0lmIHRoZSB0cmlnZ2VyIGlzIGVudGVyIG9yIGNsaWNrIGRvIHRoZSBzdWJtaXRcclxuICAgIGlmIChldmVudC53aGljaCA9PT0gMTMgfHwgZXZlbnQua2V5Q29kZSA9PT0gMTMgfHwgZXZlbnQudHlwZSA9PT0gXCJjbGlja1wiKSB7XHJcbiAgICAgICAgLy9wcmV2ZW50IHRoZSBmb3JtIHRvIHJlbG9hZCBwYWdlIG9uIGVudGVyXHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgdGhpcy50b3RhbFRpbWUgKz0gdGhpcy50aW1lci5zdG9wKCk7XHJcbiAgICAgICAgdmFyIGlucHV0O1xyXG5cclxuICAgICAgICAvL3JlbW92ZSB0aGUgbGlzdGVuZXJzIHRvIHByZXZlbnQgZG91YmxlLXN1Ym1pdFxyXG4gICAgICAgIHRoaXMuYnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnN1Ym1pdC5iaW5kKHRoaXMpKTtcclxuICAgICAgICB0aGlzLmZvcm0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleXByZXNzXCIsIHRoaXMuc3VibWl0LmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICAvL3NhdmUgaW5wdXQgZGVwZW5kaW5nIG9uIHRoZSB0eXBlIG9mIHF1ZXN0aW9uXHJcbiAgICAgICAgaWYgKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYW5zd2VyXCIpKSB7XHJcbiAgICAgICAgICAgIC8vZ2V0IHRoZSBmb3JtIGlucHV0XHJcbiAgICAgICAgICAgIGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNhbnN3ZXJcIikudmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvL2dldCB0aGUgY2hlY2tlZCByZWFkaW9idXR0b25cclxuICAgICAgICAgICAgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRbbmFtZT0nYWx0ZXJuYXRpdmUnXTpjaGVja2VkXCIpLnZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9zZXQgdGhlIGNvbmZpZyB0byBiZSBzZW50IHRvIHNlcnZlciBhbmQgc2VuZCBhIHJlcXVlc3RcclxuICAgICAgICB2YXIgY29uZmlnID0ge1xyXG4gICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICB1cmw6IHRoaXMubmV4dFVSTCxcclxuICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgYW5zd2VyOiBpbnB1dFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgcmVzcG9uc2VGdW5jdGlvbiA9IHRoaXMucmVzcG9uc2UuYmluZCh0aGlzKTtcclxuICAgICAgICBBamF4LnJlcShjb25maWcsIHJlc3BvbnNlRnVuY3Rpb24pO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSB0aGUgZ2FtZU92ZXItdmlldyBhbmQgcHJlc2VudCBpdCB0byB1c2VyXHJcbiAqL1xyXG5RdWl6LnByb3RvdHlwZS5nYW1lT3ZlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLy9jcmVhdGUgYSBoaWdoc2NvcmUgbW9kdWxlIHRvIHNob3cgaXQgdG8gdGhlIHVzZXJcclxuICAgIHZhciBocyA9IG5ldyBIaWdoc2NvcmUodGhpcy5uaWNrbmFtZSk7XHJcbiAgICB0aGlzLmNsZWFyRGl2KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKSk7XHJcblxyXG4gICAgLy9nZXQgdGhlIGdhbWUgb3ZlciB0ZW1wbGF0ZVxyXG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0ZW1wbGF0ZS1nYW1lT3ZlclwiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcclxuXHJcbiAgICAvL2lmIHRoZSBoaWdoc2NvcmUgaGFzIGVudHJpZXMgYWRkIHRoZW0gdG8gdGhlIHRlbXBsYXRlXHJcbiAgICBpZiAoaHMuaGlnaHNjb3JlLmxlbmd0aCA+IDApIHtcclxuICAgICAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLXRpdGxlXCIpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiSGlnaHNjb3JlXCIpKTtcclxuICAgICAgICB2YXIgaHNGcmFnID0gaHMuY3JlYXRlSGlnaHNjb3JlRnJhZ21lbnQoKTtcclxuICAgICAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwidGFibGVcIikuYXBwZW5kQ2hpbGQoaHNGcmFnKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgZ2xvYmFsSHMgPSBuZXcgR2xvYmFsSGlnaHNjb3JlKHRoaXMubmlja25hbWUpO1xyXG4gICAgZ2xvYmFsSHMuc2VuZFRvU2VydmVyKCk7XHJcblxyXG4gICAgLy9hZGQgdGhlIHRlbXBsYXRlIHRvIGNvbnRlbnRcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHRoZSBnYW1lIGNvbXBsZXRlZC12aWV3IGFuZCBwcmVzZW50IGl0IHRvIHRoZSB1c2VyXHJcbiAqL1xyXG5RdWl6LnByb3RvdHlwZS5nYW1lQ29tcGxldGVkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAvL2NyZWF0ZSBuZXcgaGlnaHNjb3JlIG1vZHVsZSB0byBoYW5kbGUgaXRcclxuICAgIHZhciBocyA9IG5ldyBIaWdoc2NvcmUodGhpcy5uaWNrbmFtZSwgdGhpcy50b3RhbFRpbWUudG9GaXhlZCgzKSk7XHJcbiAgICB2YXIgaXNOZXcgPSBocy5hZGRUb0xpc3QoKTtcclxuXHJcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLXF1aXpDb21wbGV0ZWRcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XHJcblxyXG4gICAgLy9nZXQgdGhlIGhpZ2hzY29yZSBpZiB0aGUgaGlnaHNjb3JlIGhhcyBlbnRyaWVzXHJcbiAgICBpZiAoaHMuaGlnaHNjb3JlLmxlbmd0aCA+IDApIHtcclxuICAgICAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLXRpdGxlXCIpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiSGlnaHNjb3JlXCIpKTtcclxuICAgICAgICB2YXIgaHNGcmFnID0gaHMuY3JlYXRlSGlnaHNjb3JlRnJhZ21lbnQoaXNOZXcpO1xyXG4gICAgICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCJ0YWJsZVwiKS5hcHBlbmRDaGlsZChoc0ZyYWcpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpc05ldykge1xyXG4gICAgICAgIHZhciBuZXdIUyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJoMVwiKTtcclxuICAgICAgICBuZXdIUy5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIk5ldyBIaWdoc2NvcmUhXCIpKTtcclxuICAgICAgICB2YXIgZGl2ID0gdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcImRpdlwiKTtcclxuICAgICAgICBkaXYuaW5zZXJ0QmVmb3JlKG5ld0hTLCBkaXYuZmlyc3RDaGlsZCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5jbGVhckRpdihkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikpO1xyXG5cclxuICAgIHZhciBoMSA9IHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIudGltZVwiKTtcclxuICAgIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy50b3RhbFRpbWUudG9GaXhlZCgzKSk7XHJcbiAgICBoMS5hcHBlbmRDaGlsZCh0ZXh0KTtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XHJcblxyXG4gICAgLy9hZGQgdGhlIGdsb2JhbCBoaWdoc2NvcmVcclxuICAgIHZhciBnbG9iYWxIcyA9IG5ldyBHbG9iYWxIaWdoc2NvcmUodGhpcy5uaWNrbmFtZSwgdGhpcy50b3RhbFRpbWUudG9GaXhlZCgzKSk7XHJcbiAgICBnbG9iYWxIcy5zZW5kVG9TZXJ2ZXIoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBjbGVhciBhIHNwZWNpZmljIGRpdiBvZiBjaGlsZHNcclxuICogQHBhcmFtIGRpdntPYmplY3R9LCB0aGUgZGl2ZWxlbWVudCB0byBjbGVhclxyXG4gKi9cclxuUXVpei5wcm90b3R5cGUuY2xlYXJEaXYgPSBmdW5jdGlvbihkaXYpIHtcclxuICAgIHdoaWxlIChkaXYuaGFzQ2hpbGROb2RlcygpKSB7XHJcbiAgICAgICAgZGl2LnJlbW92ZUNoaWxkKGRpdi5sYXN0Q2hpbGQpO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBRdWl6O1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTI0LlxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBUaW1lciBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0gb3duZXJ7T2JqZWN0fSwgdGhlIG93bmVyLW9iamVjdCB0aGF0IGNyZWF0ZWQgdGhlIHRpbWVyXHJcbiAqIEBwYXJhbSBlbGVtZW50e09iamVjdH0sIGVsZW1lbnQgdG8gcHJpbnQgdGhlIHRpbWVyIHRvXHJcbiAqIEBwYXJhbSB0aW1le051bWJlcn0sIHRoZSB0aW1lIHRvIGNvdW50IGRvd25cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBUaW1lcihvd25lciwgZWxlbWVudCwgdGltZSkge1xyXG4gICAgdGhpcy50aW1lID0gdGltZTtcclxuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLm93bmVyID0gb3duZXI7XHJcbiAgICB0aGlzLnN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgdGhpcy5pbnRlcnZhbCA9IHVuZGVmaW5lZDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRoYXQgc3RhcnRzIGFuIGludGVydmFsIGZvciB0aGUgdGltZXJcclxuICovXHJcblRpbWVyLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLy9jYWxsIHRoZSBydW4gZnVuY3Rpb24gb24gZWFjaCBpbnRlcnZhbFxyXG4gICAgdGhpcy5pbnRlcnZhbCA9IHNldEludGVydmFsKHRoaXMucnVuLmJpbmQodGhpcyksIDEwMCk7XHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gYmUgZXhlY3V0ZWQgZWFjaCBpbnRlcnZhbCBvZiB0aGUgdGltZXJcclxuICovXHJcblRpbWVyLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuXHJcbiAgICAvL2NvdW50IHRoZSBkaWZmZXJlbmNlIGZyb20gc3RhcnQgdG8gbm93XHJcbiAgICB2YXIgZGlmZiA9IChub3cgLSB0aGlzLnN0YXJ0VGltZSkgLyAxMDAwO1xyXG5cclxuICAgIC8vY291bnQgdGhlIHRpbWUgLSBkaWZmZXJlbmNlIHRvIHNob3cgY291bnRkb3duXHJcbiAgICB2YXIgc2hvd1RpbWUgPSB0aGlzLnRpbWUgLSBkaWZmO1xyXG5cclxuICAgIGlmIChkaWZmID49IHRoaXMudGltZSkge1xyXG4gICAgICAgIC8vdGltZSBpZiB1cFxyXG4gICAgICAgIHNob3dUaW1lID0gMDtcclxuICAgICAgICBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xyXG5cclxuICAgICAgICAvL2NhbGwgb3duZXIgZ2FtZU92ZXIgc2luY2UgdGltZSBpcyBvdXRcclxuICAgICAgICB0aGlzLm93bmVyLmdhbWVPdmVyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9zaG93IHRoZSB0aW1lciB3aXRoIG9uZSBkZWNpbWFsXHJcbiAgICB0aGlzLnByaW50KHNob3dUaW1lLnRvRml4ZWQoMSkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRoYXQgc3RvcHMgdGhlIHRpbWVyIGJlZm9yZSBpdHMgb3ZlclxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSwgdGhlIGRpZmZlcmVuY2UgaW4gc2Vjb25kc1xyXG4gKi9cclxuVGltZXIucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcclxuICAgIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbCk7XHJcbiAgICB2YXIgbm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcblxyXG4gICAgcmV0dXJuIChub3cgLSB0aGlzLnN0YXJ0VGltZSkgLyAxMDAwO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIHNob3cgdGhlIHRpbWVyIGF0IHRoZSBnaXZlbiBlbGVtZW50XHJcbiAqIEBwYXJhbSBkaWZme051bWJlcn0gdGhlIHRpbWUgdG8gYmUgcHJpbnRlZFxyXG4gKi9cclxuVGltZXIucHJvdG90eXBlLnByaW50ID0gZnVuY3Rpb24oZGlmZikge1xyXG4gICAgdGhpcy5lbGVtZW50LnJlcGxhY2VDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkaWZmKSwgdGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUaW1lcjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBRdWl6ID0gcmVxdWlyZShcIi4vUXVpelwiKTtcclxudmFyIHE7XHJcblxyXG5mdW5jdGlvbiBhZGRUaGVtZVNlbGVjdG9yKCkge1xyXG4gICAgLy9hZGQgbGlzdGVuZXIgZm9yIHRoZSB0aGVtZSBjaG9vc2VyXHJcbiAgICB2YXIgc2VsZWN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0aGVtZS1zZWxlY3RvclwiKTtcclxuICAgIHNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBiYXNlU3R5bGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2Jhc2VTdHlsZVwiKTtcclxuICAgICAgICB2YXIgbG9hZGluZ1N0eWxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNsb2FkaW5nU3R5bGVcIik7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJ0aGVtZVwiLCBzZWxlY3QudmFsdWUpO1xyXG4gICAgICAgIGlmIChzZWxlY3QudmFsdWUgPT09IFwicGxheWZ1bFwiKSB7XHJcbiAgICAgICAgICAgIGJhc2VTdHlsZS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwic3R5bGVzaGVldC9wbGF5ZnVsLmNzc1wiKTtcclxuICAgICAgICAgICAgbG9hZGluZ1N0eWxlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L3BsYXlmdWxfbG9hZGluZy5jc3NcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHNlbGVjdC52YWx1ZSA9PT0gXCJoYWNrZXJcIikge1xyXG4gICAgICAgICAgICBiYXNlU3R5bGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvaGFja2VyLmNzc1wiKTtcclxuICAgICAgICAgICAgbG9hZGluZ1N0eWxlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L2hhY2tlcl9sb2FkaW5nLmNzc1wiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoc2VsZWN0LnZhbHVlID09PSBcInRlcm1pbmFsXCIpIHtcclxuICAgICAgICAgICAgYmFzZVN0eWxlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L3Rlcm1pbmFsLmNzc1wiKTtcclxuICAgICAgICAgICAgbG9hZGluZ1N0eWxlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L3Rlcm1pbmFsX2xvYWRpbmcuY3NzXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChzZWxlY3QudmFsdWUgPT09IFwibm9zdHlsZVwiKSB7XHJcbiAgICAgICAgICAgIGJhc2VTdHlsZS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwic3R5bGVzaGVldC9ub3N0eWxlLmNzc1wiKTtcclxuICAgICAgICAgICAgbG9hZGluZ1N0eWxlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L25vc3R5bGVfbG9hZGluZy5jc3NcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3NldCBuaWNrbmFtZS1pbnB1dCBmb2N1c1xyXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJpbnB1dFwiKS5mb2N1cygpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgdGhlIHN1Ym1pdCBmb3Igbmlja25hbWUgYW5kIHN0YXJ0IHRoZSBxdWl6XHJcbiAqIEBwYXJhbSBldmVudCwgdGhlIGV2ZW50aGFuZGxlciBmcm9tIHRoZSBsaXN0ZW5lclxyXG4gKi9cclxuZnVuY3Rpb24gc3VibWl0KGV2ZW50KSB7XHJcbiAgICBpZiAoZXZlbnQud2hpY2ggPT09IDEzIHx8IGV2ZW50LmtleUNvZGUgPT09IDEzIHx8IGV2ZW50LnR5cGUgPT09IFwiY2xpY2tcIikge1xyXG4gICAgICAgIC8vZGlzYWJsZSBmb3JtcyBhY3Rpb24gc28gcGFnZSB3b250IHJlbG9hZCB3aXRoIGVudGVyXHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgdmFyIGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNuaWNrbmFtZVwiKS52YWx1ZTtcclxuXHJcbiAgICAgICAgLy9pZiBuaWNrbmFtZSB3cml0dGVuLCBzdGFydCBxdWl6XHJcbiAgICAgICAgaWYgKGlucHV0Lmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgcSA9IG5ldyBRdWl6KGlucHV0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmlmIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInRoZW1lXCIpKSB7XHJcbiAgICB2YXIgdGhlbWUgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInRoZW1lXCIpO1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNiYXNlU3R5bGVcIikuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvXCIgKyB0aGVtZSArIFwiLmNzc1wiKTtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbG9hZGluZ1N0eWxlXCIpLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L1wiICsgdGhlbWUgKyBcIl9sb2FkaW5nLmNzc1wiKTtcclxufVxyXG5cclxudmFyIGJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc3VibWl0XCIpO1xyXG52YXIgZm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcUZvcm1cIik7XHJcblxyXG5idXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHN1Ym1pdCwgdHJ1ZSk7XHJcbmZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcImtleXByZXNzXCIsIHN1Ym1pdCwgdHJ1ZSk7XHJcblxyXG4vL3NldCBuaWNrbmFtZS1pbnB1dCBmb2N1cyBhdCBzdGFydFxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRcIikuZm9jdXMoKTtcclxuXHJcbmFkZFRoZW1lU2VsZWN0b3IoKTtcclxuIl19
