(function($) {
	$(function(){

		onReady();

		// Execute initalization logic any time any new page is being created
		$("div[data-role='page']").live('pagecreate',onInitialize);

		// Execute page change logic any time a page is displayed
		$("div[data-role='page']").live('pagebeforeshow',onDisplay);

		// Check on some stuff before creating a page
		$("div[data-role='page']").live('pagebeforecreate',onBeforeCreate);

		/**
		 * Execute ready logic the first time the app opens
		 */
		function onReady() {}

		/**
		 * Called every time a page is loaded
		 */
		function onInitialize(e) {
			// Get page element
			var page = e.currentTarget;
			parseApacheTable(page);

			// Refresh hostname
			$(".hostname").html(window.location.hostname);
		}

		function onBeforeCreate(e) {
			var oldPath = getPath(e.currentTarget);
			var path = e.target.baseURI;
			console.log(oldPath);
			// peek ahead inside directories and check that they are directory listings
			if(e.target.id != 'htassets') {
				window.open(path,"htassets","menubar=1,location=1,resizable=1,scrollbars=1,status=1");
//				window.location = path;
				$.mobile.changePage(oldPath,{transition:'none'});
				return false;
			}
			
		}


		function getPath(page) {
			var path;
			// Display current directory
			if (window.location.hash) {
				path = window.location.hash;
				path = path.substring(1,path.length-1);
			} else {
				path = window.location.pathname;
			}
			// Make sure there's a trailing slash
			if (path.charAt(path.length-1) != '/')
				path = path+'/';
			$(page).find("#currentDir").text(path);
			return path;
		}

		/**
		 * Called every time a page is displayed
		 */
		function onDisplay(e) {
			var path = getPath(e.currentTarget);

			// If this is the htassets root, make the parent dir link
			// rel=external to avoid craziness
			if (path == htasset_location)
				$("a:contains('Parent Directory')").attr('rel','external');

			
			// Mark all rel=external and no-ajax links so they are apparent
			$("a[rel=external]").add("a[data-ajax=false]").addClass('external');
			
		}


		/**
		 * Parse the table that apache provides, and then augment it
		 * with improved aesthetics and logic
		 */
		function parseApacheTable(page) {
			// Override server-side sorting behavior
			$("th a").attr('href',null).addClass('clickable').bind('vclick',_clickSort);

			$("a:contains('Parent Directory')").each(function(index) {
				// Reverse animation for ascending a directory
				$(this).parent().parent().addClass('parentDirectoryLink');
				$(this).attr('data-direction','reverse');
			});

			// Make types that are incompatible with jQuery Mobile's ajax loading
			// open as a standard web page
			$("td a").filter(incompatibleTypeFilter).attr('data-ajax','false');

			// If the directory is empty, display a message informing the user
			// that this is the case
			if ($(page).find("tr").not(".parentDirectoryLink").children("td").length == 0) {

				var parentLink = $(page).find("tr.parentDirectoryLink a").attr("href");
				$(page).find("table").remove();
				$(page).find("address").remove();
				$(page).append("<img width='150' height='150' src='"+empty_image_location+"'/>");
				$(page).append("<p class='flash'>No files are available in this directory.</p>");
				$(page).append("<a data-direction='reverse' id='parentEmptyLink' href='"+parentLink+"'>Parent Directory</a>");
			}
		}



		/**
		 * UI Handler
		 * User clicks sort
		 */
		function _clickSort(e) {
			var page = page = $($.mobile.activePage);
			
			var sortLink = $(this);
			var elementsToSort = $(page).find('table td').parent().not('.parentDirectoryLink');
			console.log(elementsToSort.length + " rows exist!!!");
			// Note: We would have to adjust column index because of the icon in each row
			// but $.eq is 0 based and $.index is 1 based, so it works out.
			var columnIndex = $(this).parent().index();

			// Toggle sort order
			sortLink.data('ascending',!sortLink.data('ascending'));

			elementsToSort.fadeOut(5,function() {
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
				elementsToSort.fadeIn(300);
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
			return /^(?!.*(^\s*$|\/$|Parent Directory$))/.test($(this).text());
		}




	});
})(jQuery);
