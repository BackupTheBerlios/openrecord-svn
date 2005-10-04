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
dojo.provide("orp.storage.FakeStorage");
dojo.require("orp.storage.Storage");


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------
/**
 * The Storage class is the abstract superclass for the other storage 
 * classes, including FileStorage and HttpStorage.
 *
 * @param    repositoryName                         // e.g. demo_page
 * @param    pathToTrunkDirectoryFromWindowLocation // Not needed if window location is at the root of the trunk directory.
 * @scope    public instance constructor
 */
orp.storage.FakeStorage = function(repositoryName, pathToTrunkDirectoryFromWindowLocation) {
  orp.storage.Storage.call(this, repositoryName, pathToTrunkDirectoryFromWindowLocation);
  
  this._fakeFileContents = "";
};

dj_inherits(orp.storage.FakeStorage, orp.storage.Storage);  // makes FakeStorage be a subclass of Storage


// -------------------------------------------------------------------
// Public methods
// -------------------------------------------------------------------

/**
 * Appends text to a file.
 *
 * @param    textToWrite      A string with the text to append to the file.
 * @scope    public instance method
 */
orp.storage.FakeStorage.prototype.appendText = function(textToAppend) {
  this._fakeFileContents += textToAppend;
};


/**
 * Writes text to a file, completely replacing the contents of the file.
 *
 * @param    textToWrite      A string with the text to write to the file.
 * @param    overwriteIfExists      A boolean.  True to overwrite any existing file, or false to exit if there's an existing file.  
 * @scope    public instance method
 */
orp.storage.FakeStorage.prototype.writeText = function(textToWrite, overwriteIfExists) {
  if (overwriteIfExists || !this._fakeFileContents) {
    this._fakeFileContents = textToWrite;
  }
};


/**
 * Returns any text that was added using appendText() or writeText().
 *
 * @scope    public instance method
 * @return   Returns any text that was added using appendText() or writeText().
 */
orp.storage.FakeStorage.prototype.getFileContents = function() {
  return this._fakeFileContents;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
