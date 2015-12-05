# Oskar Emilssons Examination-2

## Additional Features
* Global highscore
* Quiz select (server select)
* Highlight if new highscore 
* Theme select

## Global Highscore
The global highscore uses mySQL server via some simple php-script. 

mySQL table structure is really simple and contains:
| server | nickname | score | date |

The read-script only returns the lines from which server is being asked for. 

## Quiz select
There is a drop-down selector that allows you to change the quiz server from a given list. Named after what types of question there is.

My own quiz-servers run on an cloud-server 24/7.

## Highlight if new highscore
This was the main reason to the date-field in highscore. The app adds an highlight class to the correct line when building fragment.

## Theme select
There is some various themes to choose from, and the choice gets saved in local storage so the change is there next time you visit the site!

### Terminal theme
Somewhat different from the other and only works if you only use the keyboard (keypad and enter) to navigate.
This is since the radio buttons are'nt visible you can't re-gain focus.