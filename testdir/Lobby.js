/**
 * The Lobby is the point of entry for our users.
 *
 * Here, they have immediate access to local tv listings
 * along with realtime ratings for each station.
 */
Lobby = {};(function() {

	// Conditions and callbacks
	Lobby.$ = Lobby.Condition = {};
	Lobby.$.ready	= new ConditionVariable(allReady);

	var refreshURL = '../Server/Listings/dump.php';

	// Settings
	Lobby._  = Lobby.Settings = {
		shelf_life: (5*1000)	// update channels every shelf_life ms
	}



	


	// Store from the database, synced via AJAX
	Lobby.channels = new Ext.data.Store({
		model: 'Channel',
		clearOnPageLoad: false, // We hijack this and control it directly
		proxy: {
			type: 'ajax',
			url : refreshURL,
			actionMethods: {
				read: 'POST'
			},
			reader: {
				type: 'json',
				root: 'channels'
			}
		}
	});





	/*
	 * Triggered when the page is opened
	 * Begin loading, update channels if relevant
	 */
	function load () {

		Lobby.$.ready.reset();
		
		// First channel fetch+render is all taken care of
		// with the Application.$.ready control flow
		// so do nothing
		if (Application.$.ready.satisfied) {
			
			// Refresh listings
			if (! Ext.getCmp("ChannelList").scroller.isDragging()) {
				fetchChannels();
			}
		}

	};Lobby.load = load;


	/**
	 * Buzz event is fired when the Timer goes off on this page
	 */
	function buzz () {

		// If shelf_life has expired, update channel listings and ratings
		// TODO: put this in a server-push listener instead
		if (new Date() - Lobby.lastUpdated > Lobby._.shelf_life ) {

			// Only refresh channels if user is not scrolling
			if (! Ext.getCmp("ChannelList").scroller.isDragging()) {
				fetchChannels();
			}
		}

	};Lobby.buzz = buzz;


	/**
	 * Fetch channels from server and update local store
	 */
	function fetchChannels (callback) {

		Log.log("Fetching channels...");

		// Get datetime
		var gmt = Util.gmt();

		// Reload station listings & ratings
		Lobby.channels.load({
			
			params: gmt,
			callback:
				Ext.createSequence(
					fetchChannelsComplete,
					callback
				)
		});
		

	};Lobby.fetchChannels = fetchChannels;


	/**
	 * Triggered when channel listing data is done loading
	 */
	function fetchChannelsComplete(records,operation,success) {

		Log.log("Fetched!");

		if (success) {

			render();
			
			// Update timestamp
			Lobby.lastUpdated = new Date();

		} else {
			// Existing listings will be left alone
			Log.log("Channel update failed.");
			Log.log(records);
		}

	};Lobby.fetchChannelsComplete = fetchChannelsComplete;



	/**
	 * Render/refresh the channel listings
	 */
	function render () {
		Log.log('Rendering channels...');

		// Since we're refreshing the listings manually,
		// we need to make sure it renders before continuing
		Lobby.$.ready.require('rendered');
		renderComplete();

	}Lobby.render = render;



	/**
	 * Triggered when channel list rendering is finished
	 */
	function renderComplete () {
		Log.log('Channel list updated(+rendered).');
		Application.$.ready.satisfy('ChannelsRendered');
		Lobby.$.ready.satisfy('rendered');
		

	};Lobby.renderComplete = renderComplete;


	/**
	 * Color and fill rating bars appropriately
	 */
	function updateRatingBars() {
		var ratingBars = Ext.query("span.channel-rating-interior");
		Log.log("Updating " + ratingBars.length + " rating bars.");
		for (var i = 0; i < ratingBars.length; i++) {
			var el = (new Ext.Element(ratingBars[i])),
				rating = el.getAttribute("rating"),
				perc, newClass;

			// If no specified rating, leave dull
			if (rating == null) perc = 0;
			else {
				rating = parseFloat(rating);
				perc = ( (Math.abs(rating)) / 10 )*100;
				newClass = (rating > 0)
							? "positive"
							: "negative";
			}
			
			el.setStyle({
				"width": perc + '%'
			});

			if (newClass)
				el.addCls(newClass);

			if (rating > 0) {
				el.setStyle({
					"left": "50%"
				});
			} else if (rating < 0) {
				el.setStyle({
					"right": "50%"
				});
			}

		}
	}; // @private


	function allReady() {
		Log.log("Lobby ready.");
		updateRatingBars();
	}Lobby.allReady = allReady;




	/**
	* User picks a channel
	* Respond by moving to appropriate room
	*/
	function channelPicked (dataview, index, element, eventObject) {


		// Update room's channel information
		var newChan = Lobby.channels.getAt(index);
		if (newChan != Room.channel) {
			Room.staleFlag = true;
			Room.channel = newChan;
		}

		// Capture analytics
		Analytics.channelClicked(User.get('user_id'), newChan.get('id'));

		// If this is a known show, transition to Room
		if (newChan.get('showName') != 'Local Programming')
			Application.view.setActiveItem('Room');

		
	};Lobby.channelPicked = channelPicked;







	////////////////////////////////////////////////////////////////////////
	// View Markup
	////////////////////////////////////////////////////////////////////////

	Lobby.channelTpl =
		'<span class="nooverflow channelName">{channelCallSign}</span>' +
		'<span class="nooverflow showName">{showName}</span>' +
		'<span class="channel-rating"><span rating="{rating}" class="channel-rating-interior"></span></span>';

	Lobby.viewFactory = {
		// Container
		xtype: 'panel',
		title: 'Lobby',
		layout: {
			type: 'fit'
		},
		id: 'Lobby',
		scroll: false,
		listeners: {
			activate: load
		},

		// Channel List
		items: [{
			xtype: 'bufflist',
			id: 'ChannelList',
			layout: {
				type: 'fit'
			},
			listeners: {
				itemtap: channelPicked
			},
			disableSelection: true,

			maxItemHeight: 85,	// must specify
  			blockScrollSelect: true,
			batchSize: 15,
			store: Lobby.channels,
			itemTpl: Lobby.channelTpl,
			grouped : false,

			trackOver: true,
			
			emptyText:		"No channels could be fetched in your area.  Try back later, we're on it!"
			,loadingText:	false
		}],

		// Menu bar
		dockedItems: [
			{
				xtype: 'toolbar',
				title: 'Lobby'
			}
		]
	};

})();