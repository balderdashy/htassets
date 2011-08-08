/* 
 * Set up Sencha-wide client-side models
 */

// Establish Ext data type for channel
	Ext.regModel('Channel', {
		fields: [
			'id',
			'channelName',
			'channelCallSign',
			'showImg',
			'rating',
			'displayRating',
			'showName',
			'showName10'
		]
	});


// Data type for a displayable post
	Ext.regModel('Post', {
		fields: [
			'id',	// DONT TOUCH == used internall to sencha touch
			'fromUser',
			'profileImageURL',
			'unique',	// unique id of post
			'text',
			'ago',	// how old this post is in simple English
			'ms',	// how old this post is in ms
			'type',	// specifies which type of post this is for styling purposes (twitter, facebook, etc.)
			'priority'	// the higher this number, the closer to the top of the stream this post will be displayed
		]
	});

	

	// Set up local user state model template
	Ext.regModel('User', {
		fields: [
			'id', // PROTECTED DONT TOUCH (stupid problem w/ sencha's LocalStore model)

			// User identity
			'user_id',
			'secret',

			// User experience
			'level',
			'points',

			// Official personal info
			'firstName',
			'lastName',
			'email',
			'website',
			'portrait_url',
			'big_portrait_url',

			// Twitter
			'twitter_screen_name',
			'twitter_name',
			'twitter_portrait_url',
			'twitter_description',
			'twitter_url',
			'twitter_location',

			// Facebook
			'facebook_screen_name'

		]
	});