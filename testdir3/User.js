/**
 * Contains state and methods about user analytics, local cache of session info,
 * and anything else dealing with the unique user instance
 */
User = {}; (function() {

	// Location of server-side script which returns remote store
	User.proxyURL = '../Server/Users/proxy.php';

	// User rating always starts right in the middle on app load
	User.rating = 0;

	// Proxies
	User.remoteProxy = new Ext.data.AjaxProxy({
		model: 'User',
		url: User.proxyURL,
		reader: {
			type: 'json'
		},
		type: 'ajax',
		actionMethods: {
			read: 'POST'
		},
		id: 'user_remote'
	});
	User.localProxy = new Ext.data.LocalStorageProxy({
		model: 'User',
		type: 'localstorage',
		id: 'user_local'
	});

	// Stores
	User.localStore = new Ext.data.Store({
		model: 'User',
		proxy: User.localProxy
	});

	User.remoteStore = new Ext.data.Store({
		model: 'User',
		proxy: User.remoteProxy
	});
	

	/**
	 * Authenticate user
	 * Look at localstorage to get identity
	 * Sync data from server to localstorage
	 * If no local user state exists, establish anonymous user session
	 * and disable post/rate functionality until login
	 */
	function auth(callback) {

		User.localStore.load(function(records, operation, success) {
			if (User.localStore.getCount() == 0) {
				// No local user store:  New user
				Log.log("Creating new localStorage object for user data.");
				User.localStore.add({});User.localStore.sync();
			} else {
				// Refresh local user store
				Log.log("Loaded localStore...");
			}

			// Update localStorage with remote data
			User.refresh(function(records,operation,success) {

				// Now sync the local store w/ the remote store
				// Remote store gets priority
				var userObj = User.remoteStore.first().data;

				if (User.localStore.getCount > 1) throw new Error ("Unexpected values in localStore!");
				while (User.localStore.getCount()>0)
					User.localStore.removeAt(0);

				User.localStore.add(userObj);
				User.localStore.sync();

				// Execute callback if it was passed
				if (callback) callback();
			})
		});

	}; User.auth = auth;


	/**
	 * Refresh localstore from remote source
	 */
	function refresh(callback) {
		var store = User.localStore.first();
		
		User.remoteStore.load({
			scope: this
			,callback: callback
			,params: {
				id: store.get('user_id'),
				secret: store.get('secret')
			}
		});
		
	}; User.refresh = refresh;


	/**
	 * Connect to the passed social network
	 * Return to returnTo when the connection or rejection is complete
	 */
	function connect (network,returnTo) {
		if (network == 'facebook') {
			Facebook.connect(returnTo);
		} else if (network == 'twitter') {
			Twitter.connect(returnTo);
		}
	} User.connect = connect;


	/**
	 * Convenience method to get data from user's localstore;
	 */
	function get(key) {
		return User.localStore.first().get(key);
	}; User.get = get;


})();