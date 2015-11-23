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
