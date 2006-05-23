/*****************************************************************************
 directoryList.js

******************************************************************************
 Written in 2005 by Mignon Belongie

 Copyright rights relinquished under the Creative Commons
 Public Domain Dedication:
		http://creativecommons.org/licenses/publicdomain/

 You can copy freely from this file.  This work may be freely reproduced,
 distributed, transmitted, used, modified, built upon, or otherwise exploited
 by anyone for any purpose.

 This work is provided on an "AS IS" basis, without warranties or conditions
 of any kind, either express or implied, including, without limitation, any
 warranties or conditions of title, non-infringement, merchantability, or
 fitness for a particular purpose. You are solely responsible for determining
 the appropriateness of using or distributing the work and assume all risks
 associated with use of this work, including but not limited to the risks and
 costs of errors, compliance with applicable laws, damage to or loss of data
 or equipment, and unavailability or interruption of operations.

 In no event shall the authors or contributors have any liability for any
 direct, indirect, incidental, special, exemplary, or consequential damages,
 however caused and on any theory of liability, whether in contract, strict
 liability, or tort (including negligence), arising in any way out of or in
 connection with the use or distribution of the work.
*****************************************************************************/

dojo.provide("orp.storage.directoryList");
dojo.require("orp.storage.fileProtocolUtil");
dojo.require("orp.storage.httpProtocolUtil");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
/*global window, document  */
// -------------------------------------------------------------------

/**
 * @scope    public function
 * @param    dirNameRelativeToWindowLocation
 * @param    suffix                                   // if null or undefined, all files will be listed
 * @return   an array of the files in the directory
 * @throws   Throws an Error if directory doesn't exist, isn't a directory, or can't be read.
 */
orp.storage.getDirList = function(dirNameRelativeToWindowLocation, suffix) {
	var dirList = [];
	var thisUrl = window.location.pathname; // e.g .../someDirectory/currentWindow.html
	var arrayOfPathComponents = thisUrl.split('/');
	arrayOfPathComponents.pop();
	var thisDirectory = arrayOfPathComponents.join('/'); // e.g .../someDirectory
	if (window.location.protocol == "http:") {
		var response = this._getDirListFromPhp(thisDirectory, dirNameRelativeToWindowLocation, suffix);
		if (response[0] != '[') { // i.e. get_list_of_files_in_dir.php returned a message instead of an array
			throw new Error(response);
		}
		eval("dirList = " + response);
	}
	if (window.location.protocol == "file:") {
		if (window.Components) {
			var arrayOfAdditions = dirNameRelativeToWindowLocation.split('/');
			var pathToDirectory = orp.storage.getLocalPathFromWindowLocation(arrayOfAdditions);
			dirList = this._getDirListFromMozillaComponent(pathToDirectory, suffix);
		} else {
			throw new Error("window.Components == null");
		}
	}
	return dirList;
};

// FIXME: This hack should be replaced by something better, perhaps using dojo.hostenv.getBaseScriptUri().
orp.storage.PATH_TO_TRUNK_DIRECTORY_FROM_WINDOW_LOCATION = null;
orp.storage.PATH_TO_WINDOW_LOCATION_FROM_TRUNK_DIRECTORY = null;

orp.storage._getDirListFromPhp = function(thisDirectory, dirNameRelativeToWindowLocation, suffix) {
	var newXMLHttpRequestObject = new XMLHttpRequest();
	var pathToTrunkFromPhpFile = "../..";

	var dirNameRelativeToPhpFile = pathToTrunkFromPhpFile + '/';
	if (orp.storage.PATH_TO_WINDOW_LOCATION_FROM_TRUNK_DIRECTORY) {
		dirNameRelativeToPhpFile += orp.storage.PATH_TO_WINDOW_LOCATION_FROM_TRUNK_DIRECTORY + '/';
	}
	dirNameRelativeToPhpFile += dirNameRelativeToWindowLocation;

	var pathToPhpDirectoryFromWindowLocation = "";
	if (orp.storage.PATH_TO_TRUNK_DIRECTORY_FROM_WINDOW_LOCATION) {
		pathToPhpDirectoryFromWindowLocation += orp.storage.PATH_TO_TRUNK_DIRECTORY_FROM_WINDOW_LOCATION + '/';
	}
	pathToPhpDirectoryFromWindowLocation += orp.storage.httpProtocolUtil.PATH_TO_PHP_FILES_FROM_TRUNK + '/';

	var pathToPhpFileFromWindowLocation = pathToPhpDirectoryFromWindowLocation + "get_list_of_files_in_dir.php";
	var url = "";
	url += thisDirectory + '/' + pathToPhpFileFromWindowLocation +
						"?dir=" + dirNameRelativeToPhpFile;
	if (suffix) {
		url += "&suffix=" + suffix;
	}
	newXMLHttpRequestObject.open("GET", url, false);
	newXMLHttpRequestObject.send(null);
	return newXMLHttpRequestObject.responseText;
};

orp.storage._getDirListFromMozillaComponent = function(pathToDirectory, suffix) {
	var dirList = [];
	var dirPath = pathToDirectory;
	netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
	var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
	file.initWithPath(dirPath);
	if (!file.exists()) {
		throw new Error(dirPath + " not found.");
	}
	if (!file.isDirectory()) {
		throw new Error(dirPath + " is not a directory.");
	}
	// file is the given directory (nsIFile)
	var entries = file.directoryEntries;
	while(entries.hasMoreElements()) {
		var entry = entries.getNext();
		entry.QueryInterface(Components.interfaces.nsIFile);
		if (suffix) {
			var parts = entry.leafName.split('.');
			if (parts.length != 2 || parts[1] != suffix) {
				continue;
			}
		}
		dirList.push(entry.leafName); // could be entry.path instead, if needed...
	}
	return dirList;
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
