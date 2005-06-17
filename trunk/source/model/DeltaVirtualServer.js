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
// Dependencies:
//   Util.js
//   World.js
//   Item.js
//   Vote.js
//   Entry.js
//   Ordinal.js
// -------------------------------------------------------------------


/**
 * The DeltaVirtualServer is a datastore that loads and saves
 * an entire World of items as a single monolithic JSON string.
 *
 * @scope    public instance constructor
 * @param    inJsonRepositoryString    A JSON string literal representing the world of items. 
 * @param    inJsonUserList    A JSON string literal listing user UUIDs and passwords. 
 */
DeltaVirtualServer.prototype = new StubVirtualServer();  // makes DeltaVirtualServer be a subclass of StubVirtualServer
function DeltaVirtualServer(inJsonAxiomsFileURL, inJsonRepositoryString, inJsonUserList) {
  this._myDehydratedAxiomFileURL = inJsonAxiomsFileURL;
  this._myDehydratedWorld = inJsonRepositoryString;
  this._myDehydratedUserList = inJsonUserList;
  this._myHasEverFailedToSaveFlag = false;
}


/**
 * Initializes the instance variables for a newly created DeltaVirtualServer,
 * and does the initial loading of at least the axiomatic items.
 *
 * @scope    public instance method
 * @param    inWorld    The world that we provide data for. 
 */
DeltaVirtualServer.prototype.setWorldAndLoadAxiomaticItems = function (inWorld) {
  this._initialize(inWorld);
  this._buildTypeHashTable();
  this._loadAxiomaticItemsFromFileAtURL(this._myDehydratedAxiomFileURL);
  this._loadWorldFromJsonStrings(this._myDehydratedWorld, this._myDehydratedUserList);
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
 * @param    inJsonRepositoryString    A JSON string literal representing the world of items. 
 * @param    inJsonUserList    A JSON string literal listing user UUIDs and passwords. 
 */
DeltaVirtualServer.prototype._loadWorldFromJsonStrings = function (inJsonRepositoryString, inJsonUserList) {

  // load the list of records
  Util.assert(Util.isString(inJsonRepositoryString));
  var dehydratedRecords = null;
  eval("dehydratedRecords = " + inJsonRepositoryString + ";");
  Util.assert(Util.isObject(dehydratedRecords));
  var recordFormat = dehydratedRecords[StubVirtualServer.JSON_MEMBER_FORMAT];
  Util.assert(recordFormat == StubVirtualServer.JSON_FORMAT_2005_JUNE_RECORDS);
  var listOfRecords = dehydratedRecords[StubVirtualServer.JSON_MEMBER_RECORDS];
  Util.assert(Util.isArray(listOfRecords));
  
  // load the list of users
  Util.assert(Util.isString(inJsonUserList));
  var dehydratedUserList = null;
  eval("dehydratedUserList = " + inJsonUserList + ";");
  Util.assert(Util.isObject(dehydratedUserList));
  var userListFormat = dehydratedUserList[StubVirtualServer.JSON_MEMBER_FORMAT];
  Util.assert(userListFormat == StubVirtualServer.JSON_FORMAT_2005_MAY_USERS);
  var listOfUsers = dehydratedUserList[StubVirtualServer.JSON_MEMBER_USERS];
  Util.assert(Util.isArray(listOfUsers));

  this.__loadWorldFromListOfRecordsAndUsers(listOfRecords, listOfUsers);
};
  

/**
 * Loads a world of items from a dehydrated list of entries, where those
 * entries may represent items, entries, votes, or ordinal settings.
 *
 * @scope    private instance method
 * @param    inListOfRecords    A list of dehydrated records. 
 * @param    inListOfUsers    A list of dehydrated users. 
 */
DeltaVirtualServer.prototype.__loadWorldFromListOfRecordsAndUsers = function (inListOfRecords, inListOfUsers) {
  this._rehydrateRecords(inListOfRecords);
  
  for (var key in inListOfUsers) {
    var dehydratedUserData = inListOfUsers[key];
    var userUuid = dehydratedUserData[StubVirtualServer.JSON_MEMBER_UUID];
    var userPassword = dehydratedUserData[StubVirtualServer.JSON_MEMBER_PASSWORD];
    
    var user = this.getItemFromUuid(userUuid);
    if (user) {
      this.__myListOfUsers.push(user);
      this.__myHashTableOfUserAuthenticationInfo[user.getUniqueKeyString()] = userPassword;
    }
  }
};
  

/**
 * Given a string, returns a copy of the string that is less than
 * 25 characters long.
 *
 * @scope    public instance method
 * @param    inString    A string that may need truncating.
 * @return   A string that is. 
 */
DeltaVirtualServer.prototype.truncateString = function (inString) {
  var maxLength = 30;
  var ellipsis = "...";
  if (inString.length > maxLength) {
    return (inString.substring(0, (maxLength - ellipsis.length)) + ellipsis);
  } else {
    return inString;
  }
};


/**
 * Returns a big string, containing JavaScript "object literal"
 * representations of all of the records in a Transaction.
 *
 * @scope    private instance method
 * @param    inTransaction    A transaction object.
 * @return   A JSON string literal, representing the records in the transaction. 
 */
DeltaVirtualServer.prototype._getJsonStringRepresentingTransaction = function (inTransaction) {
  var indent = "  ";
  var listOfRecords = inTransaction.getRecords();
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
    var content = this._getJsonStringRepresentingRecords(inTransaction.getRecords(), indent);
    listOfStrings.push(content);
    listOfStrings.push('  ]\n');
    listOfStrings.push('  }');
    
    var finalString = listOfStrings.join("");
    return finalString;
  }
};


