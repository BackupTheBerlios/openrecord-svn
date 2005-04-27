/*****************************************************************************
 BigLumpVirtualServer.js
 
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
//   Value.js
//   Ordinal.js
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// BigLumpVirtualServer public class constants
// -------------------------------------------------------------------
BigLumpVirtualServer.JSON_MEMBER_FORMAT = "format";
BigLumpVirtualServer.JSON_MEMBER_TIMESTAMP = "timestamp";
BigLumpVirtualServer.JSON_MEMBER_DATA = "data";
BigLumpVirtualServer.JSON_MEMBER_USERS = "users";
BigLumpVirtualServer.JSON_FORMAT_2005_MARCH = "2005_MARCH_ITEM_CENTRIC_LIST";
BigLumpVirtualServer.JSON_FORMAT_2005_APRIL = "2005_APRIL_CHRONOLOGICAL_LIST";

BigLumpVirtualServer.JSON_MEMBER_TYPE = "type";
BigLumpVirtualServer.JSON_MEMBER_DATA = "value";
BigLumpVirtualServer.JSON_TYPE_STRING_VALUE = "StringValue";
BigLumpVirtualServer.JSON_TYPE_UUID = "Uuid";
BigLumpVirtualServer.JSON_TYPE_FOREIGN_UUID = "ForeignUuid";
BigLumpVirtualServer.JSON_TYPE_RELATED_UUID = "RelatedUuid";
BigLumpVirtualServer.JSON_TYPE_NUMBER_VALUE = "NumberValue";

BigLumpVirtualServer.JSON_MEMBER_WUID = "Wuid";

BigLumpVirtualServer.JSON_MEMBER_ITEM_CLASS = "Item";
BigLumpVirtualServer.JSON_MEMBER_VALUE_CLASS = "Value";
BigLumpVirtualServer.JSON_MEMBER_VOTE_CLASS = "Vote";
BigLumpVirtualServer.JSON_MEMBER_ORDINAL_CLASS = "Ordinal";

BigLumpVirtualServer.JSON_MEMBER_ATTRIBUTE = "attribute";
BigLumpVirtualServer.JSON_MEMBER_PREVIOUS_VALUE = "previousValue";
BigLumpVirtualServer.JSON_MEMBER_USERSTAMP = "userstamp";
BigLumpVirtualServer.JSON_MEMBER_ENTRY = "entry";
BigLumpVirtualServer.JSON_MEMBER_ITEM = "item";
BigLumpVirtualServer.JSON_MEMBER_RETAIN_FLAG = "retainFlag";
BigLumpVirtualServer.JSON_MEMBER_ORDINAL_NUMBER = "ordinalNumber";

/**
 * The BigLumpVirtualServer is a datastore that loads and saves
 * an entire World of items as a single monolithic JSON string.
 *
 * @scope    public instance constructor
 * @param    inJsonString    A JSON string literal representing the world of items. 
 */
BigLumpVirtualServer.prototype = new StubBackingStore();  // makes BigLumpVirtualServer be a subclass of StubBackingStore
function BigLumpVirtualServer(inJsonString) {
  this.__myDehydratedWorld = inJsonString;
}


// -------------------------------------------------------------------
// Private Methods
// -------------------------------------------------------------------

/**
 * Overrides the superclass method.  The BigLumpVirtualServer 
 * does not create axiomatic items from scratch, but instead loads all
 * the saved items, including the axiomatic items.
 *
 * @scope    private instance method
 */
BigLumpVirtualServer.prototype.__loadAxiomaticItems = function () {
  this.__loadWorldFromJsonString(this.__myDehydratedWorld);
};
  
  
/**
 * Loads a world of items from a dehydrated JSON string.
 *
 * Given a world of items in JSON format, bootstraps new 
 * instances of items corresponding to the dehydrated data.
 * 
 * @scope    private instance method
 * @param    inJsonString    A JSON string literal representing the world of items. 
 */
