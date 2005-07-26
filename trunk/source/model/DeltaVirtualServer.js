/*****************************************************************************
 DeltaVirtualServer.js
 
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
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global window */
/*global XMLHttpRequest, ActiveXObject  */
/*global Util, DateValue  */
/*global World, Item, Entry, Ordinal, Vote  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// DeltaVirtualServer public class constants
// -------------------------------------------------------------------
DeltaVirtualServer.PATH_TO_REPOSITORY_DIRECTORY = "repositories";


/**
 * The DeltaVirtualServer is a datastore that loads and saves
 * an entire World of items as a single monolithic JSON string.
 *
 * @scope    public instance constructor
 * @param    inJsonRepositoryString    A JSON string literal representing the world of items. 
 */
DeltaVirtualServer.prototype = new StubVirtualServer();  // makes DeltaVirtualServer be a subclass of StubVirtualServer
function DeltaVirtualServer(repositoryName, pathToTrunkDirectory, optionalDefaultOverrides) {
  StubVirtualServer.call(this, pathToTrunkDirectory, optionalDefaultOverrides);
  this._pathToTrunkDirectory = "";
  if (pathToTrunkDirectory) {
    this._pathToTrunkDirectory = pathToTrunkDirectory;
  }
  
  var axiomaticFileName = "2005_june_axiomatic_items.json";
  var urlForAxiomaticFile = this._pathToTrunkDirectory + "source/model/" + axiomaticFileName;
  
  this._dehydratedAxiomFileURL = urlForAxiomaticFile;  
  this._repositoryName = repositoryName;
  this._hasEverFailedToSaveFlag = false;
}


/**
 * Initializes the instance variables for a newly created DeltaVirtualServer,
 * and does the initial loading of at least the axiomatic items.
 *
 * @scope    public instance method
 * @param    world    The world that we provide data for. 
 */
DeltaVirtualServer.prototype.setWorldAndLoadAxiomaticItems = function(world) {
  this._initialize(world);
  // this._buildTypeHashTable();
  this._loadAxiomaticItemsFromFileAtURL(this._dehydratedAxiomFileURL);

  var repositoryFileName = this._repositoryName + ".json";
  var repositoryUrl = this._pathToTrunkDirectory + DeltaVirtualServer.PATH_TO_REPOSITORY_DIRECTORY + "/" + repositoryFileName;
  var repositoryContentString = Util.getStringContentsOfFileAtURL(repositoryUrl);
  repositoryContentString += " ] }";

  this._loadWorldFromJsonString(repositoryContentString);
};


// -------------------------------------------------------------------
// Private Methods
// -------------------------------------------------------------------

/**
 * Loads a world of items from a dehydrated JSON string.
 *
 * Given a world of items in JSON format, bootstraps new 
 * instances of items corresponding to the dehydrated data.
 * 
 * @scope    private instance method
 * @param    jsonRepositoryString    A JSON string literal representing the world of items. 
 */
DeltaVirtualServer.prototype._loadWorldFromJsonString = function(jsonRepositoryString) {

  // load the list of records
  Util.assert(Util.isString(jsonRepositoryString));
  var dehydratedRecords = null;
  eval("dehydratedRecords = " + jsonRepositoryString + ";");
  Util.assert(Util.isObject(dehydratedRecords));
  var recordFormat = dehydratedRecords[StubVirtualServer.JSON_MEMBER_FORMAT];
  Util.assert(recordFormat == StubVirtualServer.JSON_FORMAT_2005_JUNE_RECORDS);
  var listOfRecords = dehydratedRecords[StubVirtualServer.JSON_MEMBER_RECORDS];
  Util.assert(Util.isArray(listOfRecords));
  
  var listOfUsers = null;
  
  this._rehydrateRecords(listOfRecords);
};
  

/**
 * Given a string, returns a copy of the string that is less than
 * 25 characters long.
 *
 * @scope    public instance method
 * @param    string    A string that may need truncating.
 * @return   A string that is. 
 */
