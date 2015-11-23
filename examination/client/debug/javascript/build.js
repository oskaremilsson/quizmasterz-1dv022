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
    console.log("response...");

    if(error) {
        //gör nå coolt
    }

    var obj = JSON.parse(response);
    console.log(obj.message);
    if(obj.question) {
        this.question = new Question(obj);
        this.question.print();
        this.addListener();
    }
    else {
        console.log(obj.answer);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMS4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQWpheC5qcyIsImNsaWVudC9zb3VyY2UvanMvUXVpei5qcyIsImNsaWVudC9zb3VyY2UvanMvYXBwLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9xdWVzdGlvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yMy5cbiAqL1xuXG5mdW5jdGlvbiByZXEoY29uZmlnLCBjYWxsYmFjaykge1xuICAgIHZhciByID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICByLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGlmIChyLnN0YXR1cyA+PSA0MDApIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHIuc3RhdHVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHIucmVzcG9uc2VUZXh0KTtcbiAgICB9KTtcblxuICAgIHIub3Blbihjb25maWcubWV0aG9kLCBjb25maWcudXJsKTtcbiAgICBpZihjb25maWcuZGF0YSl7XG4gICAgICAgIGNvbnNvbGUubG9nKGNvbmZpZy51cmwpO1xuICAgICAgICByLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uXCIpO1xuICAgICAgICByLnNlbmQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLmRhdGEpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByLnNlbmQobnVsbCk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cy5yZXEgPSByZXE7XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgT3NrYXIgb24gMjAxNS0xMS0yMy5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgUXVlc3Rpb24gPSByZXF1aXJlKFwiLi9xdWVzdGlvblwiKTtcbnZhciBBamF4ID0gcmVxdWlyZShcIi4vQWpheFwiKTtcblxuZnVuY3Rpb24gUXVpeih1c2VybmFtZSkge1xuICAgIHRoaXMudXNlcm5hbWUgPSB1c2VybmFtZTtcbiAgICB0aGlzLnF1ZXN0aW9uID0gdW5kZWZpbmVkO1xuXG4gICAgdGhpcy5nZXRRdWVzdGlvbigpO1xufVxuXG5cblF1aXoucHJvdG90eXBlLmdldFF1ZXN0aW9uID0gZnVuY3Rpb24gKHVybCkge1xuICAgIGNvbnNvbGUubG9nKFwiYXNraW5nLi5cIik7XG5cbiAgICB1cmwgPSB1cmwgfHwgXCJodHRwOi8vdmhvc3QzLmxudS5zZToyMDA4MC9xdWVzdGlvbi8xXCI7XG4gICAgdmFyIGNvbmZpZyA9IHttZXRob2Q6IFwiR0VUXCIsIHVybDogdXJsfTtcbiAgICB2YXIgcmVzcG9uc2VGdW5jdGlvbiA9IHRoaXMucmVzcG9uc2UuYmluZCh0aGlzKTtcbiAgICBBamF4LnJlcShjb25maWcsIHJlc3BvbnNlRnVuY3Rpb24pO1xufTtcblxuUXVpei5wcm90b3R5cGUucmVzcG9uc2UgPSBmdW5jdGlvbiAoZXJyb3IsIHJlc3BvbnNlKSB7XG4gICAgY29uc29sZS5sb2coXCJyZXNwb25zZS4uLlwiKTtcblxuICAgIGlmKGVycm9yKSB7XG4gICAgICAgIC8vZ8O2ciBuw6UgY29vbHRcbiAgICB9XG5cbiAgICB2YXIgb2JqID0gSlNPTi5wYXJzZShyZXNwb25zZSk7XG4gICAgY29uc29sZS5sb2cob2JqLm1lc3NhZ2UpO1xuICAgIGlmKG9iai5xdWVzdGlvbikge1xuICAgICAgICB0aGlzLnF1ZXN0aW9uID0gbmV3IFF1ZXN0aW9uKG9iaik7XG4gICAgICAgIHRoaXMucXVlc3Rpb24ucHJpbnQoKTtcbiAgICAgICAgdGhpcy5hZGRMaXN0ZW5lcigpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2cob2JqLmFuc3dlcik7XG4gICAgfVxufTtcblxuUXVpei5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzdWJtaXRcIik7XG4gICAgdmFyIGNsaWNrID0gdGhpcy5zdWJtaXQuYmluZCh0aGlzKTtcbiAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNsaWNrKTtcbn07XG5cblF1aXoucHJvdG90eXBlLnN1Ym1pdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYW5zd2VyXCIpO1xuICAgIHZhciBjb25maWcgPSB7bWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgdXJsOiB0aGlzLnF1ZXN0aW9uLm5leHRVUkwsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGFuc3dlcjogaW5wdXQudmFsdWVcbiAgICAgICAgfX07XG4gICAgdmFyIHJlc3BvbnNlRnVuY3Rpb24gPSB0aGlzLnJlc3BvbnNlLmJpbmQodGhpcyk7XG4gICAgQWpheC5yZXEoY29uZmlnLCByZXNwb25zZUZ1bmN0aW9uKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBRdWl6O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgUXVpeiA9IHJlcXVpcmUoXCIuL1F1aXpcIik7XG5cbnZhciBxID0gbmV3IFF1aXooKTtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBPc2thciBvbiAyMDE1LTExLTIzLlxuICovXG5cInVzZSBzdHJpY3RcIjtcbmZ1bmN0aW9uIFF1ZXN0aW9uKG9iaikge1xuICAgIHRoaXMuaWQgPSBvYmouaWQ7XG4gICAgdGhpcy5xdWVzdGlvbiA9IG9iai5xdWVzdGlvbjtcbiAgICB0aGlzLm5leHRVUkwgPSBvYmoubmV4dFVSTDtcbiAgICB0aGlzLmFsdCA9IG9iai5hbHRlcm5hdGl2ZTtcbn1cblxuUXVlc3Rpb24ucHJvdG90eXBlLnByaW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3FGb3JtXCIpO1xuICAgIHZhciBidXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3N1Ym1pdFwiKTtcbiAgICBpZih0aGlzLmFsdCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcImhhcyBhbHRlcm5hdGl2ZXNcIik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3F1ZXN0aW9uIGgxXCIpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMucXVlc3Rpb24pKTtcblxuICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJ0ZXh0XCIpO1xuICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcImFuc3dlclwiKTtcbiAgICAgICAgZm9ybS5pbnNlcnRCZWZvcmUoaW5wdXQsIGJ1dHRvbik7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbjtcbiJdfQ==
