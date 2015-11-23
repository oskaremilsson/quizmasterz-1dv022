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
    this.button = undefined;

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

    questionDiv.classList.add("hide");
    answerDiv.classList.add("hide");

    console.log("response...");

    if(error) {
        console.log( JSON.parse(response));
        //end quiz
    }

    var obj = JSON.parse(response);
    if(obj.question) {
        questionDiv.classList.toggle("hide");

        this.question = new Question(obj);
        this.question.print();
        this.nextURL = obj.nextURL;

        console.log(this.nextURL);

        console.log("Adding listener..");
        this.addListener();
    }
    else {
        answerDiv.classList.toggle("hide");
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

    document.addEventListener("keypress", click);

};

Quiz.prototype.submit = function() {
    var key;
    if(event) {
        key = event.which || event.keyCode;
    }

    if(key === 13 || event.type === "click") {
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
    }

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

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMS4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQWpheC5qcyIsImNsaWVudC9zb3VyY2UvanMvUXVpei5qcyIsImNsaWVudC9zb3VyY2UvanMvYXBwLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9xdWVzdGlvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yMy5cbiAqL1xuXG5mdW5jdGlvbiByZXEoY29uZmlnLCBjYWxsYmFjaykge1xuICAgIHZhciByID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICByLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGlmIChyLnN0YXR1cyA+PSA0MDApIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHIuc3RhdHVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHIucmVzcG9uc2VUZXh0KTtcbiAgICB9KTtcblxuICAgIHIub3Blbihjb25maWcubWV0aG9kLCBjb25maWcudXJsKTtcbiAgICBpZihjb25maWcuZGF0YSl7XG4gICAgICAgIGNvbnNvbGUubG9nKGNvbmZpZyk7XG4gICAgICAgIHIuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb25cIik7XG4gICAgICAgIHIuc2VuZChKU09OLnN0cmluZ2lmeShjb25maWcuZGF0YSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHIuc2VuZChudWxsKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzLnJlcSA9IHJlcTtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTIzLlxuICovXG5cInVzZSBzdHJpY3RcIjtcbnZhciBRdWVzdGlvbiA9IHJlcXVpcmUoXCIuL3F1ZXN0aW9uXCIpO1xudmFyIEFqYXggPSByZXF1aXJlKFwiLi9BamF4XCIpO1xuXG5mdW5jdGlvbiBRdWl6KHVzZXJuYW1lKSB7XG4gICAgdGhpcy51c2VybmFtZSA9IHVzZXJuYW1lO1xuICAgIHRoaXMucXVlc3Rpb24gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5uZXh0VVJMID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuYnV0dG9uID0gdW5kZWZpbmVkO1xuXG4gICAgdGhpcy5nZXRRdWVzdGlvbigpO1xufVxuXG5cblF1aXoucHJvdG90eXBlLmdldFF1ZXN0aW9uID0gZnVuY3Rpb24gKCkge1xuXG4gICAgY29uc29sZS5sb2coXCJhc2tpbmcuLlwiKTtcbiAgICB2YXIgdXJsID0gdGhpcy5uZXh0VVJMIHx8IFwiaHR0cDovL3Zob3N0My5sbnUuc2U6MjAwODAvcXVlc3Rpb24vMVwiO1xuICAgIGNvbnNvbGUubG9nKHVybCk7XG4gICAgdmFyIGNvbmZpZyA9IHttZXRob2Q6IFwiR0VUXCIsIHVybDogdXJsfTtcbiAgICB2YXIgcmVzcG9uc2VGdW5jdGlvbiA9IHRoaXMucmVzcG9uc2UuYmluZCh0aGlzKTtcbiAgICBBamF4LnJlcShjb25maWcsIHJlc3BvbnNlRnVuY3Rpb24pO1xufTtcblxuUXVpei5wcm90b3R5cGUucmVzcG9uc2UgPSBmdW5jdGlvbiAoZXJyb3IsIHJlc3BvbnNlKSB7XG4gICAgdmFyIHF1ZXN0aW9uRGl2ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNxdWVzdGlvblwiKTtcbiAgICB2YXIgYW5zd2VyRGl2ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNhbnN3ZXItcmVzcG9uc2VcIik7XG5cbiAgICBxdWVzdGlvbkRpdi5jbGFzc0xpc3QuYWRkKFwiaGlkZVwiKTtcbiAgICBhbnN3ZXJEaXYuY2xhc3NMaXN0LmFkZChcImhpZGVcIik7XG5cbiAgICBjb25zb2xlLmxvZyhcInJlc3BvbnNlLi4uXCIpO1xuXG4gICAgaWYoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5sb2coIEpTT04ucGFyc2UocmVzcG9uc2UpKTtcbiAgICAgICAgLy9lbmQgcXVpelxuICAgIH1cblxuICAgIHZhciBvYmogPSBKU09OLnBhcnNlKHJlc3BvbnNlKTtcbiAgICBpZihvYmoucXVlc3Rpb24pIHtcbiAgICAgICAgcXVlc3Rpb25EaXYuY2xhc3NMaXN0LnRvZ2dsZShcImhpZGVcIik7XG5cbiAgICAgICAgdGhpcy5xdWVzdGlvbiA9IG5ldyBRdWVzdGlvbihvYmopO1xuICAgICAgICB0aGlzLnF1ZXN0aW9uLnByaW50KCk7XG4gICAgICAgIHRoaXMubmV4dFVSTCA9IG9iai5uZXh0VVJMO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMubmV4dFVSTCk7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJBZGRpbmcgbGlzdGVuZXIuLlwiKTtcbiAgICAgICAgdGhpcy5hZGRMaXN0ZW5lcigpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgYW5zd2VyRGl2LmNsYXNzTGlzdC50b2dnbGUoXCJoaWRlXCIpO1xuICAgICAgICBjb25zb2xlLmxvZyhvYmopO1xuICAgICAgICB0aGlzLm5leHRVUkwgPSBvYmoubmV4dFVSTDtcblxuICAgICAgICB2YXIgcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwXCIpO1xuICAgICAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKG9iai5tZXNzYWdlKTtcbiAgICAgICAgcC5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICAgICAgYW5zd2VyRGl2LmFwcGVuZENoaWxkKHApO1xuXG4gICAgICAgIHZhciBuZXdRdWVzdGlvbiA9IHRoaXMuZ2V0UXVlc3Rpb24uYmluZCh0aGlzKTtcbiAgICAgICAgc2V0VGltZW91dChuZXdRdWVzdGlvbiwgMTAwMCk7XG4gICAgfVxuXG59O1xuXG5RdWl6LnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzdWJtaXRcIik7XG4gICAgdmFyIGNsaWNrID0gdGhpcy5zdWJtaXQuYmluZCh0aGlzKTtcbiAgICB0aGlzLmJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgY2xpY2spO1xuXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXByZXNzXCIsIGNsaWNrKTtcblxufTtcblxuUXVpei5wcm90b3R5cGUuc3VibWl0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGtleTtcbiAgICBpZihldmVudCkge1xuICAgICAgICBrZXkgPSBldmVudC53aGljaCB8fCBldmVudC5rZXlDb2RlO1xuICAgIH1cblxuICAgIGlmKGtleSA9PT0gMTMgfHwgZXZlbnQudHlwZSA9PT0gXCJjbGlja1wiKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwic3VibWl0dGluZy4uLlwiKTtcbiAgICAgICAgdmFyIGlucHV0O1xuICAgICAgICB0aGlzLmJ1dHRvbi5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zdWJtaXQuYmluZCh0aGlzKSk7XG4gICAgICAgIGlmKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYW5zd2VyXCIpKSB7XG4gICAgICAgICAgICBpbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYW5zd2VyXCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRbbmFtZT0nYWx0ZXJuYXRpdmUnXTpjaGVja2VkXCIpO1xuICAgICAgICB9XG5cblxuICAgICAgICB2YXIgY29uZmlnID0ge21ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgICB1cmw6IHRoaXMubmV4dFVSTCxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBhbnN3ZXI6IGlucHV0LnZhbHVlXG4gICAgICAgICAgICB9fTtcbiAgICAgICAgdmFyIHJlc3BvbnNlRnVuY3Rpb24gPSB0aGlzLnJlc3BvbnNlLmJpbmQodGhpcyk7XG4gICAgICAgIEFqYXgucmVxKGNvbmZpZywgcmVzcG9uc2VGdW5jdGlvbik7XG4gICAgfVxuXG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gUXVpejtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIFF1aXogPSByZXF1aXJlKFwiLi9RdWl6XCIpO1xuXG52YXIgcSA9IG5ldyBRdWl6KCk7XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yMy5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5mdW5jdGlvbiBRdWVzdGlvbihvYmopIHtcbiAgICB0aGlzLmlkID0gb2JqLmlkO1xuICAgIHRoaXMucXVlc3Rpb24gPSBvYmoucXVlc3Rpb247XG4gICAgdGhpcy5hbHQgPSBvYmouYWx0ZXJuYXRpdmVzO1xufVxuXG5RdWVzdGlvbi5wcm90b3R5cGUucHJpbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcXVlc3Rpb25EaXYgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3F1ZXN0aW9uXCIpO1xuICAgIHRoaXMuY2xlYXJEaXYocXVlc3Rpb25EaXYpO1xuICAgIGlmKHRoaXMuYWx0KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiaGFzIGFsdGVybmF0aXZlc1wiKTtcbiAgICAgICAgdGhpcy5wcmludEFsdFF1ZXN0aW9uKHF1ZXN0aW9uRGl2KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMucHJpbnRRdWVzdGlvbihxdWVzdGlvbkRpdik7XG4gICAgfVxufTtcblxuUXVlc3Rpb24ucHJvdG90eXBlLmNsZWFyRGl2ID0gZnVuY3Rpb24oZGl2KSB7XG4gICAgd2hpbGUoZGl2Lmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgICBkaXYucmVtb3ZlQ2hpbGQoZGl2Lmxhc3RDaGlsZCk7XG4gICAgfVxufTtcblxuUXVlc3Rpb24ucHJvdG90eXBlLnByaW50QWx0UXVlc3Rpb24gPSBmdW5jdGlvbihkaXYpIHtcbiAgICB2YXIgZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblxuICAgIHZhciBoMSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJoMVwiKTtcbiAgICB2YXIgZm9ybSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJmb3JtXCIpO1xuICAgIGZvcm0uc2V0QXR0cmlidXRlKFwiaWRcIiwgXCJxRm9ybVwiKTtcblxuICAgIHZhciBidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gICAgYnV0dG9uLnNldEF0dHJpYnV0ZShcImlkXCIsIFwic3VibWl0XCIpO1xuICAgIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiLCBcIlNlbmRcIik7XG4gICAgYnV0dG9uLnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJidXR0b25cIik7XG5cblxuICAgIGgxLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMucXVlc3Rpb24pKTtcblxuICAgIHZhciBpbnB1dEZyYWcgPSB0aGlzLmdldEFsdEZyYWcoKTtcblxuICAgIGZvcm0uYXBwZW5kQ2hpbGQoaW5wdXRGcmFnKTtcbiAgICBmb3JtLmFwcGVuZENoaWxkKGJ1dHRvbik7XG5cbiAgICBmcmFnLmFwcGVuZENoaWxkKGgxKTtcbiAgICBmcmFnLmFwcGVuZENoaWxkKGZvcm0pO1xuXG4gICAgZGl2LmFwcGVuZENoaWxkKGZyYWcpO1xufTtcblxuUXVlc3Rpb24ucHJvdG90eXBlLmdldEFsdEZyYWcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaW5wdXRGcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIHZhciBpbnB1dDtcbiAgICB2YXIgcDtcblxuICAgIGNvbnNvbGUubG9nKHRoaXMuYWx0KTtcbiAgICBmb3IodmFyIGFsdCBpbiB0aGlzLmFsdCkge1xuICAgICAgICBwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInBcIik7XG4gICAgICAgIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpO1xuICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwicmFkaW9cIik7XG4gICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcIm5hbWVcIiwgXCJhbHRlcm5hdGl2ZVwiKTtcbiAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwidmFsdWVcIiwgYWx0KTtcbiAgICAgICAgcC5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgIHAuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5hbHRbYWx0XSkpO1xuICAgICAgICBpbnB1dEZyYWcuYXBwZW5kQ2hpbGQocCk7XG4gICAgfVxuICAgIHJldHVybiBpbnB1dEZyYWc7XG59O1xuXG5RdWVzdGlvbi5wcm90b3R5cGUucHJpbnRRdWVzdGlvbiA9IGZ1bmN0aW9uKGRpdikge1xuICAgIHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgdmFyIGgxID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImgxXCIpO1xuICAgIHZhciBmb3JtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImZvcm1cIik7XG4gICAgZm9ybS5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcInFGb3JtXCIpO1xuXG4gICAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICBidXR0b24uc2V0QXR0cmlidXRlKFwiaWRcIiwgXCJzdWJtaXRcIik7XG4gICAgYnV0dG9uLnNldEF0dHJpYnV0ZShcInZhbHVlXCIsIFwiU2VuZFwiKTtcbiAgICBidXR0b24uc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcImJ1dHRvblwiKTtcblxuXG4gICAgaDEuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5xdWVzdGlvbikpO1xuXG4gICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpO1xuICAgIGlucHV0LnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJ0ZXh0XCIpO1xuICAgIGlucHV0LnNldEF0dHJpYnV0ZShcImlkXCIsIFwiYW5zd2VyXCIpO1xuXG5cbiAgICBmb3JtLmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICBmb3JtLmFwcGVuZENoaWxkKGJ1dHRvbik7XG5cbiAgICBmcmFnLmFwcGVuZENoaWxkKGgxKTtcbiAgICBmcmFnLmFwcGVuZENoaWxkKGZvcm0pO1xuXG4gICAgZGl2LmFwcGVuZENoaWxkKGZyYWcpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbjtcbiJdfQ==