DeltaVirtualServer.prototype.truncateString = function(string) {
  var maxLength = 80;
  var ellipsis = "...";
  var returnString = "";
  if (string.length > maxLength) {
    returnString = (string.substring(0, (maxLength - ellipsis.length)) + ellipsis);
  } else {
    returnString = string;
  }
  return this.encodeText(returnString);
};


/**
 * Returns a big string, containing JavaScript "object literal"
 * representations of all of the records in a Transaction.
 *
 * @scope    private instance method
 * @param    transaction    A transaction object.
 * @return   A JSON string literal, representing the records in the transaction. 
 */
DeltaVirtualServer.prototype._getJsonStringRepresentingTransaction = function(transaction) {
  var indent = "  ";
  var listOfRecords = transaction.getRecords();
  if (!listOfRecords || listOfRecords.length === 0) {
    return "";
  }
  
  if (listOfRecords.length == 1) {
    return this._getJsonStringRepresentingRecords(listOfRecords, indent);
  } else {
    indent = "    ";
    var listOfStrings = [];
    listOfStrings.push("  // =======================================================================\n");
    listOfStrings.push('  { "' + StubVirtualServer.JSON_MEMBER_TRANSACTION_CLASS + '": [\n');
    var content = this._getJsonStringRepresentingRecords(transaction.getRecords(), indent);
    listOfStrings.push(content);
    listOfStrings.push('  ]\n');
    listOfStrings.push('  }');
    
    var finalString = listOfStrings.join("");
    return finalString;
  }
};


/**
 *
 */
DeltaVirtualServer.prototype._getTypedDisplayStringForItem = function(item) {
  var returnString = "(";
  if (item) {
    Util.assert(item instanceof Item);
    var category = item.getFirstCategory();
    if (category) {
      returnString += this.truncateString(category.getDisplayString("???")) + ": ";
    }
    returnString += this.truncateString(item.getDisplayString("???"));
  }
  returnString += ")";
  return returnString;
};

  
/**
 * Returns a big string, containing JavaScript "object literal"
 * representations of the records.
 *
 * @scope    private instance method
 * @param    listOfRecords    A list of the records to include in the JSON string.
 * @param    indent    Optional. A string of spaces to prepend to each line.
 * @return   A JSON string literal, representing the records. 
 */