BigLumpVirtualServer.prototype.__loadWorldFromJsonString = function (inJsonString) {
  Util.assert(Util.isString(inJsonString));
  var dehydratedWorld = null;
  eval("dehydratedWorld = " + inJsonString + ";");
  Util.assert(Util.isObject(dehydratedWorld));
  
  var fileFormat = dehydratedWorld[BigLumpVirtualServer.JSON_MEMBER_FORMAT];
  if (fileFormat == BigLumpVirtualServer.JSON_FORMAT_2005_MARCH) {
    // this is an old file format, circa 2005-March-16
    var listOfItems = dehydratedWorld[BigLumpVirtualServer.JSON_MEMBER_DATA];
    Util.assert(Util.isArray(listOfItems));
    this.__loadWorldFromOld2005MarchFormatList(listOfItems);
  } else {
    // this is newer file format, circa 2005-April-21
    Util.assert(fileFormat == BigLumpVirtualServer.JSON_FORMAT_2005_APRIL);
    var listOfRecords = dehydratedWorld[BigLumpVirtualServer.JSON_MEMBER_DATA];
    var listOfUsers = dehydratedWorld[BigLumpVirtualServer.JSON_MEMBER_USERS];
    Util.assert(Util.isArray(listOfRecords));
    this.__loadWorldFromListOfRecordsAndUsers(listOfRecords, listOfUsers);
  }
};
  

/**
 * Loads a world of items from a dehydrated list of items.
 *
 * @scope    private instance method
 * @param    inListOfItems    A JSON list of dehydrated items. 
 */
BigLumpVirtualServer.prototype.__loadWorldFromOld2005MarchFormatList = function (inListOfItems) {
  var listOfItems = inListOfItems;
  var uuid;
  var item;
  
  // Have the StubBackingStore load the axiomatic items, because it will
  // correctly set the creator of those items to be the axiomatic user.
  this.__loadAxiomaticItems();
  
  var guestUser = this.newUser("Guest", null);
  this.__myCurrentUser = guestUser;
    
  for (var listKey in listOfItems) {
    var dehydratedItem = listOfItems[listKey];
    var dehydratedUuid = dehydratedItem[World.UUID_FOR_ATTRIBUTE_UUID];
    uuid = dehydratedUuid[BigLumpVirtualServer.JSON_MEMBER_DATA];
    item = this.__getItemFromUuidOrCreateNewItem(uuid);
    for (var propertyKey in dehydratedItem) {
      if (propertyKey != World.UUID_FOR_ATTRIBUTE_UUID) { 
        var propertyValue = dehydratedItem[propertyKey];
        var attributeUuid = propertyKey;
        Util.assert(Util.isArray(propertyValue));
        for (var valueKey in propertyValue) {
          var valueObject = propertyValue[valueKey];
          var valueType = valueObject[BigLumpVirtualServer.JSON_MEMBER_TYPE];
          var valueValue = valueObject[BigLumpVirtualServer.JSON_MEMBER_DATA];
          var finalValue = null;
          switch (valueType) {
            case BigLumpVirtualServer.JSON_TYPE_FOREIGN_UUID:
              finalValue = this.__getItemFromUuidOrCreateNewItem(valueValue);
              break;
            case BigLumpVirtualServer.JSON_TYPE_STRING_VALUE:
              finalValue = valueValue;
              break;
            case BigLumpVirtualServer.JSON_TYPE_NUMBER_VALUE:
              finalValue = valueValue;
              break;
          }
          var attribute = this.__getItemFromUuidOrCreateNewItem(attributeUuid);
          item.addAttributeValue(attribute, finalValue);
        }
      }
    }
  }
  
  for (var key in this.__myChronologicalListOfNewlyCreatedRecords) {
    var newRecord = this.__myChronologicalListOfNewlyCreatedRecords[key];
    this.__myChronologicalListOfRecords.push(newRecord);
  }
  this.__myChronologicalListOfNewlyCreatedRecords = [];
  this.__myCurrentUser = null;
};


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
    this.__myNextAvailableUuid = Math.max(this.__myNextAvailableUuid, (inUuid + 1));   
    item = new Item(this.__myWorld, inUuid);
    this.__myHashTableOfItemsKeyedByUuid[inUuid] = item;
  }
  return item;
};


/**
 * Given a UUID, either (a) returns the existing value identified by that UUID, 
 * or (b) creates an new value object, set its UUID, and returns that object.
 *
 * @scope    private instance method
 * @param    inUuid    The UUID of the value to be returned. 
 * @return   The value identified by the given UUID.
 */
StubVirtualServer.prototype.__getValueFromUuidOrBootstrapValue = function (inUuid) {
  var value = this.__myHashTableOfValuesKeyedByUuid[inUuid];
  if (!value) {
    this.__myNextAvailableUuid = Math.max(this.__myNextAvailableUuid, (inUuid + 1));   
    value = new Value(this.__myWorld, inUuid);
    this.__myHashTableOfValuesKeyedByUuid[inUuid] = value;
  }
  return value;
};


