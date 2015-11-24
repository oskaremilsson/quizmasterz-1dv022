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
