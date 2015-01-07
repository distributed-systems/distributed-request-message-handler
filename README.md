# distributed-request-message-handler

description

## installation



## build status

[![Build Status](https://travis-ci.org/eventEmitter/distributed-request-message-handler.png?branch=master)](https://travis-ci.org/eventEmitter/distributed-request-message-handler)


## usage

    var MessageHandler = require('distributed-request-message-handler');
    
    var handler = new MessageHandler();


    handler.registerAction('execute_service', new Validator({
            
    }), function(message) {

    });


    handler.handleMessage(message);
