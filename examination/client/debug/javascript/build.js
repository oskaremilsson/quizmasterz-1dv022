(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Created by Oskar on 2015-11-23.
 */

function req(config, callback) {
    var r = new XMLHttpRequest();

    r.addEventListener("load", function() {

        if (r.status >= 400) {
            callback(r.status);
        }

        callback(null, r.responseText);
    });

    r.open(config.method, config.url);
    console.log(config);
    if(config.data){
        r.setRequestHeader("Content-Type", "application/json");
        r.send(JSON.stringify(config.data));
    } else {
        r.send(null);
    }
}

module.exports.req = req;

},{}],2:[function(require,module,exports){
/**
 * Created by Oskar on 2015-11-23.
 */
"use strict";
var Question = require("./question");
var Ajax = require("./Ajax");
var Timer = require("./Timer");

function Quiz(username) {
    this.username = username;
    this.timer = undefined;
    this.question = undefined;
    this.nextURL = "http://vhost3.lnu.se:20080/question/1";
    this.button = undefined;
    this.form = undefined;
    this.totalTime = 0;

    this.getQuestion();
}


Quiz.prototype.getQuestion = function () {
    console.log("asking..");
    var url = this.nextURL;
    console.log(url);
    var config = {method: "GET", url: url};
    var responseFunction = this.response.bind(this);
    Ajax.req(config, responseFunction);
};

Quiz.prototype.response = function (error, response) {
    var questionDiv = document.querySelector("#question");
    var answerDiv = document.querySelector("#answer-response");

    questionDiv.classList.add("hide");
    answerDiv.classList.add("hide");

    console.log("response...");

    if(error) {
        if(error === 404) {
            console.log("End the quiz");
            //show ending
        }
        else {
            console.log(error);
            // show some error
        }
    }

    var obj = JSON.parse(response);
    if(obj.question) {
        this.responseQuestion(obj);
    }
    else {
        this.responseAnswer(obj);
    }

};

Quiz.prototype.responseQuestion = function(obj) {
    var questionDiv = document.querySelector("#question");
    questionDiv.classList.toggle("hide");

    this.question = new Question(obj);
    this.question.print();

    this.timer = new Timer(document.querySelector("#timer h1"), 20);
    this.timer.start();

    this.nextURL = obj.nextURL;
    console.log(this.nextURL);

    console.log("Adding listener..");
    this.addListener();
};

Quiz.prototype.responseAnswer = function(obj) {
    var answerDiv = document.querySelector("#answer-response");
    answerDiv.classList.toggle("hide");
    console.log(obj);
    this.nextURL = obj.nextURL;

    var p = document.createElement("p");
    var text = document.createTextNode(obj.message);
    p.appendChild(text);
    answerDiv.replaceChild(p, answerDiv.querySelector("p"));

    var newQuestion = this.getQuestion.bind(this);
    setTimeout(newQuestion, 1000);
};

Quiz.prototype.addListener = function() {
    this.button = document.querySelector("#submit");
    this.form = document.querySelector("#qForm");

    this.button.addEventListener("click",this.submit.bind(this));
    if(this.form) {
        this.form.addEventListener("keypress", this.getKeyPress.bind(this));
    }
};

Quiz.prototype.getKeyPress = function(event) {
    if (event.which === 13 || event.keyCode === 13) {
        console.log("got enter");
        event.preventDefault();
        this.submit();
    }
};

Quiz.prototype.submit = function() {
    console.log("submitting...");
    this.totalTime += this.timer.stop();
    console.log("time:" + this.totalTime);
    var input;
    this.button.removeEventListener("click", this.submit.bind(this));
    if(this.form) {
        this.form.removeEventListener("keypress", this.getKeyPress.bind(this));
    }

    if(document.querySelector("#answer")) {
        input = document.querySelector("#answer");
    }
    else {
        input = document.querySelector("input[name='alternative']:checked");
    }


    var config = {method: "POST",
        url: this.nextURL,
        data: {
            answer: input.value
        }};
    var responseFunction = this.response.bind(this);
    Ajax.req(config, responseFunction);
};


module.exports = Quiz;

},{"./Ajax":1,"./Timer":3,"./question":5}],3:[function(require,module,exports){
/**
 * Created by Oskar on 2015-11-24.
 */

function Timer(element, time) {
    this.time = time;
    this.element = element;
    this.startTime = new Date().getTime();
    this.interval = undefined;
}

Timer.prototype.start = function() {
    this.interval = setInterval(this.run.bind(this), 100);
};

Timer.prototype.run = function() {
    var now = new Date().getTime();
    var diff = (now - this.startTime)/1000;
    console.log(this.startTime);
    if(diff >= this.time) {
        clearInterval(this.interval);
    }
    this.print(this.time - diff);
};

Timer.prototype.stop = function() {
    clearInterval(this.interval);
    var now = new Date().getTime();

    return (now - this.startTime)/1000;
};

Timer.prototype.print = function(diff) {
    this.element.replaceChild(document.createTextNode(diff), this.element.firstChild);
};

module.exports = Timer;

},{}],4:[function(require,module,exports){
"use strict";
var Quiz = require("./Quiz");

var q = new Quiz();

},{"./Quiz":2}],5:[function(require,module,exports){
/**
 * Created by Oskar on 2015-11-23.
 */
"use strict";
function Question(obj) {
    this.id = obj.id;
    this.question = obj.question;
    this.alt = obj.alternatives;
}

Question.prototype.print = function() {
    var questionDiv = document.querySelector("#question");
    this.clearDiv(questionDiv);
    if(this.alt) {
        console.log("has alternatives");
        this.printAltQuestion(questionDiv);
    }
    else {
        this.printQuestion(questionDiv);
    }
};

Question.prototype.clearDiv = function(div) {
    while(div.hasChildNodes()) {
        div.removeChild(div.lastChild);
    }
};

Question.prototype.printAltQuestion = function(div) {
    var frag = document.createDocumentFragment();

    var h1 = document.createElement("h1");
    var form = document.createElement("form");
    form.setAttribute("id", "qForm");

    var button = document.createElement("input");
    button.setAttribute("id", "submit");
    button.setAttribute("value", "Send");
    button.setAttribute("type", "button");


    h1.appendChild(document.createTextNode(this.question));

    var inputFrag = this.getAltFrag();

    form.appendChild(inputFrag);
    form.appendChild(button);

    frag.appendChild(h1);
    frag.appendChild(form);

    div.appendChild(frag);
};

Question.prototype.getAltFrag = function() {
    var inputFrag = document.createDocumentFragment();
    var input;
    var p;

    console.log(this.alt);
    for(var alt in this.alt) {
        p = document.createElement("p");
        input = document.createElement("input");
        input.setAttribute("type", "radio");
        input.setAttribute("name", "alternative");
        input.setAttribute("value", alt);
        p.appendChild(input);
        p.appendChild(document.createTextNode(this.alt[alt]));
        inputFrag.appendChild(p);
    }
    return inputFrag;
};

Question.prototype.printQuestion = function(div) {
    var frag = document.createDocumentFragment();

    var h1 = document.createElement("h1");
    var form = document.createElement("form");
    form.setAttribute("id", "qForm");

    var button = document.createElement("input");
    button.setAttribute("id", "submit");
    button.setAttribute("value", "Send");
    button.setAttribute("type", "button");


    h1.appendChild(document.createTextNode(this.question));

    var input = document.createElement("input");
    input.setAttribute("type", "text");
    input.setAttribute("id", "answer");


    form.appendChild(input);
    form.appendChild(button);

    frag.appendChild(h1);
    frag.appendChild(form);

    div.appendChild(frag);
};

module.exports = Question;

},{}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMS4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQWpheC5qcyIsImNsaWVudC9zb3VyY2UvanMvUXVpei5qcyIsImNsaWVudC9zb3VyY2UvanMvVGltZXIuanMiLCJjbGllbnQvc291cmNlL2pzL2FwcC5qcyIsImNsaWVudC9zb3VyY2UvanMvcXVlc3Rpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTIzLlxuICovXG5cbmZ1bmN0aW9uIHJlcShjb25maWcsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIHIuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgaWYgKHIuc3RhdHVzID49IDQwMCkge1xuICAgICAgICAgICAgY2FsbGJhY2soci5zdGF0dXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgY2FsbGJhY2sobnVsbCwgci5yZXNwb25zZVRleHQpO1xuICAgIH0pO1xuXG4gICAgci5vcGVuKGNvbmZpZy5tZXRob2QsIGNvbmZpZy51cmwpO1xuICAgIGNvbnNvbGUubG9nKGNvbmZpZyk7XG4gICAgaWYoY29uZmlnLmRhdGEpe1xuICAgICAgICByLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uXCIpO1xuICAgICAgICByLnNlbmQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLmRhdGEpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByLnNlbmQobnVsbCk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cy5yZXEgPSByZXE7XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yMy5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgUXVlc3Rpb24gPSByZXF1aXJlKFwiLi9xdWVzdGlvblwiKTtcbnZhciBBamF4ID0gcmVxdWlyZShcIi4vQWpheFwiKTtcbnZhciBUaW1lciA9IHJlcXVpcmUoXCIuL1RpbWVyXCIpO1xuXG5mdW5jdGlvbiBRdWl6KHVzZXJuYW1lKSB7XG4gICAgdGhpcy51c2VybmFtZSA9IHVzZXJuYW1lO1xuICAgIHRoaXMudGltZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5xdWVzdGlvbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLm5leHRVUkwgPSBcImh0dHA6Ly92aG9zdDMubG51LnNlOjIwMDgwL3F1ZXN0aW9uLzFcIjtcbiAgICB0aGlzLmJ1dHRvbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmZvcm0gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy50b3RhbFRpbWUgPSAwO1xuXG4gICAgdGhpcy5nZXRRdWVzdGlvbigpO1xufVxuXG5cblF1aXoucHJvdG90eXBlLmdldFF1ZXN0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgIGNvbnNvbGUubG9nKFwiYXNraW5nLi5cIik7XG4gICAgdmFyIHVybCA9IHRoaXMubmV4dFVSTDtcbiAgICBjb25zb2xlLmxvZyh1cmwpO1xuICAgIHZhciBjb25maWcgPSB7bWV0aG9kOiBcIkdFVFwiLCB1cmw6IHVybH07XG4gICAgdmFyIHJlc3BvbnNlRnVuY3Rpb24gPSB0aGlzLnJlc3BvbnNlLmJpbmQodGhpcyk7XG4gICAgQWpheC5yZXEoY29uZmlnLCByZXNwb25zZUZ1bmN0aW9uKTtcbn07XG5cblF1aXoucHJvdG90eXBlLnJlc3BvbnNlID0gZnVuY3Rpb24gKGVycm9yLCByZXNwb25zZSkge1xuICAgIHZhciBxdWVzdGlvbkRpdiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcXVlc3Rpb25cIik7XG4gICAgdmFyIGFuc3dlckRpdiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYW5zd2VyLXJlc3BvbnNlXCIpO1xuXG4gICAgcXVlc3Rpb25EaXYuY2xhc3NMaXN0LmFkZChcImhpZGVcIik7XG4gICAgYW5zd2VyRGl2LmNsYXNzTGlzdC5hZGQoXCJoaWRlXCIpO1xuXG4gICAgY29uc29sZS5sb2coXCJyZXNwb25zZS4uLlwiKTtcblxuICAgIGlmKGVycm9yKSB7XG4gICAgICAgIGlmKGVycm9yID09PSA0MDQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRW5kIHRoZSBxdWl6XCIpO1xuICAgICAgICAgICAgLy9zaG93IGVuZGluZ1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgICAgLy8gc2hvdyBzb21lIGVycm9yXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgb2JqID0gSlNPTi5wYXJzZShyZXNwb25zZSk7XG4gICAgaWYob2JqLnF1ZXN0aW9uKSB7XG4gICAgICAgIHRoaXMucmVzcG9uc2VRdWVzdGlvbihvYmopO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5yZXNwb25zZUFuc3dlcihvYmopO1xuICAgIH1cblxufTtcblxuUXVpei5wcm90b3R5cGUucmVzcG9uc2VRdWVzdGlvbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBxdWVzdGlvbkRpdiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcXVlc3Rpb25cIik7XG4gICAgcXVlc3Rpb25EaXYuY2xhc3NMaXN0LnRvZ2dsZShcImhpZGVcIik7XG5cbiAgICB0aGlzLnF1ZXN0aW9uID0gbmV3IFF1ZXN0aW9uKG9iaik7XG4gICAgdGhpcy5xdWVzdGlvbi5wcmludCgpO1xuXG4gICAgdGhpcy50aW1lciA9IG5ldyBUaW1lcihkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RpbWVyIGgxXCIpLCAyMCk7XG4gICAgdGhpcy50aW1lci5zdGFydCgpO1xuXG4gICAgdGhpcy5uZXh0VVJMID0gb2JqLm5leHRVUkw7XG4gICAgY29uc29sZS5sb2codGhpcy5uZXh0VVJMKTtcblxuICAgIGNvbnNvbGUubG9nKFwiQWRkaW5nIGxpc3RlbmVyLi5cIik7XG4gICAgdGhpcy5hZGRMaXN0ZW5lcigpO1xufTtcblxuUXVpei5wcm90b3R5cGUucmVzcG9uc2VBbnN3ZXIgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgYW5zd2VyRGl2ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNhbnN3ZXItcmVzcG9uc2VcIik7XG4gICAgYW5zd2VyRGl2LmNsYXNzTGlzdC50b2dnbGUoXCJoaWRlXCIpO1xuICAgIGNvbnNvbGUubG9nKG9iaik7XG4gICAgdGhpcy5uZXh0VVJMID0gb2JqLm5leHRVUkw7XG5cbiAgICB2YXIgcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwXCIpO1xuICAgIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUob2JqLm1lc3NhZ2UpO1xuICAgIHAuYXBwZW5kQ2hpbGQodGV4dCk7XG4gICAgYW5zd2VyRGl2LnJlcGxhY2VDaGlsZChwLCBhbnN3ZXJEaXYucXVlcnlTZWxlY3RvcihcInBcIikpO1xuXG4gICAgdmFyIG5ld1F1ZXN0aW9uID0gdGhpcy5nZXRRdWVzdGlvbi5iaW5kKHRoaXMpO1xuICAgIHNldFRpbWVvdXQobmV3UXVlc3Rpb24sIDEwMDApO1xufTtcblxuUXVpei5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc3VibWl0XCIpO1xuICAgIHRoaXMuZm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcUZvcm1cIik7XG5cbiAgICB0aGlzLmJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIix0aGlzLnN1Ym1pdC5iaW5kKHRoaXMpKTtcbiAgICBpZih0aGlzLmZvcm0pIHtcbiAgICAgICAgdGhpcy5mb3JtLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlwcmVzc1wiLCB0aGlzLmdldEtleVByZXNzLmJpbmQodGhpcykpO1xuICAgIH1cbn07XG5cblF1aXoucHJvdG90eXBlLmdldEtleVByZXNzID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBpZiAoZXZlbnQud2hpY2ggPT09IDEzIHx8IGV2ZW50LmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiZ290IGVudGVyXCIpO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLnN1Ym1pdCgpO1xuICAgIH1cbn07XG5cblF1aXoucHJvdG90eXBlLnN1Ym1pdCA9IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKFwic3VibWl0dGluZy4uLlwiKTtcbiAgICB0aGlzLnRvdGFsVGltZSArPSB0aGlzLnRpbWVyLnN0b3AoKTtcbiAgICBjb25zb2xlLmxvZyhcInRpbWU6XCIgKyB0aGlzLnRvdGFsVGltZSk7XG4gICAgdmFyIGlucHV0O1xuICAgIHRoaXMuYnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnN1Ym1pdC5iaW5kKHRoaXMpKTtcbiAgICBpZih0aGlzLmZvcm0pIHtcbiAgICAgICAgdGhpcy5mb3JtLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlwcmVzc1wiLCB0aGlzLmdldEtleVByZXNzLmJpbmQodGhpcykpO1xuICAgIH1cblxuICAgIGlmKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYW5zd2VyXCIpKSB7XG4gICAgICAgIGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNhbnN3ZXJcIik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJpbnB1dFtuYW1lPSdhbHRlcm5hdGl2ZSddOmNoZWNrZWRcIik7XG4gICAgfVxuXG5cbiAgICB2YXIgY29uZmlnID0ge21ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIHVybDogdGhpcy5uZXh0VVJMLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBhbnN3ZXI6IGlucHV0LnZhbHVlXG4gICAgICAgIH19O1xuICAgIHZhciByZXNwb25zZUZ1bmN0aW9uID0gdGhpcy5yZXNwb25zZS5iaW5kKHRoaXMpO1xuICAgIEFqYXgucmVxKGNvbmZpZywgcmVzcG9uc2VGdW5jdGlvbik7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gUXVpejtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTI0LlxuICovXG5cbmZ1bmN0aW9uIFRpbWVyKGVsZW1lbnQsIHRpbWUpIHtcbiAgICB0aGlzLnRpbWUgPSB0aW1lO1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5zdGFydFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICB0aGlzLmludGVydmFsID0gdW5kZWZpbmVkO1xufVxuXG5UaW1lci5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmludGVydmFsID0gc2V0SW50ZXJ2YWwodGhpcy5ydW4uYmluZCh0aGlzKSwgMTAwKTtcbn07XG5cblRpbWVyLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgdmFyIGRpZmYgPSAobm93IC0gdGhpcy5zdGFydFRpbWUpLzEwMDA7XG4gICAgY29uc29sZS5sb2codGhpcy5zdGFydFRpbWUpO1xuICAgIGlmKGRpZmYgPj0gdGhpcy50aW1lKSB7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbCk7XG4gICAgfVxuICAgIHRoaXMucHJpbnQodGhpcy50aW1lIC0gZGlmZik7XG59O1xuXG5UaW1lci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbCk7XG4gICAgdmFyIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG4gICAgcmV0dXJuIChub3cgLSB0aGlzLnN0YXJ0VGltZSkvMTAwMDtcbn07XG5cblRpbWVyLnByb3RvdHlwZS5wcmludCA9IGZ1bmN0aW9uKGRpZmYpIHtcbiAgICB0aGlzLmVsZW1lbnQucmVwbGFjZUNoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRpZmYpLCB0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRpbWVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgUXVpeiA9IHJlcXVpcmUoXCIuL1F1aXpcIik7XG5cbnZhciBxID0gbmV3IFF1aXooKTtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTIzLlxuICovXG5cInVzZSBzdHJpY3RcIjtcbmZ1bmN0aW9uIFF1ZXN0aW9uKG9iaikge1xuICAgIHRoaXMuaWQgPSBvYmouaWQ7XG4gICAgdGhpcy5xdWVzdGlvbiA9IG9iai5xdWVzdGlvbjtcbiAgICB0aGlzLmFsdCA9IG9iai5hbHRlcm5hdGl2ZXM7XG59XG5cblF1ZXN0aW9uLnByb3RvdHlwZS5wcmludCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBxdWVzdGlvbkRpdiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcXVlc3Rpb25cIik7XG4gICAgdGhpcy5jbGVhckRpdihxdWVzdGlvbkRpdik7XG4gICAgaWYodGhpcy5hbHQpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJoYXMgYWx0ZXJuYXRpdmVzXCIpO1xuICAgICAgICB0aGlzLnByaW50QWx0UXVlc3Rpb24ocXVlc3Rpb25EaXYpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5wcmludFF1ZXN0aW9uKHF1ZXN0aW9uRGl2KTtcbiAgICB9XG59O1xuXG5RdWVzdGlvbi5wcm90b3R5cGUuY2xlYXJEaXYgPSBmdW5jdGlvbihkaXYpIHtcbiAgICB3aGlsZShkaXYuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgIGRpdi5yZW1vdmVDaGlsZChkaXYubGFzdENoaWxkKTtcbiAgICB9XG59O1xuXG5RdWVzdGlvbi5wcm90b3R5cGUucHJpbnRBbHRRdWVzdGlvbiA9IGZ1bmN0aW9uKGRpdikge1xuICAgIHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgdmFyIGgxID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImgxXCIpO1xuICAgIHZhciBmb3JtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImZvcm1cIik7XG4gICAgZm9ybS5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcInFGb3JtXCIpO1xuXG4gICAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICBidXR0b24uc2V0QXR0cmlidXRlKFwiaWRcIiwgXCJzdWJtaXRcIik7XG4gICAgYnV0dG9uLnNldEF0dHJpYnV0ZShcInZhbHVlXCIsIFwiU2VuZFwiKTtcbiAgICBidXR0b24uc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcImJ1dHRvblwiKTtcblxuXG4gICAgaDEuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5xdWVzdGlvbikpO1xuXG4gICAgdmFyIGlucHV0RnJhZyA9IHRoaXMuZ2V0QWx0RnJhZygpO1xuXG4gICAgZm9ybS5hcHBlbmRDaGlsZChpbnB1dEZyYWcpO1xuICAgIGZvcm0uYXBwZW5kQ2hpbGQoYnV0dG9uKTtcblxuICAgIGZyYWcuYXBwZW5kQ2hpbGQoaDEpO1xuICAgIGZyYWcuYXBwZW5kQ2hpbGQoZm9ybSk7XG5cbiAgICBkaXYuYXBwZW5kQ2hpbGQoZnJhZyk7XG59O1xuXG5RdWVzdGlvbi5wcm90b3R5cGUuZ2V0QWx0RnJhZyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpbnB1dEZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIGlucHV0O1xuICAgIHZhciBwO1xuXG4gICAgY29uc29sZS5sb2codGhpcy5hbHQpO1xuICAgIGZvcih2YXIgYWx0IGluIHRoaXMuYWx0KSB7XG4gICAgICAgIHAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicFwiKTtcbiAgICAgICAgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJyYWRpb1wiKTtcbiAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwibmFtZVwiLCBcImFsdGVybmF0aXZlXCIpO1xuICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiLCBhbHQpO1xuICAgICAgICBwLmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgcC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLmFsdFthbHRdKSk7XG4gICAgICAgIGlucHV0RnJhZy5hcHBlbmRDaGlsZChwKTtcbiAgICB9XG4gICAgcmV0dXJuIGlucHV0RnJhZztcbn07XG5cblF1ZXN0aW9uLnByb3RvdHlwZS5wcmludFF1ZXN0aW9uID0gZnVuY3Rpb24oZGl2KSB7XG4gICAgdmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cbiAgICB2YXIgaDEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaDFcIik7XG4gICAgdmFyIGZvcm0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZm9ybVwiKTtcbiAgICBmb3JtLnNldEF0dHJpYnV0ZShcImlkXCIsIFwicUZvcm1cIik7XG5cbiAgICB2YXIgYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpO1xuICAgIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcInN1Ym1pdFwiKTtcbiAgICBidXR0b24uc2V0QXR0cmlidXRlKFwidmFsdWVcIiwgXCJTZW5kXCIpO1xuICAgIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwiYnV0dG9uXCIpO1xuXG5cbiAgICBoMS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLnF1ZXN0aW9uKSk7XG5cbiAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gICAgaW5wdXQuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcInRleHRcIik7XG4gICAgaW5wdXQuc2V0QXR0cmlidXRlKFwiaWRcIiwgXCJhbnN3ZXJcIik7XG5cblxuICAgIGZvcm0uYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgIGZvcm0uYXBwZW5kQ2hpbGQoYnV0dG9uKTtcblxuICAgIGZyYWcuYXBwZW5kQ2hpbGQoaDEpO1xuICAgIGZyYWcuYXBwZW5kQ2hpbGQoZm9ybSk7XG5cbiAgICBkaXYuYXBwZW5kQ2hpbGQoZnJhZyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXN0aW9uO1xuIl19