/**
 * Loads a world of items from a dehydrated list of entries, where those
 * entries may represent items, values, votes, or ordinal settings.
 *
 * @scope    private instance method
 * @param    inJsonString    A JSON string literal representing the world of items. 
 */
BigLumpVirtualServer.prototype.__loadWorldFromListOfRecordsAndUsers = function (inListOfRecords, inListOfUsers) {
  var key;
  var itemUuid;
  var item;
  var entryUuid;
  var entry;
  
  for (key in inListOfRecords) {
    var dehydratedRecord = inListOfRecords[key];

    var dehydratedItem = dehydratedRecord[BigLumpVirtualServer.JSON_MEMBER_ITEM_CLASS];
    var dehydratedVote = dehydratedRecord[BigLumpVirtualServer.JSON_MEMBER_VOTE_CLASS];
    var dehydratedOrdinal = dehydratedRecord[BigLumpVirtualServer.JSON_MEMBER_ORDINAL_CLASS];
    var dehydratedValue = dehydratedRecord[BigLumpVirtualServer.JSON_MEMBER_VALUE_CLASS];

    var contents = dehydratedItem || dehydratedVote || dehydratedOrdinal || dehydratedValue;

    var timestampString = contents[BigLumpVirtualServer.JSON_MEMBER_TIMESTAMP];
    var userstampUuid = contents[BigLumpVirtualServer.JSON_MEMBER_USERSTAMP];
    var timestamp = new Date(new Number(timestampString));
    var userstamp = this.__getItemFromUuidOrBootstrapItem(userstampUuid);

    if (dehydratedItem) {
      itemUuid = dehydratedItem[BigLumpVirtualServer.JSON_MEMBER_WUID];
      item = this.__getItemFromUuidOrBootstrapItem(itemUuid);
      item._rehydrate(timestamp, userstamp);
      this.__myChronologicalListOfRecords.push(item);
    }
    if (dehydratedVote) {
      var retainFlag = dehydratedVote[BigLumpVirtualServer.JSON_MEMBER_RETAIN_FLAG];
      entryUuid = dehydratedVote[BigLumpVirtualServer.JSON_MEMBER_ENTRY];
      entry = this.__getEntryFromUuid(entryUuid);
      var vote = new Vote(entry, userstamp, retainFlag, timestamp);
      this.__myChronologicalListOfRecords.push(vote);
    }
    if (dehydratedOrdinal) {
      var ordinalNumber = dehydratedVote[BigLumpVirtualServer.JSON_MEMBER_ORDINAL_NUMBER];
      entryUuid = dehydratedVote[BigLumpVirtualServer.JSON_MEMBER_ENTRY];
      entry = this.__getEntryFromUuid(entryUuid);
      var ordinal = new Ordinal(entry, userstamp, ordinalNumber, timestamp);
      this.__myChronologicalListOfRecords.push(ordinal);
    }
    if (dehydratedValue) {
      var valueUuid = dehydratedValue[BigLumpVirtualServer.JSON_MEMBER_WUID];
      itemUuid = dehydratedValue[BigLumpVirtualServer.JSON_MEMBER_ITEM];
      item = this.__getItemFromUuidOrBootstrapItem(itemUuid);
      var attributeUuid = dehydratedValue[BigLumpVirtualServer.JSON_MEMBER_ATTRIBUTE];
      var attribute = null;
      if (attributeUuid) {
        attribute = this.__getItemFromUuidOrBootstrapItem(attributeUuid);
      }
      var previousValueUuid = dehydratedValue[BigLumpVirtualServer.JSON_MEMBER_PREVIOUS_VALUE];
      var previousValue = null;
      if (previousValueUuid) {
        previousValue = this.__getValueFromUuidOrBootstrapValue(previousValueUuid);
      }
      var pickledData = dehydratedValue[BigLumpVirtualServer.JSON_MEMBER_DATA];
      var dataType = pickledData[BigLumpVirtualServer.JSON_MEMBER_TYPE];
      var rawData = pickledData[BigLumpVirtualServer.JSON_MEMBER_DATA];
      var finalData = null;
      switch (dataType) {
        case BigLumpVirtualServer.JSON_TYPE_RELATED_UUID:
          finalData = this.__getItemFromUuidOrBootstrapItem(rawData);
          break;
        case BigLumpVirtualServer.JSON_TYPE_STRING_VALUE:
          finalData = rawData;
          break;
        case BigLumpVirtualServer.JSON_TYPE_NUMBER_VALUE:
          finalData = rawData;
          break;
      }
      var value = this.__getValueFromUuidOrBootstrapValue(valueUuid);
      var itemOrValue = previousValue || item;
      value._rehydrate(itemOrValue, attribute, finalData, timestamp, userstamp);
      this.__myChronologicalListOfRecords.push(value);
    }
  }
  for (key in inListOfUsers) {
    var userUuid = inListOfUsers[key];
    var user = this.getItemFromUuid(userUuid);
    this.__myListOfUsers.push(user);
  }
};
  

