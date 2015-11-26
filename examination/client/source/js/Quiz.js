/**
 * Created by Oskar on 2015-11-23.
 */
"use strict";
var Question = require("./Question");
var Ajax = require("./Ajax");
var Timer = require("./Timer");
var Highscore = require("./Highscore");

/**
 * Constructor function for the Quiz
 * @param nickname{string}, nickname to use for highscore
 * @constructor
 */
function Quiz(nickname) {
    console.log(nickname);
    this.nickname = nickname;
    this.timer = undefined;
    this.question = undefined;
    this.nextURL = "http://vhost3.lnu.se:20080/question/1";
    this.button = undefined;
    this.form = undefined;
    this.totalTime = 0;

    //request the first question
    this.getQuestion();
}

/**
 * Function to send a request for a new question
 */
Quiz.prototype.getQuestion = function () {
    console.log("asking..");
    var url = this.nextURL;
    console.log(url);
    var config = {method: "GET", url: url};
    var responseFunction = this.response.bind(this);

    Ajax.req(config, responseFunction);
};

/**
 * Function to handle the response, uses as argument "callback" in a request
 * @param error{Number}, errorcode, null if no error
 * @param response{string}, response string to parse JSON from
 */
Quiz.prototype.response = function (error, response) {
    console.log("response...");

    //handle errors (404 means no more questions)
    if(error) {
        //present the gameover-view to user
        this.gameOver();
    }

    //handle the response string
    if(response) {
        console.log(response);
        //pasre to JSON
        var obj = JSON.parse(response);
        this.nextURL = obj.nextURL;
        console.log(this.nextURL);

        //statement to call the rightful function on the response
        if(obj.question) {
            this.responseQuestion(obj);
        }
        else {
            if(this.nextURL || obj.message === "Correct answer!") {
                this.responseAnswer(obj);
            }
        }
    }

};

/**
 * Function to handle if response is a question
 * @param obj{Object}, object that holds the question
 */
Quiz.prototype.responseQuestion = function(obj) {
    var content = document.querySelector("#content");
    this.clearDiv(content);

    //create a new question from object
    this.question = new Question(obj);
    this.question.print();

    //create a new timer for question
    this.timer = new Timer(this, document.querySelector("#timer h1"), 20);
    this.timer.start();

    //Add linsteners for the form
    console.log("Adding listener..");
    this.addListener();
};

/**
 * Function to handle if response is an answer
 * @param obj{Object}, object that holds the answer
 */
Quiz.prototype.responseAnswer = function(obj) {
    var content = document.querySelector("#content");
    this.clearDiv(content);

    //Handle the template for answer
    var template = document.querySelector("#template-answer").content.cloneNode(true);
    var text = document.createTextNode(obj.message);
    template.querySelector("p").appendChild(text);

    content.appendChild(template);

    if(this.nextURL) {
        //Request a new question, but with a delay
        var newQuestion = this.getQuestion.bind(this);
        setTimeout(newQuestion, 1000);
    }
    else {
        this.gameCompleted();
    }
};

/**
 * Function to add the listener for submit
 */
Quiz.prototype.addListener = function() {
    this.button = document.querySelector("#submit");
    this.form = document.querySelector("#qForm");

    this.button.addEventListener("click",this.submit.bind(this), true);
    this.form.addEventListener("keypress", this.submit.bind(this), true);
};

/**
 * Function to handle when submit is triggered
 */
Quiz.prototype.submit = function(event) {
    //If the trigger is enter or click do the submit
    if (event.which === 13 || event.keyCode === 13 || event.type === "click") {
        console.log("got enter");
        //prevent the form to reload page on enter
        event.preventDefault();

        console.log("submitting...");
        this.totalTime += this.timer.stop();
        console.log("time:" + this.totalTime);
        var input;

        //remove the listeners to prevent double-submit
        this.button.removeEventListener("click", this.submit.bind(this));
        this.form.removeEventListener("keypress", this.submit.bind(this));

        //save input depending on the type of question
        if (document.querySelector("#answer")) {
            //get the form input
            input = document.querySelector("#answer").value;
        }
        else {
            //get the checked readiobutton
            input = document.querySelector("input[name='alternative']:checked").value;
        }

        //set the config to be sent to server and send a request
        var config = {
            method: "POST",
            url: this.nextURL,
            data: {
                answer: input
            }
        };
        var responseFunction = this.response.bind(this);
        Ajax.req(config, responseFunction);
    }
};

/**
 * Function to handle the gameOver-view and present it to user
 */
Quiz.prototype.gameOver = function() {
    //create a highscore module to show it to the user
    var hs = new Highscore(this.nickname);
    console.log("GAME OVER!!!");
    this.clearDiv(document.querySelector("#content"));

    //get the game over template
    var template = document.querySelector("#template-gameOver").content.cloneNode(true);

    //if the highscore has entries add them to the template
    if(hs.highscore.length > 0 ){
        template.querySelector("h2").appendChild(document.createTextNode("Highscore"));
        var hsFrag = hs.createHighscoreFragment();
        template.querySelector("table").appendChild(hsFrag);
    }

    //add the template to content
    document.querySelector("#content").appendChild(template);
};

/**
 * Function to handle the game completed-view and present it to the user
 */
Quiz.prototype.gameCompleted = function() {
    //create new highscore module to handle it
    var hs = new Highscore(this.nickname, this.totalTime.toFixed(3));
    var template = document.querySelector("#template-quizCompleted").content.cloneNode(true);

    //if the score makes it to the highscore, change temple to new highscore
    if(hs.addToList()) {
        console.log("you made it to the list");
        template = document.querySelector("#template-newHighscore").content.cloneNode(true);
    }

    //show the highscore if the highscore has entries
    if(hs.highscore.length > 0) {
        var h1 = template.querySelector(".time");
        var text = document.createTextNode(this.totalTime.toFixed(3));
        h1.appendChild(text);

        template.querySelector(".hs-title").appendChild(document.createTextNode("Highscore"));
        var hsFrag = hs.createHighscoreFragment();
        template.querySelector("table").appendChild(hsFrag);
    }

    this.clearDiv(document.querySelector("#content"));
    document.querySelector("#content").appendChild(template);
};

/**
 * Function to clear a specific div of childs
 * @param div{Object}, the divelement to clear
 */
Quiz.prototype.clearDiv = function(div) {
    while(div.hasChildNodes()) {
        div.removeChild(div.lastChild);
    }
};

module.exports = Quiz;
