dsah ;lkadghs/**
 *
 */
Util = {};(function() {

	// Constants
	//////////////////

	// Types of posts
	Util.postType = {
		BLINKTOP: 0,
		TWITTER: 1,
		FACEBOOK: 2
	}

	// Animation config objects
	Util.Animation = {
		slideLeft : {
			type: "slide",
			direction: 'left'
		},
		slideRight : {
			type: "slide",
			direction: 'right'
		},
		slideUp : {
			type: "slide",
			direction: "up"
		},
		slideDown : {
			type: "slide",
			direction: "down"
		}
	};

	//////////////////


	/**
	 * Given a datetime string,
	 * @param datetime,
	 * find the difference between it and the current datetime
	 * @return in ms
	 */
	function datestringDiff(datetime) {
		return Date.parse(new Date()) - Date.parse(datetime);
	};Util.datestringDiff = datestringDiff;


	/**
	 * Given a datetime in ms since the epoch,
	 * @param ms,
	 * find the difference between it and the current datetime
	 * @return in ms
	 */
	function datemilisDiff(ms) {
		return Date.parse(new Date()) - ms;
	};Util.datemilisDiff = datemilisDiff;

	/**
	 * Given m seconds, return a string that attractively displays
	 * the equivalent interval of time in the largest possibled grouping
	 */
	function agoFormat(m) {
		if (m == 1)
			return Math.round(m) + " second ago";
		else if (m < 5)
			return Math.round(m) + " seconds ago";
		else if (m < 60)
			return Math.round(m) + " seconds ago";
		else if (m < 120)
			return "1 minute ago";
		else if (m < 3600)
			return Math.round(m/60) + " minutes ago";
		else if (m < (7200))
			return "about an hour ago";
		else if (m < 86400)
			return Math.round(m/3600) + " hours ago";
		else
			return "a while ago";
	}; Util.agoFormat = agoFormat;

	/**
	 * Execute a simple POST AJAX request to a url with the specified parameters
	 */
	function request(url,par) {
		Ext.Ajax.request({
			url: url,
			method: 'POST',
			params: par,
			success: function(response) {
				response.success = true;
				Util.success=response;
				Log.log(response);
			},
			failure: function(response) {
				response.success = false;
				Util.failure=response;
				Log.log(response);
			}
		});
	};Util.request = request;


	/**
	 * Convert a string into
	 * a Twitter hashtag-safe string
	 **/
	function hashtagSafe(theStr) {
		var newpatt = /[^a-zA-Z0-9]/g;
		theStr = theStr.replace(/&/g,"and");
		return theStr.replace(newpatt,"");
	}Util.hashtagSafe = hashtagSafe;

	/**
	 * Validate JSON from a Ext.request response
	 * If doAlert is true, in the error case, display an error message (easy way out)
	 * If failAction is a function, in the error case, return false and execute failAction(),
	 *	passing the server's response as a string parameter
	 */
	 function validateJSON(response,doAlert,failAction) {
		var jsonobj;

		try {jsonobj = Ext.decode(response.responseText);}
		catch (err) {
			// Handle bad server output
			if (failAction) {
				failAction(response.responseText);
				return null;
			}
			var errstr="ERROR!\nServer said:\n\n" + response.responseText;
			if (!doAlert) console.log(errstr);
			else alert(errstr);
			return false;
		}return jsonobj;
	}; Util.validateJSON = validateJSON;


	/**
	 * Return the current date/time in GMT
	 * as an object:
	 * {
	 *		date: yyyymmdd,
	 *		time: hhmm
	 * }
	 */
	function gmt () {
		return {
			now: timestamp(),
			timezone: 
						(jsKata.tz.hasDst())
						? jsKata.tz.dstToString()
						: jsKata.tz.stToString()
		};
		
	} Util.gmt = gmt;


	function timestamp() {
		return Date.parse(new Date()) / 1000;
	} Util.timestamp = timestamp;


	/**
	 * Return the string representation of an integer value
	 * exactly 2 digits long (0 < value < 100)
	 * Used for formatting time.
	 *
	 * i.e. 01, 15, 99, 00, 58
	 */
	function prefixZeroes (value) {
		if (value < 100) {
			if (value < 10)
				return "0"+value;
			else return value;
		} else return 99;
	}; Util.prefixZeroes = prefixZeroes;




	/**
	 * Return a basic store
	 */
	function buildStore() {
		return new Ext.data.Store({
			model: 'Post'
		});
	}; Util.buildStore = buildStore;


})();