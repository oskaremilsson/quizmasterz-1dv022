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

    if(isNew) {
        //highlight the new highscore in the list
        frag.querySelectorAll("tr")[highlightIndex].classList.add("highlight");
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

    for(var alt in this.alt) {
        if(this.alt.hasOwnProperty(alt)) {
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
    var config = {method: "GET", url: this.nextURL};
    var responseFunction = this.response.bind(this);

    Ajax.req(config, responseFunction);
};

/**
 * Function to handle the response, uses as argument "callback" in a request
 * @param error{Number}, errorcode, null if no error
 * @param response{string}, response string to parse JSON from
 */
Quiz.prototype.response = function (error, response) {
    //handle errors (404 means no more questions)
    if(error) {
        //present the gameover-view to user
        this.gameOver();
    }

    //handle the response string
    if(response) {
        //pasre to JSON
        var obj = JSON.parse(response);
        this.nextURL = obj.nextURL;

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

function addThemeSelector() {
    //add listener for the theme chooser
    var select = document.querySelector("#theme-selector");
    select.addEventListener("change", function() {
        var baseStyle = document.querySelector("#baseStyle");
        var loadingStyle = document.querySelector("#loadingStyle");
        localStorage.setItem("theme", select.value);
        if(select.value === "playful") {
            baseStyle.setAttribute("href", "stylesheet/playful.css");
            loadingStyle.setAttribute("href", "stylesheet/playful_loading.css");
        }
        else if(select.value === "hacker") {
            baseStyle.setAttribute("href", "stylesheet/hacker.css");
            //loadingStyle.setAttribute("href", "stylesheet/hacker_loading.css");
        }
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
        if(input.length > 1) {
            q = new Quiz(input);
        }
    }
}

var button = document.querySelector("#submit");
var form = document.querySelector("#qForm");

button.addEventListener("click",submit, true);
form.addEventListener("keypress", submit, true);

addThemeSelector();

if(localStorage.getItem("theme")) {
    var theme = localStorage.getItem("theme");
    document.querySelector("#baseStyle").setAttribute("href", "stylesheet/"+theme+".css");
    document.querySelector("#loadingStyle").setAttribute("href", "stylesheet/"+theme+"_loading.css");
}

},{"./Quiz":4}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMS4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQWpheC5qcyIsImNsaWVudC9zb3VyY2UvanMvSGlnaHNjb3JlLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9RdWVzdGlvbi5qcyIsImNsaWVudC9zb3VyY2UvanMvUXVpei5qcyIsImNsaWVudC9zb3VyY2UvanMvVGltZXIuanMiLCJjbGllbnQvc291cmNlL2pzL2FwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTIzLlxuICovXG5cbi8qKlxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHJlcXVlc3RzIHZpYSBYTUxIdHRwUmVxdWVzdFxuICogQHBhcmFtIGNvbmZpZ3tPYmplY3R9LCBvYmplY3Qgd2l0aCBtZXRob2QgYW5kIHVybCwgcG9zc2libHkgZGF0YVxuICogQHBhcmFtIGNhbGxiYWNre0Z1bmN0aW9ufSwgdGhlIGZ1bmN0aW9uIHRvIGNhbGwgYXQgcmVzcG9uc2VcbiAqL1xuZnVuY3Rpb24gcmVxKGNvbmZpZywgY2FsbGJhY2spIHtcbiAgICB2YXIgciA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgLy9hZGQgZXZlbnRsaXN0ZW5lciBmb3IgcmVzcG9uc2VcbiAgICByLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGlmIChyLnN0YXR1cyA+PSA0MDApIHtcbiAgICAgICAgICAgIC8vZ290IGVycm9yLCBjYWxsIHdpdGggZXJyb3Jjb2RlXG4gICAgICAgICAgICBjYWxsYmFjayhyLnN0YXR1cyk7XG4gICAgICAgIH1cblxuICAgICAgICAvL2NhbGwgdGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHdpdGggcmVzcG9uc2VUZXh0XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHIucmVzcG9uc2VUZXh0KTtcbiAgICB9KTtcblxuICAgIC8vb3BlbiBhIHJlcXVlc3QgZnJvbSB0aGUgY29uZmlnXG4gICAgci5vcGVuKGNvbmZpZy5tZXRob2QsIGNvbmZpZy51cmwpO1xuXG4gICAgaWYoY29uZmlnLmRhdGEpe1xuICAgICAgICAvL3NlbmQgdGhlIGRhdGEgYXMgSlNPTiB0byB0aGUgc2VydmVyXG4gICAgICAgIHIuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb25cIik7XG4gICAgICAgIHIuc2VuZChKU09OLnN0cmluZ2lmeShjb25maWcuZGF0YSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vc2VuZCByZXF1ZXN0XG4gICAgICAgIHIuc2VuZChudWxsKTtcbiAgICB9XG59XG5cblxubW9kdWxlLmV4cG9ydHMucmVxID0gcmVxO1xuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IE9za2FyIG9uIDIwMTUtMTEtMjQuXG4gKi9cblxuLyoqXG4gKiBIaWdoc2NvcmUgY29uc3RydWN0b3JcbiAqIEBwYXJhbSBuaWNrbmFtZXtzdHJpbmd9LCB0aGUgbmlja25hbWVcbiAqIEBwYXJhbSBzY29yZXtzdHJpbmd9LCB0aGUgc2NvcmUodGltZSlcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBIaWdoc2NvcmUobmlja25hbWUsIHNjb3JlKSB7XG4gICAgdGhpcy5uaWNrbmFtZSA9IG5pY2tuYW1lO1xuICAgIHRoaXMuc2NvcmUgPSBzY29yZTtcbiAgICB0aGlzLmhpZ2hzY29yZSA9IFtdO1xuXG4gICAgLy9jYWxsIHRvIHJlYWQgaGlnaHNjb3JlIGZpbGUgZnJvbSBsb2NhbCBzdG9yYWdlXG4gICAgdGhpcy5yZWFkRnJvbUZpbGUoKTtcbn1cblxuLyoqXG4gKiBGdW5jdGlvbiB0byByZWFkIHRoZSBoaWdoc2NvcmUtZmlsZSBmcm9tIGxvY2FsIHN0b3JhZ2VcbiAqL1xuSGlnaHNjb3JlLnByb3RvdHlwZS5yZWFkRnJvbUZpbGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaHNGaWxlID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJoc1wiKTtcbiAgICBpZihoc0ZpbGUpIHtcbiAgICAgICAgLy9wYXJzZSBmaWxlIGludG8gSlNPTlxuICAgICAgICB2YXIganNvbiA9IEpTT04ucGFyc2UoaHNGaWxlKTtcblxuICAgICAgICAvL2ZpbGwgdGhlIGhpZ2hzY29yZS1hcnJheSB3aXRoIGVudHJpZXNcbiAgICAgICAgZm9yICh2YXIgbmlja25hbWUgaW4ganNvbikge1xuICAgICAgICAgICAgaWYoanNvbi5oYXNPd25Qcm9wZXJ0eShuaWNrbmFtZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhpZ2hzY29yZS5wdXNoKGpzb25bbmlja25hbWVdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gY2hlY2sgaWYgdGhlIHNjb3JlIHRha2VzIGEgcGxhY2UgaW50byB0aGUgaGlnaHNjb3JlXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuSGlnaHNjb3JlLnByb3RvdHlwZS5pc0hpZ2hzY29yZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpc0hpZ2hzY29yZSA9IGZhbHNlO1xuICAgIGlmKHRoaXMuaGlnaHNjb3JlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAvL2hpZ2hzY29yZSBpcyBlbXB0eSwgdGhlcmVmb3JlIG5ldyBoaWdoc2NvcmVcbiAgICAgICAgaXNIaWdoc2NvcmUgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vZ2V0IHRoZSBzY29yZSBsYXN0IGluIHRoZSBsaXN0XG4gICAgICAgIHZhciBsYXN0U2NvcmUgPSB0aGlzLmhpZ2hzY29yZVt0aGlzLmhpZ2hzY29yZS5sZW5ndGggLSAxXS5zY29yZTtcbiAgICAgICAgaWYodGhpcy5zY29yZSA8IGxhc3RTY29yZSB8fCB0aGlzLmhpZ2hzY29yZS5sZW5ndGggPCA1KSB7XG4gICAgICAgICAgICBpc0hpZ2hzY29yZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGlzSGlnaHNjb3JlO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBhZGQgdGhlIHNjb3JlIGludG8gdGhlIGxpc3RcbiAqIEByZXR1cm5zIHtib29sZWFufSwgYWRkZWQgb3Igbm90XG4gKi9cbkhpZ2hzY29yZS5wcm90b3R5cGUuYWRkVG9MaXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFkZGVkID0gZmFsc2U7XG4gICAgLy9jYWxsIHRoZSBpc0hpZ2hzY29yZSB0byBjaGVjayBpZiBzY29yZSBzaG91bGQgYmUgYWRkZWRcbiAgICBpZih0aGlzLmlzSGlnaHNjb3JlKCkpIHtcbiAgICAgICAgLy9zYXZlIHRoZSBuaWNrbmFtZSwgc2NvcmUgYW5kIGRhdGVzdGFtcCBpbnRvIGFuIG9iamVjdFxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgIHZhciB0aGlzU2NvcmUgPSB7XG4gICAgICAgICAgICBuaWNrbmFtZTogdGhpcy5uaWNrbmFtZSxcbiAgICAgICAgICAgIHNjb3JlOiB0aGlzLnNjb3JlLFxuICAgICAgICAgICAgZGF0ZTogZGF0ZVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vZGVsZXRlIHRoZSBsYXN0IHBvc2l0aW9uIG9mIHRoZSBoaWdoc2NvcmUgYXJyYXlcbiAgICAgICAgaWYodGhpcy5oaWdoc2NvcmUubGVuZ3RoID09PSA1KSB7XG4gICAgICAgICAgICAvL3JlbW92ZSB0aGUgb25lIGxhc3RcbiAgICAgICAgICAgIHRoaXMuaGlnaHNjb3JlLnNwbGljZSgtMSwgMSk7XG4gICAgICAgIH1cblxuICAgICAgICAvL3B1c2ggdGhlIG5ldyBhbmQgc29ydCB0aGUgYXJyYXlcbiAgICAgICAgdGhpcy5oaWdoc2NvcmUucHVzaCh0aGlzU2NvcmUpO1xuICAgICAgICB0aGlzLmhpZ2hzY29yZSA9IHRoaXMuaGlnaHNjb3JlLnNvcnQoZnVuY3Rpb24oYSxiKSB7cmV0dXJuIGEuc2NvcmUgLSBiLnNjb3JlO30pO1xuXG4gICAgICAgIC8vY2FsbCB0byBzYXZlIGl0XG4gICAgICAgIHRoaXMuc2F2ZVRvRmlsZSgpO1xuXG4gICAgICAgIGFkZGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGFkZGVkO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBzYXZlIHRoZSBoaWdoc2NvcmUgdG8gbG9jYWwgc3RvcmFnZVxuICovXG5IaWdoc2NvcmUucHJvdG90eXBlLnNhdmVUb0ZpbGUgPSBmdW5jdGlvbigpIHtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImhzXCIsIEpTT04uc3RyaW5naWZ5KHRoaXMuaGlnaHNjb3JlKSk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGdldCB0aGUgaGlnaHNjb3JlZnJhZ21lbnQgY29udGFpbmluZyB0aGUgaGlnaHNjb3JlLXBhcnQgb2YgdGFibGVcbiAqIEByZXR1cm5zIHtEb2N1bWVudEZyYWdtZW50fVxuICovXG5IaWdoc2NvcmUucHJvdG90eXBlLmNyZWF0ZUhpZ2hzY29yZUZyYWdtZW50ID0gZnVuY3Rpb24oaXNOZXcpIHtcbiAgICB2YXIgZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB2YXIgdGVtcGxhdGU7XG4gICAgdmFyIGhzTmlja25hbWU7XG4gICAgdmFyIGhzU2NvcmU7XG4gICAgdmFyIGhzRGF0ZTtcbiAgICB2YXIgZGF0ZTtcbiAgICB2YXIgbGF0ZXN0RW50cnkgPSBuZXcgRGF0ZSh0aGlzLmhpZ2hzY29yZVswXS5kYXRlKTtcbiAgICB2YXIgaGlnaGxpZ2h0SW5kZXggPSAwO1xuXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMuaGlnaHNjb3JlLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIC8vZ2V0IHRoZSB0ZW1wbGF0ZSBmb3IgYSB0YWJsZS1yb3dcbiAgICAgICAgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLWhpZ2hzY29yZVJvd1wiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgaHNOaWNrbmFtZSA9IHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuaHMtbmlja25hbWVcIik7XG4gICAgICAgIGhzU2NvcmUgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLXNjb3JlXCIpO1xuICAgICAgICBoc0RhdGUgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLWRhdGVcIik7XG5cbiAgICAgICAgLy9hcHBlbmQgdGhlIG5pY2tuYW1lIGFuZCBzY29yZSB0byB0aGUgcm93XG4gICAgICAgIGhzTmlja25hbWUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5oaWdoc2NvcmVbaV0ubmlja25hbWUpKTtcbiAgICAgICAgaHNTY29yZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLmhpZ2hzY29yZVtpXS5zY29yZSkpO1xuXG4gICAgICAgIGRhdGUgPSBuZXcgRGF0ZSh0aGlzLmhpZ2hzY29yZVtpXS5kYXRlKTtcbiAgICAgICAgaHNEYXRlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGUudG9EYXRlU3RyaW5nKCkpKTtcblxuICAgICAgICBpZiAoaXNOZXcpIHtcbiAgICAgICAgICAgIC8vY2hlY2sgZm9yIHRoZSBsZXRlc3QgZW50cnlcbiAgICAgICAgICAgIGlmIChkYXRlLnZhbHVlT2YoKSA+IGxhdGVzdEVudHJ5LnZhbHVlT2YoKSkge1xuICAgICAgICAgICAgICAgIGhpZ2hsaWdodEluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICBsYXRlc3RFbnRyeSA9IGRhdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvL2FwcGVuZCByb3cgdG8gZnJhZ21lbnRcbiAgICAgICAgZnJhZy5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG4gICAgfVxuXG4gICAgaWYoaXNOZXcpIHtcbiAgICAgICAgLy9oaWdobGlnaHQgdGhlIG5ldyBoaWdoc2NvcmUgaW4gdGhlIGxpc3RcbiAgICAgICAgZnJhZy5xdWVyeVNlbGVjdG9yQWxsKFwidHJcIilbaGlnaGxpZ2h0SW5kZXhdLmNsYXNzTGlzdC5hZGQoXCJoaWdobGlnaHRcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZyYWc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhpZ2hzY29yZTtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTIzLlxuICovXG5cInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBRdWVzdGlvbiBjb25zdHJ1Y3RvclxuICogQHBhcmFtIG9iantPYmplY3R9LCBvYmplY3QgdGhhdCBob2xkcyBhIHF1ZXN0aW9uXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gUXVlc3Rpb24ob2JqKSB7XG4gICAgdGhpcy5pZCA9IG9iai5pZDtcbiAgICB0aGlzLnF1ZXN0aW9uID0gb2JqLnF1ZXN0aW9uO1xuICAgIHRoaXMuYWx0ID0gb2JqLmFsdGVybmF0aXZlcztcbn1cblxuLyoqXG4gKiBGdW5jdGlvbmIgdG8gcHJlc2VudCB0aGUgcXVlc3Rpb25cbiAqL1xuUXVlc3Rpb24ucHJvdG90eXBlLnByaW50ID0gZnVuY3Rpb24oKSB7XG4gICAgLy9zdGF0ZW1lbnQgdG8gY2FsbCB0aGUgcmlnaHRmdWwgcHJpbnRmdW5jdGlvblxuICAgIGlmKHRoaXMuYWx0KSB7XG4gICAgICAgIHRoaXMucHJpbnRBbHRRdWVzdGlvbigpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5wcmludFF1ZXN0aW9uKCk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBjbGVhciBhIGRpdlxuICogQHBhcmFtIGRpdntvYmplY3R9LCB0aGUgZGl2IHRvIGNsZWFyXG4gKi9cblF1ZXN0aW9uLnByb3RvdHlwZS5jbGVhckRpdiA9IGZ1bmN0aW9uKGRpdikge1xuICAgIHdoaWxlKGRpdi5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgZGl2LnJlbW92ZUNoaWxkKGRpdi5sYXN0Q2hpbGQpO1xuICAgIH1cbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gcHJlc2VudCB0aGUgcXVlcnN0aW9uIHRoYXQgaGFzIGFsdGVybmF0aXZlc1xuICovXG5RdWVzdGlvbi5wcm90b3R5cGUucHJpbnRBbHRRdWVzdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIC8vZ2V0IHRoZSB0ZW1wbGF0ZSBhbmQgYXBwZW5kIHRoZSBhbHRlcm5hdGl2ZXNcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLXF1ZXN0aW9uLWFsdFwiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLnFIZWFkXCIpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMucXVlc3Rpb24pKTtcblxuICAgIC8vY2FsbCB0aGUgZnVuY3Rpb24gdGhhdCBoYW5kbGVzIHRoZSBhbHRlcm5hdGl2ZXNcbiAgICB2YXIgaW5wdXRGcmFnID0gdGhpcy5nZXRBbHRGcmFnKCk7XG4gICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIiNxRm9ybVwiKS5pbnNlcnRCZWZvcmUoaW5wdXRGcmFnLCB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiI3N1Ym1pdFwiKSk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHRoZSBhbHRlcm5hdGl2ZXNcbiAqIEByZXR1cm5zIHtEb2N1bWVudEZyYWdtZW50fSwgdGhlIGZyYWdtZW50IGZvciB0aGUgYWx0ZXJuYXRpdmVzXG4gKi9cblF1ZXN0aW9uLnByb3RvdHlwZS5nZXRBbHRGcmFnID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGlucHV0RnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB2YXIgaW5wdXQ7XG4gICAgdmFyIGxhYmVsO1xuICAgIHZhciBmaXJzdCA9IHRydWU7XG5cbiAgICBmb3IodmFyIGFsdCBpbiB0aGlzLmFsdCkge1xuICAgICAgICBpZih0aGlzLmFsdC5oYXNPd25Qcm9wZXJ0eShhbHQpKSB7XG4gICAgICAgICAgICAvL2dldCB0aGUgdGVtcGxhdGUgZm9yIGFsdGVybmF0aXZlc1xuICAgICAgICAgICAgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLWFsdGVybmF0aXZlXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgLy9hcHBlbmQgdGhlIGFsdGVybmF0aXZlXG4gICAgICAgICAgICBpZiAoZmlyc3QpIHtcbiAgICAgICAgICAgICAgICBpbnB1dC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRcIikuc2V0QXR0cmlidXRlKFwiY2hlY2tlZFwiLCBcImNoZWNrZWRcIik7XG4gICAgICAgICAgICAgICAgZmlyc3QgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlucHV0LnF1ZXJ5U2VsZWN0b3IoXCJpbnB1dFwiKS5zZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiLCBhbHQpO1xuICAgICAgICAgICAgbGFiZWwgPSBpbnB1dC5xdWVyeVNlbGVjdG9yKFwibGFiZWxcIik7XG4gICAgICAgICAgICBsYWJlbC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLmFsdFthbHRdKSk7XG5cbiAgICAgICAgICAgIGlucHV0RnJhZy5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgIH1cblxuICAgIH1cbiAgICByZXR1cm4gaW5wdXRGcmFnO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBwcmVzZW50IGEgcXVlc3Rpb24gd2l0aCB0ZXh0LWlucHV0XG4gKi9cblF1ZXN0aW9uLnByb3RvdHlwZS5wcmludFF1ZXN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgLy9nZXQgdGhlIHRlbXBsYXRlIGFuZCBhcHBlbmQgdGhlIHF1ZXN0aW9uXG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0ZW1wbGF0ZS1xdWVzdGlvblwiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLnFIZWFkXCIpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMucXVlc3Rpb24pKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbjtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTIzLlxuICovXG5cInVzZSBzdHJpY3RcIjtcbnZhciBRdWVzdGlvbiA9IHJlcXVpcmUoXCIuL1F1ZXN0aW9uXCIpO1xudmFyIEFqYXggPSByZXF1aXJlKFwiLi9BamF4XCIpO1xudmFyIFRpbWVyID0gcmVxdWlyZShcIi4vVGltZXJcIik7XG52YXIgSGlnaHNjb3JlID0gcmVxdWlyZShcIi4vSGlnaHNjb3JlXCIpO1xuXG4vKipcbiAqIENvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciB0aGUgUXVpelxuICogQHBhcmFtIG5pY2tuYW1le3N0cmluZ30sIG5pY2tuYW1lIHRvIHVzZSBmb3IgaGlnaHNjb3JlXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gUXVpeihuaWNrbmFtZSkge1xuICAgIHRoaXMubmlja25hbWUgPSBuaWNrbmFtZTtcbiAgICB0aGlzLnRpbWVyID0gdW5kZWZpbmVkO1xuICAgIHRoaXMucXVlc3Rpb24gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5uZXh0VVJMID0gXCJodHRwOi8vdmhvc3QzLmxudS5zZToyMDA4MC9xdWVzdGlvbi8xXCI7XG4gICAgdGhpcy5idXR0b24gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5mb3JtID0gdW5kZWZpbmVkO1xuICAgIHRoaXMudG90YWxUaW1lID0gMDtcblxuICAgIC8vcmVxdWVzdCB0aGUgZmlyc3QgcXVlc3Rpb25cbiAgICB0aGlzLmdldFF1ZXN0aW9uKCk7XG59XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gc2VuZCBhIHJlcXVlc3QgZm9yIGEgbmV3IHF1ZXN0aW9uXG4gKi9cblF1aXoucHJvdG90eXBlLmdldFF1ZXN0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBjb25maWcgPSB7bWV0aG9kOiBcIkdFVFwiLCB1cmw6IHRoaXMubmV4dFVSTH07XG4gICAgdmFyIHJlc3BvbnNlRnVuY3Rpb24gPSB0aGlzLnJlc3BvbnNlLmJpbmQodGhpcyk7XG5cbiAgICBBamF4LnJlcShjb25maWcsIHJlc3BvbnNlRnVuY3Rpb24pO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgdGhlIHJlc3BvbnNlLCB1c2VzIGFzIGFyZ3VtZW50IFwiY2FsbGJhY2tcIiBpbiBhIHJlcXVlc3RcbiAqIEBwYXJhbSBlcnJvcntOdW1iZXJ9LCBlcnJvcmNvZGUsIG51bGwgaWYgbm8gZXJyb3JcbiAqIEBwYXJhbSByZXNwb25zZXtzdHJpbmd9LCByZXNwb25zZSBzdHJpbmcgdG8gcGFyc2UgSlNPTiBmcm9tXG4gKi9cblF1aXoucHJvdG90eXBlLnJlc3BvbnNlID0gZnVuY3Rpb24gKGVycm9yLCByZXNwb25zZSkge1xuICAgIC8vaGFuZGxlIGVycm9ycyAoNDA0IG1lYW5zIG5vIG1vcmUgcXVlc3Rpb25zKVxuICAgIGlmKGVycm9yKSB7XG4gICAgICAgIC8vcHJlc2VudCB0aGUgZ2FtZW92ZXItdmlldyB0byB1c2VyXG4gICAgICAgIHRoaXMuZ2FtZU92ZXIoKTtcbiAgICB9XG5cbiAgICAvL2hhbmRsZSB0aGUgcmVzcG9uc2Ugc3RyaW5nXG4gICAgaWYocmVzcG9uc2UpIHtcbiAgICAgICAgLy9wYXNyZSB0byBKU09OXG4gICAgICAgIHZhciBvYmogPSBKU09OLnBhcnNlKHJlc3BvbnNlKTtcbiAgICAgICAgdGhpcy5uZXh0VVJMID0gb2JqLm5leHRVUkw7XG5cbiAgICAgICAgLy9zdGF0ZW1lbnQgdG8gY2FsbCB0aGUgcmlnaHRmdWwgZnVuY3Rpb24gb24gdGhlIHJlc3BvbnNlXG4gICAgICAgIGlmKG9iai5xdWVzdGlvbikge1xuICAgICAgICAgICAgdGhpcy5yZXNwb25zZVF1ZXN0aW9uKG9iaik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZih0aGlzLm5leHRVUkwgfHwgb2JqLm1lc3NhZ2UgPT09IFwiQ29ycmVjdCBhbnN3ZXIhXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlQW5zd2VyKG9iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gaGFuZGxlIGlmIHJlc3BvbnNlIGlzIGEgcXVlc3Rpb25cbiAqIEBwYXJhbSBvYmp7T2JqZWN0fSwgb2JqZWN0IHRoYXQgaG9sZHMgdGhlIHF1ZXN0aW9uXG4gKi9cblF1aXoucHJvdG90eXBlLnJlc3BvbnNlUXVlc3Rpb24gPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29udGVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKTtcbiAgICB0aGlzLmNsZWFyRGl2KGNvbnRlbnQpO1xuXG4gICAgLy9jcmVhdGUgYSBuZXcgcXVlc3Rpb24gZnJvbSBvYmplY3RcbiAgICB0aGlzLnF1ZXN0aW9uID0gbmV3IFF1ZXN0aW9uKG9iaik7XG4gICAgdGhpcy5xdWVzdGlvbi5wcmludCgpO1xuXG4gICAgLy9jcmVhdGUgYSBuZXcgdGltZXIgZm9yIHF1ZXN0aW9uXG4gICAgdGhpcy50aW1lciA9IG5ldyBUaW1lcih0aGlzLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RpbWVyIGgxXCIpLCAyMCk7XG4gICAgdGhpcy50aW1lci5zdGFydCgpO1xuXG4gICAgLy9BZGQgbGluc3RlbmVycyBmb3IgdGhlIGZvcm1cbiAgICB0aGlzLmFkZExpc3RlbmVyKCk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSBpZiByZXNwb25zZSBpcyBhbiBhbnN3ZXJcbiAqIEBwYXJhbSBvYmp7T2JqZWN0fSwgb2JqZWN0IHRoYXQgaG9sZHMgdGhlIGFuc3dlclxuICovXG5RdWl6LnByb3RvdHlwZS5yZXNwb25zZUFuc3dlciA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBjb250ZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpO1xuICAgIHRoaXMuY2xlYXJEaXYoY29udGVudCk7XG5cbiAgICAvL0hhbmRsZSB0aGUgdGVtcGxhdGUgZm9yIGFuc3dlclxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtYW5zd2VyXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUob2JqLm1lc3NhZ2UpO1xuICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCJwXCIpLmFwcGVuZENoaWxkKHRleHQpO1xuXG4gICAgY29udGVudC5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG5cbiAgICBpZih0aGlzLm5leHRVUkwpIHtcbiAgICAgICAgLy9SZXF1ZXN0IGEgbmV3IHF1ZXN0aW9uLCBidXQgd2l0aCBhIGRlbGF5XG4gICAgICAgIHZhciBuZXdRdWVzdGlvbiA9IHRoaXMuZ2V0UXVlc3Rpb24uYmluZCh0aGlzKTtcbiAgICAgICAgc2V0VGltZW91dChuZXdRdWVzdGlvbiwgMTAwMCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLmdhbWVDb21wbGV0ZWQoKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGFkZCB0aGUgbGlzdGVuZXIgZm9yIHN1Ym1pdFxuICovXG5RdWl6LnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzdWJtaXRcIik7XG4gICAgdGhpcy5mb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNxRm9ybVwiKTtcblxuICAgIHRoaXMuYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLHRoaXMuc3VibWl0LmJpbmQodGhpcyksIHRydWUpO1xuICAgIHRoaXMuZm9ybS5hZGRFdmVudExpc3RlbmVyKFwia2V5cHJlc3NcIiwgdGhpcy5zdWJtaXQuYmluZCh0aGlzKSwgdHJ1ZSk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSB3aGVuIHN1Ym1pdCBpcyB0cmlnZ2VyZWRcbiAqL1xuUXVpei5wcm90b3R5cGUuc3VibWl0ID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAvL0lmIHRoZSB0cmlnZ2VyIGlzIGVudGVyIG9yIGNsaWNrIGRvIHRoZSBzdWJtaXRcbiAgICBpZiAoZXZlbnQud2hpY2ggPT09IDEzIHx8IGV2ZW50LmtleUNvZGUgPT09IDEzIHx8IGV2ZW50LnR5cGUgPT09IFwiY2xpY2tcIikge1xuICAgICAgICAvL3ByZXZlbnQgdGhlIGZvcm0gdG8gcmVsb2FkIHBhZ2Ugb24gZW50ZXJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB0aGlzLnRvdGFsVGltZSArPSB0aGlzLnRpbWVyLnN0b3AoKTtcbiAgICAgICAgdmFyIGlucHV0O1xuXG4gICAgICAgIC8vcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgdG8gcHJldmVudCBkb3VibGUtc3VibWl0XG4gICAgICAgIHRoaXMuYnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnN1Ym1pdC5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5mb3JtLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlwcmVzc1wiLCB0aGlzLnN1Ym1pdC5iaW5kKHRoaXMpKTtcblxuICAgICAgICAvL3NhdmUgaW5wdXQgZGVwZW5kaW5nIG9uIHRoZSB0eXBlIG9mIHF1ZXN0aW9uXG4gICAgICAgIGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2Fuc3dlclwiKSkge1xuICAgICAgICAgICAgLy9nZXQgdGhlIGZvcm0gaW5wdXRcbiAgICAgICAgICAgIGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNhbnN3ZXJcIikudmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvL2dldCB0aGUgY2hlY2tlZCByZWFkaW9idXR0b25cbiAgICAgICAgICAgIGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImlucHV0W25hbWU9J2FsdGVybmF0aXZlJ106Y2hlY2tlZFwiKS52YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vc2V0IHRoZSBjb25maWcgdG8gYmUgc2VudCB0byBzZXJ2ZXIgYW5kIHNlbmQgYSByZXF1ZXN0XG4gICAgICAgIHZhciBjb25maWcgPSB7XG4gICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgICAgdXJsOiB0aGlzLm5leHRVUkwsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgYW5zd2VyOiBpbnB1dFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgcmVzcG9uc2VGdW5jdGlvbiA9IHRoaXMucmVzcG9uc2UuYmluZCh0aGlzKTtcbiAgICAgICAgQWpheC5yZXEoY29uZmlnLCByZXNwb25zZUZ1bmN0aW9uKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSB0aGUgZ2FtZU92ZXItdmlldyBhbmQgcHJlc2VudCBpdCB0byB1c2VyXG4gKi9cblF1aXoucHJvdG90eXBlLmdhbWVPdmVyID0gZnVuY3Rpb24oKSB7XG4gICAgLy9jcmVhdGUgYSBoaWdoc2NvcmUgbW9kdWxlIHRvIHNob3cgaXQgdG8gdGhlIHVzZXJcbiAgICB2YXIgaHMgPSBuZXcgSGlnaHNjb3JlKHRoaXMubmlja25hbWUpO1xuICAgIHRoaXMuY2xlYXJEaXYoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpKTtcblxuICAgIC8vZ2V0IHRoZSBnYW1lIG92ZXIgdGVtcGxhdGVcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLWdhbWVPdmVyXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgLy9pZiB0aGUgaGlnaHNjb3JlIGhhcyBlbnRyaWVzIGFkZCB0aGVtIHRvIHRoZSB0ZW1wbGF0ZVxuICAgIGlmKGhzLmhpZ2hzY29yZS5sZW5ndGggPiAwICl7XG4gICAgICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCJoMlwiKS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIkhpZ2hzY29yZVwiKSk7XG4gICAgICAgIHZhciBoc0ZyYWcgPSBocy5jcmVhdGVIaWdoc2NvcmVGcmFnbWVudCgpO1xuICAgICAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwidGFibGVcIikuYXBwZW5kQ2hpbGQoaHNGcmFnKTtcbiAgICB9XG5cbiAgICAvL2FkZCB0aGUgdGVtcGxhdGUgdG8gY29udGVudFxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSB0aGUgZ2FtZSBjb21wbGV0ZWQtdmlldyBhbmQgcHJlc2VudCBpdCB0byB0aGUgdXNlclxuICovXG5RdWl6LnByb3RvdHlwZS5nYW1lQ29tcGxldGVkID0gZnVuY3Rpb24oKSB7XG4gICAgLy9jcmVhdGUgbmV3IGhpZ2hzY29yZSBtb2R1bGUgdG8gaGFuZGxlIGl0XG4gICAgdmFyIGhzID0gbmV3IEhpZ2hzY29yZSh0aGlzLm5pY2tuYW1lLCB0aGlzLnRvdGFsVGltZS50b0ZpeGVkKDMpKTtcbiAgICB2YXIgaXNOZXcgPSBocy5hZGRUb0xpc3QoKTtcblxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtcXVpekNvbXBsZXRlZFwiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcblxuICAgIC8vZ2V0IHRoZSBoaWdoc2NvcmUgaWYgdGhlIGhpZ2hzY29yZSBoYXMgZW50cmllc1xuICAgIGlmKGhzLmhpZ2hzY29yZS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIuaHMtdGl0bGVcIikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJIaWdoc2NvcmVcIikpO1xuICAgICAgICB2YXIgaHNGcmFnID0gaHMuY3JlYXRlSGlnaHNjb3JlRnJhZ21lbnQoaXNOZXcpO1xuICAgICAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwidGFibGVcIikuYXBwZW5kQ2hpbGQoaHNGcmFnKTtcbiAgICB9XG5cbiAgICBpZihpc05ldykge1xuICAgICAgICB2YXIgbmV3SFMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaDFcIik7XG4gICAgICAgIG5ld0hTLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiTmV3IEhpZ2hzY29yZSFcIikpO1xuICAgICAgICB2YXIgZGl2ID0gdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcImRpdlwiKTtcbiAgICAgICAgZGl2Lmluc2VydEJlZm9yZShuZXdIUywgZGl2LmZpcnN0Q2hpbGQpO1xuICAgIH1cblxuICAgIHRoaXMuY2xlYXJEaXYoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpKTtcblxuICAgIHZhciBoMSA9IHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIudGltZVwiKTtcbiAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMudG90YWxUaW1lLnRvRml4ZWQoMykpO1xuICAgIGgxLmFwcGVuZENoaWxkKHRleHQpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGNsZWFyIGEgc3BlY2lmaWMgZGl2IG9mIGNoaWxkc1xuICogQHBhcmFtIGRpdntPYmplY3R9LCB0aGUgZGl2ZWxlbWVudCB0byBjbGVhclxuICovXG5RdWl6LnByb3RvdHlwZS5jbGVhckRpdiA9IGZ1bmN0aW9uKGRpdikge1xuICAgIHdoaWxlKGRpdi5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgZGl2LnJlbW92ZUNoaWxkKGRpdi5sYXN0Q2hpbGQpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUXVpejtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTI0LlxuICovXG5cbi8qKlxuICogVGltZXIgY29uc3RydWN0b3JcbiAqIEBwYXJhbSBvd25lcntPYmplY3R9LCB0aGUgb3duZXItb2JqZWN0IHRoYXQgY3JlYXRlZCB0aGUgdGltZXJcbiAqIEBwYXJhbSBlbGVtZW50e09iamVjdH0sIGVsZW1lbnQgdG8gcHJpbnQgdGhlIHRpbWVyIHRvXG4gKiBAcGFyYW0gdGltZXtOdW1iZXJ9LCB0aGUgdGltZSB0byBjb3VudCBkb3duXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVGltZXIob3duZXIsIGVsZW1lbnQsIHRpbWUpIHtcbiAgICB0aGlzLnRpbWUgPSB0aW1lO1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vd25lciA9IG93bmVyO1xuICAgIHRoaXMuc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgdGhpcy5pbnRlcnZhbCA9IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBGdW5jdGlvbiB0aGF0IHN0YXJ0cyBhbiBpbnRlcnZhbCBmb3IgdGhlIHRpbWVyXG4gKi9cblRpbWVyLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vY2FsbCB0aGUgcnVuIGZ1bmN0aW9uIG9uIGVhY2ggaW50ZXJ2YWxcbiAgICB0aGlzLmludGVydmFsID0gc2V0SW50ZXJ2YWwodGhpcy5ydW4uYmluZCh0aGlzKSwgMTAwKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gYmUgZXhlY3V0ZWQgZWFjaCBpbnRlcnZhbCBvZiB0aGUgdGltZXJcbiAqL1xuVGltZXIucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuICAgIC8vY291bnQgdGhlIGRpZmZlcmVuY2UgZnJvbSBzdGFydCB0byBub3dcbiAgICB2YXIgZGlmZiA9IChub3cgLSB0aGlzLnN0YXJ0VGltZSkvMTAwMDtcblxuICAgIC8vY291bnQgdGhlIHRpbWUgLSBkaWZmZXJlbmNlIHRvIHNob3cgY291bnRkb3duXG4gICAgdmFyIHNob3dUaW1lID0gdGhpcy50aW1lIC0gZGlmZjtcblxuICAgIGlmKGRpZmYgPj0gdGhpcy50aW1lKSB7XG4gICAgICAgIC8vdGltZSBpZiB1cFxuICAgICAgICBzaG93VGltZSA9IDA7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbCk7XG5cbiAgICAgICAgLy9jYWxsIG93bmVyIGdhbWVPdmVyIHNpbmNlIHRpbWUgaXMgb3V0XG4gICAgICAgIHRoaXMub3duZXIuZ2FtZU92ZXIoKTtcbiAgICB9XG5cbiAgICAvL3Nob3cgdGhlIHRpbWVyIHdpdGggb25lIGRlY2ltYWxcbiAgICB0aGlzLnByaW50KHNob3dUaW1lLnRvRml4ZWQoMSkpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0aGF0IHN0b3BzIHRoZSB0aW1lciBiZWZvcmUgaXRzIG92ZXJcbiAqIEByZXR1cm5zIHtudW1iZXJ9LCB0aGUgZGlmZmVyZW5jZSBpbiBkZWNvdW5kc1xuICovXG5UaW1lci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbCk7XG4gICAgdmFyIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG4gICAgcmV0dXJuIChub3cgLSB0aGlzLnN0YXJ0VGltZSkvMTAwMDtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gc2hvdyB0aGUgdGltZXIgYXQgdGhlIGdpdmVuIGVsZW1lbnRcbiAqIEBwYXJhbSBkaWZme051bWJlcn0gdGhlIHRpbWUgdG8gYmUgcHJpbnRlZFxuICovXG5UaW1lci5wcm90b3R5cGUucHJpbnQgPSBmdW5jdGlvbihkaWZmKSB7XG4gICAgdGhpcy5lbGVtZW50LnJlcGxhY2VDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkaWZmKSwgdGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUaW1lcjtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIFF1aXogPSByZXF1aXJlKFwiLi9RdWl6XCIpO1xudmFyIHE7XG5cbmZ1bmN0aW9uIGFkZFRoZW1lU2VsZWN0b3IoKSB7XG4gICAgLy9hZGQgbGlzdGVuZXIgZm9yIHRoZSB0aGVtZSBjaG9vc2VyXG4gICAgdmFyIHNlbGVjdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGhlbWUtc2VsZWN0b3JcIik7XG4gICAgc2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBiYXNlU3R5bGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2Jhc2VTdHlsZVwiKTtcbiAgICAgICAgdmFyIGxvYWRpbmdTdHlsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbG9hZGluZ1N0eWxlXCIpO1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcInRoZW1lXCIsIHNlbGVjdC52YWx1ZSk7XG4gICAgICAgIGlmKHNlbGVjdC52YWx1ZSA9PT0gXCJwbGF5ZnVsXCIpIHtcbiAgICAgICAgICAgIGJhc2VTdHlsZS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwic3R5bGVzaGVldC9wbGF5ZnVsLmNzc1wiKTtcbiAgICAgICAgICAgIGxvYWRpbmdTdHlsZS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwic3R5bGVzaGVldC9wbGF5ZnVsX2xvYWRpbmcuY3NzXCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYoc2VsZWN0LnZhbHVlID09PSBcImhhY2tlclwiKSB7XG4gICAgICAgICAgICBiYXNlU3R5bGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvaGFja2VyLmNzc1wiKTtcbiAgICAgICAgICAgIC8vbG9hZGluZ1N0eWxlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L2hhY2tlcl9sb2FkaW5nLmNzc1wiKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSB0aGUgc3VibWl0IGZvciBuaWNrbmFtZSBhbmQgc3RhcnQgdGhlIHF1aXpcbiAqIEBwYXJhbSBldmVudCwgdGhlIGV2ZW50aGFuZGxlciBmcm9tIHRoZSBsaXN0ZW5lclxuICovXG5mdW5jdGlvbiBzdWJtaXQoZXZlbnQpIHtcbiAgICBpZiAoZXZlbnQud2hpY2ggPT09IDEzIHx8IGV2ZW50LmtleUNvZGUgPT09IDEzIHx8IGV2ZW50LnR5cGUgPT09IFwiY2xpY2tcIikge1xuICAgICAgICAvL2Rpc2FibGUgZm9ybXMgYWN0aW9uIHNvIHBhZ2Ugd29udCByZWxvYWQgd2l0aCBlbnRlclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmlja25hbWVcIikudmFsdWU7XG5cbiAgICAgICAgLy9pZiBuaWNrbmFtZSB3cml0dGVuLCBzdGFydCBxdWl6XG4gICAgICAgIGlmKGlucHV0Lmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIHEgPSBuZXcgUXVpeihpbnB1dCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbnZhciBidXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3N1Ym1pdFwiKTtcbnZhciBmb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNxRm9ybVwiKTtcblxuYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLHN1Ym1pdCwgdHJ1ZSk7XG5mb3JtLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlwcmVzc1wiLCBzdWJtaXQsIHRydWUpO1xuXG5hZGRUaGVtZVNlbGVjdG9yKCk7XG5cbmlmKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwidGhlbWVcIikpIHtcbiAgICB2YXIgdGhlbWUgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInRoZW1lXCIpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYmFzZVN0eWxlXCIpLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L1wiK3RoZW1lK1wiLmNzc1wiKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2xvYWRpbmdTdHlsZVwiKS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwic3R5bGVzaGVldC9cIit0aGVtZStcIl9sb2FkaW5nLmNzc1wiKTtcbn1cbiJdfQ==
