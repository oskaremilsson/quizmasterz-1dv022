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
