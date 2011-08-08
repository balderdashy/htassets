/**
 *
 */
Invite = {

	// 
	maxLength: 100


}; (function() {

	// Conditions and callback
	Invite.$ = {};
	Invite.$.posted = new ConditionVariable(submitComplete);



	/**
	 * When Invite loads (all the way)
	 */
	function load () {
		var mention = "@" + Profile.node.get("fromUser") + " ";
		Application.view.query("#InviteMessage")[0].setValue(mention +
			"Hey! I saw your post about " + Util.hashtagSafe(Room.channel.get('showName')) + " on @Blinktop! " +
			"http://blinktop.com" 
		);

		
	} Invite.load = load;

	


	/**
	 * User taps cancel
	 * Return to Profile
	 */
	function cancel () {
		// TODO: Cancel pending form post
		backToProfile();
	} Invite.cancel = cancel;


	/**
	 * User taps submit
	 * Submit invitation
	 */
	function submitInvite() {

		var form = Application.view.query('#Invite')[0],
			values = form.getValues(),
			message= values.post;

		// Reset condition
		Invite.$.posted.reset();
		
		// Capture invite information
		Invite.$.posted.require('savedToBlinktop');
		saveInvite(message,Invite.$.posted.satisfier('savedToBlinktop'));

		// Post to Twitter servers
		Invite.$.posted.require('Twitter');
		Twitter.invite(message,Invite.$.posted.satisfier('Twitter'));

		// Start loading-- disable submit button
		form.query("#submit_invite")[0].disable();

	} Invite.submitInvite = submitInvite;



	/**
	 * Save invites locally for analytics and preventing blocking abuse
	 */
	function saveInvite(msg,callback) {
		Ext.Ajax.request({
			url: '../Server/Users/invite.php',
			method: 'POST',
			params: {
				message: msg,
				user_id: User.get('user_id'),
				station_id: Room.channel.get('id'),
				to_twitter_screen_name: Profile.node.data.fromUser
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
		
	} Invite.submitComplete = submitComplete;



	function backToProfile () {
		Application.view.setActiveItem('Profile',Util.Animation.slideRight);
	} // @private



	// View Markup
	Invite.viewFactory = {
		title: 'Invite',
		id: 'Invite',
		url: Invite.actionURL,
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
				title: 'Invite',
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
				title: 'Invite this person to Blinktop:',
				instructions: 'Come join the conversation!',
				defaults: {
					labelWidth: '35%'
				},
				items: [
					{
						xtype: 'textareafield',
						name: 'post',
						id: 'InviteMessage',
						maxLength: Invite.maxLength,
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
						id: 'submit_invite',
						ui: 'confirm-round',
						text: 'Invite',
						handler: submitInvite
					},
					{
						xtype: 'button',
						ui: 'decline-round',
						text: 'Nah.',
						handler: cancel
					}
				]
			}
		]
	};


})();