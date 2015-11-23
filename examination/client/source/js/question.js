/**
 * Created by Oskar on 2015-11-23.
 */
"use strict";
function Question(obj) {
    this.id = obj.id;
    this.question = obj.question;
    this.nextURL = obj.nextURL;
    //this.alt = obj.alternative;
}

Question.prototype.print = function() {
    document.querySelector("body").appendChild(document.createTextNode(this.question));
};

module.exports = Question;