/**
 * Returns a huge string, containing a JavaScript "object literal"
 * representation of the entire world.
 *
 * @scope    private instance method
 * @return   A JSON string literal, representing all the items in the world. 
 */
BigLumpVirtualServer.prototype.__getJsonStringRepresentingEntireWorld = function () {
  var fileTimestamp = new Date();
  var listOfStrings = [];
  var key;
  
  listOfStrings.push('// Repository dump, in JSON format' + '\n');
  listOfStrings.push('{ ');
  listOfStrings.push('"' + BigLumpVirtualServer.JSON_MEMBER_FORMAT + '": "' + BigLumpVirtualServer.JSON_FORMAT_2005_APRIL + '", ' + '\n');
  listOfStrings.push('  "' + BigLumpVirtualServer.JSON_MEMBER_TIMESTAMP + '": "' + fileTimestamp.toString() + '", ' + '\n');
  listOfStrings.push('  "' + BigLumpVirtualServer.JSON_MEMBER_DATA + '": ' + '[' + '\n');
  var firstEntry = true;
  for (key in this.__myChronologicalListOfRecords) {
    var record = this.__myChronologicalListOfRecords[key];
    if (!firstEntry) {
      listOfStrings.push(',\n');
    }
    if (record instanceof Item) {
      var item = record;
      listOfStrings.push('  { "' + BigLumpVirtualServer.JSON_MEMBER_ITEM_CLASS + '": ' + '{');
      listOfStrings.push('    "' + BigLumpVirtualServer.JSON_MEMBER_WUID + '": "' + item._getUuid() + '",\n');
    }
    if (record instanceof Vote) {
      var vote = record;
      listOfStrings.push('  { "' + BigLumpVirtualServer.JSON_MEMBER_VOTE_CLASS + '": ' + '{');
      listOfStrings.push('    "' + BigLumpVirtualServer.JSON_MEMBER_ENTRY + '": "' + vote.getEntry()._getUuid() + '",\n');
      listOfStrings.push('    "' + BigLumpVirtualServer.JSON_MEMBER_RETAIN_FLAG + '": "' + vote.getRetainFlag() + '",\n');
    }
    if (record instanceof Ordinal) {
      var ordinal = record;
      listOfStrings.push('  { "' + BigLumpVirtualServer.JSON_MEMBER_ORDINAL_CLASS + '": ' + '{');
      listOfStrings.push('    "' + BigLumpVirtualServer.JSON_MEMBER_ENTRY + '": "' + ordinal.getEntry()._getUuid() + '",\n');
      listOfStrings.push('    "' + BigLumpVirtualServer.JSON_MEMBER_ORDINAL_NUMBER + '": "' + ordinal.getOrdinalNumber() + '",\n');
    }
    if (record instanceof Value) {
      var value = record;
      listOfStrings.push('  { "' + BigLumpVirtualServer.JSON_MEMBER_VALUE_CLASS + '": ' + '{');
      listOfStrings.push('    "' + BigLumpVirtualServer.JSON_MEMBER_WUID + '": "' + value._getUuid() + '",\n');
      listOfStrings.push('    "' + BigLumpVirtualServer.JSON_MEMBER_ITEM + '": "' + value.getItem()._getUuid() + '",\n');
      var attribute = value.getAttribute();
      if (attribute) {
        var attributeName = attribute.getDisplayName();
        var attributeNameSubstring = (attributeName + '          ').substring(0, 10);
        listOfStrings.push('    "' + BigLumpVirtualServer.JSON_MEMBER_ATTRIBUTE + '": "' + attribute._getUuid() + '",');
        listOfStrings.push(' /* ' + attributeNameSubstring + ' */ \n');
      }
      var previousValue = value.getPreviousValue();
      if (previousValue) {
        listOfStrings.push('    "' + BigLumpVirtualServer.JSON_MEMBER_PREVIOUS_VALUE + '": "' + previousValue._getUuid() + '",\n');
      }
      var contentData = value.getContentData();
      var pickleString = "";
      var typeString = null;
      var valueString = null;
      if (Util.isNumber(contentData)) {
        typeString = BigLumpVirtualServer.JSON_TYPE_NUMBER_VALUE;
        valueString = contentData;
      }
      if (Util.isString(contentData)) {
        typeString = BigLumpVirtualServer.JSON_TYPE_STRING_VALUE;
        valueString = '"' + contentData + '"';
      }
      if (contentData instanceof Item) {
        typeString = BigLumpVirtualServer.JSON_TYPE_RELATED_UUID;
        valueString = contentData._getUuid();
      }
      pickleString = '{ "' + BigLumpVirtualServer.JSON_MEMBER_TYPE + '": "' + typeString + '", "' + BigLumpVirtualServer.JSON_MEMBER_VALUE + '": ' + valueString + ' }';
      listOfStrings.push('    "' + BigLumpVirtualServer.JSON_MEMBER_DATA + '": ' + pickleString + ',\n');
    }
    listOfStrings.push('    "' + BigLumpVirtualServer.JSON_MEMBER_TIMESTAMP + '": "' + record.getTimestamp().valueOf() + '",\n');
    listOfStrings.push('    "' + BigLumpVirtualServer.JSON_MEMBER_USERSTAMP + '": "' + record.getUserstamp()._getUuid() + '"}\n');
    listOfStrings.push('  }');
  }
  listOfStrings.push("  ], \n");
  listOfStrings.push('  "' + BigLumpVirtualServer.JSON_MEMBER_USERS + '": ' + '[');

  firstEntry = true;
  for (key in this.__myListOfUsers) {
    var user = this.__myListOfUsers[key];
    if (!firstEntry) {
      listOfStrings.push(', ');
    }
    listOfStrings.push('"' + user._getUuid() + '"');
  }
  listOfStrings.push("]\n");
  listOfStrings.push("}");
  var finalString = listOfStrings.join("");
  return finalString;
};


