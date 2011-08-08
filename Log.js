/**
 * Logging object
 * Lets us play with more options
 */
Log = {};(function() {

	// Local epoch
	Log.epoch = new Date().valueOf();

	// Set up history object for logging
	Log.history = [];



	/*
	 * Output message to console.log
	 * Save it in history with a timestamp
	 */
	function log (msg) {
		// Get ms since epoch
		var now = (new Date().valueOf() - Log.epoch);

		// Save message
		Log.history.push({
			message:	msg,
			timestamp:	now
		})

		// Write message
		Log.println(msg,now);

	} Log.log = log;


	function warn (msg) {
		console.warn(msg);
	} Log.warn = warn;



	/**
	 * Dump log so that it can be read easily using Chrome's dev tools
	 * or Firebug
	 */
	function dump () {
		for (var i=0;i<Log.history.length;i++) {
			var entry = Log.history[i];
			Log.println(entry.message, entry.timestamp);
		}
	} Log.dump = dump;


	/**
	 * display logic for printing a line of the log
	 */
	function println (msg,now) {
		if (typeof msg == 'object') {
			console.log(now + "\n-------------");
			console.log(msg);
			console.log('-------------');
		} else
			console.log(now + ":  " + msg);
	} Log.println = println;

})();