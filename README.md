# Skint Money Tracker

Skint is a proof of concept money tracking application that lets you track 
balances over time across multiple accounts.

## Features

Skint has the following basic features:

* Tracking of balances across multiple accounts
* Scheduled & one-off payments
* Balance projection
* Graph of balances over time

## Why?

Skint is a replacement for a very clunky spreadsheet that I put together 
a long time ago.  I wanted a more extensible base that more advanced features
could be attached at a later date.

I still consider it a proof of concept because:

* It lacks any kind of authentication or login system
* The only currency it supports is GBP
* It needs some more comprehensive documentation

## Installation

Skint is a Node.js app written in CoffeeScript and using AngularJS/Bootstrap
on the frontend.  Data is stored in a mongoDB collection.  To install and 
start it you will need to:

Ensure mongoDB is started, and responding:

    # mongo --eval 'version()' 

Checkout the Skint repository:

    # git co https://github.com/heathtechnical/skint.git

Download and install dependencies:

    # cd skint
    # npm install
    # npm start