/**
 * Sends all the changes to the server, so that the server can record the
 * changes.
 *
 * @scope    public instance method
 * @return   The list of changes made. 
 */
BigLumpVirtualServer.saveChangesToServer = function () {
  var saveChanges = false;
  if (window.location) {
    if (window.location.protocol == "http:") {
      saveChanges = true;
    }
    if (window.location.protocol == "file:") {
      window.alert("I can't save changes to server, because this page was loaded from a \"file:///\" location, not a real \"http://\" location.  Sorry."); 
    }
  }
  
  for (var key in this.__myChronologicalListOfNewlyCreatedRecords) {
    var newRecord = this.__myChronologicalListOfNewlyCreatedRecords[key];
    this.__myChronologicalListOfRecords.push(newRecord);
  }
  
  if (saveChanges) {
    var url = "save_changes.php";
    this.__myXMLHttpRequestObject.open("POST", url, true);
    this.__myXMLHttpRequestObject.setRequestHeader("Content-Type", "text/xml");
    this.__myXMLHttpRequestObject.send(this.__getJsonStringRepresentingEntireWorld());
  }
  
  var listOfChangesMade = this.__myChronologicalListOfNewlyCreatedRecords;
  this.__myChronologicalListOfNewlyCreatedRecords = [];
  return listOfChangesMade;
};


/**
 * Returns a newly created XMLHttpRequest object.
 *
 * @scope    private instance method
 * @return   A newly created XMLHttpRequest object. 
 */
BigLumpVirtualServer.prototype.__newXMLHttpRequestObject = function () {
  var newXMLHttpRequestObject = null;
  if (window.XMLHttpRequest) {
    newXMLHttpRequestObject = new XMLHttpRequest();
  } else {
    if (window.ActiveXObject) {
      newXMLHttpRequestObject = new ActiveXObject("Microsoft.XMLHTTP");
    }
  }
  if (newXMLHttpRequestObject) {
    var self = this;
    newXMLHttpRequestObject.onreadystatechange = function() {
      window.alert("onreadystatechange:\n" +
        "readyState: " + self.__myXMLHttpRequestObject.readyState + "\n" +
        "status: " + self.__myXMLHttpRequestObject.status + "\n" +
        "statusText: " + self.__myXMLHttpRequestObject.statusText + "\n" +
        "responseText: " + self.__myXMLHttpRequestObject.responseText + "\n");
    };
  }
  return newXMLHttpRequestObject;
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
