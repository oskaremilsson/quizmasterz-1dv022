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
        console.log(config.url);
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

    this.getQuestion();
}


Quiz.prototype.getQuestion = function (url) {
    console.log("asking..");

    url = url || "http://vhost3.lnu.se:20080/question/1";
    var config = {method: "GET", url: url};
    var responseFunction = this.response.bind(this);
    Ajax.req(config, responseFunction);
};

Quiz.prototype.response = function (error, response) {
    var questionDiv = document.querySelector("#question");
    var answerDiv = document.querySelector("#answer-response");
    console.log("response...");

    if(error) {
        console.log("Fel svar..");
    }

    var obj = JSON.parse(response);
    //console.log(obj.message);
    if(obj.question) {
        answerDiv.classList.toggle("hide");
        this.question = new Question(obj);
        this.question.print();
        this.addListener();
    }
    else {
        questionDiv.classList.toggle("hide");
        answerDiv.classList.toggle("hide");
        console.log(obj.message);
    }
};

Quiz.prototype.addListener = function() {
    var button = document.querySelector("#submit");
    var click = this.submit.bind(this);
    button.addEventListener("click", click);
};

Quiz.prototype.submit = function() {
    var input = document.querySelector("#answer");
    var config = {method: "POST",
        url: this.question.nextURL,
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
    this.nextURL = obj.nextURL;
    this.alt = obj.alternative;
}

Question.prototype.print = function() {
    var form = document.querySelector("#qForm");
    var button = document.querySelector("#submit");
    if(this.alt) {
        console.log("has alternatives");
    }
    else {
        document.querySelector("#question h1").appendChild(document.createTextNode(this.question));

        var input = document.createElement("input");
        input.setAttribute("type", "text");
        input.setAttribute("id", "answer");
        form.insertBefore(input, button);
    }
};

module.exports = Question;

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMS4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQWpheC5qcyIsImNsaWVudC9zb3VyY2UvanMvUXVpei5qcyIsImNsaWVudC9zb3VyY2UvanMvYXBwLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9xdWVzdGlvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IE9za2FyIG9uIDIwMTUtMTEtMjMuXG4gKi9cblxuZnVuY3Rpb24gcmVxKGNvbmZpZywgY2FsbGJhY2spIHtcbiAgICB2YXIgciA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgci5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCBmdW5jdGlvbigpIHtcblxuICAgICAgICBpZiAoci5zdGF0dXMgPj0gNDAwKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhyLnN0YXR1cyk7XG4gICAgICAgIH1cblxuICAgICAgICBjYWxsYmFjayhudWxsLCByLnJlc3BvbnNlVGV4dCk7XG4gICAgfSk7XG5cbiAgICByLm9wZW4oY29uZmlnLm1ldGhvZCwgY29uZmlnLnVybCk7XG4gICAgaWYoY29uZmlnLmRhdGEpe1xuICAgICAgICBjb25zb2xlLmxvZyhjb25maWcudXJsKTtcbiAgICAgICAgci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcbiAgICAgICAgci5zZW5kKEpTT04uc3RyaW5naWZ5KGNvbmZpZy5kYXRhKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgci5zZW5kKG51bGwpO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMucmVxID0gcmVxO1xuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IE9za2FyIG9uIDIwMTUtMTEtMjMuXG4gKi9cblwidXNlIHN0cmljdFwiO1xudmFyIFF1ZXN0aW9uID0gcmVxdWlyZShcIi4vcXVlc3Rpb25cIik7XG52YXIgQWpheCA9IHJlcXVpcmUoXCIuL0FqYXhcIik7XG5cbmZ1bmN0aW9uIFF1aXoodXNlcm5hbWUpIHtcbiAgICB0aGlzLnVzZXJuYW1lID0gdXNlcm5hbWU7XG4gICAgdGhpcy5xdWVzdGlvbiA9IHVuZGVmaW5lZDtcblxuICAgIHRoaXMuZ2V0UXVlc3Rpb24oKTtcbn1cblxuXG5RdWl6LnByb3RvdHlwZS5nZXRRdWVzdGlvbiA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgICBjb25zb2xlLmxvZyhcImFza2luZy4uXCIpO1xuXG4gICAgdXJsID0gdXJsIHx8IFwiaHR0cDovL3Zob3N0My5sbnUuc2U6MjAwODAvcXVlc3Rpb24vMVwiO1xuICAgIHZhciBjb25maWcgPSB7bWV0aG9kOiBcIkdFVFwiLCB1cmw6IHVybH07XG4gICAgdmFyIHJlc3BvbnNlRnVuY3Rpb24gPSB0aGlzLnJlc3BvbnNlLmJpbmQodGhpcyk7XG4gICAgQWpheC5yZXEoY29uZmlnLCByZXNwb25zZUZ1bmN0aW9uKTtcbn07XG5cblF1aXoucHJvdG90eXBlLnJlc3BvbnNlID0gZnVuY3Rpb24gKGVycm9yLCByZXNwb25zZSkge1xuICAgIHZhciBxdWVzdGlvbkRpdiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcXVlc3Rpb25cIik7XG4gICAgdmFyIGFuc3dlckRpdiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYW5zd2VyLXJlc3BvbnNlXCIpO1xuICAgIGNvbnNvbGUubG9nKFwicmVzcG9uc2UuLi5cIik7XG5cbiAgICBpZihlcnJvcikge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkZlbCBzdmFyLi5cIik7XG4gICAgfVxuXG4gICAgdmFyIG9iaiA9IEpTT04ucGFyc2UocmVzcG9uc2UpO1xuICAgIC8vY29uc29sZS5sb2cob2JqLm1lc3NhZ2UpO1xuICAgIGlmKG9iai5xdWVzdGlvbikge1xuICAgICAgICBhbnN3ZXJEaXYuY2xhc3NMaXN0LnRvZ2dsZShcImhpZGVcIik7XG4gICAgICAgIHRoaXMucXVlc3Rpb24gPSBuZXcgUXVlc3Rpb24ob2JqKTtcbiAgICAgICAgdGhpcy5xdWVzdGlvbi5wcmludCgpO1xuICAgICAgICB0aGlzLmFkZExpc3RlbmVyKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBxdWVzdGlvbkRpdi5jbGFzc0xpc3QudG9nZ2xlKFwiaGlkZVwiKTtcbiAgICAgICAgYW5zd2VyRGl2LmNsYXNzTGlzdC50b2dnbGUoXCJoaWRlXCIpO1xuICAgICAgICBjb25zb2xlLmxvZyhvYmoubWVzc2FnZSk7XG4gICAgfVxufTtcblxuUXVpei5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzdWJtaXRcIik7XG4gICAgdmFyIGNsaWNrID0gdGhpcy5zdWJtaXQuYmluZCh0aGlzKTtcbiAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNsaWNrKTtcbn07XG5cblF1aXoucHJvdG90eXBlLnN1Ym1pdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYW5zd2VyXCIpO1xuICAgIHZhciBjb25maWcgPSB7bWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgdXJsOiB0aGlzLnF1ZXN0aW9uLm5leHRVUkwsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGFuc3dlcjogaW5wdXQudmFsdWVcbiAgICAgICAgfX07XG4gICAgdmFyIHJlc3BvbnNlRnVuY3Rpb24gPSB0aGlzLnJlc3BvbnNlLmJpbmQodGhpcyk7XG4gICAgQWpheC5yZXEoY29uZmlnLCByZXNwb25zZUZ1bmN0aW9uKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBRdWl6O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgUXVpeiA9IHJlcXVpcmUoXCIuL1F1aXpcIik7XG5cbnZhciBxID0gbmV3IFF1aXooKTtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTIzLlxuICovXG5cInVzZSBzdHJpY3RcIjtcbmZ1bmN0aW9uIFF1ZXN0aW9uKG9iaikge1xuICAgIHRoaXMuaWQgPSBvYmouaWQ7XG4gICAgdGhpcy5xdWVzdGlvbiA9IG9iai5xdWVzdGlvbjtcbiAgICB0aGlzLm5leHRVUkwgPSBvYmoubmV4dFVSTDtcbiAgICB0aGlzLmFsdCA9IG9iai5hbHRlcm5hdGl2ZTtcbn1cblxuUXVlc3Rpb24ucHJvdG90eXBlLnByaW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3FGb3JtXCIpO1xuICAgIHZhciBidXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3N1Ym1pdFwiKTtcbiAgICBpZih0aGlzLmFsdCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcImhhcyBhbHRlcm5hdGl2ZXNcIik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3F1ZXN0aW9uIGgxXCIpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMucXVlc3Rpb24pKTtcblxuICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJ0ZXh0XCIpO1xuICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcImFuc3dlclwiKTtcbiAgICAgICAgZm9ybS5pbnNlcnRCZWZvcmUoaW5wdXQsIGJ1dHRvbik7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbjtcbiJdfQ==
