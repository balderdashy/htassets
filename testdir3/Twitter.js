/**
 *
 */
Twitter = {
	baseURL: 'http://search.twitter.com/search.json',
	pending: false

	,since_id: 0		// Twitter since_id
};(function() {


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
		window.location = '../Server/twitter/register.php?'+
								'returnTo='+returnTo+
								'&message='+message+
								'&channelID='+channelID;

	};Twitter.connect = connect;


	/**
	 * Post a message to twitter on a user's behalf
	 */
	function post (msg,callback) {

		Ext.Ajax.request({
			url: '../Server/twitter/post.php',
			method: 'POST',
			params: {
				message: msg,
				hashtag: Util.hashtagSafe(Room.channel.get('showName')),
				channelID: Room.channel.get('id')
			},
			success: function(response) {
				var json = Util.validateJSON(response);
				
				if (json.status == "TOO_LONG") {
					// Indicate to user that their tweet is too long
					// Should never happen because of client-side validation.
					alert("Tweet too long!");
					this.failure(response);
				} else if (json.status == "OK"){
					// Tweet OK
					Log.log("Tweet succesful!");
					if (callback) callback();
				} else
					this.failure(response);
			},
			failure: function(response) {
				// TODO: Indicate to user that their post won't appear
				// on this social network because of a network error.
				Log.log("SERVER ERROR:");
				Log.log(response);
			}
		});

	};Twitter.post = post;


	/**
	 * Invite a Twitter user to Blinktop
	 */
	function invite(msg,callback) {
		post(msg,callback);
	};Twitter.invite = invite;


	/**
	 * Returns whether user is connected to Twitter
	 */
	function connected () {
		var indicator = User.localStore.first().get('twitter_screen_name');
		return (
			typeof(indicator) != "undefined"
			&&	indicator != ""
		);
	};Twitter.connected = connected;












	///////////////////////////////////////////////
	//  SEARCH API
	///////////////////////////////////////////////

	/**
	 * Fetch tweets from Twitter and update local store
	 */
	function fetch (callback) {

//		if (!Twitter.pending) {
			Log.log("Looking for tweets...");
			var q = buildQuery();
			window.onerror = function() {
				console.warn("Onerror fired!  Twitter probably sent us some garbage-- either a bad image URL or bad tweets.");
				Ext.util.JSONP.callback({});
			}
//			Twitter.pending = true;
			try {
				Ext.util.JSONP.request({
					url: Twitter.baseURL,
					callbackKey: 'callback',
					params: q,
					callback: function(payload){
//						Twitter.pending = false;
						processResults(payload,callback);
					},
					exception: function() {
						alert("Exception event in JSONP request.");
					},
					failure: function() {
						alert("Failure event in JSONP request.");
					}
				});
			} catch (e) {
				Log.warn("Failed to parse Twitter's JSON response.");
				Log.warn(e);
			}
//		} else Log.log("Couldn't fetch tweets because a fetch is still pending.");
		
	}Twitter.fetch = fetch;

	/**
	 * Fetch any new tweets from Twitter and update local store
	 */
	function refresh (callback) {
		fetch(callback);
	}Twitter.refresh = refresh;





	/**
	 * Get meta-information about twitter buffer state
	 * and process tweets so that they look like the standard post data type
	 * Then file them in the chatter stream appropriately.
	 */
	function processResults(payload,callback) {
		// If user isn't on the correct page anymore
		// this is a design logic error
		if (Application.view.getActiveItem().id != "Room") {
			Log.log('Trying to add tweets from the wrong page!');
			if (callback) callback();
			return;
		}

		////////////////////////////////////////////////////////
		// Logging to deal with broken tweets bug:
		////////////////////////////////////////////////////////
		if (payload) {
			if (payload.results)
				Log.log("Twitter returned " + payload.results.length + " results.");
			else {
				Log.log("Twitter returned something, but no results:");
				Log.log(payload);
			}
		} else
			Log.warn("Twitter returned NOTHING!!!!" );
		////////////////////////////////////////////////////////

		if (payload && payload.results) {
			
			// Get max_id as next since_id so we know when to update from
			Twitter.since_id = payload.max_id_str;

			// Convert tweets into standard post format
			payload = payload.results;
			ln = (payload.length <= Room.maxPosts)
					? payload.length
					: Room.maxPosts;
		
			for (var i = 0; i < ln; i++) {
				addTweet(payload[i]);
			}

			// Finally execute callback passed down from Room.fetchChatter
			if (callback) callback();
		} else {
			Log.log("Twitter responded in an unusal way.  User may have been rate limited?  Or twitter is sending us garbage.");
			if (callback) callback();
		}
	}Twitter.processResults = processResults;



	/**
	 * Convert a tweet object from twitter
	 * into a usable post object,
	 * then add it to the store
	 * fixing stuff along the way like:
			//		- broken image links
			//		- empty posts
			//		- spammy posts
			//		- extremely inappropriate posts
	 */
	function addTweet(tweet) {

		// Fix dead tweets (or tweets from this user)
		if (tweet.from_user && tweet.text &&
			tweet.from_user.toLowerCase() != User.get('twitter_screen_name')) {

			// Fix Twitter image 404
			if (tweet.profile_image_url == "http://static.twitter.com/images/default_profile_normal.png") {
				tweet.profile_image_url = "http://a0.twimg.com/sticky/default_profile_images/default_profile_3_normal.png";
			}

			// Now convert tweet
			// And insert it in the chatter store at a priority level
			if ( -1 == Room.chatter.find('unique',tweet.id)) {

				var createdAt = Date.parse(tweet.created_at) / 1000;

				var post = {};
				post.text = tweet.text;
				post.ago = Util.agoFormat(Room.lastUpdated - createdAt);
				post.age = Room.lastUpdated - createdAt;
				post.created_at = createdAt;
				post.fromUser = tweet.from_user;
				post.profileImageURL = tweet.profile_image_url;
				post.type = Util.postType.TWITTER;
				post.unique = tweet.id_str;
				
				Room.addPost(post);
			}

		}
	} // @private



	/**
	 * Build twitter query
	 */
	function buildQuery () {

		//var query = "#"+Util.hashtagSafe(Room.channel.get('showName10'))+' OR '+"#"+Util.hashtagSafe(Room.channel.get('showName'));
		var query = "#"+Util.hashtagSafe(Room.channel.get('showName'));
		
		//Log.log('Since_id being used is  ' + Twitter.since_id);
		//Log.log('Twitter search query is: ' + query);
		
		return {
			q: query,
			rpp: 15,
			lang: 'en',
			result_type: "recent",
			since_id: Twitter.since_id
			//,cache_buster: (Math.random()*100)
		};
	} // @private


})();