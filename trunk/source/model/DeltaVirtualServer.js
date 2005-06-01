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


// -------------------------------------------------------------------
// DeltaVirtualServer public class constants
// -------------------------------------------------------------------
DeltaVirtualServer.JSON_MEMBER_FORMAT = "format";
DeltaVirtualServer.JSON_MEMBER_TIMESTAMP = "timestamp";
DeltaVirtualServer.JSON_MEMBER_DATA = "data";
DeltaVirtualServer.JSON_MEMBER_RECORDS = "records";
DeltaVirtualServer.JSON_MEMBER_USERS = "users";

DeltaVirtualServer.JSON_FORMAT_2005_MARCH = "2005_MARCH_ITEM_CENTRIC_LIST";
DeltaVirtualServer.JSON_FORMAT_2005_APRIL = "2005_APRIL_CHRONOLOGICAL_LIST";
DeltaVirtualServer.JSON_FORMAT_2005_MAY_RECORDS = "2005_MAY_CHRONOLOGICAL_LIST";
DeltaVirtualServer.JSON_FORMAT_2005_MAY_USERS = "2005_MAY_USER_LIST";

DeltaVirtualServer.JSON_MEMBER_TYPE = "type";
DeltaVirtualServer.JSON_MEMBER_VALUE = "value";
DeltaVirtualServer.JSON_TYPE_STRING_VALUE = "StringValue";
DeltaVirtualServer.JSON_TYPE_UUID = "Uuid";
DeltaVirtualServer.JSON_TYPE_FOREIGN_UUID = "ForeignUuid";
DeltaVirtualServer.JSON_TYPE_RELATED_UUID = "RelatedUuid";
DeltaVirtualServer.JSON_TYPE_NUMBER_VALUE = "NumberValue";

DeltaVirtualServer.JSON_MEMBER_WUID = "uuid";
DeltaVirtualServer.JSON_MEMBER_PASSWORD = "password";

DeltaVirtualServer.JSON_MEMBER_ITEM_CLASS = "Item";
DeltaVirtualServer.JSON_MEMBER_ENTRY_CLASS = "Entry";
DeltaVirtualServer.JSON_MEMBER_VOTE_CLASS = "Vote";
DeltaVirtualServer.JSON_MEMBER_ORDINAL_CLASS = "Ordinal";

DeltaVirtualServer.JSON_MEMBER_ATTRIBUTE = "attribute";
DeltaVirtualServer.JSON_MEMBER_PREVIOUS_VALUE = "previousEntry";
DeltaVirtualServer.JSON_MEMBER_USERSTAMP = "userstamp";
DeltaVirtualServer.JSON_MEMBER_RECORD = "record";
DeltaVirtualServer.JSON_MEMBER_ITEM = "item";
DeltaVirtualServer.JSON_MEMBER_RETAIN_FLAG = "retainFlag";
DeltaVirtualServer.JSON_MEMBER_ORDINAL_NUMBER = "ordinalNumber";


/**
 * The DeltaVirtualServer is a datastore that loads and saves
 * an entire World of items as a single monolithic JSON string.
 *
 * @scope    public instance constructor
 * @param    inJsonRepositoryString    A JSON string literal representing the world of items. 
 * @param    inJsonUserList    A JSON string literal listing user UUIDs and passwords. 
 */
