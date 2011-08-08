/**
 * Timer
 * Singleton class which maintains a regular cycle and montiors various updates.
 *
 * Dependencies: N/A
 */
var Timer = {
	// Minimum/approximate length between refreshes in miliseconds
	tickLength: 2000

};(function () {

	/**
	 * Do initial clear and reset of timer
	 */
	function on () {
		Timer.alarm = window.setTimeout(buzz, Timer.tickLength);
	};Timer.on = on;


	/**
	 * Disable buzz events
	 */
	function snooze () {
		window.clearTimeout(Timer.alarm);
	};Timer.off = Timer.snooze = snooze;


	/**
	 * Timer fires
	 * Different things need to be refreshed depending on
	 * what page the user is on
	 * Detect the current page and then call ITS corresponding buzz method
	 */
	function buzz () {
		// Get current page
		var current = App.view.getActiveItem().id;

		// Do global buzz event
		Application.buzz();

		// Do page-specific buzz event
		switch (current) {
			case 'Lobby':Lobby.buzz();break;
			case 'Room':Room.buzz();break;
			case 'Compose':break;
			case 'Profile':break;
			case 'History':break;
		};

		// Reset alarm
		Timer.alarm = window.setTimeout(buzz,Timer.tickLength);

	};Timer.buzz = buzz;


})()