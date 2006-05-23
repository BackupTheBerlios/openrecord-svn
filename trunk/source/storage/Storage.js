/*****************************************************************************
 Storage.js

******************************************************************************
 Written in 2005 by Brian Douglas Skinner <brian.skinner@gumption.org>

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


// -------------------------------------------------------------------
// Provides and Requires
// -------------------------------------------------------------------
dojo.provide("orp.storage.Storage");


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------
/**
 * The Storage class is the abstract superclass for the other storage
 * classes, including FileProtocolStorage and HttpProtocolStorage.
 *
 * @param    repositoryName                         // e.g. demo_page
 * @param    pathToTrunkDirectoryFromWindowLocation // Not needed if window location is at the root of the trunk directory.
 * @scope    public instance constructor
 */
orp.storage.Storage = function(repositoryName, repositoryDirectoryName, pathToTrunkDirectoryFromWindowLocation) {
	this._repositoryName = repositoryName;
	this._repositoryDirectoryName = repositoryDirectoryName;
	this._pathToTrunkDirectory = pathToTrunkDirectoryFromWindowLocation;
};


// -------------------------------------------------------------------
// Public methods
// -------------------------------------------------------------------

/**
 * Returns the _repositoryName value provided in the constructor.
 *
 * @scope    public instance method
 */
orp.storage.Storage.prototype.getRepositoryName = function() {
	return this._repositoryName;
};


/**
 * Returns the _pathToTrunkDirectory value provided in the constructor.
 *
 * @scope    public instance method
 */
orp.storage.Storage.prototype.getPathToTrunkDirectory = function() {
	return this._pathToTrunkDirectory;
};


/**
 * Appends text to a file.
 *
 * @param    textToWrite      A string with the text to append to the file.
 * @scope    public instance method
 */
orp.storage.Storage.prototype.appendText = function(textToAppend) {
	// Storage is an abstract superclass.
	// This method must be implemented by the subclasses.
	dj_unimplemented("appendText");
};


/**
 * Writes text to a file, completely replacing the contents of the file.
 *
 * @param    textToWrite      A string with the text to write to the file.
 * @param    overwriteIfExists      A boolean.  True to overwrite any existing file, or false to exit if there's an existing file.
 * @scope    public instance method
 */
orp.storage.Storage.prototype.writeText = function(textToWrite, overwriteIfExists) {
	// Storage is an abstract superclass.
	// This method must be implemented by the subclasses.
	dj_unimplemented("writeText");
};

orp.storage.Storage.prototype.getCurrentLocationDirectory = function() {
	var thisUrl = window.location.pathname; //e.g. /openrecord/trunk/demo_page.html or /openrecord/trunk/source/model/TestRepositoryWriting.html.
	var arrayOfPathComponents = thisUrl.split('/');
	arrayOfPathComponents.pop();
	return arrayOfPathComponents.join('/'); //e.g. /openrecord/trunk or /openrecord/trunk/source/model
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
