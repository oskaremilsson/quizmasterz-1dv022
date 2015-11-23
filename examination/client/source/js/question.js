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
