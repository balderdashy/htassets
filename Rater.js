/**
 * Controller for rating system
 */
Rater = {

	USEGUESSINGALGORITHM: false,

	settleDelay: 550,	// # ms after last interaction to wait before postingrating

	maxRating: 5,
	minRating: -5,

	lastUserRatingTime: new Date(),	// in javascript date notation

	shelfLife: 120,		// in seconds


	pending: false	// whether an existing update is out

};(function () {


	/**
	 * Initialization event is called only once
	 */
	function init () {
		Log.log("Loading rater for the first time...");

		Rater.userNeedle = createUserNeedle();
		Rater.friendNeedle = createFriendNeedle();

		Rater.postIndex = 0;	// used to keep track of posts to server
		Rater.postAck = 0;

		// Calculate rater bounds
		// ( max/min amount to move needle each way )
		var margin = 67;
		Rater.bounds = 
			(Ext.get('RatingInterface').getWidth()/ 2 - margin)
				/ Rater.maxRating;
		
	};Rater.init = init;


	/**
	 * Run every time the rater is displayed
	 */
	function load () {
		Log.log("Loading rater...");

		if (typeof Rater.userNeedle == 'undefined') init();

		// User should see a fresh rating interface when
		// (re)entering a channel
		reset();

		
	};Rater.load = load;


	/**
	 * Rater buzz event is fired by Room
	 */
	function buzz () {

		// Update friend needle
		if (Rater.friendNeedle) {
			initiateFriendUpdate();
			
		}
		// If the user's rating has expired, reset their needle
		if (ratingExpired()) {
			reset();
		}

	};Rater.buzz = buzz;


	/**
	 * Return whether the user's rating has expired
	 */
	function ratingExpired() {
		return (new Date() - Rater.lastUserRatingTime > Rater.shelfLife*1000 );
	}; //@private


	/**
	 * User initiated a change of their individual rating
	 * if they've kept the needle still for a while
	 * (a while == Rater.settleDelay)
	 */
	function userRatingUpdate () {

		Rater.lastUserRatingTime = new Date();
		

		updateUserNeedle();

		if (Rater.USEGUESSINGALGORITHM)
			guessFriendNeedle(User.rating);

		// Push changes to server after a bit
		clearTimeout(Rater.settleTimer);
		Rater.settleTimer = setTimeout(function(){
			Log.log("User rating updated!");
			var currentIndex = Rater.postIndex;
			server.post(function(data){
				Rater.postAck = currentIndex+1;
			});		// Send rating to server

			Rater.postIndex++;

			// Uncomment to reset needle immediately after rating
			//User.rating = 0;
			//updateUserNeedle();

		},Rater.settleDelay);

	};Rater.userRatingUpdate = userRatingUpdate;




	/**
	 * Child object for communicating with the server
	 */
	var server = {};(function() {

		/**
		 * Send user rating to server
		 */
		function post (callback) {
			Log.log("Rater :: post()");
				Ext.Ajax.request( {
					url: '/Server/Ratings/post.php'
					,params: {
						 user_id:		User.get('user_id')
						,channel_id:	Room.channel.get('id')
						,data:			User.rating
					}
					,success: callback
					,failure: failure
				});
		};server.post = post;


		
		/**
		 * TODO: If a rating was not successfully posted, attempt retransmision
		 * up to some logical point
		 * Right now, retransmission is not even attempted.
		 */
		function failure (response) {
			Log.log("Failure!!!  Server said:");
			Log.log(response);
		}; // @private



		/**
		 * Listen to the server
		 * (since we're doing polling right now, this is a one-off thing)
		 */
		function listen (callback) {
			Log.log("Rater :: listen()");
//			if (!Rater.pending) {
//				Rater.pending = true;
				Ext.Ajax.request( {
					url: '/Server/Ratings/listen.php'
					,params: {
						 user_id:		User.get('user_id')
						,channel_id:	Room.channel.get('id')
					}
					,success: callback
					,failure: failure
				});
//			} else {
//				Log.log("Couldn't listen because a request is already pending.");
//				Rater.pending = false;
//			}

		};server.listen = listen;
		
	})();Rater.server = server;





	/**
	 * Reset rating interface
	 * That includes the user rating, needle position, etc.
	 */
	function reset () {

		Log.log("Initializing rating reset!");
		// Reset user rating & move user needle
		User.rating = 0;
		Friend.rating = 0;
		Rater.numSimulUsers = undefined;
		updateUserNeedle(0);

		Rater.lastUserRating = User.rating;
		Rater.lastUserRatingTime = new Date();

		Rater.pollTime = new Date().getTime();
		Rater.guessTime = 0;

		server.post(function() {
			
			// Update friend needle
			Friend.updateRating(function(response) {
//				Rater.pending = false;
				var r = Util.validateJSON(response),
					newRating = r.aggrRating,
					numSimulUsers = r.numSimulUsers;
				
				var oldRating = Friend.rating;
				if (!newRating == null)
					Friend.rating = 0;
				
				Friend.rating = newRating;
				updateFriendNeedle(oldRating,Friend.rating);

				// Save data for guesses
				Rater.currentAvg = newRating;
				Rater.numSimulUsers = numSimulUsers;
//				Log.log("numSimulUsers == " + numSimulUsers);
			});

		})

	}; // @private

	/**
	 * Update position of user needle after a user event
	 */
	function updateUserNeedle (duration) {
		duration = (duration) ? duration : 300;
		
		// Apply CSS transform properties
		Rater.userNeedle.applyStyles({
			"-webkit-transition-duration": duration+"ms"
		});
		
		var amount = User.rating * Rater.bounds;
		Rater.userNeedle.dom.style.webkitTransform =
			'translateX('+ amount +'px)';
	}; // @private


	/**
	 * (if the user has moved her needle in the mean time, don't move)
	 * (if the user hasn't received an ack for the most recent post, don't move)
	 */
	function initiateFriendUpdate() {

		Rater.pollTime = new Date().getTime();
//		Log.log("Starting server rating poll!");
		Friend.updateRating(function(response) {
//			Rater.pending = false;
			
//			if (!Rater.guessTime || !Rater.pollTime ||
//					(Rater.pollTime > Rater.guessTime &&
//					Rater.postAck == Rater.postIndex)) {
				var oldRating = Friend.rating;
				var r = Util.validateJSON(response),
					newRating = r.aggrRating,
					numSimulUsers = r.numSimulUsers;

				// Save data for guesses
				Rater.currentAvg = newRating;
				Rater.numSimulUsers = numSimulUsers;
//				Log.log("Friend.rating == " + newRating);
//				Log.log("numSimulUsers == " + numSimulUsers);

				updateFriendNeedle(oldRating, newRating);
//			} else {
////				Log.log("Bypassing server poll...");
//			}
		});
	}


	/**
	 * Estimate the next average, w/ some assumptions
	 * A' = (An+x)/(n+1)
	 * but we omit the +1 in the denominator
	 */
	function guessFriendNeedle (newUserRating) {
		Rater.guessTime = (new Date()).getTime();
		var oldRating = Friend.rating;
		Friend.rating = ( Rater.currentAvg*Rater.numSimulUsers + newUserRating - Rater.lastUserRating) / ( Rater.numSimulUsers )
		if (Rater.numSimulUsers == 1)
			Friend.rating = newUserRating;
		
//		Log.log("My guess:" + Friend.rating);
		
		moveFriendNeedle(oldRating,Friend.rating,true);
	}

	/**
	 * Update position of friend needle after a server update
	 * We only do this if the update is occuring since the user interacted
	 * and even then, we need to make sure the server has received all of our
	 * posted ratings first.
	 */
	function updateFriendNeedle (oldRating, newRating) {
		Friend.rating = newRating;
		moveFriendNeedle(oldRating,newRating,false);
		updateFriendCount();
	}; // @private

	/**
	 * Animate friend needle in appropriate direction
	 */
	function moveFriendNeedle(oldRating,newRating,isGuess) {
		var duration = ( Math.abs(oldRating - newRating) * 600);
		var amount = newRating * Rater.bounds;
		
		Rater.friendNeedle.applyStyles({
			"-webkit-transition-duration": duration+"ms"
		});
		Rater.friendNeedle.dom.style.webkitTransform =
			'translateX('+ amount +'px)';
	} // @private

	function updateFriendCount() {
		if (Rater.numSimulUsers)
			Rater.friendNeedle.setHTML(Rater.numSimulUsers);
	}



	function createUserNeedle () {
		Log.log("Creating user needle...");
		return createNeedle('userNeedle');
	}; // @private

	function createFriendNeedle () {
		Log.log("Creating friend needle...");
		return createNeedle('friendNeedle');
	}; // @private

	/**
	 * If drawNumUsers is true, display the number of concurrent users in the room
	 */
	function createNeedle (needleId) {

		var options = {
			tag: 'div',
			id: needleId
		};

		var needle = Ext.get('RatingInterface').createChild(options);
		var needleWidth = needle.getWidth();
		needle.setLeft((Ext.Element.getViewportWidth() - needleWidth) / 2);

		return needle;
	}; // @private

})();