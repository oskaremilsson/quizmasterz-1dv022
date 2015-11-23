/**
 * Created by Oskar on 2015-11-23.
 */
"use strict";
var Question = require("./question");
var Ajax = require("./Ajax");

function Quiz(username) {
    this.username = username;
    //this.req = undefined;
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

        var config = {method: "POST",
            url: this.question.nextURL,
            data: {
                answer: "2"
            }};
        var responseFunction = this.response.bind(this);
        Ajax.req(config, responseFunction);
    }
    else {
        console.log(obj.answer);
    }
};

module.exports = Quiz;
