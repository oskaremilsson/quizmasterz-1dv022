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

    this.nextURL = obj.nextURL;
    console.log(this.nextURL);

    if(obj.question) {
        this.responseQuestion(obj);
    }
    else {
        this.responseAnswer(obj);
    }

};

Quiz.prototype.responseQuestion = function(obj) {
    var content = document.querySelector("#content");
    this.clearDiv(content);
    this.question = new Question(obj);
    this.question.print();

    this.timer = new Timer(this, document.querySelector("#timer h1"), 20);
    this.timer.start();

    console.log("Adding listener..");
    this.addListener();
};

Quiz.prototype.responseAnswer = function(obj) {
    var content = document.querySelector("#content");
    this.clearDiv(content);

    var template = document.querySelector("#template-answer").content.cloneNode(true);
    var text = document.createTextNode(obj.message);
    template.querySelector("p").appendChild(text);

    content.appendChild(template);

    var newQuestion = this.getQuestion.bind(this);
    setTimeout(newQuestion, 1000);
};

Quiz.prototype.addListener = function() {
    this.button = document.querySelector("#submit");
    this.form = document.querySelector("#qForm");

    this.button.addEventListener("click",this.submit.bind(this));
    if(this.form) {
        this.form.addEventListener("keypress", this.getKeyPress.bind(this), true);
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

Quiz.prototype.gameOver = function() {
    console.log("GAME OVER!!!");
    var div = document.querySelector("#content");
    while(div.hasChildNodes()) {
        div.removeChild(div.lastChild);
    }
    div.appendChild(document.createTextNode("GAME OVER!! Time: " + this.totalTime));
};

Quiz.prototype.clearDiv = function(div) {
    while(div.hasChildNodes()) {
        div.removeChild(div.lastChild);
    }
};

module.exports = Quiz;

},{"./Ajax":1,"./Timer":3,"./question":5}],3:[function(require,module,exports){
/**
 * Created by Oskar on 2015-11-24.
 */

function Timer(owner, element, time) {
    this.time = time;
    this.element = element;
    this.owner = owner;
    this.startTime = new Date().getTime();
    this.interval = undefined;
}

Timer.prototype.start = function() {
    this.interval = setInterval(this.run.bind(this), 100);
};

Timer.prototype.run = function() {
    var now = new Date().getTime();
    var diff = (now - this.startTime)/1000;
    var showTime = this.time - diff;

    if(diff >= this.time) {
        showTime = 0;
        clearInterval(this.interval);
        this.owner.gameOver();
    }
    this.print(showTime);
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
    //this.clearDiv(questionDiv);
    if(this.alt) {
        console.log("has alternatives");
        this.printAltQuestion();
    }
    else {
        this.printQuestion();
    }
};

Question.prototype.clearDiv = function(div) {
    while(div.hasChildNodes()) {
        div.removeChild(div.lastChild);
    }
};

Question.prototype.printAltQuestion = function() {
    var template = document.querySelector("#template-question-alt").content.cloneNode(true);
    template.querySelector(".qHead").appendChild(document.createTextNode(this.question));
    var inputFrag = this.getAltFrag();
    console.log(template.querySelector("#submit"));
    template.querySelector("#qForm").insertBefore(inputFrag, template.querySelector("#submit"));
    document.querySelector("#content").appendChild(template);
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

Question.prototype.printQuestion = function() {
    var template = document.querySelector("#template-question").content.cloneNode(true);
    template.querySelector(".qHead").appendChild(document.createTextNode(this.question));
    document.querySelector("#content").appendChild(template);
};

module.exports = Question;

},{}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMS4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQWpheC5qcyIsImNsaWVudC9zb3VyY2UvanMvUXVpei5qcyIsImNsaWVudC9zb3VyY2UvanMvVGltZXIuanMiLCJjbGllbnQvc291cmNlL2pzL2FwcC5qcyIsImNsaWVudC9zb3VyY2UvanMvcXVlc3Rpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTIzLlxuICovXG5cbmZ1bmN0aW9uIHJlcShjb25maWcsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIHIuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgaWYgKHIuc3RhdHVzID49IDQwMCkge1xuICAgICAgICAgICAgY2FsbGJhY2soci5zdGF0dXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgY2FsbGJhY2sobnVsbCwgci5yZXNwb25zZVRleHQpO1xuICAgIH0pO1xuXG4gICAgci5vcGVuKGNvbmZpZy5tZXRob2QsIGNvbmZpZy51cmwpO1xuICAgIGNvbnNvbGUubG9nKGNvbmZpZyk7XG4gICAgaWYoY29uZmlnLmRhdGEpe1xuICAgICAgICByLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uXCIpO1xuICAgICAgICByLnNlbmQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLmRhdGEpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByLnNlbmQobnVsbCk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cy5yZXEgPSByZXE7XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yMy5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgUXVlc3Rpb24gPSByZXF1aXJlKFwiLi9xdWVzdGlvblwiKTtcbnZhciBBamF4ID0gcmVxdWlyZShcIi4vQWpheFwiKTtcbnZhciBUaW1lciA9IHJlcXVpcmUoXCIuL1RpbWVyXCIpO1xuXG5mdW5jdGlvbiBRdWl6KHVzZXJuYW1lKSB7XG4gICAgdGhpcy51c2VybmFtZSA9IHVzZXJuYW1lO1xuICAgIHRoaXMudGltZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5xdWVzdGlvbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLm5leHRVUkwgPSBcImh0dHA6Ly92aG9zdDMubG51LnNlOjIwMDgwL3F1ZXN0aW9uLzFcIjtcbiAgICB0aGlzLmJ1dHRvbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmZvcm0gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy50b3RhbFRpbWUgPSAwO1xuXG4gICAgdGhpcy5nZXRRdWVzdGlvbigpO1xufVxuXG5cblF1aXoucHJvdG90eXBlLmdldFF1ZXN0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgIGNvbnNvbGUubG9nKFwiYXNraW5nLi5cIik7XG4gICAgdmFyIHVybCA9IHRoaXMubmV4dFVSTDtcbiAgICBjb25zb2xlLmxvZyh1cmwpO1xuICAgIHZhciBjb25maWcgPSB7bWV0aG9kOiBcIkdFVFwiLCB1cmw6IHVybH07XG4gICAgdmFyIHJlc3BvbnNlRnVuY3Rpb24gPSB0aGlzLnJlc3BvbnNlLmJpbmQodGhpcyk7XG4gICAgQWpheC5yZXEoY29uZmlnLCByZXNwb25zZUZ1bmN0aW9uKTtcbn07XG5cblF1aXoucHJvdG90eXBlLnJlc3BvbnNlID0gZnVuY3Rpb24gKGVycm9yLCByZXNwb25zZSkge1xuICAgIGNvbnNvbGUubG9nKFwicmVzcG9uc2UuLi5cIik7XG5cbiAgICBpZihlcnJvcikge1xuICAgICAgICBpZihlcnJvciA9PT0gNDA0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkVuZCB0aGUgcXVpelwiKTtcbiAgICAgICAgICAgIC8vc2hvdyBlbmRpbmdcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgIC8vIHNob3cgc29tZSBlcnJvclxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIG9iaiA9IEpTT04ucGFyc2UocmVzcG9uc2UpO1xuXG4gICAgdGhpcy5uZXh0VVJMID0gb2JqLm5leHRVUkw7XG4gICAgY29uc29sZS5sb2codGhpcy5uZXh0VVJMKTtcblxuICAgIGlmKG9iai5xdWVzdGlvbikge1xuICAgICAgICB0aGlzLnJlc3BvbnNlUXVlc3Rpb24ob2JqKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMucmVzcG9uc2VBbnN3ZXIob2JqKTtcbiAgICB9XG5cbn07XG5cblF1aXoucHJvdG90eXBlLnJlc3BvbnNlUXVlc3Rpb24gPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29udGVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKTtcbiAgICB0aGlzLmNsZWFyRGl2KGNvbnRlbnQpO1xuICAgIHRoaXMucXVlc3Rpb24gPSBuZXcgUXVlc3Rpb24ob2JqKTtcbiAgICB0aGlzLnF1ZXN0aW9uLnByaW50KCk7XG5cbiAgICB0aGlzLnRpbWVyID0gbmV3IFRpbWVyKHRoaXMsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGltZXIgaDFcIiksIDIwKTtcbiAgICB0aGlzLnRpbWVyLnN0YXJ0KCk7XG5cbiAgICBjb25zb2xlLmxvZyhcIkFkZGluZyBsaXN0ZW5lci4uXCIpO1xuICAgIHRoaXMuYWRkTGlzdGVuZXIoKTtcbn07XG5cblF1aXoucHJvdG90eXBlLnJlc3BvbnNlQW5zd2VyID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGNvbnRlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIik7XG4gICAgdGhpcy5jbGVhckRpdihjb250ZW50KTtcblxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtYW5zd2VyXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUob2JqLm1lc3NhZ2UpO1xuICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCJwXCIpLmFwcGVuZENoaWxkKHRleHQpO1xuXG4gICAgY29udGVudC5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG5cbiAgICB2YXIgbmV3UXVlc3Rpb24gPSB0aGlzLmdldFF1ZXN0aW9uLmJpbmQodGhpcyk7XG4gICAgc2V0VGltZW91dChuZXdRdWVzdGlvbiwgMTAwMCk7XG59O1xuXG5RdWl6LnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzdWJtaXRcIik7XG4gICAgdGhpcy5mb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNxRm9ybVwiKTtcblxuICAgIHRoaXMuYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLHRoaXMuc3VibWl0LmJpbmQodGhpcykpO1xuICAgIGlmKHRoaXMuZm9ybSkge1xuICAgICAgICB0aGlzLmZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcImtleXByZXNzXCIsIHRoaXMuZ2V0S2V5UHJlc3MuYmluZCh0aGlzKSwgdHJ1ZSk7XG4gICAgfVxufTtcblxuUXVpei5wcm90b3R5cGUuZ2V0S2V5UHJlc3MgPSBmdW5jdGlvbihldmVudCkge1xuICAgIGlmIChldmVudC53aGljaCA9PT0gMTMgfHwgZXZlbnQua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJnb3QgZW50ZXJcIik7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuc3VibWl0KCk7XG4gICAgfVxufTtcblxuUXVpei5wcm90b3R5cGUuc3VibWl0ID0gZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coXCJzdWJtaXR0aW5nLi4uXCIpO1xuICAgIHRoaXMudG90YWxUaW1lICs9IHRoaXMudGltZXIuc3RvcCgpO1xuICAgIGNvbnNvbGUubG9nKFwidGltZTpcIiArIHRoaXMudG90YWxUaW1lKTtcbiAgICB2YXIgaW5wdXQ7XG4gICAgdGhpcy5idXR0b24ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc3VibWl0LmJpbmQodGhpcykpO1xuICAgIGlmKHRoaXMuZm9ybSkge1xuICAgICAgICB0aGlzLmZvcm0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleXByZXNzXCIsIHRoaXMuZ2V0S2V5UHJlc3MuYmluZCh0aGlzKSk7XG4gICAgfVxuXG4gICAgaWYoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNhbnN3ZXJcIikpIHtcbiAgICAgICAgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2Fuc3dlclwiKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImlucHV0W25hbWU9J2FsdGVybmF0aXZlJ106Y2hlY2tlZFwiKTtcbiAgICB9XG5cblxuICAgIHZhciBjb25maWcgPSB7bWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgdXJsOiB0aGlzLm5leHRVUkwsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGFuc3dlcjogaW5wdXQudmFsdWVcbiAgICAgICAgfX07XG4gICAgdmFyIHJlc3BvbnNlRnVuY3Rpb24gPSB0aGlzLnJlc3BvbnNlLmJpbmQodGhpcyk7XG4gICAgQWpheC5yZXEoY29uZmlnLCByZXNwb25zZUZ1bmN0aW9uKTtcbn07XG5cblF1aXoucHJvdG90eXBlLmdhbWVPdmVyID0gZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coXCJHQU1FIE9WRVIhISFcIik7XG4gICAgdmFyIGRpdiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKTtcbiAgICB3aGlsZShkaXYuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgIGRpdi5yZW1vdmVDaGlsZChkaXYubGFzdENoaWxkKTtcbiAgICB9XG4gICAgZGl2LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiR0FNRSBPVkVSISEgVGltZTogXCIgKyB0aGlzLnRvdGFsVGltZSkpO1xufTtcblxuUXVpei5wcm90b3R5cGUuY2xlYXJEaXYgPSBmdW5jdGlvbihkaXYpIHtcbiAgICB3aGlsZShkaXYuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgIGRpdi5yZW1vdmVDaGlsZChkaXYubGFzdENoaWxkKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFF1aXo7XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yNC5cbiAqL1xuXG5mdW5jdGlvbiBUaW1lcihvd25lciwgZWxlbWVudCwgdGltZSkge1xuICAgIHRoaXMudGltZSA9IHRpbWU7XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm93bmVyID0gb3duZXI7XG4gICAgdGhpcy5zdGFydFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICB0aGlzLmludGVydmFsID0gdW5kZWZpbmVkO1xufVxuXG5UaW1lci5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmludGVydmFsID0gc2V0SW50ZXJ2YWwodGhpcy5ydW4uYmluZCh0aGlzKSwgMTAwKTtcbn07XG5cblRpbWVyLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgdmFyIGRpZmYgPSAobm93IC0gdGhpcy5zdGFydFRpbWUpLzEwMDA7XG4gICAgdmFyIHNob3dUaW1lID0gdGhpcy50aW1lIC0gZGlmZjtcblxuICAgIGlmKGRpZmYgPj0gdGhpcy50aW1lKSB7XG4gICAgICAgIHNob3dUaW1lID0gMDtcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsKTtcbiAgICAgICAgdGhpcy5vd25lci5nYW1lT3ZlcigpO1xuICAgIH1cbiAgICB0aGlzLnByaW50KHNob3dUaW1lKTtcbn07XG5cblRpbWVyLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XG4gICAgY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsKTtcbiAgICB2YXIgbm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cbiAgICByZXR1cm4gKG5vdyAtIHRoaXMuc3RhcnRUaW1lKS8xMDAwO1xufTtcblxuVGltZXIucHJvdG90eXBlLnByaW50ID0gZnVuY3Rpb24oZGlmZikge1xuICAgIHRoaXMuZWxlbWVudC5yZXBsYWNlQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGlmZiksIHRoaXMuZWxlbWVudC5maXJzdENoaWxkKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVGltZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBRdWl6ID0gcmVxdWlyZShcIi4vUXVpelwiKTtcblxudmFyIHEgPSBuZXcgUXVpeigpO1xuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IE9za2FyIG9uIDIwMTUtMTEtMjMuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuZnVuY3Rpb24gUXVlc3Rpb24ob2JqKSB7XG4gICAgdGhpcy5pZCA9IG9iai5pZDtcbiAgICB0aGlzLnF1ZXN0aW9uID0gb2JqLnF1ZXN0aW9uO1xuICAgIHRoaXMuYWx0ID0gb2JqLmFsdGVybmF0aXZlcztcbn1cblxuUXVlc3Rpb24ucHJvdG90eXBlLnByaW50ID0gZnVuY3Rpb24oKSB7XG4gICAgLy90aGlzLmNsZWFyRGl2KHF1ZXN0aW9uRGl2KTtcbiAgICBpZih0aGlzLmFsdCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcImhhcyBhbHRlcm5hdGl2ZXNcIik7XG4gICAgICAgIHRoaXMucHJpbnRBbHRRdWVzdGlvbigpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5wcmludFF1ZXN0aW9uKCk7XG4gICAgfVxufTtcblxuUXVlc3Rpb24ucHJvdG90eXBlLmNsZWFyRGl2ID0gZnVuY3Rpb24oZGl2KSB7XG4gICAgd2hpbGUoZGl2Lmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgICBkaXYucmVtb3ZlQ2hpbGQoZGl2Lmxhc3RDaGlsZCk7XG4gICAgfVxufTtcblxuUXVlc3Rpb24ucHJvdG90eXBlLnByaW50QWx0UXVlc3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLXF1ZXN0aW9uLWFsdFwiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLnFIZWFkXCIpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMucXVlc3Rpb24pKTtcbiAgICB2YXIgaW5wdXRGcmFnID0gdGhpcy5nZXRBbHRGcmFnKCk7XG4gICAgY29uc29sZS5sb2codGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIiNzdWJtaXRcIikpO1xuICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIjcUZvcm1cIikuaW5zZXJ0QmVmb3JlKGlucHV0RnJhZywgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIiNzdWJtaXRcIikpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG59O1xuXG5RdWVzdGlvbi5wcm90b3R5cGUuZ2V0QWx0RnJhZyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpbnB1dEZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIGlucHV0O1xuICAgIHZhciBwO1xuXG4gICAgY29uc29sZS5sb2codGhpcy5hbHQpO1xuICAgIGZvcih2YXIgYWx0IGluIHRoaXMuYWx0KSB7XG4gICAgICAgIHAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicFwiKTtcbiAgICAgICAgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJyYWRpb1wiKTtcbiAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwibmFtZVwiLCBcImFsdGVybmF0aXZlXCIpO1xuICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiLCBhbHQpO1xuICAgICAgICBwLmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgcC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLmFsdFthbHRdKSk7XG4gICAgICAgIGlucHV0RnJhZy5hcHBlbmRDaGlsZChwKTtcbiAgICB9XG4gICAgcmV0dXJuIGlucHV0RnJhZztcbn07XG5cblF1ZXN0aW9uLnByb3RvdHlwZS5wcmludFF1ZXN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0ZW1wbGF0ZS1xdWVzdGlvblwiKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiLnFIZWFkXCIpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMucXVlc3Rpb24pKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIikuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbjtcbiJdfQ==
