/**
 *
 */
App = Application = {}; (function() {

	// Define loading conditions and callback
	Application.$ = {};
	Application.$.ready = new ConditionVariable(appReady);



	/**
	 * Run immediately when app is opened
	 */
	function start() {

		// Detect query string parameters
		Application.querystring = Ext.urlDecode(window.location.search.substring(1));

		// Assign DOMReady event
		Application.$.ready.require('DOMReady');
		Ext.onReady(DOMReady);

		// Load Sencha Touch, assign onload event
		Application.$.ready.require('senchaReady');
		Application.$.ready.require('senchaRendered');
		Ext.setup({
			/*
				phoneStartupScreen: "/Client/Modules/Images/bg_tower.svg"	// 320x460
				,tabletStartupScreen: "",// 768x1004
				tabletIcon: "",			// 57x57
				phoneIcon: "",			// 57x57
				glossOnIcon: true,
			*/
			fullscreen: true,
			statusBarStyle: "black-translucent",
			onReady: senchaReady
		});

	} Application.start = start;


	/**
	 * This global buzz event is fired each time the timer fires its buzz event
	 */
	function buzz() {
		// TODO: Analytics to find out if user still has the app open:
		//			e.g. send a request every 60-120 buzzes to the server.
		//				When the server doesn't get any more responses, it knows
		//				that the javascript stopped executing and the user either
		//				backgrounded or closed the app.
	}; Application.buzz = buzz;


	/**
	 * 
	 * Run when the DOM is ready
		- In-App Loading Screen
		* (ASYNC) ask Blinktop server for info about user
		* (ASYNC) ask Blinktop server for channel listings
		* (ASYNC) preload UI images from server -OR- use appcache
		* Feature-detect, UA detect, progressive-enhancement

		* When all ASYNC loading tasks finish
			==>
				Move to Lobby
	 */
	function DOMReady() {
		Log.log("DOM ready.");
		Application.$.ready.satisfy('DOMReady');

		// TODO: Test for Kinita with a timeout


		// Get <body> and set its background to our in-app loading image
		var body = Ext.get(Ext.query("body"));
		body.setStyle(
			"background", 'url("/Client/Images/bg_clouds.svg") #008EA2 no-repeat bottom center'
		);

		// Now initiate prelaunch sequence
		// 1) Check credentials for this user
		Application.$.ready.require('gotCredentials');
		User.auth(Application.$.ready.satisfier('gotCredentials'));

		// 2) Get channel listings
		Application.$.ready.require('gotListings');
		Application.$.ready.require('ChannelsRendered');
		Lobby.fetchChannels(
			Application.$.ready.satisfier('gotListings')
		);

		// 3) Preload images
		// Application.$.ready.require('preloadedImages');'
		// TODO preload images
		
	} Application.DOMReady = DOMReady;







	/**
	 * Run when Sencha Touch is loaded
	 */
	function senchaReady() {

		Log.log("Sencha is ready.");

		// Build and render root element
		Application.view = new Ext.Panel(Application.viewTemplate());

		// But keep it hidden
		Application.view.hide();

		Application.$.ready.satisfy('senchaReady');

	} Application.senchaReady = senchaReady;




	/**
	 * Run when app is ready
	 * Sencha is loaded and all preloading and rendering tasks are complete
	 */
	function appReady() {
		// Load the first page
		Log.log("Application ready to display.");
		Lobby.allReady();

		// If query parameters direct,
		// transition back to the appropriate page
		// and populate the fields (and error message if necessary)
		if (Application.querystring.isCallback) {

			if (Application.querystring.chanID)
				Room.channel = Lobby.channels.getById(Application.querystring.chanID);

			if (Application.querystring.returnTo)
				Application.view.setActiveItem(Application.querystring.returnTo);
		}

		// Turn on the timer 
		Timer.on();

		// Examine this as an optimization mechanism:
		/*
		Application.view.on('cardswitch', function (newCard,oldCard) {
			if (oldCard)
				this.remove(oldCard,true);

		});
		*/

		// Fade in Application view
		Application.view.show('fade');

		Log.log("Welcome User #" + User.localStore.first().get('user_id'));

	} Application.appReady = appReady;



	/**
	 * The template for the application view
	 */
	function viewTemplate () {

		return {
			fullscreen: true,
			cardSwitchAnimation: 'slide',
			layout: {
				type: 'card'
			},
			scroll: false,
			listeners: {
				afterlayout: Application.$.ready.satisfier('senchaRendered')
			},
			items: [
				Lobby.viewFactory
				,Room.viewFactory
				,Compose.viewFactory
				,Profile.viewFactory
				,Invite.viewFactory
				,Reply.viewFactory
				//,Account.view
				//,History.view
			]
		};
	}; Application.viewTemplate = viewTemplate;


}());