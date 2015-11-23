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
    if(config.data){
        console.log(config);
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

function Quiz(username) {
    this.username = username;
    this.question = undefined;
    this.nextURL = undefined;
    this.getQuestion();
}


Quiz.prototype.getQuestion = function () {
    console.log("asking..");
    var url = this.nextURL || "http://vhost3.lnu.se:20080/question/1";
    console.log(url);
    var config = {method: "GET", url: url};
    var responseFunction = this.response.bind(this);
    Ajax.req(config, responseFunction);
};

Quiz.prototype.response = function (error, response) {
    var questionDiv = document.querySelector("#question");
    var answerDiv = document.querySelector("#answer-response");

    console.log("response...");

    if(error) {
        console.log( JSON.parse(response));
        //end quiz
    }

    var obj = JSON.parse(response);
    //console.log(obj.message);
    if(obj.question) {
        questionDiv.classList.add("show");
        questionDiv.classList.remove("hide");

        this.question = new Question(obj);
        this.question.print();
        this.nextURL = obj.nextURL;

        console.log(this.nextURL);

        console.log("Adding listener..");
        this.addListener();
    }
    else {
        answerDiv.classList.add("show");
        answerDiv.classList.remove("hide");
        console.log(obj);
        this.nextURL = obj.nextURL;

        var p = document.createElement("p");
        var text = document.createTextNode(obj.message);
        p.appendChild(text);
        answerDiv.appendChild(p);

        var newQuestion = this.getQuestion.bind(this);
        setTimeout(newQuestion, 1000);
    }

};

Quiz.prototype.addListener = function() {
    this.button = document.querySelector("#submit");
    var click = this.submit.bind(this);
    this.button.addEventListener("click", click);
};

Quiz.prototype.submit = function() {
    console.log("submitting...");
    var input;
    this.button.removeEventListener("click", this.submit.bind(this));
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

},{"./Ajax":1,"./question":4}],3:[function(require,module,exports){
"use strict";
var Quiz = require("./Quiz");

var q = new Quiz();

},{"./Quiz":2}],4:[function(require,module,exports){
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

    form.appendChild(inputFrag);
    form.appendChild(button);

    frag.appendChild(h1);
    frag.appendChild(form);

    div.appendChild(frag);
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

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMS4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQWpheC5qcyIsImNsaWVudC9zb3VyY2UvanMvUXVpei5qcyIsImNsaWVudC9zb3VyY2UvanMvYXBwLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9xdWVzdGlvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IE9za2FyIG9uIDIwMTUtMTEtMjMuXG4gKi9cblxuZnVuY3Rpb24gcmVxKGNvbmZpZywgY2FsbGJhY2spIHtcbiAgICB2YXIgciA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgci5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCBmdW5jdGlvbigpIHtcblxuICAgICAgICBpZiAoci5zdGF0dXMgPj0gNDAwKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhyLnN0YXR1cyk7XG4gICAgICAgIH1cblxuICAgICAgICBjYWxsYmFjayhudWxsLCByLnJlc3BvbnNlVGV4dCk7XG4gICAgfSk7XG5cbiAgICByLm9wZW4oY29uZmlnLm1ldGhvZCwgY29uZmlnLnVybCk7XG4gICAgaWYoY29uZmlnLmRhdGEpe1xuICAgICAgICBjb25zb2xlLmxvZyhjb25maWcpO1xuICAgICAgICByLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uXCIpO1xuICAgICAgICByLnNlbmQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLmRhdGEpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByLnNlbmQobnVsbCk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cy5yZXEgPSByZXE7XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yMy5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgUXVlc3Rpb24gPSByZXF1aXJlKFwiLi9xdWVzdGlvblwiKTtcbnZhciBBamF4ID0gcmVxdWlyZShcIi4vQWpheFwiKTtcblxuZnVuY3Rpb24gUXVpeih1c2VybmFtZSkge1xuICAgIHRoaXMudXNlcm5hbWUgPSB1c2VybmFtZTtcbiAgICB0aGlzLnF1ZXN0aW9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMubmV4dFVSTCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmdldFF1ZXN0aW9uKCk7XG59XG5cblxuUXVpei5wcm90b3R5cGUuZ2V0UXVlc3Rpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgY29uc29sZS5sb2coXCJhc2tpbmcuLlwiKTtcbiAgICB2YXIgdXJsID0gdGhpcy5uZXh0VVJMIHx8IFwiaHR0cDovL3Zob3N0My5sbnUuc2U6MjAwODAvcXVlc3Rpb24vMVwiO1xuICAgIGNvbnNvbGUubG9nKHVybCk7XG4gICAgdmFyIGNvbmZpZyA9IHttZXRob2Q6IFwiR0VUXCIsIHVybDogdXJsfTtcbiAgICB2YXIgcmVzcG9uc2VGdW5jdGlvbiA9IHRoaXMucmVzcG9uc2UuYmluZCh0aGlzKTtcbiAgICBBamF4LnJlcShjb25maWcsIHJlc3BvbnNlRnVuY3Rpb24pO1xufTtcblxuUXVpei5wcm90b3R5cGUucmVzcG9uc2UgPSBmdW5jdGlvbiAoZXJyb3IsIHJlc3BvbnNlKSB7XG4gICAgdmFyIHF1ZXN0aW9uRGl2ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNxdWVzdGlvblwiKTtcbiAgICB2YXIgYW5zd2VyRGl2ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNhbnN3ZXItcmVzcG9uc2VcIik7XG5cbiAgICBjb25zb2xlLmxvZyhcInJlc3BvbnNlLi4uXCIpO1xuXG4gICAgaWYoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5sb2coIEpTT04ucGFyc2UocmVzcG9uc2UpKTtcbiAgICAgICAgLy9lbmQgcXVpelxuICAgIH1cblxuICAgIHZhciBvYmogPSBKU09OLnBhcnNlKHJlc3BvbnNlKTtcbiAgICAvL2NvbnNvbGUubG9nKG9iai5tZXNzYWdlKTtcbiAgICBpZihvYmoucXVlc3Rpb24pIHtcbiAgICAgICAgcXVlc3Rpb25EaXYuY2xhc3NMaXN0LmFkZChcInNob3dcIik7XG4gICAgICAgIHF1ZXN0aW9uRGl2LmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRlXCIpO1xuXG4gICAgICAgIHRoaXMucXVlc3Rpb24gPSBuZXcgUXVlc3Rpb24ob2JqKTtcbiAgICAgICAgdGhpcy5xdWVzdGlvbi5wcmludCgpO1xuICAgICAgICB0aGlzLm5leHRVUkwgPSBvYmoubmV4dFVSTDtcblxuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLm5leHRVUkwpO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwiQWRkaW5nIGxpc3RlbmVyLi5cIik7XG4gICAgICAgIHRoaXMuYWRkTGlzdGVuZXIoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGFuc3dlckRpdi5jbGFzc0xpc3QuYWRkKFwic2hvd1wiKTtcbiAgICAgICAgYW5zd2VyRGl2LmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRlXCIpO1xuICAgICAgICBjb25zb2xlLmxvZyhvYmopO1xuICAgICAgICB0aGlzLm5leHRVUkwgPSBvYmoubmV4dFVSTDtcblxuICAgICAgICB2YXIgcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwXCIpO1xuICAgICAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKG9iai5tZXNzYWdlKTtcbiAgICAgICAgcC5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICAgICAgYW5zd2VyRGl2LmFwcGVuZENoaWxkKHApO1xuXG4gICAgICAgIHZhciBuZXdRdWVzdGlvbiA9IHRoaXMuZ2V0UXVlc3Rpb24uYmluZCh0aGlzKTtcbiAgICAgICAgc2V0VGltZW91dChuZXdRdWVzdGlvbiwgMTAwMCk7XG4gICAgfVxuXG59O1xuXG5RdWl6LnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzdWJtaXRcIik7XG4gICAgdmFyIGNsaWNrID0gdGhpcy5zdWJtaXQuYmluZCh0aGlzKTtcbiAgICB0aGlzLmJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgY2xpY2spO1xufTtcblxuUXVpei5wcm90b3R5cGUuc3VibWl0ID0gZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coXCJzdWJtaXR0aW5nLi4uXCIpO1xuICAgIHZhciBpbnB1dDtcbiAgICB0aGlzLmJ1dHRvbi5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zdWJtaXQuYmluZCh0aGlzKSk7XG4gICAgaWYoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNhbnN3ZXJcIikpIHtcbiAgICAgICAgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2Fuc3dlclwiKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImlucHV0W25hbWU9J2FsdGVybmF0aXZlJ106Y2hlY2tlZFwiKTtcbiAgICB9XG5cblxuICAgIHZhciBjb25maWcgPSB7bWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgdXJsOiB0aGlzLm5leHRVUkwsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGFuc3dlcjogaW5wdXQudmFsdWVcbiAgICAgICAgfX07XG4gICAgdmFyIHJlc3BvbnNlRnVuY3Rpb24gPSB0aGlzLnJlc3BvbnNlLmJpbmQodGhpcyk7XG4gICAgQWpheC5yZXEoY29uZmlnLCByZXNwb25zZUZ1bmN0aW9uKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBRdWl6O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgUXVpeiA9IHJlcXVpcmUoXCIuL1F1aXpcIik7XG5cbnZhciBxID0gbmV3IFF1aXooKTtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTIzLlxuICovXG5cInVzZSBzdHJpY3RcIjtcbmZ1bmN0aW9uIFF1ZXN0aW9uKG9iaikge1xuICAgIHRoaXMuaWQgPSBvYmouaWQ7XG4gICAgdGhpcy5xdWVzdGlvbiA9IG9iai5xdWVzdGlvbjtcbiAgICB0aGlzLmFsdCA9IG9iai5hbHRlcm5hdGl2ZXM7XG59XG5cblF1ZXN0aW9uLnByb3RvdHlwZS5wcmludCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBxdWVzdGlvbkRpdiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcXVlc3Rpb25cIik7XG4gICAgdGhpcy5jbGVhckRpdihxdWVzdGlvbkRpdik7XG4gICAgaWYodGhpcy5hbHQpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJoYXMgYWx0ZXJuYXRpdmVzXCIpO1xuICAgICAgICB0aGlzLnByaW50QWx0UXVlc3Rpb24ocXVlc3Rpb25EaXYpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5wcmludFF1ZXN0aW9uKHF1ZXN0aW9uRGl2KTtcbiAgICB9XG59O1xuXG5RdWVzdGlvbi5wcm90b3R5cGUuY2xlYXJEaXYgPSBmdW5jdGlvbihkaXYpIHtcbiAgICB3aGlsZShkaXYuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgIGRpdi5yZW1vdmVDaGlsZChkaXYubGFzdENoaWxkKTtcbiAgICB9XG59O1xuXG5RdWVzdGlvbi5wcm90b3R5cGUucHJpbnRBbHRRdWVzdGlvbiA9IGZ1bmN0aW9uKGRpdikge1xuICAgIHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgdmFyIGgxID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImgxXCIpO1xuICAgIHZhciBmb3JtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImZvcm1cIik7XG4gICAgZm9ybS5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcInFGb3JtXCIpO1xuXG4gICAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICBidXR0b24uc2V0QXR0cmlidXRlKFwiaWRcIiwgXCJzdWJtaXRcIik7XG4gICAgYnV0dG9uLnNldEF0dHJpYnV0ZShcInZhbHVlXCIsIFwiU2VuZFwiKTtcbiAgICBidXR0b24uc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcImJ1dHRvblwiKTtcblxuXG4gICAgaDEuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5xdWVzdGlvbikpO1xuXG4gICAgdmFyIGlucHV0RnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB2YXIgaW5wdXQ7XG4gICAgdmFyIHA7XG5cbiAgICBjb25zb2xlLmxvZyh0aGlzLmFsdCk7XG4gICAgZm9yKHZhciBhbHQgaW4gdGhpcy5hbHQpIHtcbiAgICAgICAgcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwXCIpO1xuICAgICAgICBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcInJhZGlvXCIpO1xuICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJuYW1lXCIsIFwiYWx0ZXJuYXRpdmVcIik7XG4gICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcInZhbHVlXCIsIGFsdCk7XG4gICAgICAgIHAuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICBwLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMuYWx0W2FsdF0pKTtcbiAgICAgICAgaW5wdXRGcmFnLmFwcGVuZENoaWxkKHApO1xuICAgIH1cblxuICAgIGZvcm0uYXBwZW5kQ2hpbGQoaW5wdXRGcmFnKTtcbiAgICBmb3JtLmFwcGVuZENoaWxkKGJ1dHRvbik7XG5cbiAgICBmcmFnLmFwcGVuZENoaWxkKGgxKTtcbiAgICBmcmFnLmFwcGVuZENoaWxkKGZvcm0pO1xuXG4gICAgZGl2LmFwcGVuZENoaWxkKGZyYWcpO1xufTtcblxuUXVlc3Rpb24ucHJvdG90eXBlLnByaW50UXVlc3Rpb24gPSBmdW5jdGlvbihkaXYpIHtcbiAgICB2YXIgZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblxuICAgIHZhciBoMSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJoMVwiKTtcbiAgICB2YXIgZm9ybSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJmb3JtXCIpO1xuICAgIGZvcm0uc2V0QXR0cmlidXRlKFwiaWRcIiwgXCJxRm9ybVwiKTtcblxuICAgIHZhciBidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gICAgYnV0dG9uLnNldEF0dHJpYnV0ZShcImlkXCIsIFwic3VibWl0XCIpO1xuICAgIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiLCBcIlNlbmRcIik7XG4gICAgYnV0dG9uLnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJidXR0b25cIik7XG5cblxuICAgIGgxLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMucXVlc3Rpb24pKTtcblxuICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwidGV4dFwiKTtcbiAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcImFuc3dlclwiKTtcblxuXG4gICAgZm9ybS5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgZm9ybS5hcHBlbmRDaGlsZChidXR0b24pO1xuXG4gICAgZnJhZy5hcHBlbmRDaGlsZChoMSk7XG4gICAgZnJhZy5hcHBlbmRDaGlsZChmb3JtKTtcblxuICAgIGRpdi5hcHBlbmRDaGlsZChmcmFnKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUXVlc3Rpb247XG4iXX0=