DeltaVirtualServer.prototype._getJsonStringRepresentingRecords = function(listOfRecords, indent) {
  indent = indent || "";
  var key;
  var listOfStrings = [];
  var firstContentRecord = true;
  var itemDisplayNameSubstring;
  var entryDisplayNameSubstring;
  var listOfUsers = null;
  var commentString;

  for (key in listOfRecords) {
    var record = listOfRecords[key];
    if (firstContentRecord) {
      firstContentRecord = false;
    } else {
      listOfStrings.push(',\n');
    }
    listOfStrings.push(indent + '// -----------------------------------------------------------------------\n');

    if (record instanceof Item) {
      var item = record;
      listOfStrings.push(indent + '// ' + this._getTypedDisplayStringForItem(item) + '\n');
      listOfStrings.push(indent + '//           by (' + this.truncateString(item.getUserstamp().getDisplayString()) + ')');
      listOfStrings.push(' on (' + DateValue.getStringMonthDayYear(item.getCreationDate()) + ')\n');
      listOfStrings.push(indent + '{ "' + StubVirtualServer.JSON_MEMBER_ITEM_CLASS + '": ');
      listOfStrings.push('{ "' + StubVirtualServer.JSON_MEMBER_UUID + '": "' + item._getUuid() + '" }');
      listOfStrings.push(' }');
      
      if (!listOfUsers) {
        listOfUsers = this.getUsers();
      }
      if (Util.isObjectInSet(item, listOfUsers)) {
        var user = item;
        var password = this._hashTableOfUserAuthenticationInfo[user.getUniqueKeyString()];
        var passwordString = "null";
        if (password) {
          passwordString = '"' + password + '"';
        }
        listOfStrings.push(',\n');
        listOfStrings.push(indent + '// -----------------------------------------------------------------------\n');
        listOfStrings.push(indent + '// ' + this._getTypedDisplayStringForItem(user) + '\n');
        listOfStrings.push(indent + '{ "' + StubVirtualServer.JSON_MEMBER_USER_CLASS + '": ' + '{\n');
        listOfStrings.push(indent + '         "' + StubVirtualServer.JSON_MEMBER_USER + '": "' + user._getUuid() + '",\n');
        listOfStrings.push(indent + '     "' + StubVirtualServer.JSON_MEMBER_PASSWORD + '": ' + passwordString + ' }\n');
        listOfStrings.push(indent + '}');
      }
    }

    if (record instanceof Vote) {
      var vote = record;
      entryDisplayNameSubstring = this.truncateString(vote.getContentRecord().getDisplayString());
      var deleteVsRetainString = vote.getRetainFlag() ? "RETAIN" : "DELETE";
      listOfStrings.push(indent + '// vote to ' + deleteVsRetainString + " " + entryDisplayNameSubstring + '\n');
      listOfStrings.push(indent + '{ "' + StubVirtualServer.JSON_MEMBER_VOTE_CLASS + '": ' + '{\n');
      listOfStrings.push(indent + '         "' + StubVirtualServer.JSON_MEMBER_UUID + '": "' + vote._getUuid() + '",\n');
      listOfStrings.push(indent + '       "' + StubVirtualServer.JSON_MEMBER_RECORD + '": "' + vote.getContentRecord()._getUuid() + '",\n');
      listOfStrings.push(indent + '   "' + StubVirtualServer.JSON_MEMBER_RETAIN_FLAG + '": "' + vote.getRetainFlag() + '"');
      listOfStrings.push('  }\n');
      listOfStrings.push(indent + '}');
    }

    if (record instanceof Ordinal) {
      var ordinal = record;
      entryDisplayNameSubstring = this.truncateString(ordinal.getContentRecord().getDisplayString());
      listOfStrings.push(indent + '// ordinal # ' + ordinal.getOrdinalNumber() + " for " + entryDisplayNameSubstring + '\n');
      listOfStrings.push(indent + '{ "' + StubVirtualServer.JSON_MEMBER_ORDINAL_CLASS + '": ' + '{' + '\n');
      listOfStrings.push(indent + '         "' + StubVirtualServer.JSON_MEMBER_UUID + '": "' + ordinal._getUuid() + '",\n');
      listOfStrings.push(indent + '    "' + StubVirtualServer.JSON_MEMBER_RECORD + '": "' + ordinal.getContentRecord()._getUuid() + '",\n');
      listOfStrings.push(indent + '    "' + StubVirtualServer.JSON_MEMBER_ORDINAL_NUMBER + '": "' + ordinal.getOrdinalNumber() + '"');
      listOfStrings.push('  }\n');
      listOfStrings.push(indent + '}');
    }

    if (record instanceof Entry) {
      var entry = record;
      var entryType = entry.getType();
      var typeUuid = entryType._getUuid();
      commentString = "";
      var entryString = "";
      entryString += indent + '{ "' + StubVirtualServer.JSON_MEMBER_ENTRY_CLASS + '": ' + '{\n';
      entryString += indent + '         "' + StubVirtualServer.JSON_MEMBER_UUID + '": "' + entry._getUuid() + '",\n';
      var previousEntry = entry.getPreviousEntry();
      if (previousEntry) {
        entryString += indent + '"' + StubVirtualServer.JSON_MEMBER_PREVIOUS_VALUE + '": "' + previousEntry._getUuid() + '",\n';
      }
      entryString += indent + '         "' + StubVirtualServer.JSON_MEMBER_TYPE + '": "' + typeUuid + '",\n';
      if (typeUuid == World.UUID_FOR_TYPE_CONNECTION) {
        var pairOfItems = entry.getItem();
        var firstItem = pairOfItems[0];
        var secondItem = pairOfItems[1];
        entryString += indent + '         "' + StubVirtualServer.JSON_MEMBER_ITEM + '": ["' + firstItem._getUuid() + '", "' + secondItem._getUuid() + '"],\n';
        var pairOfAttributes = entry.getAttribute();
        var firstAttribute = pairOfAttributes[0];
        var secondAttribute = pairOfAttributes[1];
        entryString += indent + '    "' + StubVirtualServer.JSON_MEMBER_ATTRIBUTE + '": ["' + firstAttribute._getUuid() + '", "' + secondAttribute._getUuid() + '"]';
        commentString += indent + '// ' + this._getTypedDisplayStringForItem(firstItem);
        commentString += ".(" + this.truncateString(firstAttribute.getDisplayString("???")) + ")";
        commentString += " = " + this._getTypedDisplayStringForItem(secondItem) + "\n";
        commentString += indent + '// ' + this._getTypedDisplayStringForItem(secondItem);
        commentString += ".(" + this.truncateString(secondAttribute.getDisplayString("???")) + ")";
        commentString += " = " + this._getTypedDisplayStringForItem(firstItem) + "\n";
      } else {
        var attribute = entry.getAttribute();
        entryString += indent + '    "' + StubVirtualServer.JSON_MEMBER_ATTRIBUTE + '": "' + attribute._getUuid() + '",\n';
        entryString += indent + '         "' + StubVirtualServer.JSON_MEMBER_ITEM + '": "' + entry.getItem()._getUuid() + '",\n';
        var contentData = entry.getValue();
        
        var valueString = null;
        var valueComment = null;
        switch (typeUuid) {
          case World.UUID_FOR_TYPE_NUMBER: 
            valueString = '"' + contentData + '"';
            valueComment = contentData;
            break;
          case World.UUID_FOR_TYPE_TEXT: 
            valueString = '"' + this.encodeText(contentData) + '"';
            valueComment = '"' + this.truncateString(contentData) + '"';
            break;
          case World.UUID_FOR_TYPE_DATE: 
            valueString = '"' + contentData.toString() + '"';
            valueComment = valueString;
            break;
          case World.UUID_FOR_TYPE_ITEM: 
            valueString = '"' + contentData._getUuid() + '"';
            valueComment = this._getTypedDisplayStringForItem(contentData);
            break;
          default:
            Util.assert(false, "no such type: " + entryType.getDisplayString());
        }
        entryString += indent + '        "' + StubVirtualServer.JSON_MEMBER_VALUE + '": ' + valueString;
        commentString += indent + '// ' + this._getTypedDisplayStringForItem(entry.getItem());
        commentString += ".(" + this.truncateString(attribute.getDisplayString("???")) + ")";
        commentString += " = " + valueComment + "\n";
      }
      commentString += indent + '//           by (' + this.truncateString(entry.getUserstamp().getDisplayString()) + ')';
      commentString += ' on (' + DateValue.getStringMonthDayYear(entry.getCreationDate()) + ')\n';
      listOfStrings.push(commentString);
      listOfStrings.push(entryString);
      listOfStrings.push('  }\n');
      listOfStrings.push(indent + '}');
    }
  }
  
  var finalString = listOfStrings.join("");
  return finalString;
};


/**
 * Sends all the changes to the server, so that the server can record the
 * changes.
 *
 * @scope    public instance method
 * @param    forceSave    Optional. Forces a save if set to true. 
 * @return   The list of changes made. 
 */
DeltaVirtualServer.prototype.saveChangesToServer = function(forceSave) {
  var currentTransaction = this.getCurrentTransaction();
  var listOfChangesMade = currentTransaction.getRecords();
  if (!forceSave && listOfChangesMade.length === 0) {
    return listOfChangesMade;
  }
  
  if (!this._saverObject) {
    if (window.location) {
      if (window.location.protocol == "http:") {
        this._saverObject = new HttpSaver(this._pathToTrunkDirectory, this._repositoryName);
      }
      if (window.location.protocol == "file:") {
        // var fileName = this._repositoryName + ".json";
        this._saverObject = new FileSaver(this._repositoryName);
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
    var textToAppend = ",\n" + this._getJsonStringRepresentingTransaction(currentTransaction);
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
