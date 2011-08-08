/**
 * Object to represent the "other party"
 * whether that's a friend, a group of friends, or the community at large
 */
Friend = {
	
	rating: 0
};  (function () {

	/**
	 * Hit Blinktop server's for an update of Friend rating
	 */
	function updateRating (callback) {
		// TODO: Replace this with a scalable node.js thing
		Rater.server.listen(callback);
		
	}; Friend.updateRating = updateRating;

})();