DeltaVirtualServer.prototype = new StubVirtualServer();  // makes DeltaVirtualServer be a subclass of StubVirtualServer
function DeltaVirtualServer(inJsonRepositoryString, inJsonUserList) {
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
  this.__initialize(inWorld);
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
  var recordFormat = dehydratedRecords[DeltaVirtualServer.JSON_MEMBER_FORMAT];
  Util.assert(recordFormat == DeltaVirtualServer.JSON_FORMAT_2005_MAY_RECORDS);
  var listOfRecords = dehydratedRecords[DeltaVirtualServer.JSON_MEMBER_RECORDS];
  Util.assert(Util.isArray(listOfRecords));
  
  // load the list of users
  Util.assert(Util.isString(inJsonUserList));
  var dehydratedUserList = null;
  eval("dehydratedUserList = " + inJsonUserList + ";");
  Util.assert(Util.isObject(dehydratedUserList));
  var userListFormat = dehydratedUserList[DeltaVirtualServer.JSON_MEMBER_FORMAT];
  Util.assert(userListFormat == DeltaVirtualServer.JSON_FORMAT_2005_MAY_USERS);
  var listOfUsers = dehydratedUserList[DeltaVirtualServer.JSON_MEMBER_USERS];
  Util.assert(Util.isArray(listOfUsers));

  this.__loadWorldFromListOfRecordsAndUsers(listOfRecords, listOfUsers);
  
  /* DELETE_ME:
  var fileFormat = dehydratedWorld[DeltaVirtualServer.JSON_MEMBER_FORMAT];
  if (fileFormat == DeltaVirtualServer.JSON_FORMAT_2005_MARCH) {
    // this is an old file format, circa 2005-March-16
    var listOfItems = dehydratedWorld[DeltaVirtualServer.JSON_MEMBER_DATA];
    Util.assert(Util.isArray(listOfItems));
    this.__loadWorldFromOld2005MarchFormatList(listOfItems);
  } else {
    // this is newer file format, circa 2005-April-21
    Util.assert(fileFormat == DeltaVirtualServer.JSON_FORMAT_2005_APRIL);
    var listOfRecords = dehydratedWorld[DeltaVirtualServer.JSON_MEMBER_DATA];
    var listOfUsers = dehydratedWorld[DeltaVirtualServer.JSON_MEMBER_USERS];
    Util.assert(Util.isArray(listOfRecords));
    this.__loadWorldFromListOfRecordsAndUsers(listOfRecords, listOfUsers);
  }
  */
};
  

/**
 * Loads a world of items from a dehydrated list of items.
 *
 * @scope    private instance method
 * @param    inListOfItems    A JSON list of dehydrated items. 
 */
/*
DeltaVirtualServer.prototype.__loadWorldFromOld2005MarchFormatList = function (inListOfItems) {

  var listOfDehydratedItems = inListOfItems;

  var axiomaticItem;
  var dehydratedItem;
  var dehydratedUuid;
  var item;
  var uuid;
  var key;
  
  // Have the StubBackingStore load the axiomatic items, because it will
  // correctly set the creator of those items to be the axiomatic user.
  var listOfAxiomaticRecords = this.__loadAxiomaticItems();
  
  var hashTableOfAxiomaticItemsKeyedByUuid = {};
  for (key in listOfAxiomaticRecords) {
    var record = listOfAxiomaticRecords[key];
    if (record instanceof Item) {
      hashTableOfAxiomaticItemsKeyedByUuid[record._getUuid()] = record;
    }
  }
  
  this.__myWorld.beginTransaction();
  var guestUser = this.newUser("Guest", null);
  this.__myCurrentUser = guestUser;
  
  // First, go through the whole list of dehydrated items.  Find all 
  // the UUIDs for all the items, and make Item objects for all of them.
  // After we've done this step, we'll know the next available UUID,
  // so we can start assigning new UUIDs to the attribute entries.
  for (key in listOfDehydratedItems) {
    dehydratedItem = listOfDehydratedItems[key];
    dehydratedUuid = dehydratedItem[World.UUID_FOR_ATTRIBUTE_UUID];
    uuid = dehydratedUuid[DeltaVirtualServer.JSON_MEMBER_VALUE];
    axiomaticItem = hashTableOfAxiomaticItemsKeyedByUuid[uuid];
    if (!axiomaticItem) {
      // We only need to rehydrate the non-axiomatic items.
      // We rely on the StubBackingStore to have loaded the axiomatic items.
      item = this.__getItemFromUuidOrCreateNewItem(uuid);
      Util.assert(item instanceof Item);
    }
  }
  
  // We already have Item objects for all the items we're going to
  // rehydrate.  Now we can add attributes to them.
  for (key in listOfDehydratedItems) {
    dehydratedItem = listOfDehydratedItems[key];
    dehydratedUuid = dehydratedItem[World.UUID_FOR_ATTRIBUTE_UUID];
    uuid = dehydratedUuid[DeltaVirtualServer.JSON_MEMBER_VALUE];
    axiomaticItem = hashTableOfAxiomaticItemsKeyedByUuid[uuid];
    if (!axiomaticItem) {
      // We only need to rehydrate the non-axiomatic items.
      // We rely on the StubBackingStore to have loaded the axiomatic items.
      item = this.__getItemFromUuidOrCreateNewItem(uuid);
      Util.assert(item instanceof Item);
      for (var propertyKey in dehydratedItem) {
        if (propertyKey != World.UUID_FOR_ATTRIBUTE_UUID) { 
          var propertyValue = dehydratedItem[propertyKey];
          var attributeUuid = parseInt(propertyKey);
          Util.assert(Util.isArray(propertyValue));
          for (var entryKey in propertyValue) {
            var entryObject = propertyValue[entryKey];
            var valueType = entryObject[DeltaVirtualServer.JSON_MEMBER_TYPE];
            var valueValue = entryObject[DeltaVirtualServer.JSON_MEMBER_VALUE];
            var finalValue = null;
            switch (valueType) {
              case DeltaVirtualServer.JSON_TYPE_FOREIGN_UUID:
                finalValue = this.__getItemFromUuidOrCreateNewItem(valueValue);
                break;
              case DeltaVirtualServer.JSON_TYPE_STRING_VALUE:
                finalValue = valueValue;
                break;
              case DeltaVirtualServer.JSON_TYPE_NUMBER_VALUE:
                finalValue = valueValue;
                break;
            }
            var attribute = this.getItemFromUuid(attributeUuid);
            item.addEntryForAttribute(attribute, finalValue);
          }
        }
      }
    }
  }

  for (key in this.__myChronologicalListOfNewlyCreatedRecords) {
    var newRecord = this.__myChronologicalListOfNewlyCreatedRecords[key];
    this.__myChronologicalListOfRecords.push(newRecord);
  }
  this.__myChronologicalListOfNewlyCreatedRecords = [];
  this.__myWorld.endTransaction();
  this.__myCurrentUser = null;
};
*/

