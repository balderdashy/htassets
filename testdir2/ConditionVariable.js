/**
 * ConditionVariable
 * A class for controlling situations where serveral asynchronous
 * processes must all occur before proceding.
 * ex.
 * 
 *		function whenResponsesReceived() {
 *			alert ("All done!");
 *		}
 *
 *		var cv = new ConditionVariable(whenResponsesReceived);
 *		cv.require(['Server0Response', 'Server1Response', 'Server2Response']);
 *		XHR.request('server0.com',cv.satisfier('Server0Response'));
 *		XHR.request('server1.com',cv.satisfier('Server1Response'));
 *		XHR.request('server2.com',cv.satisfier('Server2Response'));
 *
 *
 * Guarantees that all conditions have been met n>=1 times.  They could have
 * occured much more often.
 *
 * Dependencies:	N/A
 */
function ConditionVariable (userCallback) {

	this.reqs = {};	// requirement table
	if (typeof userCallback=='undefined') throw new Error('userCallback not specified!');
	this.callback = userCallback;

	// Keeps track of whether the callback has been fired
	this.satisfied = false;

	/**
	 * If all conditions have been satisfied, execute user callback
	 */
	function checkIfDone() {
		if (this.satisfied == false && Object.keys(this.reqs).length == 0) {
			this.satisfied = true;
			this.callback();
		}
	} this.checkIfDone = checkIfDone;


	/**
	 * Require that one or more additional conditions be met
	 * before the user callback is executed
	 * 
	 * @param newRequirement can be a string or an array of strings
	 */
	function require (newRequirement) {
		if (this.satisfied)
			this.satisfied = false;
			/* throw new Error('Trying to require new condition for already satisfied condition!'+
					' Use ConditionVariable.prototype.reset() before reusing a CV.'); */

		if (typeof newRequirement=="object")
			for (var i=0;i<newRequirement.length;i++)
				this.reqs[newRequirement[i]] = null;
		else
			this.reqs[newRequirement] = null;
	} this.require = require;

	/**
	 * Satisfy a condition
	 * If nothing left, execute callback
	 */
	function satisfy (reqName) {
		if (!this.reqs.hasOwnProperty(reqName)) {
			// Requirement doesn't exist or is already satisfied
			// -- no effect
			return;
		}
		delete this.reqs[reqName];
		this.checkIfDone();
	} this.satisfy = satisfy;


	/**
	 * Build a closure which calls this.satisfy with reqName
	 */
	function satisfier (reqName) {
		var me = this;
		return function() {
			me.satisfy(reqName);
		}
	} this.satisfier = satisfier;


	/**
	 * Reset all requirements
	 */
	function reset () {
		for (var reqName in this.reqs)
			delete this.reqs[reqName];;
		this.satisfied = false;
	} this.reset = reset;
}