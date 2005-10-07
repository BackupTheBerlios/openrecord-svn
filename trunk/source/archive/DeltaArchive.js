/*****************************************************************************
 DeltaArchive.js
 
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
dojo.provide("orp.archive.DeltaArchive");
dojo.require("orp.archive.StubArchive");
dojo.require("orp.model.World");
dojo.require("orp.model.Vote");
dojo.require("orp.storage.FileStorage");
dojo.require("orp.storage.HttpStorage");
dojo.require("orp.lang.Lang");
dojo.require("orp.archive.JsonSerializer");
dojo.require("orp.archive.JsonDeserializer");
dojo.require("orp.archive.ArchiveLoader");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global window */
/*global XMLHttpRequest, ActiveXObject  */
/*global Util, DateValue  */
/*global World, Item, Entry, Ordinal, Vote  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------
/**
 * The DeltaArchive is a datastore that loads and saves
 * an entire World of items as a single monolithic JSON string.
 *
 * @scope    public instance constructor
 * @param    inJsonRepositoryString    A JSON string literal representing the world of items. 
 */
orp.archive.DeltaArchive = function(repositoryName, pathToTrunkDirectory) {
  orp.archive.StubArchive.call(this, pathToTrunkDirectory);
  this._repositoryName = repositoryName;
  this._pathToTrunkDirectory = "";
  if (pathToTrunkDirectory) {
    this._pathToTrunkDirectory = pathToTrunkDirectory;
  }
  this._hasEverFailedToSaveFlag = false;
};

dj_inherits(orp.archive.DeltaArchive, orp.archive.StubArchive);  // makes DeltaArchive be a subclass of StubArchive


// -------------------------------------------------------------------
// Public constants
// -------------------------------------------------------------------
orp.archive.DeltaArchive.PATH_TO_REPOSITORY_DIRECTORY = "repositories";


// -------------------------------------------------------------------
// Public methods
// -------------------------------------------------------------------

/**
 * Initializes the instance variables for a newly created DeltaArchive,
 * and does the initial loading of at least the axiomatic items.
 *
 * @scope    public instance method
 * @param    world    The world that we provide data for. 
 */
orp.archive.DeltaArchive.prototype.setWorldAndLoadAxiomaticItems = function(world) {
  this._initialize(world);
  this._loadAxiomaticItemsFromFileAtURL(this._axiomaticJsonFileURL);

  var repositoryFileName = this._repositoryName + ".json";
  var repositoryUrl = "";
  if (this._needCompletePath) {
    repositoryUrl = this._completePathToTrunkDirectory + '/';
  }
  repositoryUrl += orp.archive.DeltaArchive.PATH_TO_REPOSITORY_DIRECTORY + "/" + repositoryFileName;
  var repositoryContentString = dojo.hostenv.getText(repositoryUrl);
  var jsonFormat = new orp.archive.JsonFormat();
  repositoryContentString += jsonFormat.getRepositoryFooter();

  this._loadWorldFromJsonString(repositoryContentString);
};


// -------------------------------------------------------------------
// Private Methods
// -------------------------------------------------------------------

/**
 * Loads a world of items from a serialized JSON string.
 *
 * Given a world of items in JSON format, bootstraps new 
 * instances of items corresponding to the serialized data.
 * 
 * @scope    private instance method
 * @param    jsonRepositoryString    A JSON string literal representing the world of items. 
 */
orp.archive.DeltaArchive.prototype._loadWorldFromJsonString = function(jsonRepositoryString) {
  var archiveLoader = new orp.archive.ArchiveLoader(this);
  var deserializer = new orp.archive.JsonDeserializer(archiveLoader);
  deserializer.deserializeFromString(jsonRepositoryString);
};


/**
 * @scope    private instance method
 * @param    overwriteIfExists    Optional
 * @return   success
 */
orp.archive.DeltaArchive.prototype._createNewRepository = function(overwriteIfExists) {
  if (this._saverObject) {
    alert("this._saverObject is already initialized.");
    return false;
  }
  if (window.location) {
    if (window.location.protocol == "http:") {
      this._saverObject = new orp.storage.HttpStorage(this._repositoryName, this._pathToTrunkDirectory);
    }
    if (window.location.protocol == "file:") {
      this._saverObject = new orp.storage.FileStorage(this._repositoryName, this._pathToTrunkDirectory);
    }
  }
  if (!this._saverObject) {
    if (!this._hasEverFailedToSaveFlag) {
      window.alert("I can't save changes to server, because this page was loaded from a \"file:///\" location, not a real \"http://\" location.  Sorry."); 
      this._hasEverFailedToSaveFlag = true;
    }
    return false;
  }
  var jsonSerializer = new orp.archive.JsonSerializer(this);
  var text = jsonSerializer.getRepositoryHeader();
  return this._saverObject.writeText(text, overwriteIfExists);
};


/**
 * Sends all the changes to the server, so that the server can record the
 * changes.
 *
 * @scope    private instance method
 * @param    forceSave    Optional. Forces a save if set to true. 
 * @return   The list of changes made. 
 */
orp.archive.DeltaArchive.prototype._saveChangesToServer = function(forceSave) {
  var currentTransaction = this.getCurrentTransaction();
  var listOfChangesMade = currentTransaction.getRecords();
  if (!forceSave && listOfChangesMade.length === 0) {
    return listOfChangesMade;
  }
  
  if (!this._saverObject) {
    if (window.location) {
      if (window.location.protocol == "http:") {
        this._saverObject = new orp.storage.HttpStorage(this._repositoryName, this._pathToTrunkDirectory);
      }
      if (window.location.protocol == "file:") {
        this._saverObject = new orp.storage.FileStorage(this._repositoryName, this._pathToTrunkDirectory);
      }
    }
  }
  
  var key;
  var newRecord;
  for (key in listOfChangesMade) {
    newRecord = listOfChangesMade[key];
    this._chronologicalListOfRecords.push(newRecord);
  }

  if (this._saverObject) {
    var jsonSerializer = new orp.archive.JsonSerializer(this);
    var textToAppend = ",\n" + jsonSerializer.serializeToString(currentTransaction);
    this._saverObject.appendText(textToAppend);
  } else {
    if (!this._hasEverFailedToSaveFlag) {
      window.alert("I can't save changes to server, because this page was loaded from a \"file:///\" location, not a real \"http://\" location.  Sorry."); 
      this._hasEverFailedToSaveFlag = true;
    }
  }
  
  this._currentTransaction = null;
  return listOfChangesMade;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
