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

function Quiz(nickname) {
    console.log(nickname);
    this.username = nickname;
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
        }
        else {
            console.log(error);
            this.gameOver();
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
    this.form.addEventListener("keypress", this.getKeyPress.bind(this), true);
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
    this.form.removeEventListener("keypress", this.getKeyPress.bind(this));

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
var q;

function submit(event) {
    if (event.which === 13 || event.keyCode === 13 || event.type === "click") {
        event.preventDefault();
        console.log("submitting");
        var input = document.querySelector("#nickname").value;
        q = new Quiz(input);
    }
}

var button = document.querySelector("#submit");
var form = document.querySelector("#qForm");

button.addEventListener("click",submit, true);
form.addEventListener("keypress", submit, true);


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMS4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQWpheC5qcyIsImNsaWVudC9zb3VyY2UvanMvUXVpei5qcyIsImNsaWVudC9zb3VyY2UvanMvVGltZXIuanMiLCJjbGllbnQvc291cmNlL2pzL2FwcC5qcyIsImNsaWVudC9zb3VyY2UvanMvcXVlc3Rpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTIzLlxuICovXG5cbmZ1bmN0aW9uIHJlcShjb25maWcsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIHIuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgaWYgKHIuc3RhdHVzID49IDQwMCkge1xuICAgICAgICAgICAgY2FsbGJhY2soci5zdGF0dXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgY2FsbGJhY2sobnVsbCwgci5yZXNwb25zZVRleHQpO1xuICAgIH0pO1xuXG4gICAgci5vcGVuKGNvbmZpZy5tZXRob2QsIGNvbmZpZy51cmwpO1xuICAgIGNvbnNvbGUubG9nKGNvbmZpZyk7XG4gICAgaWYoY29uZmlnLmRhdGEpe1xuICAgICAgICByLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uXCIpO1xuICAgICAgICByLnNlbmQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLmRhdGEpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByLnNlbmQobnVsbCk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cy5yZXEgPSByZXE7XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yMy5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgUXVlc3Rpb24gPSByZXF1aXJlKFwiLi9xdWVzdGlvblwiKTtcbnZhciBBamF4ID0gcmVxdWlyZShcIi4vQWpheFwiKTtcbnZhciBUaW1lciA9IHJlcXVpcmUoXCIuL1RpbWVyXCIpO1xuXG5mdW5jdGlvbiBRdWl6KG5pY2tuYW1lKSB7XG4gICAgY29uc29sZS5sb2cobmlja25hbWUpO1xuICAgIHRoaXMudXNlcm5hbWUgPSBuaWNrbmFtZTtcbiAgICB0aGlzLnRpbWVyID0gdW5kZWZpbmVkO1xuICAgIHRoaXMucXVlc3Rpb24gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5uZXh0VVJMID0gXCJodHRwOi8vdmhvc3QzLmxudS5zZToyMDA4MC9xdWVzdGlvbi8xXCI7XG4gICAgdGhpcy5idXR0b24gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5mb3JtID0gdW5kZWZpbmVkO1xuICAgIHRoaXMudG90YWxUaW1lID0gMDtcblxuICAgIHRoaXMuZ2V0UXVlc3Rpb24oKTtcbn1cblxuXG5RdWl6LnByb3RvdHlwZS5nZXRRdWVzdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zb2xlLmxvZyhcImFza2luZy4uXCIpO1xuICAgIHZhciB1cmwgPSB0aGlzLm5leHRVUkw7XG4gICAgY29uc29sZS5sb2codXJsKTtcbiAgICB2YXIgY29uZmlnID0ge21ldGhvZDogXCJHRVRcIiwgdXJsOiB1cmx9O1xuICAgIHZhciByZXNwb25zZUZ1bmN0aW9uID0gdGhpcy5yZXNwb25zZS5iaW5kKHRoaXMpO1xuICAgIEFqYXgucmVxKGNvbmZpZywgcmVzcG9uc2VGdW5jdGlvbik7XG59O1xuXG5RdWl6LnByb3RvdHlwZS5yZXNwb25zZSA9IGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcbiAgICBjb25zb2xlLmxvZyhcInJlc3BvbnNlLi4uXCIpO1xuXG4gICAgaWYoZXJyb3IpIHtcbiAgICAgICAgaWYoZXJyb3IgPT09IDQwNCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJFbmQgdGhlIHF1aXpcIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgICB0aGlzLmdhbWVPdmVyKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgb2JqID0gSlNPTi5wYXJzZShyZXNwb25zZSk7XG5cbiAgICB0aGlzLm5leHRVUkwgPSBvYmoubmV4dFVSTDtcbiAgICBjb25zb2xlLmxvZyh0aGlzLm5leHRVUkwpO1xuXG4gICAgaWYob2JqLnF1ZXN0aW9uKSB7XG4gICAgICAgIHRoaXMucmVzcG9uc2VRdWVzdGlvbihvYmopO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5yZXNwb25zZUFuc3dlcihvYmopO1xuICAgIH1cblxufTtcblxuUXVpei5wcm90b3R5cGUucmVzcG9uc2VRdWVzdGlvbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBjb250ZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpO1xuICAgIHRoaXMuY2xlYXJEaXYoY29udGVudCk7XG4gICAgdGhpcy5xdWVzdGlvbiA9IG5ldyBRdWVzdGlvbihvYmopO1xuICAgIHRoaXMucXVlc3Rpb24ucHJpbnQoKTtcblxuICAgIHRoaXMudGltZXIgPSBuZXcgVGltZXIodGhpcywgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0aW1lciBoMVwiKSwgMjApO1xuICAgIHRoaXMudGltZXIuc3RhcnQoKTtcblxuICAgIGNvbnNvbGUubG9nKFwiQWRkaW5nIGxpc3RlbmVyLi5cIik7XG4gICAgdGhpcy5hZGRMaXN0ZW5lcigpO1xufTtcblxuUXVpei5wcm90b3R5cGUucmVzcG9uc2VBbnN3ZXIgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29udGVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKTtcbiAgICB0aGlzLmNsZWFyRGl2KGNvbnRlbnQpO1xuXG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0ZW1wbGF0ZS1hbnN3ZXJcIikuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShvYmoubWVzc2FnZSk7XG4gICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcInBcIikuYXBwZW5kQ2hpbGQodGV4dCk7XG5cbiAgICBjb250ZW50LmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcblxuICAgIHZhciBuZXdRdWVzdGlvbiA9IHRoaXMuZ2V0UXVlc3Rpb24uYmluZCh0aGlzKTtcbiAgICBzZXRUaW1lb3V0KG5ld1F1ZXN0aW9uLCAxMDAwKTtcbn07XG5cblF1aXoucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5idXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3N1Ym1pdFwiKTtcbiAgICB0aGlzLmZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3FGb3JtXCIpO1xuXG4gICAgdGhpcy5idXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsdGhpcy5zdWJtaXQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5mb3JtLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlwcmVzc1wiLCB0aGlzLmdldEtleVByZXNzLmJpbmQodGhpcyksIHRydWUpO1xufTtcblxuUXVpei5wcm90b3R5cGUuZ2V0S2V5UHJlc3MgPSBmdW5jdGlvbihldmVudCkge1xuICAgIGlmIChldmVudC53aGljaCA9PT0gMTMgfHwgZXZlbnQua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJnb3QgZW50ZXJcIik7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuc3VibWl0KCk7XG4gICAgfVxufTtcblxuUXVpei5wcm90b3R5cGUuc3VibWl0ID0gZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coXCJzdWJtaXR0aW5nLi4uXCIpO1xuICAgIHRoaXMudG90YWxUaW1lICs9IHRoaXMudGltZXIuc3RvcCgpO1xuICAgIGNvbnNvbGUubG9nKFwidGltZTpcIiArIHRoaXMudG90YWxUaW1lKTtcbiAgICB2YXIgaW5wdXQ7XG4gICAgdGhpcy5idXR0b24ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc3VibWl0LmJpbmQodGhpcykpO1xuICAgIHRoaXMuZm9ybS5yZW1vdmVFdmVudExpc3RlbmVyKFwia2V5cHJlc3NcIiwgdGhpcy5nZXRLZXlQcmVzcy5iaW5kKHRoaXMpKTtcblxuICAgIGlmKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYW5zd2VyXCIpKSB7XG4gICAgICAgIGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNhbnN3ZXJcIik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJpbnB1dFtuYW1lPSdhbHRlcm5hdGl2ZSddOmNoZWNrZWRcIik7XG4gICAgfVxuXG5cbiAgICB2YXIgY29uZmlnID0ge21ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIHVybDogdGhpcy5uZXh0VVJMLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBhbnN3ZXI6IGlucHV0LnZhbHVlXG4gICAgICAgIH19O1xuICAgIHZhciByZXNwb25zZUZ1bmN0aW9uID0gdGhpcy5yZXNwb25zZS5iaW5kKHRoaXMpO1xuICAgIEFqYXgucmVxKGNvbmZpZywgcmVzcG9uc2VGdW5jdGlvbik7XG59O1xuXG5RdWl6LnByb3RvdHlwZS5nYW1lT3ZlciA9IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKFwiR0FNRSBPVkVSISEhXCIpO1xuICAgIHZhciBkaXYgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NvbnRlbnRcIik7XG4gICAgd2hpbGUoZGl2Lmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgICBkaXYucmVtb3ZlQ2hpbGQoZGl2Lmxhc3RDaGlsZCk7XG4gICAgfVxuICAgIGRpdi5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIkdBTUUgT1ZFUiEhIFRpbWU6IFwiICsgdGhpcy50b3RhbFRpbWUpKTtcbn07XG5cblF1aXoucHJvdG90eXBlLmNsZWFyRGl2ID0gZnVuY3Rpb24oZGl2KSB7XG4gICAgd2hpbGUoZGl2Lmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgICBkaXYucmVtb3ZlQ2hpbGQoZGl2Lmxhc3RDaGlsZCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBRdWl6O1xuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IE9za2FyIG9uIDIwMTUtMTEtMjQuXG4gKi9cblxuZnVuY3Rpb24gVGltZXIob3duZXIsIGVsZW1lbnQsIHRpbWUpIHtcbiAgICB0aGlzLnRpbWUgPSB0aW1lO1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vd25lciA9IG93bmVyO1xuICAgIHRoaXMuc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgdGhpcy5pbnRlcnZhbCA9IHVuZGVmaW5lZDtcbn1cblxuVGltZXIucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pbnRlcnZhbCA9IHNldEludGVydmFsKHRoaXMucnVuLmJpbmQodGhpcyksIDEwMCk7XG59O1xuXG5UaW1lci5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIHZhciBkaWZmID0gKG5vdyAtIHRoaXMuc3RhcnRUaW1lKS8xMDAwO1xuICAgIHZhciBzaG93VGltZSA9IHRoaXMudGltZSAtIGRpZmY7XG5cbiAgICBpZihkaWZmID49IHRoaXMudGltZSkge1xuICAgICAgICBzaG93VGltZSA9IDA7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbCk7XG4gICAgICAgIHRoaXMub3duZXIuZ2FtZU92ZXIoKTtcbiAgICB9XG4gICAgdGhpcy5wcmludChzaG93VGltZSk7XG59O1xuXG5UaW1lci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbCk7XG4gICAgdmFyIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG4gICAgcmV0dXJuIChub3cgLSB0aGlzLnN0YXJ0VGltZSkvMTAwMDtcbn07XG5cblRpbWVyLnByb3RvdHlwZS5wcmludCA9IGZ1bmN0aW9uKGRpZmYpIHtcbiAgICB0aGlzLmVsZW1lbnQucmVwbGFjZUNoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRpZmYpLCB0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRpbWVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgUXVpeiA9IHJlcXVpcmUoXCIuL1F1aXpcIik7XG52YXIgcTtcblxuZnVuY3Rpb24gc3VibWl0KGV2ZW50KSB7XG4gICAgaWYgKGV2ZW50LndoaWNoID09PSAxMyB8fCBldmVudC5rZXlDb2RlID09PSAxMyB8fCBldmVudC50eXBlID09PSBcImNsaWNrXCIpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJzdWJtaXR0aW5nXCIpO1xuICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25pY2tuYW1lXCIpLnZhbHVlO1xuICAgICAgICBxID0gbmV3IFF1aXooaW5wdXQpO1xuICAgIH1cbn1cblxudmFyIGJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc3VibWl0XCIpO1xudmFyIGZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3FGb3JtXCIpO1xuXG5idXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsc3VibWl0LCB0cnVlKTtcbmZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcImtleXByZXNzXCIsIHN1Ym1pdCwgdHJ1ZSk7XG5cbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTIzLlxuICovXG5cInVzZSBzdHJpY3RcIjtcbmZ1bmN0aW9uIFF1ZXN0aW9uKG9iaikge1xuICAgIHRoaXMuaWQgPSBvYmouaWQ7XG4gICAgdGhpcy5xdWVzdGlvbiA9IG9iai5xdWVzdGlvbjtcbiAgICB0aGlzLmFsdCA9IG9iai5hbHRlcm5hdGl2ZXM7XG59XG5cblF1ZXN0aW9uLnByb3RvdHlwZS5wcmludCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmKHRoaXMuYWx0KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiaGFzIGFsdGVybmF0aXZlc1wiKTtcbiAgICAgICAgdGhpcy5wcmludEFsdFF1ZXN0aW9uKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLnByaW50UXVlc3Rpb24oKTtcbiAgICB9XG59O1xuXG5RdWVzdGlvbi5wcm90b3R5cGUuY2xlYXJEaXYgPSBmdW5jdGlvbihkaXYpIHtcbiAgICB3aGlsZShkaXYuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgIGRpdi5yZW1vdmVDaGlsZChkaXYubGFzdENoaWxkKTtcbiAgICB9XG59O1xuXG5RdWVzdGlvbi5wcm90b3R5cGUucHJpbnRBbHRRdWVzdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGVtcGxhdGUtcXVlc3Rpb24tYWx0XCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIucUhlYWRcIikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5xdWVzdGlvbikpO1xuICAgIHZhciBpbnB1dEZyYWcgPSB0aGlzLmdldEFsdEZyYWcoKTtcbiAgICBjb25zb2xlLmxvZyh0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiI3N1Ym1pdFwiKSk7XG4gICAgdGVtcGxhdGUucXVlcnlTZWxlY3RvcihcIiNxRm9ybVwiKS5pbnNlcnRCZWZvcmUoaW5wdXRGcmFnLCB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yKFwiI3N1Ym1pdFwiKSk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb250ZW50XCIpLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcbn07XG5cblF1ZXN0aW9uLnByb3RvdHlwZS5nZXRBbHRGcmFnID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGlucHV0RnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB2YXIgaW5wdXQ7XG4gICAgdmFyIHA7XG5cbiAgICBjb25zb2xlLmxvZyh0aGlzLmFsdCk7XG4gICAgZm9yKHZhciBhbHQgaW4gdGhpcy5hbHQpIHtcbiAgICAgICAgcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwXCIpO1xuICAgICAgICBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcInJhZGlvXCIpO1xuICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJuYW1lXCIsIFwiYWx0ZXJuYXRpdmVcIik7XG4gICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcInZhbHVlXCIsIGFsdCk7XG4gICAgICAgIHAuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICBwLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMuYWx0W2FsdF0pKTtcbiAgICAgICAgaW5wdXRGcmFnLmFwcGVuZENoaWxkKHApO1xuICAgIH1cbiAgICByZXR1cm4gaW5wdXRGcmFnO1xufTtcblxuUXVlc3Rpb24ucHJvdG90eXBlLnByaW50UXVlc3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RlbXBsYXRlLXF1ZXN0aW9uXCIpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgIHRlbXBsYXRlLnF1ZXJ5U2VsZWN0b3IoXCIucUhlYWRcIikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5xdWVzdGlvbikpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGVudFwiKS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXN0aW9uO1xuIl19
