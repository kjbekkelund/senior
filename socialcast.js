var async = require('async');
var cachedRequest = require('./cachedRequest');

var socialcastUrl = process.env.SOCIALCAST_URL;
var socialcastUser = process.env.SOCIALCAST_USER;
var socialcastPassword = process.env.SOCIALCAST_PASS;

var socialcastAuth = {
    user: socialcastUser,
    pass: socialcastPassword
};

function socialcastParams(url) {
    return {
        url: socialcastUrl + url,
        json: true,
        auth: socialcastAuth
    };
}

function messages(callback) {
    cachedRequest(socialcastParams('/api/messages'), function(error, response, body) {
        if (error) {
            return callback(error);
        }

        var reqs = body.map(function(message){
            return function(callback) {
                addLikesToMessage(message, function(likes) {
                    callback(null, likes);
                });
            };
        });

        async.parallel(reqs, function(){
            socialcastMessages = body;
            callback(null, socialcastMessages);
        });
    });
}

function message(id, callback) {
	cachedRequest(socialcastParams('/api/messages/' + id), function(error, response, body) {
        if (error) return callback(error);
        addLikesToMessage(body, function(){
            if (error) return callback(error);
            callback(null, body);
        });
    });
}


function addLikesToMessage(message, callback){
    cachedRequest(socialcastParams('/api/messages/' +  message.id + '/likes'), function(error, response, likes) {
        if (error) {
            return callback(error);
        }
        message.likes = likes;
        callback(null, likes);
    });
}

module.exports = {
	messages: messages,
	message: message
};