/**
 * Returns a big string, containing JavaScript "object literal"
 * representations of the records.
 *
 * @scope    private instance method
 * @param    inListOfRecords    A list of the records to include in the JSON string.
 * @param    inIndent    Optional. A string of spaces to prepend to each line.
 * @return   A JSON string literal, representing the records. 
 */
DeltaVirtualServer.prototype._getJsonStringRepresentingRecords = function (inListOfRecords, inIndent) {
  var indent = inIndent || "";
  var key;
  var listOfStrings = [];
  var firstContentRecord = true;
  var itemDisplayNameSubstring;
  var entryDisplayNameSubstring;

  for (key in inListOfRecords) {
    var record = inListOfRecords[key];
    if (firstContentRecord) {
      firstContentRecord = false;
    } else {
      listOfStrings.push(',\n');
    }
    listOfStrings.push(indent + '// -----------------------------------------------------------------------\n');
    if (record instanceof Item) {
      var item = record;
      listOfStrings.push(indent + '{ "' + StubVirtualServer.JSON_MEMBER_ITEM_CLASS + '": ' + '{');
      itemDisplayNameSubstring = this.truncateString(item.getDisplayName());
      listOfStrings.push('                                               // ' + itemDisplayNameSubstring + '\n');
      listOfStrings.push(indent + '         "' + StubVirtualServer.JSON_MEMBER_UUID + '": "' + item._getUuid() + '"');
    }
    if (record instanceof Vote) {
      var vote = record;
      listOfStrings.push(indent + '{ "' + StubVirtualServer.JSON_MEMBER_VOTE_CLASS + '": ' + '{');
      entryDisplayNameSubstring = this.truncateString(vote.getContentRecord().getDisplayString());
      var deleteVsRetainString = vote.getRetainFlag() ? "RETAIN" : "DELETE";
      listOfStrings.push('                                              // vote to ' + deleteVsRetainString + " " + entryDisplayNameSubstring + '\n');
      listOfStrings.push(indent + '         "' + StubVirtualServer.JSON_MEMBER_UUID + '": "' + vote._getUuid() + '",\n');
      listOfStrings.push(indent + '       "' + StubVirtualServer.JSON_MEMBER_RECORD + '": "' + vote.getContentRecord()._getUuid() + '",\n');
      listOfStrings.push(indent + '   "' + StubVirtualServer.JSON_MEMBER_RETAIN_FLAG + '": "' + vote.getRetainFlag() + '"');
    }
    if (record instanceof Ordinal) {
      var ordinal = record;
      listOfStrings.push(indent + '{ "' + StubVirtualServer.JSON_MEMBER_ORDINAL_CLASS + '": ' + '{' + '\n');
      listOfStrings.push(indent + '         "' + StubVirtualServer.JSON_MEMBER_UUID + '": "' + ordinal._getUuid() + '",\n');
      listOfStrings.push(indent + '    "' + StubVirtualServer.JSON_MEMBER_RECORD + '": "' + ordinal.getContentRecord()._getUuid() + '",\n');
      listOfStrings.push(indent + '    "' + StubVirtualServer.JSON_MEMBER_ORDINAL_NUMBER + '": "' + ordinal.getOrdinalNumber() + '"');
    }
    if (record instanceof Entry) {
      var entry = record;
      listOfStrings.push(indent + '{ "' + StubVirtualServer.JSON_MEMBER_ENTRY_CLASS + '": ' + '{');
      entryDisplayNameSubstring = this.truncateString(entry.getDisplayString());
      listOfStrings.push('                                              // ' + entryDisplayNameSubstring + '\n');
      listOfStrings.push(indent + '         "' + StubVirtualServer.JSON_MEMBER_UUID + '": "' + entry._getUuid() + '",\n');
      var previousEntry = entry.getPreviousEntry();
      if (previousEntry) {
        listOfStrings.push(indent + '"' + StubVirtualServer.JSON_MEMBER_PREVIOUS_VALUE + '": "' + previousEntry._getUuid() + '",\n');
      }
      var entryType = entry.getType();
      var typeToken = this._getTypeTokenFromType(entryType);
      listOfStrings.push(indent + '         "' + StubVirtualServer.JSON_MEMBER_TYPE + '": "' + typeToken + '",\n');
      if (typeToken == StubVirtualServer.JSON_TYPE_CONNECTION) {
        var pairOfItems = entry.getItem();
        var firstItem = pairOfItems[0];
        var secondItem = pairOfItems[1];
        listOfStrings.push(indent + '         "' + StubVirtualServer.JSON_MEMBER_ITEM + '": ["' + firstItem._getUuid() + '", "' + secondItem._getUuid() + '"],\n');
        var pairOfAttributes = entry.getAttribute();
        var firstAttribute = pairOfAttributes[0];
        var secondAttribute = pairOfAttributes[1];
        listOfStrings.push(indent + '    "' + StubVirtualServer.JSON_MEMBER_ATTRIBUTE + '": ["' + firstAttribute._getUuid() + '", "' + secondAttribute._getUuid() + '"]');
      } else {
        var attribute = entry.getAttribute();
        if (attribute) {
          var attributeName = attribute.getDisplayName();
          listOfStrings.push(indent + '    "' + StubVirtualServer.JSON_MEMBER_ATTRIBUTE + '": "' + attribute._getUuid() + '",');
          var attributeNameSubstring = this.truncateString(attributeName);
          listOfStrings.push('  // ' + attributeNameSubstring + '\n');
        }
        listOfStrings.push(indent + '         "' + StubVirtualServer.JSON_MEMBER_ITEM + '": "' + entry.getItem()._getUuid() + '",');
        itemDisplayNameSubstring = this.truncateString(entry.getItem().getDisplayName());
        listOfStrings.push('  // ' + itemDisplayNameSubstring + '\n');
        var contentData = entry.getValue();
        
        var valueString = null;
        switch (typeToken) {
          case StubVirtualServer.JSON_TYPE_NUMBER_VALUE: 
            valueString = contentData;
            break;
          case StubVirtualServer.JSON_TYPE_TEXT_VALUE: 
            valueString = '"' + contentData + '"';
            break;
          case StubVirtualServer.JSON_TYPE_DATE_VALUE: 
            valueString = '"' + contentData.toString() + '"';
            break;
          case StubVirtualServer.JSON_TYPE_RELATED_UUID: 
            valueString = '"' + contentData._getUuid() + '"';
            break;
          default:
            Util.assert(false, "no such type: " + typeToken);
        }
        listOfStrings.push(indent + '        "' + StubVirtualServer.JSON_MEMBER_VALUE + '": ' + valueString + '');
      }
    }
    listOfStrings.push('  }');
    // var userDisplayName = record.getUserstamp().getDisplayName();
    // var userDisplayNameSubstring = this.truncateString(userDisplayName);
    // listOfStrings.push('  // by (' + userDisplayNameSubstring + ')\n');
    listOfStrings.push(indent + '}');
  }
  
  var finalString = listOfStrings.join("");
  return finalString;
};


