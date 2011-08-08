/**
 *
 */
var Profile = {
	
	staleFlag:	false,
	node:		null

};(function() {

	// Conditions and callback
	// N/A


	/**
	 * Called when Profile is visually activated
	 */
	function load () {
		var view = Application.view.query('#Profile')[0];

		// Update Profile configuration based on Profile.node object
		var username = Profile.node.get('fromUser');
		var userid = Profile.node.get('userid');

		// 1=twitter, 0=blinktop
		var type = Profile.node.get("type");
		var displayAge = Profile.node.get("ago");

		// Set title
//		view.getDockedItems()[0].setTitle(username);
		view.getDockedItems()[0].setTitle(displayAge);
		// TODO: Make node smarter about user

		// Set username, name
		var usernameWrappedInLink = "<a>"+username+"</a>";
		view.query("#Profile-username")[0].getEl().update(usernameWrappedInLink);

		// Set portrait
		var biggerProfilePicture;
		if (type == Util.postType.TWITTER)
			biggerProfilePicture = "http://api.twitter.com/1/users/profile_image/" + username +
			".json?size=bigger";
		else
			biggerProfilePicture = "/Server/Image/Image.php?big=true&id="+userid;
		view.query("#portrait")[0].getEl().setStyle({
			"background": 'url("' + biggerProfilePicture + '") top center no-repeat'
		});


		var container = view.query("#profile_options")[0];

		addInviteButton("invite_on_twitter_button",view,container,type,username);
		addRetweetButton("retweet_button",view,container,type);
		addReplyButton("reply_button",view,container,type);

		// Set body
		view.query("#Profile-postbody")[0].getEl().update(Profile.node.get('text'));


		// Set back button string
		view.query("#back-Room")[0].getEl().child('.x-button-label').update(Room.channel.get('channelCallSign'));
		
	} // @private




	function addRetweetButton (id,view,container,type) {
		if (type == Util.postType.TWITTER) {
			checkRetweet(function(response) {
				var json = Util.validateJSON(response);
				if (json.didRetweet)
					(view.query("#retweet_button")[0]).disable();
				else {
					addButton(id,view,container,
						"Retweet",
						doRetweet);
				}
			});
		} else clearButtons(id,view);
	}

	function checkRetweet(callback) {
		Ext.Ajax.request({
			url: '../Server/Users/checkRetweeted.php',
			method: 'POST',
			params: {
				user_id: User.get('user_id'),
				station_id: Room.channel.get('id'),
				tweet_id: Profile.node.data.unique
			},
			success: callback,
			failure: function(response) {
				// TODO: Indicate to user that the retweet failed
				Log.log("SERVER ERROR:");
				Log.log(response);
			}
		});
	}


	function addInviteButton (id,view,container,type,username) {
		if (type == Util.postType.TWITTER) {

			addButton(id,view,container,
				"Invite",
				doInvite);
		} else clearButtons();
	}

	function addReplyButton (id,view,container,type,username) {
			addButton(id,view,container,
				"Reply",
				doReply);
	}

	function addButton (id,view,container,text,action) {
		clearButtons(id,view);
		container.render();
		container.add({
			xtype: 'button',
			ui: 'confirm-round',
			id:id,
			text: text,
			listeners: {
				tap: action
			}
		});
		container.doLayout();
	}

	function clearButtons (id,view) {
		var resultSet = view.query("#"+id);
		if (resultSet.length > 0)
			resultSet[0].destroy();
	}


	/**
	 * Invite this user to Blinktop
	 * If your account isn't connected yet, connect it
	 */
	function doInvite(button,evObject, eventSet) {
		if (Twitter.connected()) {

			// Transition to Invite
			Application.view.setActiveItem('Invite',Util.Animation.slideLeft);
			
		} else
			User.connect('twitter','Room');
	}; // @private


	/**
	 * Reply to this user on twitter or blinktop
	 */
	function doReply(button,evObject, eventSet) {
		if (Twitter.connected()) {

			// Transition to reply sheet
			Application.view.setActiveItem('Reply',Util.Animation.slideLeft);
			
		} else {
			// TODO: Reply on blinktop
		}
	}; // @private


	/**
	 * Retweet this user's post
	 * If your account isn't connected yet, connect it
	 */
	function doRetweet(button,evObject, eventSet) {
		if (Twitter.connected()) {
			submitRetweet();
			button.disable();
		} else
			User.connect('twitter','Room');
	}

	function submitRetweet(callback) {
		Ext.Ajax.request({
			url: '../Server/Users/retweet.php',
			method: 'POST',
			params: {
				user_id: User.get('user_id'),
				station_id: Room.channel.get('id'),
				tweet_id: Profile.node.data.unique
			},
			success: function(response) {
				Log.log("Retweet request returned.");
				Log.log(response);
				if (callback) callback();
			},
			failure: function(response) {
				// TODO: Indicate to user that the retweet failed
				Log.log("SERVER ERROR:");
				Log.log(response);
			}
		});
	}


	/**
	 * Go back to the Room
	 */
	function goBack() {
		Application.view.setActiveItem('Room',Util.Animation.slideUp);
	}Profile.goBack = goBack;


	// View Markup
	Profile.viewFactory = {
		title: 'Profile',
		id: 'Profile',
		xtype: 'panel',
		listeners: {
			activate: load
		},
		defaults: {
			flex: 1
		},
		layout: {
			type:'vbox',
			pack: 'top',
			align: 'stretch'
		},
		items: [
			// Portrait and user info
			{
				flex: 2,
				margin: "0 10%",
				layout: {
					type: 'hbox'
				}
				,defaults: {
					flex: 1
				}
				,items: [
					// Profile portrait
					{
						id: 'portrait',
						height: 100
						
					}
					// User info
					,{
						flex: 7,
						id: 'Profile-username',
						padding: '0 0 50'
					}]
				}
			// Post
			,{
				flex: 4,
				xtype: 'panel',
			scroll: 'vertical',
				margin: "0 10%",
				items: [{
					layout: {
						type: 'fit'
					},
					id:'Profile-postbody'
					,html: 'post'
				}]
			}
			// Action buttons
			,{
				flex: 1,
				margin: "0 10%",
				xtype: 'segmentedbutton',
				allowDepress: true,
				id: "profile_options"
				,layout: {
					type: 'hbox'
				}
				,defaults: {
					flex: 1
				}
				,items: []
			}
		],
		dockedItems:[
			// Top toolbar
			{
				xtype: 'toolbar',
				title: 'Profile',
				items: [
					{
						id: 'back-Room',
						xtype: 'button',
						ui: "back",
						text:'Room',
						handler: goBack
					}
				]
			}
		]
	};


})();



