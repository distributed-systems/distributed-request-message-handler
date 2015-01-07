!function() {

	var   Class 		= require('ee-class')
        , type          = require('ee-types')
        , fs            = require('fs')
        , path          = require('path')
        , EventEmitter  = require('ee-event-emitter')
		, log 			= require('ee-log');



	module.exports = new Class({
        inherits: EventEmitter


        , loaded: false


        /**
         * setup
         */
		, init: function(options) {
            if (!type.object(options)) throw new Error('Please provide the options object to the contructor!');
            if (!type.string(options.signature)) throw new Error('Please provide the signature string inside the object passed to the contructor!');

            // store 
            this.signature = options.signature;

            // storage for action handlers
            this.actions = {};

            // storage for vlidators loaded from the filesystem
            this.fsValidators = {};

            // cache queue
            this._queue = [];

            // we need to process the queue once everything is loaded
            this.once('load', function() {
                process.nextTick(function() {
                    this._queue.forEach(this._handleMessage.bind(this));
                }.bind(this));
            }.bind(this));

            // shall we load validators from the fs?
            if (options.path) this.loadValidators(options.path);
            else this.loaded = true;
		}





        /**
         * handle an incoming message
         */
        , handleMessage: function(message) {
            if (!this.loaded) this._queue.push(message);
            else this._handleMessage(message);
        }




        /** 
         * handle incoming messages
         */
        , _handleMessage: function(message) {
            var handler;

            if (!this.loaded) {}

            if (Object.hasOwnProperty.call(this.actions, message.action)) {
                // we got an actionhandler
                handler = this.actions[message.action];

                // validate contents
                handler.validator.validate(message.content).then(function() {
                    // the message is valid
                    handler.callback(message);
                }.bind(this)).catch(function(validationMessage) {
                    // invalid message
                    message.sendError(message.response.INVALID_CONTENT, this.createMessage('The content validation by the $ignature service failed: $$1', validationMessage));
                }.bind(this));
            }
            else {
                // the action was not registered
                message.sendError(message.response.INVALID_ACTION, this.createMessage('The action $$1 is not supported by the $ignature service!', message.action));
            }
        }





        /**
         * load a set of validators from a directory
         *
         * @param <string> absolute path
         */
        , loadValidators: function(validatorsDir) {
            fs.readdir(validatorsDir, function(err, files) {
                if (err) throw new Error('Failed to load validators from «'+validatorsDir+'»: '+err.message);
                else {
                    files = files.filter(function(fileName) {
                        return /\.js$/.test(fileName)
                    }.bind(this)).forEach(function(fileName) {
                        var   filePath = path.join(validatorsDir, fileName)
                            , validator;

                        try {
                            validator = require(filePath);
                        } catch (err) {
                            err.message = 'Failed to load validator «'+filePath+'» :'+err.message;
                            throw err;
                        }

                        this.fsValidators[fileName.replace('.js', '')] = validator;
                    }.bind(this));

                    this.loaded = true;
                    this.emit('load');
                }
            }.bind(this));
        }





        /**
         * create an error message
         */
        , createMessage: function(message) {
            var args = Array.prototype.slice.call(arguments, 1);

            args.forEach(function(arg, index) {
                message = message.replace('$$'+(index+1), '«'+arg+'»');
                message = message.replace('$'+(index+1), arg);
            });

            return message.replace(/\$ignature|\$signature/gi, this.signature);
        }





        /**
         * register a new action thta can be handled
         */
        , registerAction: function(actionName, validator, callback) {
            if (this.actions[actionName]) throw new Error('There is already is already an action handler for the action «'+actionName+'»!');

            var continueLoading = function() {
                 if (type.function(validator)) {
                    callback = validator;
                    if (this.fsValidators[actionName]) validator = this.fsValidators[actionName];
                    else validator = null;
                }


                this.actions[actionName] = {
                      actionName: actionName
                    , validator: validator || null
                    , callback: callback
                };
            }.bind(this);


            if (!this.loaded) this.once('load', continueLoading);
            else continueLoading();
        }
	});
}();
