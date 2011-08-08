/**
 * Control
 * Singleton class which turns user interactions on and off.  Used for loads, transitions,
 * and other asynchronous wait periods where additional user interaction might
 * confuse the UI logic.
 *
 * Dependencies: N/A
 */
function Control (rootPanelReference) {
	if (typeof rootPanelReference=='undefined') {
		throw new Error('rootPanelReference was not specified!');
		return;
	}
	
	if (typeof Control.rootPanel=='undefined') {
		Control.rootPanel = rootPanelReference;	// the root panel of Sencha Touch
		Control.free = true;					// User has control
	} else console.log("Warning: Attempting to redefine Control() singleton. " +
						"State was not changed to reflect the new constructor.");
}

Control.allowed = function() {
	return Control.free;
}

/**
 * Grab control from user
 */
Control.grab = function() {
	Application.view.setLoading(true);
	this.free = false;
}

/**
 * Return control to user
 */
Control.release = function() {
	Application.view.setLoading(false);
	this.free = true;
}