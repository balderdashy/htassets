/**
 *
 */
Room = {
	// Whether or not this room needs to be refreshed onactivate
	staleFlag: true

}; (function() {

	// Conditions and callback
	Room.$ = {};
	Room.$.ready	= new ConditionVariable(function() {Log.log("Room ready.");});
	Room.$.chatterCollected = new ConditionVariable(chatterReady);

	// The remote source of the blinktop chatter
	Room.blinktopPostURL = "/Server/Posts/fetch.php";


	// Will house the Buffer which is actually displayed
	// by combining and prioritizing between the other stores
	Room.chatter = Util.buildStore();


	// Maximum # of posts to keep on the screen at any one time
	// (for performance reasons)
	Room.maxPosts = 15;

	// secs to wait before refreshing chatter
	Room.shelf_life = 5;




	/*
	 * Triggered when this Room is activated
	 * But only if it is stale (e.g. the channel changed)
	 * Begin loading, update chatter
	 */
	function load () {
		if (Room.staleFlag) {
			Room.staleFlag = false;
			Room.$.ready.reset();

			var view = Application.view.query('#Room')[0];

			// Move scroll position to top
			var scroller = view.getComponent('ChatterList').scroller;
			if (scroller) scroller.scrollTo({x:0,y:0});

			// Wipe room chatter
			Room.chatter = Util.buildStore();
			view.getComponent('ChatterList').bindStore(Room.chatter);

			// Update Room configuration (title bar) based on Room.channel object
			view.getDockedItems()[0].setTitle(Room.channel.get('channelCallSign'));

			// Reset Twitter since_id
			Twitter.since_id = 0;

			// Reload chatter
			Room.$.ready.require('ChatterFetched');
			fetchChatter();


			Room.lastUpdated = Util.timestamp();

			// Reload rater
			Rater.load();
		}

	}; Room.load = load;


	/**
	 * Buzz event is fired when the Timer goes off on this page
	 */
	function buzz () {
		// Update Blinktop chatter and tweets
		// TODO: put this in a server-push listener instead
		if (Util.timestamp() - Room.lastUpdated > Room.shelf_life ) {
			refreshChatter();
		}
		
		// TODO: Calculate average Blinktop throughput over the last N buzz events

		// TODO: If not enough fresh content from Blinktop, update Tweets

		// Update aggregate rating
		// TODO: put this in a server-push listener instead
		Rater.buzz();

		updatePostAge();
		
	}; Room.buzz = buzz;



	function updatePostAge () {
		Log.log("updatePostAge()");

		// If user isn't scrolling (aka inactive)
		if (Application.view.query('#ChatterList')[0].scroller.isDragging()) {
			Log.log("Trying to refresh chatter timestamps while user is scrolling.  Returning...");
			return;
		}

		// Update "ago" timestamps on chatter
		var list = App.view.query('#ChatterList')[0];
		Room.chatter.each(function(obj,index) {
			var age = Room.lastUpdated - obj.data.created_at,
				ago = Util.agoFormat(age);
			if (ago != obj.data.ago) {
				// Update store and refresh listview
				obj.data.ago = ago;
				list.refreshNode(index);
			}

		});
	}; // @private





	/**
	 * Triggered when the page is left
	 * Cancel all polling
	 */
	function unload () {
	}; Room.unload = unload;






	/**
	 * Refresh all chatter including blinktop chats and tweets
	 * For tweets, manage a since_id.
	 */
	function refreshChatter () {

		// Only refresh chatter if user is not scrolling
		var scroller = Application.view.query('#Room')[0].getComponent('ChatterList').scroller;
		if (scroller && scroller.isDragging()) {
			Log.log("Trying to refresh chatter while user is scrolling.  Returning...");
			return;
		}

		// Set up result expectations
		Room.$.chatterCollected.reset();
		Room.$.chatterCollected.require('Twitter');
		Room.$.chatterCollected.require('Blinktop');

		refreshBlinktopChats();
		Twitter.refresh(Room.$.chatterCollected.satisfier('Twitter'));
		
	}; Room.refreshChatter = refreshChatter;




	function refreshBlinktopChats () {
//		Log.log("refreshBlinktopChats()");
		Ext.Ajax.request({
			url: Room.blinktopPostURL,
			params: {
				user_id: User.get('user_id'),
				channel_id: Room.channel.get('id'),
				since: Room.lastUpdated
			},
			success: function(response) {
				
				processChats(response,Room.$.chatterCollected.satisfier('Blinktop'));
			},
			failure: function(response) {
				Log.log("Failed to load chats.");
				Log.log(response);
			}
		});
	}; // @private



	/**
	 * Aggregate and prioritize chatter from the various servers
	 * and update local store
	 */
	function fetchChatter () {
		Log.log("Fetching chatter...");

		// Set up result expectations
		Room.$.chatterCollected.reset();
		Room.$.chatterCollected.require('Twitter');
		Room.$.chatterCollected.require('Blinktop');

		// Go get chatter
		Twitter.fetch(Room.$.chatterCollected.satisfier('Twitter'));
		fetchBlinktopChats(Room.$.chatterCollected.satisfier('Blinktop'));

	}; Room.fetchChatter = fetchChatter;




	/**
	 * Fetch chats from Blinktop and update local store
	 */
	function fetchBlinktopChats (callback) {
//		Log.log("fetchBlinktopChats()");
		Ext.Ajax.request({
			url: Room.blinktopPostURL,
			params: {
				user_id: User.get('user_id'),
				channel_id: Room.channel.get('id')
			},
			success: function(response) {
				processChats(response,callback);
			},
			failure: callback
		});
	}; // @private


	/**
	 * Get chats and file them in the stream
	 */
	function processChats(payload,callback) {

//		Log.log("processChats()");

		// Interpret server response and add chats to chatter
		var chats = Util.validateJSON(payload);
		Room.lastUpdated = chats.lastUpdated;
		Room.clientTimeWhenLastUpdated = Util.timestamp();
		chats = chats.chats;

		var ln = (chats.length <= Room.maxPosts)
				? chats.length
				: Room.maxPosts;
		for (var i=0;i<ln;i++) {
			var chat = chats[i];

			chat.ago = Util.agoFormat(chat.age);
			chat.type = Util.postType.BLINKTOP;
			addPost(chat);
		}

		if (callback) callback();
	};Room.processChats = processChats;


	/**
	 * Prepend a new post
	 * @param chat The chat object to prepend
	 */
	function addPost(chat) {
		// Only add chat if it doesn't already exist
		if ( -1 == Room.chatter.find('unique',chat.unique)) {
			Room.chatter.add(chat);
		} else Log.log("Trying to add chat which already exists!");
	}; Room.addPost = addPost;


	/**
	 * Remove the oldest post
	 */
	function removePost () {
		var num = Room.chatter.getCount();
		Room.chatter.removeAt(num-1);
	}; // @private


	/**
	 * Called when the chatter is all ready
	 * Sort tweets and chats
	 */
	function chatterReady() {

		// Sort everything by post age
		Room.chatter.sort('created_at','DESC');
		Room.$.ready.satisfy('ChatterFetched');

		// If there are too many posts, get rid of the oldest ones
		while (Room.chatter.getCount() > Room.maxPosts)
			removePost();
	}; // @private




	/**
	 * Press button to compose a new chat
	 * Transition to chat area
	 */
	function goCompose () {

		// TODO: Cancel any pending requests

		// Transition to Compose
		Application.view.setActiveItem('Compose',Util.Animation.slideUp);
		
	}; Room.goCompose = goCompose;




	/**
	 * Press button to go back to the channel listings
	 */
	function goBack() {
		Application.view.setActiveItem('Lobby',Util.Animation.slideRight);

		// TODO: Cancel any pending requests

		// Capture analytics
		Analytics.backToLobbyClicked(User.get('user_id'), Room.channel.get('id'));
		
	}; Room.goBack = goBack;




	/**
	 * Press button to rate up
	 */
	function goRateUp() {
		Log.log("Rate up.");
		Rater.lastUserRating = User.rating;

		if ( User.rating < Rater.maxRating )
			User.rating +=1;

		Rater.userRatingUpdate();

	}; Room.goRateUp = goRateUp;




	/**
	 * Press button to rate down
	 */
	function goRateDown() {
		Log.log("Rate down.");
		Rater.lastUserRating = User.rating;

		if ( User.rating > Rater.minRating )
			User.rating -=1;

		Rater.userRatingUpdate();

	}; Room.goRateDown = goRateDown;



	/**
	 * User taps a post/tweet
	 */
	function goProfile (dataview, index, element, eventObject) {

		// Update Profile's node information
		var node = Room.chatter.getAt(index);
		if (node != Profile.node) {
			Profile.staleFlag = true;
			Profile.node = node;
		}


		// Transition to profile
		Application.view.setActiveItem('Profile',Util.Animation.slideDown);
		
	}; Room.goProfile = goProfile;




	/**
	 * Triggered when user begins a scrolling event
	 */
	function onScrollStart() {
		// TODO: cancel anything preventing seemless scrolling on scrollstart
		// Ummm.. Not totally sure what to do here yet.

		Log.log("SCROLL START");
	}; // @private

	function onScrollEnd() {
		// TODO: cancel anything preventing seemless scrolling on scrollstart
		// Ummm.. Not totally sure what to do here yet.

		Log.log("SCROLL END");
	}; // @private




	// View Markup
	Room.chatterTpl =
	//"<span class='postUser'>{fromUser}</span>"+
	"<img class='chatterImg' width='48' height='48' src='{profileImageURL}'/>"
	+"<span class='postAge' age='{age}'>{ago}</span>"
	+"<span class='postBody'>{text}</span>"
	//+"{type}"
	;

	Room.viewFactory = {
		title: 'Room',
		id: "Room",
		layout: {
			type: "vbox",
			align: "stretch"
		},
		listeners: {
			activate: load
		},
		items: [
			// Rating interface
			{
				xtype: 'panel',
				id: 'RatingInterface',
				cls: 'RatingInterface',
				flex: 1,
				layout: {
					type: "hbox"
				},
				defaults: {
					xtype: 'button',
					height: "100%",
					width: "20%"
				},
				items: [
					{
						id: 'rateDown',
						cls: 'rateButton',
						handler: goRateDown	
					},
					{
						id: 'rateUp',
						cls: 'rateButton',
						handler: goRateUp
					}
				]
			},

			// Chatter
			{
				xtype: 'list',
				id: 'ChatterList',
				flex: 5,
				layout: {
					type: 'fit'
				},
				store: Room.chatter,
				itemTpl: Room.chatterTpl,
				grouped : false,

				disableSelection: true,
				allowDeselect: false,
				trackOver: true,

				emptyText:		"Listening for chatter.. .",
				loadingText:	'Loading chatter...'

				,listeners: {
					// Only on first load
					afterrender: function(component){
						//component.scroller.on('scrollstart', onScrollStart);
						//component.scroller.on('scrollend', onScrollEnd);
					}

					,itemtap: goProfile
				}
			}
		],
		dockedItems:[
			
			// Top toolbar
			{
				xtype: 'toolbar',
				title: 'Room',
				items: [
					{
						xtype: 'button',
						ui: "back",
						text:'Lobby',
						handler: goBack
					},
					{xtype: 'spacer'},
					{
						ui: 'light',
						text: 'Comment',
						handler: goCompose
					}
				]
			}
		]
	}


})();