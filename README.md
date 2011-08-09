.htassets
===================

A makeover for your Apache directory listing.
---------------------------------------------

Uses jQuery Mobile to enhance the presentation of Apache's autoindex on mobile devices, including all modern browsers,

handheld devices:
*	IPhone
*	Android
*	Blackberry
*	WebOS/Palm
*	Windows Phone
*	IPod Touch

and tablets:
*	IPad
*	Android Tablets


Installation
----------------

Put .htaccess and .htassets in your web root, or the root of one of your virtualhosts.

Installation in subdirectory other than webroot
----------------

Put .htaccess and .htassets in the subdirectory where you want the augmented directory listing to exist.
Modify .htassets/configure.sh with the web-root-relative path of the directory and then run it.


TODO
----------------

- Lookahead: htassess should not render the directory index handler within jQuery Mobile.  It should open those links externally.