/**
 * Given a UUID, either (a) returns the existing item identified by that UUID, 
 * or (b) creates an new item object, set its UUID, and returns that object.
 *
 * @scope    private instance method
 * @param    inUuid    The UUID of the item to be returned. 
 * @return   The item identified by the given UUID.
 */
StubVirtualServer.prototype.__getItemFromUuidOrBootstrapItem = function (inUuid) {
  var item = this.getItemFromUuid(inUuid);
  if (!item) {
    /*
    var uuidAsInt = null;
    if (Util.isNumber(inUuid)) {
      uuidAsInt = inUuid;
    } else {
      if (Util.isString(inUuid) && Util.isNumeric(inUuid)) {
        uuidAsInt = parseInt(inUuid);
      }
    }
    if (uuidAsInt) {
      Util.assert(Util.isNumber(uuidAsInt));
      this.__myNextAvailableUuid = Math.max(this.__myNextAvailableUuid, (uuidAsInt + 1));   
    }
    */
    item = new Item(this.__myWorld, inUuid);
    this.__myHashTableOfItemsKeyedByUuid[inUuid] = item;
  }
  return item;
};


/**
 * Given a UUID, either (a) returns the existing entry identified by that UUID, 
 * or (b) creates an new entry object, set its UUID, and returns that object.
 *
 * @scope    private instance method
 * @param    inUuid    The UUID of the entry to be returned. 
 * @return   The entry identified by the given UUID.
 */
StubVirtualServer.prototype.__getEntryFromUuidOrBootstrapEntry = function (inUuid) {
  var entry = this.__myHashTableOfEntriesKeyedByUuid[inUuid];
  if (!entry) {
    /*
    var uuidAsInt = null;
    if (Util.isNumber(inUuid)) {
      uuidAsInt = inUuid;
    } else {
      if (Util.isString(inUuid) && Util.isNumeric(inUuid)) {
        uuidAsInt = parseInt(inUuid);
      }
    }
    if (uuidAsInt) {
      Util.assert(Util.isNumber(uuidAsInt));
      this.__myNextAvailableUuid = Math.max(this.__myNextAvailableUuid, (uuidAsInt + 1));   
    }
    */
    entry = new Entry(this.__myWorld, inUuid);
    this.__myHashTableOfEntriesKeyedByUuid[inUuid] = entry;
  }
  return entry;
};


/**
 * Loads a world of items from a dehydrated list of entries, where those
 * entries may represent items, entries, votes, or ordinal settings.
 *
 * @scope    private instance method
 * @param    inJsonString    A JSON string literal representing the world of items. 
 */