/**
 * Returns a string containing a JavaScript "object literal" with a list of
 * all the user UUIDs and passwords.
 *
 * @scope    private instance method
 * @param    inChromeFlag    True if the return string should contain "chrome".
 * @return   A JSON string literal with a list of user UUIDs and passwords. 
 */
DeltaVirtualServer.prototype.__getJsonStringRepresentingUserList = function (inChromeFlag) {
  var listOfStrings = [];
  var key;

  if (inChromeFlag) {
    listOfStrings.push('// User list, in JSON format' + '\n');
    listOfStrings.push('{ ');
    listOfStrings.push('"' + StubVirtualServer.JSON_MEMBER_FORMAT + '": "' + StubVirtualServer.JSON_FORMAT_2005_MAY_USERS + '", ' + '\n');    
  }
  
  listOfStrings.push('  "' + StubVirtualServer.JSON_MEMBER_USERS + '": ' + '[\n');
  var firstContentRecord = true;
  for (key in this.__myListOfUsers) {
    var user = this.__myListOfUsers[key];
    if (firstContentRecord) {
      firstContentRecord = false;
    } else {
      listOfStrings.push(',\n');
    }
    var password = this.__myHashTableOfUserAuthenticationInfo[user.getUniqueKeyString()];
    var passwordString = "null";
    if (password) {
      passwordString = '"' + password + '"';
    }
    listOfStrings.push('    { "' + StubVirtualServer.JSON_MEMBER_UUID + '": "' + user._getUuid() + '", ');
    listOfStrings.push('"' + StubVirtualServer.JSON_MEMBER_PASSWORD + '": ' + passwordString + ' }');
  }
  listOfStrings.push(" ]\n");
  
  if (inChromeFlag) {
    listOfStrings.push('}\n');
  }
  
  var finalString = listOfStrings.join("");
  return finalString;
};


