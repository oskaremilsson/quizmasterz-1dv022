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