DeltaVirtualServer.prototype.__loadWorldFromListOfRecordsAndUsers = function (inListOfRecords, inListOfUsers) {
  var key;
  var itemUuid;
  var item;
  var identifiedRecordUuid;
  var identifiedRecord;
  
  for (key in inListOfRecords) {
    var dehydratedRecord = inListOfRecords[key];

    var dehydratedItem = dehydratedRecord[DeltaVirtualServer.JSON_MEMBER_ITEM_CLASS];
    var dehydratedVote = dehydratedRecord[DeltaVirtualServer.JSON_MEMBER_VOTE_CLASS];
    var dehydratedOrdinal = dehydratedRecord[DeltaVirtualServer.JSON_MEMBER_ORDINAL_CLASS];
    var dehydratedEntry = dehydratedRecord[DeltaVirtualServer.JSON_MEMBER_ENTRY_CLASS];

    var contents = dehydratedItem || dehydratedVote || dehydratedOrdinal || dehydratedEntry;

    var timestampString = contents[DeltaVirtualServer.JSON_MEMBER_TIMESTAMP];
    var userstampUuid = contents[DeltaVirtualServer.JSON_MEMBER_USERSTAMP];
    var timestamp = new Date(new Number(timestampString));
    var userstamp = this.__getItemFromUuidOrBootstrapItem(userstampUuid);

    if (dehydratedItem) {
      itemUuid = dehydratedItem[DeltaVirtualServer.JSON_MEMBER_WUID];
      item = this.__getItemFromUuidOrBootstrapItem(itemUuid);
      item._rehydrate(timestamp, userstamp);
      this.__myChronologicalListOfRecords.push(item);
    }
    if (dehydratedVote) {
      var retainFlag = dehydratedVote[DeltaVirtualServer.JSON_MEMBER_RETAIN_FLAG];
      identifiedRecordUuid = dehydratedVote[DeltaVirtualServer.JSON_MEMBER_RECORD];
      identifiedRecord = this.__getIdentifiedRecordFromUuid(identifiedRecordUuid);
      var vote = new Vote(identifiedRecord, userstamp, retainFlag, timestamp);
      this.__myChronologicalListOfRecords.push(vote);
    }
    if (dehydratedOrdinal) {
      var ordinalNumber = dehydratedVote[DeltaVirtualServer.JSON_MEMBER_ORDINAL_NUMBER];
      identifiedRecordUuid = dehydratedVote[DeltaVirtualServer.JSON_MEMBER_RECORD];
      identifiedRecord = this.__getIdentifiedRecordFromUuid(identifiedRecordUuid);
      var ordinal = new Ordinal(identifiedRecord, userstamp, ordinalNumber, timestamp);
      this.__myChronologicalListOfRecords.push(ordinal);
    }
    if (dehydratedEntry) {
      var entryUuid = dehydratedEntry[DeltaVirtualServer.JSON_MEMBER_WUID];
      itemUuid = dehydratedEntry[DeltaVirtualServer.JSON_MEMBER_ITEM];
      item = this.__getItemFromUuidOrBootstrapItem(itemUuid);
      var attributeUuid = dehydratedEntry[DeltaVirtualServer.JSON_MEMBER_ATTRIBUTE];
      var attribute = null;
      if (attributeUuid) {
        attribute = this.__getItemFromUuidOrBootstrapItem(attributeUuid);
      }
      var previousEntryUuid = dehydratedEntry[DeltaVirtualServer.JSON_MEMBER_PREVIOUS_VALUE];
      var previousEntry = null;
      if (previousEntryUuid) {
        previousEntry = this.__getEntryFromUuidOrBootstrapEntry(previousEntryUuid);
      }
      var pickledData = dehydratedEntry[DeltaVirtualServer.JSON_MEMBER_VALUE];
      var dataType = pickledData[DeltaVirtualServer.JSON_MEMBER_TYPE];
      var rawData = pickledData[DeltaVirtualServer.JSON_MEMBER_VALUE];
      var finalData = null;
      switch (dataType) {
        case DeltaVirtualServer.JSON_TYPE_RELATED_UUID:
          finalData = this.__getItemFromUuidOrBootstrapItem(rawData);
          break;
        case DeltaVirtualServer.JSON_TYPE_STRING_VALUE:
          finalData = rawData;
          break;
        case DeltaVirtualServer.JSON_TYPE_NUMBER_VALUE:
          finalData = rawData;
          break;
      }
      var entry = this.__getEntryFromUuidOrBootstrapEntry(entryUuid);
      var itemOrEntry = previousEntry || item;
      entry._rehydrate(itemOrEntry, attribute, finalData, timestamp, userstamp);
      this.__myChronologicalListOfRecords.push(entry);
    }
  }
  for (key in inListOfUsers) {
    var dehydratedUserData = inListOfUsers[key];
    var userUuid = dehydratedUserData[DeltaVirtualServer.JSON_MEMBER_WUID];
    var userPassword = dehydratedUserData[DeltaVirtualServer.JSON_MEMBER_PASSWORD];
    
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
 * representations of the records.
 *
 * @scope    private instance method
 * @param    inListOfRecords    A list of the records to include in the JSON string.
 * @return   A JSON string literal, representing the records. 
 */
DeltaVirtualServer.prototype.__getJsonStringRepresentingRecords = function (inListOfRecords) {

  var key;
  var listOfStrings = [];
  var firstIdentifiedRecord = true;
  var itemDisplayNameSubstring;

  for (key in inListOfRecords) {
    var record = inListOfRecords[key];
    if (firstIdentifiedRecord) {
      firstIdentifiedRecord = false;
    } else {
      listOfStrings.push(',\n');
    }
    listOfStrings.push('  // -----------------------------------------------------------------------\n');
    if (record instanceof Item) {
      var item = record;
      listOfStrings.push('  { "' + DeltaVirtualServer.JSON_MEMBER_ITEM_CLASS + '": ' + '{');
      itemDisplayNameSubstring = this.truncateString(item.getDisplayName());
      listOfStrings.push('                             // ' + itemDisplayNameSubstring + '\n');
      listOfStrings.push('           "' + DeltaVirtualServer.JSON_MEMBER_WUID + '": "' + item._getUuid() + '",\n');
    }
    if (record instanceof Vote) {
      var vote = record;
      listOfStrings.push('  { "' + DeltaVirtualServer.JSON_MEMBER_VOTE_CLASS + '": ' + '{' + '\n');
      listOfStrings.push('      "' + DeltaVirtualServer.JSON_MEMBER_RECORD + '": "' + vote.getIdentifiedRecord()._getUuid() + '",\n');
      listOfStrings.push('      "' + DeltaVirtualServer.JSON_MEMBER_RETAIN_FLAG + '": "' + vote.getRetainFlag() + '",\n');
    }
    if (record instanceof Ordinal) {
      var ordinal = record;
      listOfStrings.push('  { "' + DeltaVirtualServer.JSON_MEMBER_ORDINAL_CLASS + '": ' + '{' + '\n');
      listOfStrings.push('      "' + DeltaVirtualServer.JSON_MEMBER_RECORD + '": "' + ordinal.getIdentifiedRecord()._getUuid() + '",\n');
      listOfStrings.push('      "' + DeltaVirtualServer.JSON_MEMBER_ORDINAL_NUMBER + '": "' + ordinal.getOrdinalNumber() + '",\n');
    }
    if (record instanceof Entry) {
      var entry = record;
      listOfStrings.push('  { "' + DeltaVirtualServer.JSON_MEMBER_ENTRY_CLASS + '": ' + '{');
      var entryDisplayNameSubstring = this.truncateString(entry.getDisplayString());
      listOfStrings.push('                             // ' + entryDisplayNameSubstring + '\n');
      listOfStrings.push('           "' + DeltaVirtualServer.JSON_MEMBER_WUID + '": "' + entry._getUuid() + '",\n');
      var attribute = entry.getAttribute();
      if (attribute) {
        var attributeName = attribute.getDisplayName();
        listOfStrings.push('      "' + DeltaVirtualServer.JSON_MEMBER_ATTRIBUTE + '": "' + attribute._getUuid() + '",');
        var attributeNameSubstring = this.truncateString(attributeName);
        listOfStrings.push('                // ' + attributeNameSubstring + '\n');
      }
      listOfStrings.push('           "' + DeltaVirtualServer.JSON_MEMBER_ITEM + '": "' + entry.getItem()._getUuid() + '",');
      itemDisplayNameSubstring = this.truncateString(entry.getItem().getDisplayName());
      listOfStrings.push('                // ' + itemDisplayNameSubstring + '\n');
      var previousEntry = entry.getPreviousEntry();
      if (previousEntry) {
        listOfStrings.push('   "' + DeltaVirtualServer.JSON_MEMBER_PREVIOUS_VALUE + '": "' + previousEntry._getUuid() + '",\n');
      }
      var contentData = entry.getValue();
      var pickleString = "";
      var typeString = null;
      var valueString = null;
      if (Util.isNumber(contentData)) {
        typeString = DeltaVirtualServer.JSON_TYPE_NUMBER_VALUE;
        valueString = contentData;
      }
      if (Util.isString(contentData)) {
        typeString = DeltaVirtualServer.JSON_TYPE_STRING_VALUE;
        valueString = '"' + contentData + '"';
      }
      if (contentData instanceof Item) {
        typeString = DeltaVirtualServer.JSON_TYPE_RELATED_UUID;
        valueString = '"' + contentData._getUuid() + '"';
      }
      pickleString = '{ "' + DeltaVirtualServer.JSON_MEMBER_TYPE + '": "' + typeString + '", "' + DeltaVirtualServer.JSON_MEMBER_VALUE + '": ' + valueString + ' }';
      listOfStrings.push('          "' + DeltaVirtualServer.JSON_MEMBER_VALUE + '": ' + pickleString + ',\n');
    }
    Util.assert(record.getUserstamp() !== null);
    listOfStrings.push('      "' + DeltaVirtualServer.JSON_MEMBER_USERSTAMP + '": "' + record.getUserstamp()._getUuid() + '",');
    var userDisplayName = record.getUserstamp().getDisplayName();
    var userDisplayNameSubstring = this.truncateString(userDisplayName);
    listOfStrings.push('                // by (' + userDisplayNameSubstring + ')\n');
    listOfStrings.push('      "' + DeltaVirtualServer.JSON_MEMBER_TIMESTAMP + '": "' + record.getTimestamp().valueOf() + '" }\n');
    listOfStrings.push('  }');
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
    listOfStrings.push('"' + DeltaVirtualServer.JSON_MEMBER_FORMAT + '": "' + DeltaVirtualServer.JSON_FORMAT_2005_MAY_USERS + '", ' + '\n');    
  }
  
  listOfStrings.push('  "' + DeltaVirtualServer.JSON_MEMBER_USERS + '": ' + '[\n');
  var firstIdentifiedRecord = true;
  for (key in this.__myListOfUsers) {
    var user = this.__myListOfUsers[key];
    if (firstIdentifiedRecord) {
      firstIdentifiedRecord = false;
    } else {
      listOfStrings.push(',\n');
    }
    var password = this.__myHashTableOfUserAuthenticationInfo[user.getUniqueKeyString()];
    var passwordString = "null";
    if (password) {
      passwordString = '"' + password + '"';
    }
    listOfStrings.push('    { "' + DeltaVirtualServer.JSON_MEMBER_WUID + '": "' + user._getUuid() + '", ');
    listOfStrings.push('"' + DeltaVirtualServer.JSON_MEMBER_PASSWORD + '": ' + passwordString + ' }');
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
  listOfStrings.push('"' + DeltaVirtualServer.JSON_MEMBER_FORMAT + '": "' + DeltaVirtualServer.JSON_FORMAT_2005_APRIL + '", ' + '\n');
  listOfStrings.push('  "' + DeltaVirtualServer.JSON_MEMBER_DATA + '": ' + '[' + '\n');

  var jsonStringForRecords = this.__getJsonStringRepresentingRecords(this.__myChronologicalListOfRecords);
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
 * @param    inForceSave    Optional. Forces a save if set to true. 
 * @return   The list of changes made. 
 */
DeltaVirtualServer.prototype.saveChangesToServer = function (inForceSave) {
  var listOfChangesMade;
  if (!inForceSave && this.__myChronologicalListOfNewlyCreatedRecords.length === 0) {
    listOfChangesMade = [];
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
  for (key in this.__myChronologicalListOfNewlyCreatedRecords) {
    newRecord = this.__myChronologicalListOfNewlyCreatedRecords[key];
    this.__myChronologicalListOfRecords.push(newRecord);
  }
  
  var saveListOfUsers = false;
  var listOfUsers = this.getUsers();
  for (key in this.__myChronologicalListOfNewlyCreatedRecords) {
    newRecord = this.__myChronologicalListOfNewlyCreatedRecords[key];
    if (Util.isObjectInSet(newRecord, listOfUsers)) {
      saveListOfUsers = true;
      break;
    }
  }
 
  if (saveChanges) {
    var url;
    var recordsToAppend;
    var textToAppend;
    
    // OLD: used for saving a the entire world as one lump
    // url = "model/save_lump.php";
    // this.__myXMLHttpRequestObject.open("POST", url, true);
    // this.__myXMLHttpRequestObject.setRequestHeader("Content-Type", "text/plain");
    // this.__myXMLHttpRequestObject.send(this.__getJsonStringRepresentingEntireWorld());
    
    // NEW: used for saving just the changes
    url = "model/append_to_repository_file.php";
    recordsToAppend = this.__myChronologicalListOfNewlyCreatedRecords;
    textToAppend = ",\n" + this.__getJsonStringRepresentingRecords(recordsToAppend);
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
  
  listOfChangesMade = this.__myChronologicalListOfNewlyCreatedRecords;
  this.__myChronologicalListOfNewlyCreatedRecords = [];
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
