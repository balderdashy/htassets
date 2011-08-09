(function($) {$(function(){
		
	// Execute this initalization logic any time any new page is being created
	$("div[data-role='page']").live('pagecreate',onInitialize);


/**
 * Called every time a page is loaded
 */
function onInitialize(e) {
	// Get page element
	var page = e.currentTarget;
	parseApacheTable(page);
}


/**
 * Parse the table that apache provides, and then augment it
 * with improved aesthetics and logic
 */
function parseApacheTable(page) {
	// Override server-side sorting behavior
	$("th a").attr('href',null).addClass('clickable').bind('vclick',_clickSort);

	// Reverse animation for ascending a directory
	$("a:contains('Parent Directory')").each(function(index) {
		$(this).attr('data-direction','reverse');
	});

	// Make types that are incompatible with jQuery Mobile's ajax loading
	// open as a standard web page
	$("td a").filter(incompatibleTypeFilter).attr('data-ajax','false');

	// If the directory is empty, display a message informing the user
	// that this is the case
	if ($("td").length == 0) {
		$("table").remove();
		$(page).append("<img src='/.htassets/images/empty.png'/>");
		$(page).append("<p class='flash'>No files are available in this directory.</p>");
	}
}



/**
 * UI Handler
 * User clicks sort
 */
function _clickSort(e) {

	var sortLink = $(this);
	var elementsToSort = $('table td').parent();
	console.log(elementsToSort.length + " rows exist!!!");
	// Note: We would have to adjust column index because of the icon in each row
	// but $.eq is 0 based and $.index is 1 based, so it works out.
	var columnIndex = $(this).parent().index();

	// Toggle sort order
	sortLink.data('ascending',!sortLink.data('ascending'));

	elementsToSort.sortElements(function(a,b) {
		var aVal =  $(a).find('td:eq('+columnIndex+')').text(),
			bVal = $(b).find('td:eq('+columnIndex+')').text();
		if (aVal == bVal) {
			return 0;
		} else if (sortLink.data('ascending')) {
			return aVal > bVal ? 1 : -1;
		} else {
			return aVal < bVal ? 1 : -1;
		}
	});

	e.stopPropagation();
	e.preventDefault();
	return false;
}




/**
* This filter removes all directories and empty strings.
* It returns only files which jQuery Mobile wouldn't be able to load
* with AJAX.
*
* This can be removed down the line if jQuery Mobile starts handling
* things like text files (.js, .py, .sh, .txt, etc.)
*/
function incompatibleTypeFilter () {
	return /^(?!.*(^\s*$|\/$))/.test($(this).text());
//	return /^(?!.*(^\s*$|\.html$|\/$))/.test($(this).text());
}







});})(jQuery);
