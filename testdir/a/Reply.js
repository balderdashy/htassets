/**
 *
 */
Reply = {

	// 
	maxLength: 100


}; (function() {

	// Conditions and callback
	Reply.$ = {};
	Reply.$.posted = new ConditionVariable(submitComplete);



	/**
	 * When Reply loads (all the way)
	 */
	function load () {

		var mention = "@" + Profile.node.get("fromUser") + " ";
		Application.view.query("#ReplyMessage")[0].setValue(mention);

		
	} Reply.load = load;

	


	/**
	 * User taps cancel
	 * Return to Profile
	 */
	function cancel () {
		// TODO: Cancel pending form posts
		backToProfile();
	} Reply.cancel = cancel;


	/**
	 * User taps submit
	 * Submit invitation
	 */
	function submitReply() {

		var form = Application.view.query('#Reply')[0],
			values = form.getValues(),
			message= values.post;

		// Reset condition
		Reply.$.posted.reset();
		
		// Capture Reply information
		Reply.$.posted.require('savedToBlinktop');
		saveReply(message,Reply.$.posted.satisfier('savedToBlinktop'));

		// Post to Twitter servers
		Reply.$.posted.require('Twitter');
		Twitter.Reply(message,Reply.$.posted.satisfier('Twitter'));

		// Start loading-- disable submit button
		form.query("#submit_Reply")[0].disable();

	} Reply.submitReply = submitReply;



	/**
	 * Save Replys locally for analytics and preventing blocking abuse
	 */
	function saveReply(msg,callback) {
		Ext.Ajax.request({
			url: '../Server/Users/Reply.php',
			method: 'POST',
			params: {
				message: msg,
				user_id: User.get('user_id'),
				station_id: Room.channel.get('id'),
				to_twitter_screen_name: Profile.node.data.fromUser,
				hashtag: Util.hashtagSafe(Room.channel.get('showName'))
			},
			success: function(response) {
				if (callback) callback();
			},
			failure: function(response) {
				// TODO: Indicate to user that their post won't appear
				// on this social network because of a network error.
				Log.log("SERVER ERROR:");
				Log.log(response);
			}
		});
	}



	/**
	 * Submission completed
	 */
	function submitComplete (form, result) {
		Log.log("submitComplete fired.");

		backToProfile();
		
	} Reply.submitComplete = submitComplete;



	function backToProfile () {
		Application.view.setActiveItem('Profile',Util.Animation.slideRight);
	} // @private



	// View Markup
	Reply.viewFactory = {
		title: 'Reply',
		id: 'Reply',
		url: Reply.actionURL,
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
				title: 'Reply',
				items: [
					{
						xtype: 'button',
						ui: "back",
						text:'Profile',
						handler: backToProfile
					}
				]
			}
		],
		items:[
			{
				xtype: 'fieldset',
				title: 'Reply to this person on Twitter:',
				instructions: '',
				defaults: {
					labelWidth: '35%'
				},
				items: [
					{
						xtype: 'textareafield',
						name: 'post',
						id: 'ReplyMessage',
						maxLength: Reply.maxLength,
						label: 'Heard of Blinktop?',
						placeHolder: 'Check this out!',
						autoCapitalize : false,
						useClearIcon: false
					}
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
						id: 'submit_Reply',
						ui: 'confirm-round',
						text: 'Reply',
						handler: submitReply
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