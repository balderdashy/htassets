/**
 * Analytics.js
 * Every user interaction should report here and be collected by an appropriate
 * handler.  Then, every once and a while, this script reports to the
 * analytics server.
 */
var Analytics = {

	msBetweenSubmittingReports: 6000,
	host: "/Server/Analytics/post.php"

}; (function () {


	// Build empty local key-value store
	clearRecord();

	// Set report timer
	setTimer();


	/**
	 * Post a report to the analytics server
	 */
	function report() {
		// Only submit report if there's anything to submit
		if (Analytics.record.anythingNew) {
			Ext.Ajax.request({
				url: Analytics.host,
				method: 'POST',
				params: {
					report:Ext.encode(Analytics.record)
				},
				success: function(response) {
					if (Util.validateJSON(response)) {
						//Log.log("Analytics report was submitted succesfully.");
						//Log.log(response);
					} else failure(response);
				},
				failure: failure
			});

			clearRecord();
		}

		setTimer();
	}

	function clearRecord() {
		Analytics.record = {
			channelClicked: [],
			invitesSent: [],
			backToLobbyClicked: []
		};
	}

	function setTimer() {
		Analytics.reportTimer =
		window.setTimeout(report,Analytics.msBetweenSubmittingReports);
	}
	function failure(response) {
		Log.log("Analytics reporting has failed silently.  Server said: " + response + "\n"+
		"  Will resume in " +
		(Analytics.msBetweenSubmittingReports) + " ms.");
	}



				//////////////////////////
				/////// Handlers /////////
				//////////////////////////

	function channelClicked(userId,channelId) {
		Analytics.record.anythingNew = true;
		Analytics.record.channelClicked.push({
			activity: 'channelClicked',
			user_id: userId,
			channel_id: channelId,
			since_epoch: Util.timestamp()
		});

	}
	Analytics.channelClicked = channelClicked;


// Deprecated-- now we use invite tables
//	function inviteSent(userId,channelId,destinationTwitterUsername) {
//		Analytics.record.anythingNew = true;
//		Analytics.record.invitesSent.push({
//			activity: 'inviteSent',
//			user_id: userId,
//			channel_id: channelId,
//			twitter_user: destinationTwitterUsername,
//			since_epoch: Util.timestamp()
//		});
//	}
//	Analytics.inviteSent = inviteSent;


	function backToLobbyClicked(userId,fromChannelId) {
		Analytics.record.anythingNew = true;
		Analytics.record.backToLobbyClicked.push({
			activity: 'backToLobbyClicked',
			user_id: userId,
			channel_id: fromChannelId,
			since_epoch: Util.timestamp()
		});
	}
	Analytics.backToLobbyClicked = backToLobbyClicked;

})();