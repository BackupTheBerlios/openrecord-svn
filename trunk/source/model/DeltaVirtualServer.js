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
// Provides and Requires
// -------------------------------------------------------------------
dojo.provide("orp.model.DeltaVirtualServer");
dojo.require("orp.model.StubVirtualServer");
dojo.require("orp.model.World");
dojo.require("orp.model.Vote");
dojo.require("orp.model.FileSaver");
dojo.require("orp.model.HttpSaver");
dojo.require("orp.lang.Lang");

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
 * The DeltaVirtualServer is a datastore that loads and saves
 * an entire World of items as a single monolithic JSON string.
 *
 * @scope    public instance constructor
 * @param    inJsonRepositoryString    A JSON string literal representing the world of items. 
 */
orp.model.DeltaVirtualServer = function(repositoryName, pathToTrunkDirectory, optionalDefaultOverrides) {
  orp.model.StubVirtualServer.call(this, pathToTrunkDirectory, optionalDefaultOverrides);
  this._repositoryName = repositoryName;
  this._pathToTrunkDirectory = "";
  if (pathToTrunkDirectory) {
    this._pathToTrunkDirectory = pathToTrunkDirectory;
  }
  this._hasEverFailedToSaveFlag = false;
};

dj_inherits(orp.model.DeltaVirtualServer, orp.model.StubVirtualServer);  // makes DeltaVirtualServer be a subclass of StubVirtualServer


// -------------------------------------------------------------------
// Public constants
// -------------------------------------------------------------------
orp.model.DeltaVirtualServer.PATH_TO_REPOSITORY_DIRECTORY = "repositories";


// -------------------------------------------------------------------
// Public methods
// -------------------------------------------------------------------

/**
 * Initializes the instance variables for a newly created DeltaVirtualServer,
 * and does the initial loading of at least the axiomatic items.
 *
 * @scope    public instance method
 * @param    world    The world that we provide data for. 
 */
