"use strict";

var Quiz = require("./Quiz");
var q;
var serverURL = "//oskaremilsson.se:4001";

function addThemeSelector() {
    //element to change the start-info
    var descr = document.querySelector("#start-info");

    //add listener for the theme chooser
    var select = document.querySelector("#theme-selector");
    select.addEventListener("change", function() {
        var baseStyle = document.querySelector("#baseStyle");
        var loadingStyle = document.querySelector("#loadingStyle");
        localStorage.setItem("theme", select.value);

        if (select.value === "playful") {
            baseStyle.setAttribute("href", "stylesheet/playful.css");
            loadingStyle.setAttribute("href", "stylesheet/playful_loading.css");

            if (descr.hasChildNodes()) {
                descr.removeChild(descr.firstChild);
            }
        }
        else if (select.value === "hacker") {
            baseStyle.setAttribute("href", "stylesheet/hacker.css");
            loadingStyle.setAttribute("href", "stylesheet/hacker_loading.css");

            if (descr.hasChildNodes()) {
                descr.removeChild(descr.firstChild);
            }
        }
        else if (select.value === "fancy") {
            baseStyle.setAttribute("href", "stylesheet/fancy.css");
            loadingStyle.setAttribute("href", "stylesheet/fancy_loading.css");

            if (descr.hasChildNodes()) {
                descr.removeChild(descr.firstChild);
            }
        }
        else if (select.value === "terminal") {
            baseStyle.setAttribute("href", "stylesheet/terminal.css");
            loadingStyle.setAttribute("href", "stylesheet/terminal_loading.css");

            descr.appendChild(document.createTextNode("Use keypad to choose when alternatives. OBS! Don't use mouseclick in this mode!"));
        }
        else if (select.value === "nostyle") {
            baseStyle.setAttribute("href", "stylesheet/nostyle.css");
            loadingStyle.setAttribute("href", "stylesheet/nostyle_loading.css");

            if (descr.hasChildNodes()) {
                descr.removeChild(descr.firstChild);
            }
        }
        else if (select.value === "1me321") {
            baseStyle.setAttribute("href", "stylesheet/1me321.css");
            loadingStyle.setAttribute("href", "stylesheet/1me321.css");

            if (descr.hasChildNodes()) {
                descr.removeChild(descr.firstChild);
            }
        }

        //set nickname-input focus
        document.querySelector("input").focus();
    });
}

function addServerSelector() {
    //add listener for the theme chooser
    var select = document.querySelector("#server-selector");
    select.addEventListener("change", function() {
        if (select.value === "random") {
            serverURL = "//oskaremilsson.se:4000";
        }
        else if (select.value === "music") {
            serverURL = "//oskaremilsson.se:4001";
        }
        else {
            serverURL = "//vhost3.lnu.se:20080";
        }
    });
}

/**
 * Function to handle the submit for nickname and start the quiz
 * @param event, the eventhandler from the listener
 */
function submit(event) {
    if (event.which === 13 || event.keyCode === 13 || event.type === "click") {
        //disable forms action so page wont reload with enter
        event.preventDefault();

        var input = document.querySelector("#nickname").value;

        //if nickname written, start quiz
        if (input.length > 1) {
            q = new Quiz(input, serverURL);
        }
    }
}

if (localStorage.getItem("theme")) {
    var theme = localStorage.getItem("theme");
    document.querySelector("#baseStyle").setAttribute("href", "stylesheet/" + theme + ".css");
    document.querySelector("#loadingStyle").setAttribute("href", "stylesheet/" + theme + "_loading.css");
}

var button = document.querySelector("#submit");
var form = document.querySelector("#qForm");

button.addEventListener("click", submit, true);
form.addEventListener("keypress", submit, true);

//set nickname-input focus at start
document.querySelector("input").focus();

addThemeSelector();
addServerSelector();
