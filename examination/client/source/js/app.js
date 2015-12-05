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

        //need to set globalStyle everytime since nostyle deletes that
        document.querySelector("#globalStyle").setAttribute("href", "stylesheet/globalStyle.css");

        localStorage.setItem("theme", select.value);

        //clean the description if needed
        if (descr.hasChildNodes()) {
            descr.removeChild(descr.firstChild);
        }

        //set the selected theme
        baseStyle.setAttribute("href", "stylesheet/" + select.value + ".css");
        loadingStyle.setAttribute("href", "stylesheet/" + select.value + "_loading.css");

        //add description
        if (select.value === "terminal") {
            descr.appendChild(document.createTextNode("Use keypad to choose when alternatives. OBS! Don't use mouseclick in this mode!"));
        }
        else if (select.value === "nostyle") {
            baseStyle.setAttribute("href", "");
            loadingStyle.setAttribute("href", "");

            //reset the href-tag on globalstyle to get true nostyle
            document.querySelector("#globalStyle").setAttribute("href", "");
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
        else if (select.value === "movie") {
            serverURL = "//oskaremilsson.se:4002";
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

    if (theme === "nostyle") {
        //reset the href-tag on globalstyle to get true nostyle
        document.querySelector("#globalStyle").setAttribute("href", "");
    }
}

var button = document.querySelector("#submit");
var form = document.querySelector("#qForm");

button.addEventListener("click", submit, true);
form.addEventListener("keypress", submit, true);

//set nickname-input focus at start
document.querySelector("input").focus();

addThemeSelector();
addServerSelector();