orp.model.DeltaVirtualServer.prototype.setWorldAndLoadAxiomaticItems = function(world) {
  this._initialize(world);
  this._loadAxiomaticItemsFromFileAtURL(this._dehydratedAxiomFileURL);

  var repositoryFileName = this._repositoryName + ".json";
  var repositoryUrl = "";
  if (this._needCompletePath) {
    repositoryUrl = this._completePathToTrunkDirectory + '/';
  }
  repositoryUrl += orp.model.DeltaVirtualServer.PATH_TO_REPOSITORY_DIRECTORY + "/" + repositoryFileName;
  // var repositoryContentString = orp.util.getStringContentsOfFileAtURL(repositoryUrl);
  var repositoryContentString = dojo.hostenv.getText(repositoryUrl);
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
orp.model.DeltaVirtualServer.prototype._loadWorldFromJsonString = function(jsonRepositoryString) {

  // load the list of records
  orp.lang.assertType(jsonRepositoryString, String);
  var dehydratedRecords = null;
  eval("dehydratedRecords = " + jsonRepositoryString + ";");
  orp.lang.assertType(dehydratedRecords, Object);
  var recordFormat = dehydratedRecords[orp.model.StubVirtualServer.JSON_MEMBER.FORMAT];
  orp.lang.assert(recordFormat == orp.model.StubVirtualServer.JSON_FORMAT.FORMAT_2005_JUNE_CHRONOLOGICAL_LIST);
  var listOfRecords = dehydratedRecords[orp.model.StubVirtualServer.JSON_MEMBER.RECORDS];
  orp.lang.assertType(listOfRecords, Array);
  
  var listOfUsers = null;
  
  this._rehydrateRecords(listOfRecords);
};


/**
 * Given a string, returns a copy of the string that is less than
 * 80 characters long.
 *
 * @scope    private instance method
 * @param    string    A string that may need truncating.
 * @return   A string that is no longer than 80 characters long.
 */
orp.model.DeltaVirtualServer.prototype._truncateString = function(string) {
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
orp.model.DeltaVirtualServer.prototype._getJsonStringRepresentingTransaction = function(transaction) {
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
    listOfStrings.push('  { "' + orp.model.StubVirtualServer.JSON_MEMBER.TRANSACTION_CLASS + '": [\n');
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
orp.model.DeltaVirtualServer.prototype._getTypedDisplayStringForItem = function(item) {
  var returnString = "(";
  if (item) {
    if (item instanceof orp.model.Item) {
      var category = item.getFirstCategory();
      if (category) {
        returnString += this._truncateString(category.getDisplayString("???")) + ": ";
      }
      returnString += this._truncateString(item.getDisplayString("???"));
    }
    if (item instanceof orp.model.Entry) {
      returnString += "Entry";
    }
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
orp.model.DeltaVirtualServer.prototype._getJsonStringRepresentingRecords = function(listOfRecords, indent) {
  indent = indent || "";
  var i;
  var listOfStrings = [];
  var firstContentRecord = true;
  var itemDisplayNameSubstring;
  var entryDisplayNameSubstring;
  var listOfUsers = null;
  var commentString;
  var generateComments = false;
  var JSON_MEMBER = orp.model.StubVirtualServer.JSON_MEMBER;

  if (!generateComments) {
    indent = "";
  }
  
  for (i in listOfRecords) {
    var record = listOfRecords[i];
    if (firstContentRecord) {
      firstContentRecord = false;
    } else {
      listOfStrings.push(',\n');
    }
    if (generateComments) {
      listOfStrings.push(indent + '// -----------------------------------------------------------------------\n');
    }
    
    if (record instanceof orp.model.Item) {
      var item = record;
      if (generateComments) {
        listOfStrings.push(indent + '// ' + this._getTypedDisplayStringForItem(item) + '\n');
        listOfStrings.push(indent + '//           by (' + this._truncateString(item.getUserstamp().getDisplayString()) + ')');
        listOfStrings.push(' on (' + orp.util.DateValue.getStringMonthDayYear(item.getCreationDate()) + ')\n');
      }
      if (!this._jsonFragmentForItemPrefix) {
        this._jsonFragmentForItemPrefix = indent + '{ "' + JSON_MEMBER.ITEM_CLASS + '": ';
        this._jsonFragmentForItemPrefix += '{ "' + JSON_MEMBER.UUID + '": ';
      }
      listOfStrings.push(this._jsonFragmentForItemPrefix);
      listOfStrings.push(item._getUuidInQuotes());
      listOfStrings.push(' } }');
      
      if (!listOfUsers) {
        listOfUsers = this.getUsers();
      }
      if (orp.util.isObjectInSet(item, listOfUsers)) {
        var user = item;
        var password = this._hashTableOfUserAuthenticationInfo[user.getUuid()];
        var passwordString = "null";
        if (password) {
          passwordString = '"' + password + '"';
        }
        listOfStrings.push(',\n');
        if (generateComments) {
          listOfStrings.push(indent + '// -----------------------------------------------------------------------\n');
          listOfStrings.push(indent + '// ' + this._getTypedDisplayStringForItem(user) + '\n');
        }
        listOfStrings.push(indent + '{ "' + JSON_MEMBER.USER_CLASS + '": ' + '{\n');
        listOfStrings.push(indent + '         "' + JSON_MEMBER.USER + '": ' + user._getUuidInQuotes() + ',\n');
        listOfStrings.push(indent + '     "' + JSON_MEMBER.PASSWORD + '": ' + passwordString + ' }\n');
        listOfStrings.push(indent + '}');
      }
    }

    if (record instanceof orp.model.Vote) {
      var vote = record;
      entryDisplayNameSubstring = this._getTypedDisplayStringForItem(vote.getContentRecord());
      var deleteVsRetainString = vote.getRetainFlag() ? "RETAIN" : "DELETE";
      if (generateComments) {
        listOfStrings.push(indent + '// vote to ' + deleteVsRetainString + " " + entryDisplayNameSubstring + '\n');
      }
      listOfStrings.push(indent + '{ "' + JSON_MEMBER.VOTE_CLASS + '": ' + '{\n');
      listOfStrings.push(indent + '         "' + JSON_MEMBER.UUID + '": ' + vote._getUuidInQuotes() + ',\n');
      listOfStrings.push(indent + '       "' + JSON_MEMBER.RECORD + '": ' + vote.getContentRecord()._getUuidInQuotes() + ',\n');
      listOfStrings.push(indent + '   "' + JSON_MEMBER.RETAIN_FLAG + '": "' + vote.getRetainFlag() + '"');
      listOfStrings.push('  }\n');
      listOfStrings.push(indent + '}');
    }

    if (record instanceof orp.model.Ordinal) {
      var ordinal = record;
      entryDisplayNameSubstring = this._getTypedDisplayStringForItem(ordinal.getContentRecord());
      if (generateComments) {
        listOfStrings.push(indent + '// ordinal # ' + ordinal.getOrdinalNumber() + " for " + entryDisplayNameSubstring + '\n');
      }
      listOfStrings.push(indent + '{ "' + JSON_MEMBER.ORDINAL_CLASS + '": ' + '{' + '\n');
      listOfStrings.push(indent + '         "' + JSON_MEMBER.UUID + '": ' + ordinal._getUuidInQuotes() + ',\n');
      listOfStrings.push(indent + '       "' + JSON_MEMBER.RECORD + '": ' + ordinal.getContentRecord()._getUuidInQuotes() + ',\n');
      listOfStrings.push(indent + '        "' + JSON_MEMBER.ORDINAL_NUMBER + '": "' + ordinal.getOrdinalNumber() + '"');
      listOfStrings.push('  }\n');
      listOfStrings.push(indent + '}');
    }

    if (record instanceof orp.model.Entry) {
      var entry = record;
      var entryType = entry.getType();
      var typeUuid = entryType.getUuid();
      // var entryString = "";
      if (generateComments) {
        listOfStringsForEntry = [];
      } else {
        listOfStringsForEntry = listOfStrings;
      }
      listOfStringsForEntry.push(indent + '{ "' + JSON_MEMBER.ENTRY_CLASS + '": ' + '{\n');
      listOfStringsForEntry.push(indent + '         "' + JSON_MEMBER.UUID + '": ' + entry._getUuidInQuotes() + ',\n');
      var previousEntry = entry.getPreviousEntry();
      if (previousEntry) {
        listOfStringsForEntry.push(indent + '"' + JSON_MEMBER.PREVIOUS_VALUE + '": ' + previousEntry._getUuidInQuotes() + ',\n');
      }
      listOfStringsForEntry.push(indent + '         "' + JSON_MEMBER.TYPE + '": "' + typeUuid.toString() + '",\n');
      if (generateComments) {
        commentString = "";
      }
      if (typeUuid.toString() == orp.model.World.UUID.TYPE_CONNECTION) {
        var pairOfItems = entry.getItem();
        var firstItem = pairOfItems[0];
        var secondItem = pairOfItems[1];
        listOfStringsForEntry.push(indent + '         "' + JSON_MEMBER.ITEM + '": [' + firstItem._getUuidInQuotes() + ', ' + secondItem._getUuidInQuotes() + '],\n');
        var pairOfAttributes = entry.getAttribute();
        var firstAttribute = pairOfAttributes[0];
        var secondAttribute = pairOfAttributes[1];
        listOfStringsForEntry.push(indent + '    "' + JSON_MEMBER.ATTRIBUTE + '": [' + firstAttribute._getUuidInQuotes() + ', ' + secondAttribute._getUuidInQuotes() + ']');
        if (generateComments) {
          commentString += indent + '// ' + this._getTypedDisplayStringForItem(firstItem);
          commentString += ".(" + this._truncateString(firstAttribute.getDisplayString("???")) + ")";
          commentString += " = " + this._getTypedDisplayStringForItem(secondItem) + "\n";
          commentString += indent + '// ' + this._getTypedDisplayStringForItem(secondItem);
          commentString += ".(" + this._truncateString(secondAttribute.getDisplayString("???")) + ")";
          commentString += " = " + this._getTypedDisplayStringForItem(firstItem) + "\n";
        }
      } else {
        var attribute = entry.getAttribute();
        // if (!(attribute instanceof orp.model.Item)) {
        //   alert(entry + "\n" + attribute);
        // }
        listOfStringsForEntry.push(indent + '    "' + JSON_MEMBER.ATTRIBUTE + '": ' + attribute._getUuidInQuotes() + ',\n');
        listOfStringsForEntry.push(indent + '         "' + JSON_MEMBER.ITEM + '": ' + entry.getItem()._getUuidInQuotes() + ',\n');
        var contentData = entry.getValue();
        
        var valueString = null;
        var valueComment = null;
        switch (typeUuid.toString()) {
          case orp.model.World.UUID.TYPE_NUMBER: 
            valueString = '"' + contentData + '"';
            if (generateComments) {valueComment = contentData;}
            break;
          case orp.model.World.UUID.TYPE_TEXT: 
            valueString = '"' + this.encodeText(contentData) + '"';
            if (generateComments) {valueComment = '"' + this._truncateString(contentData) + '"';}
            break;
          case orp.model.World.UUID.TYPE_DATE: 
            valueString = '"' + contentData.toString() + '"';
            if (generateComments) {valueComment = valueString;}
            break;
          case orp.model.World.UUID.TYPE_ITEM: 
            valueString = contentData._getUuidInQuotes();
            if (generateComments) {valueComment = this._getTypedDisplayStringForItem(contentData);}
            break;
          default:
            orp.lang.assert(false, "no such type: " + entryType.getDisplayString());
        }
        listOfStringsForEntry.push(indent + '        "' + JSON_MEMBER.VALUE + '": ' + valueString);
        if (generateComments) {
          commentString += indent + '// ' + this._getTypedDisplayStringForItem(entry.getItem());
          commentString += ".(" + this._truncateString(attribute.getDisplayString("???")) + ")";
          commentString += " = " + valueComment + "\n";
        }
      }
      if (generateComments) {
        commentString += indent + '//           by (' + this._truncateString(entry.getUserstamp().getDisplayString()) + ')';
        commentString += ' on (' + orp.util.DateValue.getStringMonthDayYear(entry.getCreationDate()) + ')\n';
        listOfStrings.push(commentString);
        for (var j in listOfStringsForEntry) {
          listOfStrings.push(listOfStringsForEntry[j]);
        }
      }
      // listOfStrings.push(entryString);
      listOfStrings.push('  }\n');
      listOfStrings.push(indent + '}');
    }
  }
  
  var finalString = listOfStrings.join("");
  return finalString;
};


/**
 * @scope    private instance method
 * @param    overwriteIfExists    Optional
 * @return   success
 */
orp.model.DeltaVirtualServer.prototype._createNewRepository = function(overwriteIfExists) {
  if (this._saverObject) {
    alert("this._saverObject is already initialized.");
    return false;
  }
  if (window.location) {
    if (window.location.protocol == "http:") {
      this._saverObject = new orp.model.HttpSaver(this._repositoryName, this._pathToTrunkDirectory);
    }
    if (window.location.protocol == "file:") {
      this._saverObject = new orp.model.FileSaver(this._repositoryName, this._pathToTrunkDirectory);
    }
  }
  if (!this._saverObject) {
    if (!this._hasEverFailedToSaveFlag) {
      window.alert("I can't save changes to server, because this page was loaded from a \"file:///\" location, not a real \"http://\" location.  Sorry."); 
      this._hasEverFailedToSaveFlag = true;
    }
    return false;
  }
  var text = '{ "format": "' + orp.model.StubVirtualServer.JSON_FORMAT.FORMAT_2005_JUNE_CHRONOLOGICAL_LIST + '", \n';
  text +=    '  "records": [\n';
  text +=    '  // =======================================================================\n';
  text +=    '  { "Transaction": [ ]\n';
  text +=    '  }';
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
orp.model.DeltaVirtualServer.prototype._saveChangesToServer = function(forceSave) {
  var currentTransaction = this.getCurrentTransaction();
  var listOfChangesMade = currentTransaction.getRecords();
  if (!forceSave && listOfChangesMade.length === 0) {
    return listOfChangesMade;
  }
  
  if (!this._saverObject) {
    if (window.location) {
      if (window.location.protocol == "http:") {
        this._saverObject = new orp.model.HttpSaver(this._repositoryName, this._pathToTrunkDirectory);
      }
      if (window.location.protocol == "file:") {
        this._saverObject = new orp.model.FileSaver(this._repositoryName, this._pathToTrunkDirectory);
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
