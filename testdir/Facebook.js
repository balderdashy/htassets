/**
 *
 */
Facebook = {
	
}; (function() {


	///////////////////////////////////////////////
	//					OAUTH
	///////////////////////////////////////////////
	function connect (returnTo) {
		// Prevent interaction across entire app
		Control.grab();

		// Remember message and channel
		var message = encodeURIComponent(
						Application.view.query('#Compose textareafield')[0].getValue()),
			channelID = encodeURIComponent(Room.channel.get('id'));

		// Redirect
		window.location = '../Server/facebook/register.php?'+
								'returnTo='+returnTo+
								'&message='+message+
								'&channelID='+channelID;
							
	}; Facebook.connect = connect;


	/**
	 * Post a message to Facebook on a user's behalf
	 */
	function post (msg,callback) {
		Ext.Ajax.request({
			url: '../Server/facebook/post.php',
			method: 'POST',
			params: {
				message: msg,
				hashtag: Util.hashtagSafe(Room.channel.get('showName')),
				channelID: Room.channel.get('id')
			},
			success: function(response) {
				var json = Util.validateJSON(response);

				if (json.status == "TOO_LONG") {
					// TODO: Indicate to user that their tweet is too long
					// Should never happen because of client-side validation.
					alert("Post too long!");
					this.failure(response);
				} else if (json.ok == true){
					// Tweet OK
					Log.log("Facebook post succesful!");
					if (callback) callback();
				} else
					failure(response);
			},
			failure: function(response) {
				// TODO: Indicate to user that their post won't appear
				// on this social network because of a network error.
				Log.log("SERVER ERROR:");
				Log.log(response);
			}
		});
	}; Facebook.post = post;


	/**
	 * Returns whether this user is connected to Facebook
	 */
	function connected () {
		var indicator = User.localStore.first().get('facebook_screen_name');
		return (
			typeof(indicator) != "undefined"
			&&	indicator != ""
		);
	}; Facebook.connected = connected;


	/**
	 *
	 */
	function failure (response) {
		Log.log("Facebook post failure!");
		Log.log(response);
	}; // @private

})();