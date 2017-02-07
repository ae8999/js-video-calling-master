$("document").ready(function() {
    sinchClient = new SinchClient({
        applicationKey: "428b9043-a2bc-4334-8f97-6377085b3f36",
        capabilities: {calling: true, video: true, messaging: true},
        supportActiveConnection: true,
        onLogMessage: function(message) {
            console.log(message.message);
        },
    });
    
    var clearError = function() {
	$('div.error').text("");
    }
    var global_username = '';
    var global_recipient = '';
    var callClient;
    var call;

    $("#login").on("click", function (event) {
        event.preventDefault();
        
        var signUpObj = {};
        signUpObj.username = $("input#username").val();
        signUpObj.password = $("input#password").val();
        global_username = $('input#username').val();
        sinchClient.start(signUpObj, afterStartSinchClient());          
    });

    $("#signup").on("click", function (event) {
        event.preventDefault();
        
        var signUpObj = {};
        signUpObj.username = $("input#username").val();
        signUpObj.password = $("input#password").val();
        global_username = $('input#username').val();
        sinchClient.newUser(signUpObj, function(ticket) {
            sinchClient.start(ticket, afterStartSinchClient());
        });
    });

    function afterStartSinchClient() {
        // hide auth form
        $("form#authForm").css("display", "none");
        // show logged-in view
        $("div#sinch").css("display", "inline");
        // start listening for incoming calls
        sinchClient.startActiveConnection();
        // define call client (to handle incoming/outgoing calls)
        callClient = sinchClient.getCallClient();
        //initialize media streams, asks for microphone & video permission
        callClient.initStream();
        //what to do when there is an incoming call
        callClient.addEventListener(incomingCallListener);
    }

    $("#call").on("click", function (event) {
        event.preventDefault();
    	if (!call) {
            usernameToCall = $("input#usernameToCall").val()
            $("div#status").append("<div>Calling " + usernameToCall + "</div>");
        	call = callClient.callUser(usernameToCall);
        	call.addEventListener(callListeners);
    	}   
    });

    $("#answer").click(function(event) {
        event.preventDefault();
        if (call) {
            $("div#status").append("<div>You answered the call</div>");
        	call.answer();
        }
    });

    $("#hangup").click(function(event) {
        event.preventDefault();
        if (call) {
            $("div#status").append("<div>You hung up the call</div>");
        	call.hangup();
        	call = null
        }
    });
    
    $("#chat").click(function(event) {
        event.preventDefault();
        if (call) {
            $("div#status").append("<div>You started chat with</div>" + usernameToCall);
            $('div#chat').show();
	    $('div#chatArea').show();
            global_recipient = $('input#usernameToCall').val();
        }
    });
    
var messageClient = sinchClient.getMessageClient();

$('button#sendMsg').on('click', function(event) {
	event.preventDefault();
	clearError();

	var text = $('input#message').val();
    $('input#message').val('');
	var sinchMessage = messageClient.newMessage(global_recipient, text);
	messageClient.send(sinchMessage).fail(handleError);
});

var eventListener = {
	onIncomingMessage: function(message) {
        if (message.senderId == global_username) {
            $('div#chatArea').append('<div>' + message.textBody + '</div>');
        } else {
            $('div#chatArea').append('<div style="color:red;">' + message.textBody + '</div>');
        }		
	}
}

messageClient.addEventListener(eventListener);
    
    
    
    var incomingCallListener = {
        onIncomingCall: function(incomingCall) {
            $("div#status").append("<div>Incoming Call</div>");
            call = incomingCall;
            call.addEventListener(callListeners);
        }
    }

    var callListeners = {
        onCallProgressing: function(call) {
            $("div#status").append("<div>Ringing</div>");
        },
        onCallEstablished: function(call) {
            $("div#status").append("<div>Call established</div>");
            $("video#outgoing").attr("src", call.outgoingStreamURL);
            $("video#incoming").attr("src", call.incomingStreamURL);
        },
        onCallEnded: function(call) {
            $("div#status").append("<div>Call ended</div>");
            $("video#outgoing").attr("src", "");
            $("video#incoming").attr("src", "");
            call = null;
        }
    }        
});
