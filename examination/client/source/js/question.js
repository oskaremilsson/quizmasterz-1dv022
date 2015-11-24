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
    if(this.alt) {
        console.log("has alternatives");
        this.printAltQuestion();
    }
    else {
        this.printQuestion();
    }
};

Question.prototype.clearDiv = function(div) {
    while(div.hasChildNodes()) {
        div.removeChild(div.lastChild);
    }
};

Question.prototype.printAltQuestion = function() {
    var template = document.querySelector("#template-question-alt").content.cloneNode(true);
    template.querySelector(".qHead").appendChild(document.createTextNode(this.question));
    var inputFrag = this.getAltFrag();
    console.log(template.querySelector("#submit"));
    template.querySelector("#qForm").insertBefore(inputFrag, template.querySelector("#submit"));
    document.querySelector("#content").appendChild(template);
};

Question.prototype.getAltFrag = function() {
    var inputFrag = document.createDocumentFragment();
    var input;
    var p;

    console.log(this.alt);
    for(var alt in this.alt) {
        if(this.alt.hasOwnProperty(alt)) {
            p = document.createElement("p");
            input = document.createElement("input");
            input.setAttribute("type", "radio");
            input.setAttribute("name", "alternative");
            input.setAttribute("value", alt);
            p.appendChild(input);
            p.appendChild(document.createTextNode(this.alt[alt]));
            inputFrag.appendChild(p);
        }

    }
    return inputFrag;
};

Question.prototype.printQuestion = function() {
    var template = document.querySelector("#template-question").content.cloneNode(true);
    template.querySelector(".qHead").appendChild(document.createTextNode(this.question));
    document.querySelector("#content").appendChild(template);
};

module.exports = Question;
