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

        //check if highscore
        if(parseFloat(this.score) < parseFloat(lastScore) || this.highscore.length < 5) {
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
            loadingStyle.setAttribute("href", "stylesheet/hacker_loading.css");
        }
        else if(select.value === "terminal") {
            baseStyle.setAttribute("href", "stylesheet/terminal.css");
            loadingStyle.setAttribute("href", "stylesheet/terminal_loading.css");
        }
        else if(select.value === "nostyle") {
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
        if(input.length > 1) {
            q = new Quiz(input);
        }
    }
}

if(localStorage.getItem("theme")) {
    var theme = localStorage.getItem("theme");
    document.querySelector("#baseStyle").setAttribute("href", "stylesheet/"+theme+".css");
    document.querySelector("#loadingStyle").setAttribute("href", "stylesheet/"+theme+"_loading.css");
}

var button = document.querySelector("#submit");
var form = document.querySelector("#qForm");

button.addEventListener("click",submit, true);
form.addEventListener("keypress", submit, true);

//set nickname-input focus at start
document.querySelector("input").focus();

addThemeSelector();

},{"./Quiz":4}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMS4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQWpheC5qcyIsImNsaWVudC9zb3VyY2UvanMvSGlnaHNjb3JlLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9RdWVzdGlvbi5qcyIsImNsaWVudC9zb3VyY2UvanMvUXVpei5qcyIsImNsaWVudC9zb3VyY2UvanMvVGltZXIuanMiLCJjbGllbnQvc291cmNlL2pzL2FwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IE9za2FyIG9uIDIwMTUtMTEtMjMuXG4gKi9cblxuLyoqXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgcmVxdWVzdHMgdmlhIFhNTEh0dHBSZXF1ZXN0XG4gKiBAcGFyYW0gY29uZmlne09iamVjdH0sIG9iamVjdCB3aXRoIG1ldGhvZCBhbmQgdXJsLCBwb3NzaWJseSBkYXRhXG4gKiBAcGFyYW0gY2FsbGJhY2t7RnVuY3Rpb259LCB0aGUgZnVuY3Rpb24gdG8gY2FsbCBhdCByZXNwb25zZVxuICovXG5mdW5jdGlvbiByZXEoY29uZmlnLCBjYWxsYmFjaykge1xuICAgIHZhciByID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAvL2FkZCBldmVudGxpc3RlbmVyIGZvciByZXNwb25zZVxuICAgIHIuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgaWYgKHIuc3RhdHVzID49IDQwMCkge1xuICAgICAgICAgICAgLy9nb3QgZXJyb3IsIGNhbGwgd2l0aCBlcnJvcmNvZGVcbiAgICAgICAgICAgIGNhbGxiYWNrKHIuc3RhdHVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vY2FsbCB0aGUgY2FsbGJhY2sgZnVuY3Rpb24gd2l0aCByZXNwb25zZVRleHRcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgci5yZXNwb25zZVRleHQpO1xuICAgIH0pO1xuXG4gICAgLy9vcGVuIGEgcmVxdWVzdCBmcm9tIHRoZSBjb25maWdcbiAgICByLm9wZW4oY29uZmlnLm1ldGhvZCwgY29uZmlnLnVybCk7XG5cbiAgICBpZihjb25maWcuZGF0YSl7XG4gICAgICAgIC8vc2VuZCB0aGUgZGF0YSBhcyBKU09OIHRvIHRoZSBzZXJ2ZXJcbiAgICAgICAgci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcbiAgICAgICAgci5zZW5kKEpTT04uc3RyaW5naWZ5KGNvbmZpZy5kYXRhKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy9zZW5kIHJlcXVlc3RcbiAgICAgICAgci5zZW5kKG51bGwpO1xuICAgIH1cbn1cblxuXG5tb2R1bGUuZXhwb3J0cy5yZXEgPSByZXE7XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yNC5cbiAqL1xuXG4vKipcbiAqIEhpZ2hzY29yZSBjb25zdHJ1Y3RvclxuICogQHBhcmFtIG5pY2tuYW1le3N0cmluZ30sIHRoZSBuaWNrbmFtZVxuICogQHBhcmFtIHNjb3Jle3N0cmluZ30sIHRoZSBzY29yZSh0aW1lKVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEhpZ2hzY29yZShuaWNrbmFtZSwgc2NvcmUpIHtcbiAgICB0aGlzLm5pY2tuYW1lID0gbmlja25hbWU7XG4gICAgdGhpcy5zY29yZSA9IHNjb3JlO1xuICAgIHRoaXMuaGlnaHNjb3JlID0gW107XG5cbiAgICAvL2NhbGwgdG8gcmVhZCBoaWdoc2NvcmUgZmlsZSBmcm9tIGxvY2FsIHN0b3JhZ2VcbiAgICB0aGlzLnJlYWRGcm9tRmlsZSgpO1xufVxuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHJlYWQgdGhlIGhpZ2hzY29yZS1maWxlIGZyb20gbG9jYWwgc3RvcmFnZVxuICovXG5IaWdoc2NvcmUucHJvdG90eXBlLnJlYWRGcm9tRmlsZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBoc0ZpbGUgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcImhzXCIpO1xuICAgIGlmKGhzRmlsZSkge1xuICAgICAgICAvL3BhcnNlIGZpbGUgaW50byBKU09OXG4gICAgICAgIHZhciBqc29uID0gSlNPTi5wYXJzZShoc0ZpbGUpO1xuXG4gICAgICAgIC8vZmlsbCB0aGUgaGlnaHNjb3JlLWFycmF5IHdpdGggZW50cmllc1xuICAgICAgICBmb3IgKHZhciBuaWNrbmFtZSBpbiBqc29uKSB7XG4gICAgICAgICAgICBpZihqc29uLmhhc093blByb3BlcnR5KG5pY2tuYW1lKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGlnaHNjb3JlLnB1c2goanNvbltuaWNrbmFtZV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBjaGVjayBpZiB0aGUgc2NvcmUgdGFrZXMgYSBwbGFjZSBpbnRvIHRoZSBoaWdoc2NvcmVcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5IaWdoc2NvcmUucHJvdG90eXBlLmlzSGlnaHNjb3JlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGlzSGlnaHNjb3JlID0gZmFsc2U7XG4gICAgaWYodGhpcy5oaWdoc2NvcmUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIC8vaGlnaHNjb3JlIGlzIGVtcHR5LCB0aGVyZWZvcmUgbmV3IGhpZ2hzY29yZVxuICAgICAgICBpc0hpZ2hzY29yZSA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy9nZXQgdGhlIHNjb3JlIGxhc3QgaW4gdGhlIGxpc3RcbiAgICAgICAgdmFyIGxhc3RTY29yZSA9IHRoaXMuaGlnaHNjb3JlW3RoaXMuaGlnaHNjb3JlLmxlbmd0aCAtIDFdLnNjb3JlO1xuXG4gICAgICAgIC8vY2hlY2sgaWYgaGlnaHNjb3JlXG4gICAgICAgIGlmKHBhcnNlRmxvYXQodGhpcy5zY29yZSkgPCBwYXJzZUZsb2F0KGxhc3RTY29yZSkgfHwgdGhpcy5oaWdoc2NvcmUubGVuZ3RoIDwgNSkge1xuICAgICAgICAgICAgaXNIaWdoc2NvcmUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpc0hpZ2hzY29yZTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gYWRkIHRoZSBzY29yZSBpbnRvIHRoZSBsaXN0XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0sIGFkZGVkIG9yIG5vdFxuICovXG5IaWdoc2NvcmUucHJvdG90eXBlLmFkZFRvTGlzdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhZGRlZCA9IGZhbHNlO1xuICAgIC8vY2FsbCB0aGUgaXNIaWdoc2NvcmUgdG8gY2hlY2sgaWYgc2NvcmUgc2hvdWxkIGJlIGFkZGVkXG4gICAgaWYodGhpcy5pc0hpZ2hzY29yZSgpKSB7XG4gICAgICAgIC8vc2F2ZSB0aGUgbmlja25hbWUsIHNjb3JlIGFuZCBkYXRlc3RhbXAgaW50byBhbiBvYmplY3RcbiAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICB2YXIgdGhpc1Njb3JlID0ge1xuICAgICAgICAgICAgbmlja25hbWU6IHRoaXMubmlja25hbWUsXG4gICAgICAgICAgICBzY29yZTogdGhpcy5zY29yZSxcbiAgICAgICAgICAgIGRhdGU6IGRhdGVcbiAgICAgICAgfTtcblxuICAgICAgICAvL2RlbGV0ZSB0aGUgbGFzdCBwb3NpdGlvbiBvZiB0aGUgaGlnaHNjb3JlIGFycmF5XG4gICAgICAgIGlmKHRoaXMuaGlnaHNjb3JlLmxlbmd0aCA9PT0gNSkge1xuICAgICAgICAgICAgLy9yZW1vdmUgdGhlIG9uZSBsYXN0XG4gICAgICAgICAgICB0aGlzLmhpZ2hzY29yZS5zcGxpY2UoLTEsIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9wdXNoIHRoZSBuZXcgYW5kIHNvcnQgdGhlIGFycmF5XG4gICAgICAgIHRoaXMuaGlnaHNjb3JlLnB1c2godGhpc1Njb3JlKTtcbiAgICAgICAgdGhpcy5oaWdoc2NvcmUgPSB0aGlzLmhpZ2hzY29yZS5zb3J0KGZ1bmN0aW9uKGEsYikge3JldHVybiBhLnNjb3JlIC0gYi5zY29yZTt9KTtcblxuICAgICAgICAvL2NhbGwgdG8gc2F2ZSBpdFxuICAgICAgICB0aGlzLnNhdmVUb0ZpbGUoKTtcblxuICAgICAgICBhZGRlZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBhZGRlZDtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gc2F2ZSB0aGUgaGlnaHNjb3JlIHRvIGxvY2FsIHN0b3JhZ2VcbiAqL1xuSGlnaHNjb3JlLnByb3RvdHlwZS5zYXZlVG9GaWxlID0gZnVuY3Rpb24oKSB7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJoc1wiLCBKU09OLnN0cmluZ2lmeSh0aGlzLmhpZ2hzY29yZSkpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBnZXQgdGhlIGhpZ2hzY29yZWZyYWdtZW50IGNvbnRhaW5pbmcgdGhlIGhpZ2hzY29yZS1wYXJ0IG9mIHRhYmxlXG4gKiBAcmV0dXJucyB7RG9jdW1lbnRGcmFnbWVudH1cbiAqL1xuSGlnaHNjb3JlLnByb3RvdHlwZS5jcmVhdGVIaWdoc2NvcmVGcmFnbWVudCA9IGZ1bmN0aW9uKGlzTmV3KSB7XG4gICAgdmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIHRlbXBsYXRlO1xuICAgIHZhciBoc05pY2tuYW1lO1xuICAgIHZhciBoc1Njb3JlO1xuICAgIHZhciBoc0RhdGU7XG4gICAgdmFyIGRhdGU7XG4gICAgdmFyIGxhdGVzdEVudHJ5ID0gbmV3IERhdGUodGhpcy5oaWdoc2NvcmVbMF0uZGF0ZSk7XG4gICAgdmFyIGhpZ2hsaWdodEluZGV4ID0gMDtcblxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmhpZ2hzY29yZS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAvL2dldCB0aGUgdGVtcGxhdGUgZm9yIGEgdGFibGUtcm93XG4gICAgICAgIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0ZW1wbGF0ZS1oaWdoc2NvcmVSb3dcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgIGhzTmlja25hbWUgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLW5pY2tuYW1lXCIpO1xuICAgICAgICBoc1Njb3JlID0gdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5ocy1zY29yZVwiKTtcbiAgICAgICAgaHNEYXRlID0gdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5ocy1kYXRlXCIpO1xuXG4gICAgICAgIC8vYXBwZW5kIHRoZSBuaWNrbmFtZSBhbmQgc2NvcmUgdG8gdGhlIHJvd1xuICAgICAgICBoc05pY2tuYW1lLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMuaGlnaHNjb3JlW2ldLm5pY2tuYW1lKSk7XG4gICAgICAgIGhzU2NvcmUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5oaWdoc2NvcmVbaV0uc2NvcmUpKTtcblxuICAgICAgICBkYXRlID0gbmV3IERhdGUodGhpcy5oaWdoc2NvcmVbaV0uZGF0ZSk7XG4gICAgICAgIGhzRGF0ZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRlLnRvRGF0ZVN0cmluZygpKSk7XG5cbiAgICAgICAgaWYgKGlzTmV3KSB7XG4gICAgICAgICAgICAvL2NoZWNrIGZvciB0aGUgbGV0ZXN0IGVudHJ5XG4gICAgICAgICAgICBpZiAoZGF0ZS52YWx1ZU9mKCkgPiBsYXRlc3RFbnRyeS52YWx1ZU9mKCkpIHtcbiAgICAgICAgICAgICAgICBoaWdobGlnaHRJbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgbGF0ZXN0RW50cnkgPSBkYXRlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy9hcHBlbmQgcm93IHRvIGZyYWdtZW50XG4gICAgICAgIGZyYWcuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xuICAgIH1cblxuICAgIGlmKGlzTmV3KSB7XG4gICAgICAgIC8vaGlnaGxpZ2h0IHRoZSBuZXcgaGlnaHNjb3JlIGluIHRoZSBsaXN0XG4gICAgICAgIGZyYWcucXVlcnlTZWxlY3RvckFsbChcInRyXCIpW2hpZ2hsaWdodEluZGV4XS5jbGFzc0xpc3QuYWRkKFwiaGlnaGxpZ2h0XCIpO1xuICAgIH1cblxuICAgIHJldHVybiBmcmFnO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBIaWdoc2NvcmU7XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yMy5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogUXVlc3Rpb24gY29uc3RydWN0b3JcbiAqIEBwYXJhbSBvYmp7T2JqZWN0fSwgb2JqZWN0IHRoYXQgaG9sZHMgYSBxdWVzdGlvblxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFF1ZXN0aW9uKG9iaikge1xuICAgIHRoaXMuaWQgPSBvYmouaWQ7XG4gICAgdGhpcy5xdWVzdGlvbiA9IG9iai5xdWVzdGlvbjtcbiAgICB0aGlzLmFsdCA9IG9iai5hbHRlcm5hdGl2ZXM7XG59XG5cbi8qKlxuICogRnVuY3Rpb25iIHRvIHByZXNlbnQgdGhlIHF1ZXN0aW9uXG4gKi9cblF1ZXN0aW9uLnByb3RvdHlwZS5wcmludCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vc3RhdGVtZW50IHRvIGNhbGwgdGhlIHJpZ2h0ZnVsIHByaW50ZnVuY3Rpb25cbiAgICBpZih0aGlzLmFsdCkge1xuICAgICAgICB0aGlzLnByaW50QWx0UXVlc3Rpb24oKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMucHJpbnRRdWVzdGlvbigpO1xuICAgIH1cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRcIikuZm9jdXMoKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gY2xlYXIgYSBkaXZcbiAqIEBwYXJhbSBkaXZ7b2JqZWN0fSwgdGhlIGRpdiB0byBjbGVhclxuICovXG5RdWVzdGlvbi5wcm90b3R5cGUuY2xlYXJEaXYgPSBmdW5jdGlvbihkaXYpIHtcbiAgICB3aGlsZShkaXYuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgIGRpdi5yZW1vdmVDaGlsZChkaXYubGFzdENoaWxkKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHByZXNlbnQgdGhlIHF1ZXJzdGlvbiB0aGF0IGhhcyBhbHRlcm5hdGl2ZXNcbiAqL1xuUXVlc3Rpb24ucHJvdG90eXBlLnByaW50QWx0UXVlc3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICAvL2dldCB0aGUgdGVtcGxhdGUgYW5kIGFwcGVuZCB0aGUgYWx0ZXJuYXRpdmVzXG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0ZW1wbGF0ZS1xdWVzdGlvbi1hbHRcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5xSGVhZFwiKS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLnF1ZXN0aW9uKSk7XG5cbiAgICAvL2NhbGwgdGhlIGZ1bmN0aW9uIHRoYXQgaGFuZGxlcyB0aGUgYWx0ZXJuYXRpdmVzXG4gICAgdmFyIGlucHV0RnJhZyA9IHRoaXMuZ2V0QWx0RnJhZygpO1xuICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIjcUZvcm1cIikuaW5zZXJ0QmVmb3JlKGlucHV0RnJhZywgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIiNzdWJtaXRcIikpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSB0aGUgYWx0ZXJuYXRpdmVzXG4gKiBAcmV0dXJucyB7RG9jdW1lbnRGcmFnbWVudH0sIHRoZSBmcmFnbWVudCBmb3IgdGhlIGFsdGVybmF0aXZlc1xuICovXG5RdWVzdGlvbi5wcm90b3R5cGUuZ2V0QWx0RnJhZyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpbnB1dEZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIGlucHV0O1xuICAgIHZhciBsYWJlbDtcbiAgICB2YXIgZmlyc3QgPSB0cnVlO1xuXG4gICAgZm9yKHZhciBhbHQgaW4gdGhpcy5hbHQpIHtcbiAgICAgICAgaWYodGhpcy5hbHQuaGFzT3duUHJvcGVydHkoYWx0KSkge1xuICAgICAgICAgICAgLy9nZXQgdGhlIHRlbXBsYXRlIGZvciBhbHRlcm5hdGl2ZXNcbiAgICAgICAgICAgIGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0ZW1wbGF0ZS1hbHRlcm5hdGl2ZVwiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgIC8vYXBwZW5kIHRoZSBhbHRlcm5hdGl2ZVxuICAgICAgICAgICAgaWYgKGZpcnN0KSB7XG4gICAgICAgICAgICAgICAgaW5wdXQucXVlcnlTZWxlY3RvcihcImlucHV0XCIpLnNldEF0dHJpYnV0ZShcImNoZWNrZWRcIiwgXCJjaGVja2VkXCIpO1xuICAgICAgICAgICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbnB1dC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRcIikuc2V0QXR0cmlidXRlKFwidmFsdWVcIiwgYWx0KTtcbiAgICAgICAgICAgIGxhYmVsID0gaW5wdXQucXVlcnlTZWxlY3RvcihcImxhYmVsXCIpO1xuICAgICAgICAgICAgbGFiZWwuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5hbHRbYWx0XSkpO1xuXG4gICAgICAgICAgICBpbnB1dEZyYWcuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICB9XG5cbiAgICB9XG4gICAgcmV0dXJuIGlucHV0RnJhZztcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gcHJlc2VudCBhIHF1ZXN0aW9uIHdpdGggdGV4dC1pbnB1dFxuICovXG5RdWVzdGlvbi5wcm90b3R5cGUucHJpbnRRdWVzdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIC8vZ2V0IHRoZSB0ZW1wbGF0ZSBhbmQgYXBwZW5kIHRoZSBxdWVzdGlvblxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtcXVlc3Rpb25cIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIi5xSGVhZFwiKS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLnF1ZXN0aW9uKSk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUXVlc3Rpb247XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yMy5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgUXVlc3Rpb24gPSByZXF1aXJlKFwiLi9RdWVzdGlvblwiKTtcbnZhciBBamF4ID0gcmVxdWlyZShcIi4vQWpheFwiKTtcbnZhciBUaW1lciA9IHJlcXVpcmUoXCIuL1RpbWVyXCIpO1xudmFyIEhpZ2hzY29yZSA9IHJlcXVpcmUoXCIuL0hpZ2hzY29yZVwiKTtcblxuLyoqXG4gKiBDb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgdGhlIFF1aXpcbiAqIEBwYXJhbSBuaWNrbmFtZXtzdHJpbmd9LCBuaWNrbmFtZSB0byB1c2UgZm9yIGhpZ2hzY29yZVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFF1aXoobmlja25hbWUpIHtcbiAgICB0aGlzLm5pY2tuYW1lID0gbmlja25hbWU7XG4gICAgdGhpcy50aW1lciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnF1ZXN0aW9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMubmV4dFVSTCA9IFwiaHR0cDovL3Zob3N0My5sbnUuc2U6MjAwODAvcXVlc3Rpb24vMVwiO1xuICAgIHRoaXMuYnV0dG9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuZm9ybSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnRvdGFsVGltZSA9IDA7XG5cbiAgICAvL3JlcXVlc3QgdGhlIGZpcnN0IHF1ZXN0aW9uXG4gICAgdGhpcy5nZXRRdWVzdGlvbigpO1xufVxuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHNlbmQgYSByZXF1ZXN0IGZvciBhIG5ldyBxdWVzdGlvblxuICovXG5RdWl6LnByb3RvdHlwZS5nZXRRdWVzdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY29uZmlnID0ge21ldGhvZDogXCJHRVRcIiwgdXJsOiB0aGlzLm5leHRVUkx9O1xuICAgIHZhciByZXNwb25zZUZ1bmN0aW9uID0gdGhpcy5yZXNwb25zZS5iaW5kKHRoaXMpO1xuXG4gICAgQWpheC5yZXEoY29uZmlnLCByZXNwb25zZUZ1bmN0aW9uKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gaGFuZGxlIHRoZSByZXNwb25zZSwgdXNlcyBhcyBhcmd1bWVudCBcImNhbGxiYWNrXCIgaW4gYSByZXF1ZXN0XG4gKiBAcGFyYW0gZXJyb3J7TnVtYmVyfSwgZXJyb3Jjb2RlLCBudWxsIGlmIG5vIGVycm9yXG4gKiBAcGFyYW0gcmVzcG9uc2V7c3RyaW5nfSwgcmVzcG9uc2Ugc3RyaW5nIHRvIHBhcnNlIEpTT04gZnJvbVxuICovXG5RdWl6LnByb3RvdHlwZS5yZXNwb25zZSA9IGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcbiAgICAvL2hhbmRsZSBlcnJvcnMgKDQwNCBtZWFucyBubyBtb3JlIHF1ZXN0aW9ucylcbiAgICBpZihlcnJvcikge1xuICAgICAgICAvL3ByZXNlbnQgdGhlIGdhbWVvdmVyLXZpZXcgdG8gdXNlclxuICAgICAgICB0aGlzLmdhbWVPdmVyKCk7XG4gICAgfVxuXG4gICAgLy9oYW5kbGUgdGhlIHJlc3BvbnNlIHN0cmluZ1xuICAgIGlmKHJlc3BvbnNlKSB7XG4gICAgICAgIC8vcGFzcmUgdG8gSlNPTlxuICAgICAgICB2YXIgb2JqID0gSlNPTi5wYXJzZShyZXNwb25zZSk7XG4gICAgICAgIHRoaXMubmV4dFVSTCA9IG9iai5uZXh0VVJMO1xuXG4gICAgICAgIC8vc3RhdGVtZW50IHRvIGNhbGwgdGhlIHJpZ2h0ZnVsIGZ1bmN0aW9uIG9uIHRoZSByZXNwb25zZVxuICAgICAgICBpZihvYmoucXVlc3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMucmVzcG9uc2VRdWVzdGlvbihvYmopO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYodGhpcy5uZXh0VVJMIHx8IG9iai5tZXNzYWdlID09PSBcIkNvcnJlY3QgYW5zd2VyIVwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZUFuc3dlcihvYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGhhbmRsZSBpZiByZXNwb25zZSBpcyBhIHF1ZXN0aW9uXG4gKiBAcGFyYW0gb2Jqe09iamVjdH0sIG9iamVjdCB0aGF0IGhvbGRzIHRoZSBxdWVzdGlvblxuICovXG5RdWl6LnByb3RvdHlwZS5yZXNwb25zZVF1ZXN0aW9uID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGNvbnRlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIik7XG4gICAgdGhpcy5jbGVhckRpdihjb250ZW50KTtcblxuICAgIC8vY3JlYXRlIGEgbmV3IHF1ZXN0aW9uIGZyb20gb2JqZWN0XG4gICAgdGhpcy5xdWVzdGlvbiA9IG5ldyBRdWVzdGlvbihvYmopO1xuICAgIHRoaXMucXVlc3Rpb24ucHJpbnQoKTtcblxuICAgIC8vY3JlYXRlIGEgbmV3IHRpbWVyIGZvciBxdWVzdGlvblxuICAgIHRoaXMudGltZXIgPSBuZXcgVGltZXIodGhpcywgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0aW1lciBoMVwiKSwgMjApO1xuICAgIHRoaXMudGltZXIuc3RhcnQoKTtcblxuICAgIC8vQWRkIGxpbnN0ZW5lcnMgZm9yIHRoZSBmb3JtXG4gICAgdGhpcy5hZGRMaXN0ZW5lcigpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgaWYgcmVzcG9uc2UgaXMgYW4gYW5zd2VyXG4gKiBAcGFyYW0gb2Jqe09iamVjdH0sIG9iamVjdCB0aGF0IGhvbGRzIHRoZSBhbnN3ZXJcbiAqL1xuUXVpei5wcm90b3R5cGUucmVzcG9uc2VBbnN3ZXIgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29udGVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKTtcbiAgICB0aGlzLmNsZWFyRGl2KGNvbnRlbnQpO1xuXG4gICAgLy9IYW5kbGUgdGhlIHRlbXBsYXRlIGZvciBhbnN3ZXJcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLWFuc3dlclwiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKG9iai5tZXNzYWdlKTtcbiAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwicFwiKS5hcHBlbmRDaGlsZCh0ZXh0KTtcblxuICAgIGNvbnRlbnQuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xuXG4gICAgaWYodGhpcy5uZXh0VVJMKSB7XG4gICAgICAgIC8vUmVxdWVzdCBhIG5ldyBxdWVzdGlvbiwgYnV0IHdpdGggYSBkZWxheVxuICAgICAgICB2YXIgbmV3UXVlc3Rpb24gPSB0aGlzLmdldFF1ZXN0aW9uLmJpbmQodGhpcyk7XG4gICAgICAgIHNldFRpbWVvdXQobmV3UXVlc3Rpb24sIDEwMDApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5nYW1lQ29tcGxldGVkKCk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBhZGQgdGhlIGxpc3RlbmVyIGZvciBzdWJtaXRcbiAqL1xuUXVpei5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc3VibWl0XCIpO1xuICAgIHRoaXMuZm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcUZvcm1cIik7XG5cbiAgICB0aGlzLmJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIix0aGlzLnN1Ym1pdC5iaW5kKHRoaXMpLCB0cnVlKTtcbiAgICB0aGlzLmZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcImtleXByZXNzXCIsIHRoaXMuc3VibWl0LmJpbmQodGhpcyksIHRydWUpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgd2hlbiBzdWJtaXQgaXMgdHJpZ2dlcmVkXG4gKi9cblF1aXoucHJvdG90eXBlLnN1Ym1pdCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgLy9JZiB0aGUgdHJpZ2dlciBpcyBlbnRlciBvciBjbGljayBkbyB0aGUgc3VibWl0XG4gICAgaWYgKGV2ZW50LndoaWNoID09PSAxMyB8fCBldmVudC5rZXlDb2RlID09PSAxMyB8fCBldmVudC50eXBlID09PSBcImNsaWNrXCIpIHtcbiAgICAgICAgLy9wcmV2ZW50IHRoZSBmb3JtIHRvIHJlbG9hZCBwYWdlIG9uIGVudGVyXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgdGhpcy50b3RhbFRpbWUgKz0gdGhpcy50aW1lci5zdG9wKCk7XG4gICAgICAgIHZhciBpbnB1dDtcblxuICAgICAgICAvL3JlbW92ZSB0aGUgbGlzdGVuZXJzIHRvIHByZXZlbnQgZG91YmxlLXN1Ym1pdFxuICAgICAgICB0aGlzLmJ1dHRvbi5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zdWJtaXQuYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuZm9ybS5yZW1vdmVFdmVudExpc3RlbmVyKFwia2V5cHJlc3NcIiwgdGhpcy5zdWJtaXQuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgLy9zYXZlIGlucHV0IGRlcGVuZGluZyBvbiB0aGUgdHlwZSBvZiBxdWVzdGlvblxuICAgICAgICBpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNhbnN3ZXJcIikpIHtcbiAgICAgICAgICAgIC8vZ2V0IHRoZSBmb3JtIGlucHV0XG4gICAgICAgICAgICBpbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYW5zd2VyXCIpLnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy9nZXQgdGhlIGNoZWNrZWQgcmVhZGlvYnV0dG9uXG4gICAgICAgICAgICBpbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJpbnB1dFtuYW1lPSdhbHRlcm5hdGl2ZSddOmNoZWNrZWRcIikudmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICAvL3NldCB0aGUgY29uZmlnIHRvIGJlIHNlbnQgdG8gc2VydmVyIGFuZCBzZW5kIGEgcmVxdWVzdFxuICAgICAgICB2YXIgY29uZmlnID0ge1xuICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgIHVybDogdGhpcy5uZXh0VVJMLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIGFuc3dlcjogaW5wdXRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHJlc3BvbnNlRnVuY3Rpb24gPSB0aGlzLnJlc3BvbnNlLmJpbmQodGhpcyk7XG4gICAgICAgIEFqYXgucmVxKGNvbmZpZywgcmVzcG9uc2VGdW5jdGlvbik7XG4gICAgfVxufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgdGhlIGdhbWVPdmVyLXZpZXcgYW5kIHByZXNlbnQgaXQgdG8gdXNlclxuICovXG5RdWl6LnByb3RvdHlwZS5nYW1lT3ZlciA9IGZ1bmN0aW9uKCkge1xuICAgIC8vY3JlYXRlIGEgaGlnaHNjb3JlIG1vZHVsZSB0byBzaG93IGl0IHRvIHRoZSB1c2VyXG4gICAgdmFyIGhzID0gbmV3IEhpZ2hzY29yZSh0aGlzLm5pY2tuYW1lKTtcbiAgICB0aGlzLmNsZWFyRGl2KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKSk7XG5cbiAgICAvL2dldCB0aGUgZ2FtZSBvdmVyIHRlbXBsYXRlXG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0ZW1wbGF0ZS1nYW1lT3ZlclwiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcblxuICAgIC8vaWYgdGhlIGhpZ2hzY29yZSBoYXMgZW50cmllcyBhZGQgdGhlbSB0byB0aGUgdGVtcGxhdGVcbiAgICBpZihocy5oaWdoc2NvcmUubGVuZ3RoID4gMCApe1xuICAgICAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiaDJcIikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJIaWdoc2NvcmVcIikpO1xuICAgICAgICB2YXIgaHNGcmFnID0gaHMuY3JlYXRlSGlnaHNjb3JlRnJhZ21lbnQoKTtcbiAgICAgICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcInRhYmxlXCIpLmFwcGVuZENoaWxkKGhzRnJhZyk7XG4gICAgfVxuXG4gICAgLy9hZGQgdGhlIHRlbXBsYXRlIHRvIGNvbnRlbnRcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgdGhlIGdhbWUgY29tcGxldGVkLXZpZXcgYW5kIHByZXNlbnQgaXQgdG8gdGhlIHVzZXJcbiAqL1xuUXVpei5wcm90b3R5cGUuZ2FtZUNvbXBsZXRlZCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vY3JlYXRlIG5ldyBoaWdoc2NvcmUgbW9kdWxlIHRvIGhhbmRsZSBpdFxuICAgIHZhciBocyA9IG5ldyBIaWdoc2NvcmUodGhpcy5uaWNrbmFtZSwgdGhpcy50b3RhbFRpbWUudG9GaXhlZCgzKSk7XG4gICAgdmFyIGlzTmV3ID0gaHMuYWRkVG9MaXN0KCk7XG5cbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLXF1aXpDb21wbGV0ZWRcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG5cbiAgICAvL2dldCB0aGUgaGlnaHNjb3JlIGlmIHRoZSBoaWdoc2NvcmUgaGFzIGVudHJpZXNcbiAgICBpZihocy5oaWdoc2NvcmUubGVuZ3RoID4gMCkge1xuICAgICAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLmhzLXRpdGxlXCIpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiSGlnaHNjb3JlXCIpKTtcbiAgICAgICAgdmFyIGhzRnJhZyA9IGhzLmNyZWF0ZUhpZ2hzY29yZUZyYWdtZW50KGlzTmV3KTtcbiAgICAgICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcInRhYmxlXCIpLmFwcGVuZENoaWxkKGhzRnJhZyk7XG4gICAgfVxuXG4gICAgaWYoaXNOZXcpIHtcbiAgICAgICAgdmFyIG5ld0hTID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImgxXCIpO1xuICAgICAgICBuZXdIUy5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIk5ldyBIaWdoc2NvcmUhXCIpKTtcbiAgICAgICAgdmFyIGRpdiA9IHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCJkaXZcIik7XG4gICAgICAgIGRpdi5pbnNlcnRCZWZvcmUobmV3SFMsIGRpdi5maXJzdENoaWxkKTtcbiAgICB9XG5cbiAgICB0aGlzLmNsZWFyRGl2KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKSk7XG5cbiAgICB2YXIgaDEgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLnRpbWVcIik7XG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLnRvdGFsVGltZS50b0ZpeGVkKDMpKTtcbiAgICBoMS5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBjbGVhciBhIHNwZWNpZmljIGRpdiBvZiBjaGlsZHNcbiAqIEBwYXJhbSBkaXZ7T2JqZWN0fSwgdGhlIGRpdmVsZW1lbnQgdG8gY2xlYXJcbiAqL1xuUXVpei5wcm90b3R5cGUuY2xlYXJEaXYgPSBmdW5jdGlvbihkaXYpIHtcbiAgICB3aGlsZShkaXYuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgIGRpdi5yZW1vdmVDaGlsZChkaXYubGFzdENoaWxkKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFF1aXo7XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yNC5cbiAqL1xuXG4vKipcbiAqIFRpbWVyIGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0gb3duZXJ7T2JqZWN0fSwgdGhlIG93bmVyLW9iamVjdCB0aGF0IGNyZWF0ZWQgdGhlIHRpbWVyXG4gKiBAcGFyYW0gZWxlbWVudHtPYmplY3R9LCBlbGVtZW50IHRvIHByaW50IHRoZSB0aW1lciB0b1xuICogQHBhcmFtIHRpbWV7TnVtYmVyfSwgdGhlIHRpbWUgdG8gY291bnQgZG93blxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFRpbWVyKG93bmVyLCBlbGVtZW50LCB0aW1lKSB7XG4gICAgdGhpcy50aW1lID0gdGltZTtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3duZXIgPSBvd25lcjtcbiAgICB0aGlzLnN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIHRoaXMuaW50ZXJ2YWwgPSB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogRnVuY3Rpb24gdGhhdCBzdGFydHMgYW4gaW50ZXJ2YWwgZm9yIHRoZSB0aW1lclxuICovXG5UaW1lci5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICAvL2NhbGwgdGhlIHJ1biBmdW5jdGlvbiBvbiBlYWNoIGludGVydmFsXG4gICAgdGhpcy5pbnRlcnZhbCA9IHNldEludGVydmFsKHRoaXMucnVuLmJpbmQodGhpcyksIDEwMCk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGJlIGV4ZWN1dGVkIGVhY2ggaW50ZXJ2YWwgb2YgdGhlIHRpbWVyXG4gKi9cblRpbWVyLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cbiAgICAvL2NvdW50IHRoZSBkaWZmZXJlbmNlIGZyb20gc3RhcnQgdG8gbm93XG4gICAgdmFyIGRpZmYgPSAobm93IC0gdGhpcy5zdGFydFRpbWUpLzEwMDA7XG5cbiAgICAvL2NvdW50IHRoZSB0aW1lIC0gZGlmZmVyZW5jZSB0byBzaG93IGNvdW50ZG93blxuICAgIHZhciBzaG93VGltZSA9IHRoaXMudGltZSAtIGRpZmY7XG5cbiAgICBpZihkaWZmID49IHRoaXMudGltZSkge1xuICAgICAgICAvL3RpbWUgaWYgdXBcbiAgICAgICAgc2hvd1RpbWUgPSAwO1xuICAgICAgICBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xuXG4gICAgICAgIC8vY2FsbCBvd25lciBnYW1lT3ZlciBzaW5jZSB0aW1lIGlzIG91dFxuICAgICAgICB0aGlzLm93bmVyLmdhbWVPdmVyKCk7XG4gICAgfVxuXG4gICAgLy9zaG93IHRoZSB0aW1lciB3aXRoIG9uZSBkZWNpbWFsXG4gICAgdGhpcy5wcmludChzaG93VGltZS50b0ZpeGVkKDEpKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdGhhdCBzdG9wcyB0aGUgdGltZXIgYmVmb3JlIGl0cyBvdmVyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSwgdGhlIGRpZmZlcmVuY2UgaW4gZGVjb3VuZHNcbiAqL1xuVGltZXIucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgICBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xuICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuICAgIHJldHVybiAobm93IC0gdGhpcy5zdGFydFRpbWUpLzEwMDA7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHNob3cgdGhlIHRpbWVyIGF0IHRoZSBnaXZlbiBlbGVtZW50XG4gKiBAcGFyYW0gZGlmZntOdW1iZXJ9IHRoZSB0aW1lIHRvIGJlIHByaW50ZWRcbiAqL1xuVGltZXIucHJvdG90eXBlLnByaW50ID0gZnVuY3Rpb24oZGlmZikge1xuICAgIHRoaXMuZWxlbWVudC5yZXBsYWNlQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGlmZiksIHRoaXMuZWxlbWVudC5maXJzdENoaWxkKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVGltZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBRdWl6ID0gcmVxdWlyZShcIi4vUXVpelwiKTtcbnZhciBxO1xuXG5mdW5jdGlvbiBhZGRUaGVtZVNlbGVjdG9yKCkge1xuICAgIC8vYWRkIGxpc3RlbmVyIGZvciB0aGUgdGhlbWUgY2hvb3NlclxuICAgIHZhciBzZWxlY3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RoZW1lLXNlbGVjdG9yXCIpO1xuICAgIHNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYmFzZVN0eWxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNiYXNlU3R5bGVcIik7XG4gICAgICAgIHZhciBsb2FkaW5nU3R5bGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2xvYWRpbmdTdHlsZVwiKTtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJ0aGVtZVwiLCBzZWxlY3QudmFsdWUpO1xuICAgICAgICBpZihzZWxlY3QudmFsdWUgPT09IFwicGxheWZ1bFwiKSB7XG4gICAgICAgICAgICBiYXNlU3R5bGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvcGxheWZ1bC5jc3NcIik7XG4gICAgICAgICAgICBsb2FkaW5nU3R5bGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvcGxheWZ1bF9sb2FkaW5nLmNzc1wiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKHNlbGVjdC52YWx1ZSA9PT0gXCJoYWNrZXJcIikge1xuICAgICAgICAgICAgYmFzZVN0eWxlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgXCJzdHlsZXNoZWV0L2hhY2tlci5jc3NcIik7XG4gICAgICAgICAgICBsb2FkaW5nU3R5bGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvaGFja2VyX2xvYWRpbmcuY3NzXCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYoc2VsZWN0LnZhbHVlID09PSBcInRlcm1pbmFsXCIpIHtcbiAgICAgICAgICAgIGJhc2VTdHlsZS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwic3R5bGVzaGVldC90ZXJtaW5hbC5jc3NcIik7XG4gICAgICAgICAgICBsb2FkaW5nU3R5bGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvdGVybWluYWxfbG9hZGluZy5jc3NcIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZihzZWxlY3QudmFsdWUgPT09IFwibm9zdHlsZVwiKSB7XG4gICAgICAgICAgICBiYXNlU3R5bGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvbm9zdHlsZS5jc3NcIik7XG4gICAgICAgICAgICBsb2FkaW5nU3R5bGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvbm9zdHlsZV9sb2FkaW5nLmNzc1wiKTtcbiAgICAgICAgfVxuICAgICAgICAvL3NldCBuaWNrbmFtZS1pbnB1dCBmb2N1c1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRcIikuZm9jdXMoKTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBGdW5jdGlvbiB0byBoYW5kbGUgdGhlIHN1Ym1pdCBmb3Igbmlja25hbWUgYW5kIHN0YXJ0IHRoZSBxdWl6XG4gKiBAcGFyYW0gZXZlbnQsIHRoZSBldmVudGhhbmRsZXIgZnJvbSB0aGUgbGlzdGVuZXJcbiAqL1xuZnVuY3Rpb24gc3VibWl0KGV2ZW50KSB7XG4gICAgaWYgKGV2ZW50LndoaWNoID09PSAxMyB8fCBldmVudC5rZXlDb2RlID09PSAxMyB8fCBldmVudC50eXBlID09PSBcImNsaWNrXCIpIHtcbiAgICAgICAgLy9kaXNhYmxlIGZvcm1zIGFjdGlvbiBzbyBwYWdlIHdvbnQgcmVsb2FkIHdpdGggZW50ZXJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25pY2tuYW1lXCIpLnZhbHVlO1xuXG4gICAgICAgIC8vaWYgbmlja25hbWUgd3JpdHRlbiwgc3RhcnQgcXVpelxuICAgICAgICBpZihpbnB1dC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBxID0gbmV3IFF1aXooaW5wdXQpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5pZihsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInRoZW1lXCIpKSB7XG4gICAgdmFyIHRoZW1lID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJ0aGVtZVwiKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2Jhc2VTdHlsZVwiKS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwic3R5bGVzaGVldC9cIit0aGVtZStcIi5jc3NcIik7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNsb2FkaW5nU3R5bGVcIikuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBcInN0eWxlc2hlZXQvXCIrdGhlbWUrXCJfbG9hZGluZy5jc3NcIik7XG59XG5cbnZhciBidXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3N1Ym1pdFwiKTtcbnZhciBmb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNxRm9ybVwiKTtcblxuYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLHN1Ym1pdCwgdHJ1ZSk7XG5mb3JtLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlwcmVzc1wiLCBzdWJtaXQsIHRydWUpO1xuXG4vL3NldCBuaWNrbmFtZS1pbnB1dCBmb2N1cyBhdCBzdGFydFxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImlucHV0XCIpLmZvY3VzKCk7XG5cbmFkZFRoZW1lU2VsZWN0b3IoKTtcbiJdfQ==