/**
 * Returns a huge string, containing a JavaScript "object literal"
 * representation of the entire world.
 *
 * @scope    private instance method
 * @return   A JSON string literal, representing all the items in the world. 
 */
DeltaVirtualServer.prototype.__getJsonStringRepresentingEntireWorld = function () {
  var listOfStrings = [];
  
  listOfStrings.push('// Repository dump, in JSON format' + '\n');
  listOfStrings.push('{ ');
  listOfStrings.push('"' + StubVirtualServer.JSON_MEMBER_FORMAT + '": "' + StubVirtualServer.JSON_FORMAT_2005_APRIL + '", ' + '\n');
  listOfStrings.push('  "' + StubVirtualServer.JSON_MEMBER_DATA + '": ' + '[' + '\n');

  var indent = "  ";
  var jsonStringForRecords = this._getJsonStringRepresentingRecords(this.__myChronologicalListOfRecords, indent);
  listOfStrings.push(jsonStringForRecords);

  listOfStrings.push("  ], \n");
  
  // write out the list of users
  var withChrome = false;
  var jsonStringForUserList = this.__getJsonStringRepresentingUserList(withChrome);
  listOfStrings.push(jsonStringForUserList);
  
  listOfStrings.push("}\n");
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
DeltaVirtualServer.prototype.saveChangesToServer = function (forceSave) {
  var currentTransaction = this.getCurrentTransaction();
  var listOfChangesMade = currentTransaction.getRecords();
  if (!forceSave && listOfChangesMade.length === 0) {
    return listOfChangesMade;
  }
  
  var saveChanges = false;
  if (window.location) {
    if (window.location.protocol == "http:") {
      saveChanges = true;
    }
    if (window.location.protocol == "file:") {
      if (!this._myHasEverFailedToSaveFlag) {
        window.alert("I can't save changes to server, because this page was loaded from a \"file:///\" location, not a real \"http://\" location.  Sorry."); 
        this._myHasEverFailedToSaveFlag = true;
      }
    }
  }
  
  var key;
  var newRecord;
  for (key in listOfChangesMade) {
    newRecord = listOfChangesMade[key];
    this.__myChronologicalListOfRecords.push(newRecord);
  }
  
  var saveListOfUsers = false;
  var listOfUsers = this.getUsers();
  for (key in listOfChangesMade) {
    newRecord = listOfChangesMade[key];
    if (Util.isObjectInSet(newRecord, listOfUsers)) {
      saveListOfUsers = true;
      break;
    }
  }
 
  if (saveChanges) {
    var url;
    var textToAppend;
    
    // OLD: used for saving a the entire world as one lump
    // url = "model/save_lump.php";
    // this.__myXMLHttpRequestObject.open("POST", url, true);
    // this.__myXMLHttpRequestObject.setRequestHeader("Content-Type", "text/plain");
    // this.__myXMLHttpRequestObject.send(this.__getJsonStringRepresentingEntireWorld());
    
    // NEW: used for saving just the changes
    url = "model/append_to_repository_file.php";
    textToAppend = ",\n" + this._getJsonStringRepresentingTransaction(currentTransaction);
    var asynchronous;
    asynchronous = true;
    
    // PENDING: 
    // It might be more efficient to re-use the XMLHttpRequestObject,
    // rather than creating a new one for new request.  But re-using 
    // them is complicated, because the requests are asynchronous, so
    // we need to check to see if the last request is done before we 
    // can start a new request.
    this.__myXMLHttpRequestObject = this.__newXMLHttpRequestObject();
    this.__myXMLHttpRequestObject.open("POST", url, asynchronous);
    this.__myXMLHttpRequestObject.setRequestHeader("Content-Type", "text/plain");
    this.__myXMLHttpRequestObject.send(textToAppend);
    
    // NEW: used for saving just the user list
    if (saveListOfUsers) {
      url = "model/replace_user_file.php";
      var withChrome = true;
      textToAppend = this.__getJsonStringRepresentingUserList(withChrome);
      asynchronous = true;
      
      // PENDING: 
      // It might be more efficient to re-use the XMLHttpRequestObject,
      // rather than creating a new one for new request.  But re-using 
      // them is complicated, because the requests are asynchronous, so
      // we need to check to see if the last request is done before we 
      // can start a new request.
      this._myUserListXMLHttpRequestObject = this.__newXMLHttpRequestObject();
      
      this._myUserListXMLHttpRequestObject.open("POST", url, asynchronous);
      this._myUserListXMLHttpRequestObject.setRequestHeader("Content-Type", "text/plain");
      this._myUserListXMLHttpRequestObject.send(textToAppend);
    }
  }
  
  this._currentTransaction = null;
  return listOfChangesMade;
};


/**
 * Returns a newly created XMLHttpRequest object.
 *
 * @scope    private instance method
 * @return   A newly created XMLHttpRequest object. 
 */
DeltaVirtualServer.prototype.__newXMLHttpRequestObject = function () {
  var newXMLHttpRequestObject = null;
  if (window.XMLHttpRequest) {
    newXMLHttpRequestObject = new XMLHttpRequest();
  } else {
    if (window.ActiveXObject) {
      newXMLHttpRequestObject = new ActiveXObject("Microsoft.XMLHTTP");
    }
  }
  if (newXMLHttpRequestObject) {
    newXMLHttpRequestObject.onreadystatechange = function() {
      var statusText = newXMLHttpRequestObject.statusText;
      if (statusText != "OK") {
        window.alert("onreadystatechange:\n" +
          "readyState: " + newXMLHttpRequestObject.readyState + "\n" +
          "status: " + newXMLHttpRequestObject.status + "\n" +
          "statusText: " + newXMLHttpRequestObject.statusText + "\n" +
          "responseText: " + newXMLHttpRequestObject.responseText + "\n");
      }
    };
  }
  return newXMLHttpRequestObject;
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
