/**
 *
 */
Compose = {

	// TODO: make maxLength vary depending on what sharing options the user has selected
	maxLength: 100


}; (function() {

	// Conditions and callback
	Compose.$ = {};
	Compose.$.posted = new ConditionVariable(submitComplete);


	// Post action URL
	Compose.actionURL = '/Server/Posts/post.php';


	/**
	 * When Compose loads (all the way)
	 */
	function load () {

		// Reset form
		Application.view.query('#submit_compose')[0].enable();
		// Set message field based on callback query string and clear it
		if (Application.querystring.message &&
					Application.querystring.message != "") {
				var msgDestination = Application.view.query('#Message');
				if (msgDestination.length > 0) {
					msgDestination[0].setValue(decodeURI(Application.querystring.message));
					Application.querystring.message = "";
				}
			}
		else
			Application.view.query('#Message')[0].setValue('');

		// IF TWEET SHARING IS NOT SET UP
		// When the sharing components render, assign them to call connect handlers
		if (! Twitter.connected()) {
			Log.log("Connecting to twitter....");
			var toggle = Application.view.query('#twitter')[0];
			toggle.getEl().addListener('tap',function(){
				User.connect("twitter",'Compose');
			});
			
		} else Log.log('Twitter is already authed.');

		// IF FACEBOOK SHARING IS NOT SET UP
		// When the sharing components render, assign them to call connect handlers
		if (! Facebook.connected()) {
			Log.log("Connecting to facebook....");
			toggle = Application.view.query('#facebook')[0];
			toggle.getEl().addListener('tap',function(){
				User.connect("facebook",'Compose');
			});

		} else Log.log('Facebook is already authed.');


		// TODO: Based on default sharing options,
		// enable sliders:
		if (Twitter.connected())
			Application.view.query('#twitter')[0].setValue(1);
		if (Facebook.connected())
			Application.view.query('#facebook')[0].setValue(1);

	}; Compose.load = load; 


	/**
	 * User taps cancel
	 * Return to Room
	 */
	function cancel () {
		// TODO: Cancel pending form post

		backToRoom();
	}; Compose.cancel = cancel;


	/**
	 * User taps submit
	 * Submit post to Blinktop
	 * and Twitter and/or Facebook as well if requested
	 */
	function submitPost() {

		var form = Application.view.query('#Compose')[0],
			values = form.getValues(),
			message= values.post;

		if (!form.query("#submit_compose")[0].isDisabled()) {

			// Reset condition
			Compose.$.posted.reset();

			// Build post
			var post = {
				user_id:		User.get('user_id')
				,channel_id:	Room.channel.get('id')
				,thepost:		message
				,sharedToTwitter: values.twitter
				,sharedToFacebook: values.facebook
				,hashtag: Util.hashtagSafe(Room.channel.get('showName'))
			};

			// Post to Facebook servers
			if (values.facebook == 1) {
				Compose.$.posted.require('Facebook');
				Facebook.post(message,Compose.$.posted.satisfier('Facebook'));
			}

			// Post to Twitter servers
			if (values.twitter == 1) {
				Compose.$.posted.require('Twitter');
				Twitter.post(message,Compose.$.posted.satisfier('Twitter'));
			}


			// Post to blinktop servers
			Compose.$.posted.require('Blinktop');
			form.submit({
				params: post
				,success: Compose.$.posted.satisfier('Blinktop')
				,failure: function(form,response,query) {
					Log.log("POST FAILED!");
					Log.log("Server said:");
					Log.log(response);
				}
			});

			// Start loading-- disable submit button
			form.query("#submit_compose")[0].disable();
		}

	}; Compose.submitPost = submitPost;


	/**
	 * Submission completed
	 */
	function submitComplete (form, result) {
		Log.log("submitComplete fired.");

		// Scroll to top of screen
		var view = Application.view.query('#Room')[0];
		var scroller = view.getComponent('ChatterList').scroller;
		if (scroller) scroller.scrollTo({x:0,y:0});

		// Go back to Room
		backToRoom();
		
	}; Compose.submitComplete = submitComplete;



	function backToRoom () {
		// Refresh chatter in room
		// But don't wait before continuing
		Room.refreshChatter();

		// TODO: Reset to default sharing settings
		// TODO: reset toggles if not connected to social networks

		// Transition back to Room
		Application.view.setActiveItem('Room',Util.Animation.slideDown);

	} // @private



	// View Markup
	Compose.viewFactory = {
		title: 'Compose',
		id: 'Compose',
		url: Compose.actionURL,
		standardSubmit: false,
		xtype: 'formpanel',
		scroll: 'vertical',
		listeners: {
			activate: load
		},
		dockedItems:[
			// Top toolbar
			{
				xtype: 'toolbar',
				title: 'Remark',
				items: [
					{
						xtype: 'button',
						ui: "back",
						text:'Room',
						handler: backToRoom
					}
				]
			}
		],
		items:[
			{
				xtype: 'fieldset',
				title: 'Share your thoughts...',
				defaults: {
					labelWidth: '35%'
				},
				items: [
					{
						xtype: 'textareafield',
						name: 'post',
						id: 'Message',
						maxLength: Compose.maxLength,
						label: 'Remark',
						placeHolder: 'I love this show.',
						autoCapitalize : true,
						useClearIcon: false
					}
				]
			},
			{
				xtype: 'fieldset',
				defaults: {
					labelWidth: '60%',
					xtype: 'togglefield',
					listeners: {
						
					}
				},
				items: [
					{ id: 'facebook',label: 'Facebook'}
					,{ id: 'twitter', label: 'Twitter'}
				]
			}
			,{
				xtype: 'container',
				layout: {
					type: 'hbox',
					pack: 'center'
				},
				defaults: {
						margin: '5px',
						flex: 1
				},
				items: [
					{
						xtype: 'button',
						id: 'submit_compose',
						ui: 'confirm-round',
						text: 'Post',
						handler: submitPost
					},
					{
						xtype: 'button',
						ui: 'decline-round',
						text: 'Cancel',
						handler: cancel
					}
				]
			}
		]
	};


})();