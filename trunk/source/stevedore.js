/*****************************************************************************
 stevedore.js
 
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
//   util.js
//   item.js
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Stevedore public class constants
// -------------------------------------------------------------------
Stevedore.UUID_FOR_ATTRIBUTE_UUID = 100;
Stevedore.UUID_FOR_ATTRIBUTE_SHORT_NAME = 101;
Stevedore.UUID_FOR_ATTRIBUTE_NAME = 102;
Stevedore.UUID_FOR_ATTRIBUTE_SUMMARY = 103;
Stevedore.UUID_FOR_ATTRIBUTE_BODY = 104;
Stevedore.UUID_FOR_ATTRIBUTE_CATEGORY = 105;
Stevedore.UUID_FOR_ATTRIBUTE_USERSTAMP = 106;
Stevedore.UUID_FOR_ATTRIBUTE_TIMESTAMP = 107;
Stevedore.UUID_FOR_ATTRIBUTE_SECTION = 108;
Stevedore.UUID_FOR_ATTRIBUTE_QUERY = 109;
Stevedore.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_CATEGORY = 110;
Stevedore.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_ITEM = 111;
Stevedore.UUID_FOR_ATTRIBUTE_LAYOUT_NAME = 112;

Stevedore.UUID_FOR_CATEGORY_BOOK = 141;      // here as an example only
Stevedore.UUID_FOR_CATEGORY_MOVIE = 142;     // here as an example only
Stevedore.UUID_FOR_CATEGORY_ATTRIBUTE = 143;
Stevedore.UUID_FOR_CATEGORY_CATEGORY = 144;
Stevedore.UUID_FOR_CATEGORY_PAGE = 145;
Stevedore.UUID_FOR_CATEGORY_SECTION = 146;
Stevedore.UUID_FOR_CATEGORY_QUERY = 147;

Stevedore.JSON_MEMBER_FORMAT = "format";
Stevedore.JSON_MEMBER_TIMESTAMP = "timestamp";
Stevedore.JSON_MEMBER_DATA = "data";
Stevedore.JSON_FORMAT_2005_MARCH = "2005_MARCH_ITEM_CENTRIC_LIST";

Stevedore.JSON_MEMBER_TYPE = "type";
Stevedore.JSON_MEMBER_VALUE = "value";
Stevedore.JSON_TYPE_STRING_VALUE = "StringValue";
Stevedore.JSON_TYPE_UUID = "Uuid";
Stevedore.JSON_TYPE_FOREIGN_UUID = "ForeignUuid";
Stevedore.JSON_TYPE_NUMBER_VALUE = "NumberValue";


/**
 * Instances of the Stevedore class know how to store and retrieve items to 
 * and from a data source.
 *
 * @scope    public instance constructor
 */
function Stevedore() {
  this._myNextAvailableUuid = 1;
  this._myHashTableOfItemsKeyedByUuid = {};
  this._myCountOfNestedTransactions = 0;
  this._myHomePageItem = null;
  this._myXMLHttpRequestObject = this._newXMLHttpRequestObject();
  this._myListOfDirtyItems = [];
  // this._myDirtyFlag = false;
  
  this._loadBootstrapItems();
}


/**
 * Returns a newly created item.
 *
 * @scope    public instance method
 * @param    inObserver    Optional. An object to be registered as an observer of the returned item. 
 * @return   A newly created item.
 */
Stevedore.prototype.newItem = function (inObserver) {
  var uuid = this._myNextAvailableUuid;
  this._myNextAvailableUuid += 1;
  var item = new Item(this, uuid);
  this._myHashTableOfItemsKeyedByUuid[uuid] = item;
  item.addObserver(inObserver);
  this.markDirty(item);
  return item;
};


// -------------------------------------------------------------------
// Accessor Methods
// -------------------------------------------------------------------

/**
 * Given a UUID, returns the item identified by that UUID.
 *
 * @scope    public instance method
 * @param    inUuid    The UUID of the item to be returned. 
 * @param    inObserver    Optional. An object to be registered as an observer of the returned item. 
 * @return   The item identified by the given UUID.
 */
Stevedore.prototype.getItemFromUuid = function (inUuid, inObserver) {
  Util.assert(Util.isNumeric(inUuid));
  
  var item = this._myHashTableOfItemsKeyedByUuid[inUuid];
  if (item && inObserver) {
    item.addObserver(inObserver);
  }
  return item;
};


/**
 * Given an attribute or an attribute's UUID, return the attribute's UUID.
 *
 * @scope    public instance method
 * @param    inAttributeOrUuid    An attribute, or an attribute's UUID. 
 * @return   The UUID of the attribute.
 */
Stevedore.prototype.getAttributeUuidFromAttributeOrUuid = function (inAttributeOrUuid) {
  Util.assert((inAttributeOrUuid instanceof Item) || Util.isNumeric(inAttributeOrUuid));

  var uuid = null;
  if (Util.isNumeric(inAttributeOrUuid)) {
    uuid = inAttributeOrUuid;
  }
  if (inAttributeOrUuid instanceof Item) {
    uuid = inAttributeOrUuid.getUuid();
  }
  return uuid;
};


/**
 * Returns the page item to be used as the home page.
 *
 * @scope    public instance method
 * @return   A page item.
 */
Stevedore.prototype.getHomePage = function () {
  return this._myHomePageItem; 
};


/**
 * Given a query item, this method returns a list of all the items that 
 * match the query criteria.
 *
 * @scope    public instance method
 * @param    inQuery    A query item. 
 * @return   A list of items.
 */
Stevedore.prototype.getListOfResultItemsForQuery = function (inQuery) {
  Util.assert(inQuery instanceof Item);

  var listOfQueryResultItems = null;
  var listOfMatchingCategories = inQuery.getValueListFromAttribute(Stevedore.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_CATEGORY);
  var listOfMatchingItems = inQuery.getValueListFromAttribute(Stevedore.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_ITEM);
  var isCategoryMatchingQuery = (listOfMatchingCategories && (listOfMatchingCategories.length > 0));
  var isItemMatchingQuery = (listOfMatchingItems && (listOfMatchingItems.length > 0));

  Util.assert(!(isCategoryMatchingQuery && isItemMatchingQuery));

  if (isItemMatchingQuery) {
    listOfQueryResultItems = listOfMatchingItems;
  }
  
  if (isCategoryMatchingQuery) {
    listOfQueryResultItems = [];
    // This is a wildly inefficient search.  But maybe it doesn't matter,
    // because this code should all be replaced someday by server code.
    for (var uuid in this._myHashTableOfItemsKeyedByUuid) {
      var item = this._myHashTableOfItemsKeyedByUuid[uuid];
      var includeItem = true;
      for (var key in listOfMatchingCategories) {
        var category = listOfMatchingCategories[key];
        if (includeItem && !(item.isInCategory(category))) {
          includeItem = false;
        }
      }
      if (includeItem) {
        listOfQueryResultItems.push(item);
      }
    }
  }
  
  if (!isItemMatchingQuery && !isCategoryMatchingQuery) {
    listOfQueryResultItems = [];
    for (var uuid in this._myHashTableOfItemsKeyedByUuid) {
      var item = this._myHashTableOfItemsKeyedByUuid[uuid];
      listOfQueryResultItems.push(item);
    }
  }
  
  return listOfQueryResultItems; 
};



/**
 * Given an item and a query item, this method modifies the attributes 
 * of the item so that when the query is next evaluated the item will be 
 * included in query result list.
 *
 * @scope    public instance method
 * @param    inItem    An item, which will be modified so that it matches the query. 
 * @param    inQuery    A query item. 
 */
Stevedore.prototype.setItemToBeIncludedInQueryResultList = function (inItem, inQuery) {
  Util.assert(inItem instanceof Item);
  Util.assert(inQuery instanceof Item);

  var listOfMatchingCategories = inQuery.getValueListFromAttribute(Stevedore.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_CATEGORY);
  var listOfMatchingItems = inQuery.getValueListFromAttribute(Stevedore.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_ITEM);
  var isCategoryMatchingQuery = (listOfMatchingCategories && (listOfMatchingCategories.length > 0));
  var isItemMatchingQuery = (listOfMatchingItems && (listOfMatchingItems.length > 0));

  Util.assert(!(isCategoryMatchingQuery && isItemMatchingQuery));

  if (isItemMatchingQuery) {
    inQuery.assign(Stevedore.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_ITEM, inItem);
  }
  
  if (isCategoryMatchingQuery) {
    for (var key in listOfMatchingCategories) {
      var category = listOfMatchingCategories[key];
      if (!(inItem.isInCategory(category))) {
        inItem.assign(Stevedore.UUID_FOR_ATTRIBUTE_CATEGORY, category);
      }
    }
  }
};


/**
 * Given a category, this method returns a list of all the items that have been 
 * assigned to that category.
 *
 * @scope    public instance method
 * @param    inCategory    A category item. 
 * @return   A list of items.
 */
Stevedore.prototype.getListOfItemsInCategory = function (inCategory) {
  Util.assert(inCategory instanceof Item);

  var listOfItems = [];
  for (var uuid in this._myHashTableOfItemsKeyedByUuid) {
    var item = this._myHashTableOfItemsKeyedByUuid[uuid];
    if (item.isInCategory(inCategory)) {
      listOfItems.push(item);
    }
    // var kindList = item.getValueListFromAttribute(Repository.ATTRIBUTE_CALLED_KIND);
    // if (kindList) {
    //   if (kindList[0] == inKind) {
    //     listOfItems.push(item);
    //   }
    // }
  }
  return listOfItems; 
};

// -------------------------------------------------------------------
// Transaction Methods
// -------------------------------------------------------------------

/**
 * Marks the beginning of a transaction.
 *
 * Each time you call beginTransaction() you open a new transaction, 
 * which you need to close later using endTransation().  Transactions
 * may be nested, but the beginTransaction and endTransation calls
 * always need to come in pairs. 
 *
 * @scope    public instance method
 */
Stevedore.prototype.beginTransaction = function () {
  this._myCountOfNestedTransactions += 1;
  // PROBLEM:
  //   This is just a stub method for now.  Once we start implementing
  //   support for transactions we'll have to put some real code here.
};
 

/**
 * Marks the end of a transaction.
 *
 * @scope    public instance method
 */
Stevedore.prototype.endTransaction = function () {
  this._myCountOfNestedTransactions -= 1;
  Util.assert(this._myCountOfNestedTransactions >= 0);
  // PROBLEM:
  //   This is just a stub method for now.  Once we start implementing
  //   support for transactions we'll have to put some real code here.
  if (this._myCountOfNestedTransactions === 0) {
    CompleteView.displayStatusBlurb(this._myListOfDirtyItems.length + " changes made");
    if (this._myListOfDirtyItems && (this._myListOfDirtyItems.length > 0)) {
      this._saveChangesToServer();
      this._myListOfDirtyItems = [];
    }
  }
};


/**
 * Marks an item as having been edited during the transaction.
 *
 * @scope    public instance method
 */
Stevedore.prototype.markDirty = function (anItem) {
  Util.assert(Util.isArray(this._myListOfDirtyItems));
  this._myListOfDirtyItems.push(anItem);
};


// -------------------------------------------------------------------
// Private Methods
// -------------------------------------------------------------------

/**
 * Given a UUID, either (a) returns the existing item identified by that UUID, 
 * or (b) creates an new item object, set its UUID, and returns that object.
 *
 * @scope    public instance method
 * @param    inUuid    The UUID of the item to be returned. 
 * @param    inObserver    Optional. An object to be registered as an observer of the returned item. 
 * @return   The item identified by the given UUID.
 */
Stevedore.prototype._getItemFromUuidOrBootstrapItem = function (inUuid, inObserver) {
  var item = this.getItemFromUuid(inUuid, inObserver);
  if (!item) {
    item = new Item(this, inUuid);
    this._myHashTableOfItemsKeyedByUuid[inUuid] = item;
    this._myNextAvailableUuid = Math.max(this._myNextAvailableUuid, (inUuid + 1));   
    item.addObserver(inObserver);
  }
  return item;
};


/**
 * Loads the basic items that needed in order to anything else, like
 * the items for "name", "attribute", and "category".
 *
 * @scope    private instance method
 */
Stevedore.prototype._loadBootstrapItems = function () {
  var uuid;
  var name;
  var item;
  
  // associate display names with the UUIDs of all the attributes
  var hashTableOfAttributeNamesKeyedByUuid = {};
  hashTableOfAttributeNamesKeyedByUuid[Stevedore.UUID_FOR_ATTRIBUTE_SHORT_NAME] = "Short Name";
  hashTableOfAttributeNamesKeyedByUuid[Stevedore.UUID_FOR_ATTRIBUTE_NAME] = "Name";
  hashTableOfAttributeNamesKeyedByUuid[Stevedore.UUID_FOR_ATTRIBUTE_SUMMARY] = "Summary";
  hashTableOfAttributeNamesKeyedByUuid[Stevedore.UUID_FOR_ATTRIBUTE_BODY] = "Body";
  hashTableOfAttributeNamesKeyedByUuid[Stevedore.UUID_FOR_ATTRIBUTE_CATEGORY] = "Category";
  hashTableOfAttributeNamesKeyedByUuid[Stevedore.UUID_FOR_ATTRIBUTE_USERSTAMP] = "Userstamp";
  hashTableOfAttributeNamesKeyedByUuid[Stevedore.UUID_FOR_ATTRIBUTE_TIMESTAMP] = "Timestamp";
  hashTableOfAttributeNamesKeyedByUuid[Stevedore.UUID_FOR_ATTRIBUTE_SECTION] = "Section";
  hashTableOfAttributeNamesKeyedByUuid[Stevedore.UUID_FOR_ATTRIBUTE_QUERY] = "Query";
  hashTableOfAttributeNamesKeyedByUuid[Stevedore.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_CATEGORY] = "Matching Category";
  hashTableOfAttributeNamesKeyedByUuid[Stevedore.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_ITEM] = "Matching Item";
  hashTableOfAttributeNamesKeyedByUuid[Stevedore.UUID_FOR_ATTRIBUTE_LAYOUT_NAME] = "Layout Name";

  // create all the Item objects for the attributes
  for (uuid in hashTableOfAttributeNamesKeyedByUuid) {
    this._getItemFromUuidOrBootstrapItem(uuid);
  }
  
  // associate display names with the UUIDs of all the categories
  var hashTableOfCategoryNamesKeyedByUuid = {};
  hashTableOfCategoryNamesKeyedByUuid[Stevedore.UUID_FOR_CATEGORY_ATTRIBUTE] = "Attribute";
  hashTableOfCategoryNamesKeyedByUuid[Stevedore.UUID_FOR_CATEGORY_CATEGORY] = "Category";
  hashTableOfCategoryNamesKeyedByUuid[Stevedore.UUID_FOR_CATEGORY_PAGE] = "Page";
  hashTableOfCategoryNamesKeyedByUuid[Stevedore.UUID_FOR_CATEGORY_SECTION] = "Section";
  hashTableOfCategoryNamesKeyedByUuid[Stevedore.UUID_FOR_CATEGORY_QUERY] = "Query";

  // create all the Item objects for the categories
  for (uuid in hashTableOfCategoryNamesKeyedByUuid) {
    this._getItemFromUuidOrBootstrapItem(uuid);
  }
 
  // set the display names of all the attributes, and put them in the category called "Attribute"
  var categoryAttribute = this._getItemFromUuidOrBootstrapItem(Stevedore.UUID_FOR_CATEGORY_ATTRIBUTE);
  for (uuid in hashTableOfAttributeNamesKeyedByUuid) {
    item = this.getItemFromUuid(uuid);
    name = hashTableOfAttributeNamesKeyedByUuid[uuid];
    item._initializeAttributeValue(Stevedore.UUID_FOR_ATTRIBUTE_NAME, name);
    item._initializeAttributeValue(Stevedore.UUID_FOR_ATTRIBUTE_CATEGORY, categoryAttribute);
  }
  
  // set the display names of all the categories, and put them in the category called "Category"
  var categoryCategory = this._getItemFromUuidOrBootstrapItem(Stevedore.UUID_FOR_CATEGORY_CATEGORY);
  for (uuid in hashTableOfCategoryNamesKeyedByUuid) {
    item = this.getItemFromUuid(uuid);
    name = hashTableOfCategoryNamesKeyedByUuid[uuid];
    item._initializeAttributeValue(Stevedore.UUID_FOR_ATTRIBUTE_NAME, name);
    item._initializeAttributeValue(Stevedore.UUID_FOR_ATTRIBUTE_CATEGORY, categoryCategory);
  }
  
};


/**
 * Loads sample data.
 *
 * Given a set of sample data in JSON format, bootstraps 
 * new instances of items corresponding to the sample data.
 * 
 * @scope    private instance method
 * @param    inDataSet    A list of items to be loaded, in JSON format. 
 */
Stevedore.prototype._loadItemsFromList = function (inDataSet) {
  Util.assert(Util.isArray(inDataSet) || Util.isObject(inDataSet));
  
  var uuidValue;
  var uuid;
  var item;
  var listOfItems;
  
  if (Util.isArray(inDataSet)) {
    // this is an old, pre-March-15-2005, file format
    listOfItems = inDataSet;
  } else {
    // this is newer file format, circa March-16-2005
    var fileFormat = inDataSet[Stevedore.JSON_MEMBER_FORMAT];
    Util.assert(fileFormat == Stevedore.JSON_FORMAT_2005_MARCH);
    listOfItems = inDataSet[Stevedore.JSON_MEMBER_DATA];
    Util.assert(Util.isArray(listOfItems));
  }
  
  for (var entryKey in listOfItems) {
    var entry = listOfItems[entryKey];
    uuidValue = entry[Stevedore.UUID_FOR_ATTRIBUTE_UUID];
    uuid = uuidValue[Stevedore.JSON_MEMBER_VALUE];
    item = this._getItemFromUuidOrBootstrapItem(uuid);
    for (var propertyKey in entry) {
      if (propertyKey != Stevedore.UUID_FOR_ATTRIBUTE_UUID) { 
        var propertyValue = entry[propertyKey];
        var attributeUuid = propertyKey;
        Util.assert(Util.isArray(propertyValue));
        for (var valueKey in propertyValue) {
          var valueObject = propertyValue[valueKey];
          var valueType = valueObject[Stevedore.JSON_MEMBER_TYPE];
          var valueValue = valueObject[Stevedore.JSON_MEMBER_VALUE];
          var finalValue = null;
          switch (valueType) {
            case Stevedore.JSON_TYPE_FOREIGN_UUID:
              finalValue = this._getItemFromUuidOrBootstrapItem(valueValue);
              break;
            case Stevedore.JSON_TYPE_STRING_VALUE:
              finalValue = valueValue;
              break;
            case Stevedore.JSON_TYPE_NUMBER_VALUE:
              finalValue = valueValue;
              break;
          }
          item._initializeAttributeValue(attributeUuid, finalValue);
        }
      }
    }
  }
  
  // PROBLEM:
  // If we don't have a designated "home page" for this data set, then just
  // look through all the items and set the home page to be the first page 
  // item we come across.  This, of course, is a hack.
  if (!this._myHomePageItem) {
    var categoryPage = this.getItemFromUuid(Stevedore.UUID_FOR_CATEGORY_PAGE);
    for (uuid in this._myHashTableOfItemsKeyedByUuid) {
      item = this.getItemFromUuid(uuid);
      if (item.isInCategory(categoryPage)) {
        this._myHomePageItem = this._myHomePageItem || item;
      }
    }
  }
};


/**
 * Returns a huge string, containing a JavaScript "object literal"
 * representation of the entire cache.
 *
 * @scope    private instance method
 * @return   A string in JavaScript "object literal" format, representing all the items in the cache. 
 */
Stevedore.prototype._getJsonStringRepresentingAllItems = function () {
  var timestamp = new Date();
  var timestampString = timestamp.toString();
  var listOfStrings = [];
  
  listOfStrings.push('// Repository dump, in JSON format' + '\n');
  listOfStrings.push('Stevedore._ourRepositoryInJsonFormat = {' + '\n');
  listOfStrings.push('  "' + Stevedore.JSON_MEMBER_FORMAT + '": "' + Stevedore.JSON_FORMAT_2005_MARCH + '", ' + '\n');
  listOfStrings.push('  "' + Stevedore.JSON_MEMBER_TIMESTAMP + '": "' + timestampString + '", ' + '\n');
  listOfStrings.push('  "' + Stevedore.JSON_MEMBER_DATA + '": ' + '[' + '\n');
  for (var uuid in this._myHashTableOfItemsKeyedByUuid) {
    var uuidInJsonForm = '{ "' + Stevedore.JSON_MEMBER_TYPE + '": "' + Stevedore.JSON_TYPE_UUID + '", "' + Stevedore.JSON_MEMBER_VALUE + '": ' + uuid + ' }';
    listOfStrings.push('  { "' + Stevedore.UUID_FOR_ATTRIBUTE_UUID + '": ' + uuidInJsonForm + ',' + '\n');
    var item = this.getItemFromUuid(uuid);
    var listOfAttributeUuids = item.getListOfAttributeUuids();
    for (var attributeKey in listOfAttributeUuids) {
      var attributeUuid = listOfAttributeUuids[attributeKey];
      var attribute = this.getItemFromUuid(attributeUuid);
      Util.assert(attribute instanceof Item);
      var attributeName = attribute.getDisplayName();
      var attributeNameSubstring = (attributeName + '          ').substring(0, 10);
      listOfStrings.push('    /* ' + attributeNameSubstring + ' */   ');
      listOfStrings.push('"' + attributeUuid + '": [');
      var listOfAttributeValues = item.getValueListFromAttribute(attribute);
      for (var valueKey in listOfAttributeValues) {
        var value = listOfAttributeValues[valueKey];
        var pickleString = "";
        var typeString = null;
        var valueString = null;
        if (Util.isNumber(value)) {
          typeString = Stevedore.JSON_TYPE_NUMBER_VALUE;
          valueString = value;
        }
        if (Util.isString(value)) {
          typeString = Stevedore.JSON_TYPE_STRING_VALUE;
          valueString = '"' + value + '"';
        }
        if (value instanceof Item) {
          typeString = Stevedore.JSON_TYPE_FOREIGN_UUID;
          valueString = value.getUuid();
        }
        pickleString = '{ "' + Stevedore.JSON_MEMBER_TYPE + '": "' + typeString + '", "' + Stevedore.JSON_MEMBER_VALUE + '": ' + valueString + ' }';
        listOfStrings.push(pickleString + ', ');
      }
      listOfStrings.push('],\n');
    }
    listOfStrings.push("  }," + "\n");
  }
  listOfStrings.push("]};" + "\n");
  var finalString = listOfStrings.join("");
  return finalString;
};


/**
 * Returns a newly created XMLHttpRequest object.
 *
 * @scope    private instance method
 * @return   A newly created XMLHttpRequest object. 
 */
Stevedore.prototype._newXMLHttpRequestObject = function () {
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
      alert("onreadystatechange:\n" +
        "readyState: " + this._myXMLHttpRequestObject.readyState + "\n" +
        "status: " + this._myXMLHttpRequestObject.status + "\n" +
        "statusText: " + this._myXMLHttpRequestObject.statusText + "\n" +
        "responseText: " + this._myXMLHttpRequestObject.responseText + "\n");
    };
  }
  return newXMLHttpRequestObject;
};


/**
 * Sends all the changed items to the server, so that the server can save the
 * changes.
 *
 * @scope    private instance method
 */
Stevedore.prototype._saveChangesToServer = function () {
  var saveChanges = false;
  if (window.location) {
    if (window.location.protocol == "http:") {
      saveChanges = true;
    }
    if (window.location.protocol == "file:") {
      alert("I can't save changes to server, because this page was loaded from a \"file:///\" location, not a real \"http://\" location.  Sorry."); 
    }
  }
  
  if (saveChanges) {
    var url = "save_changes.php";
    this._myXMLHttpRequestObject.open("POST", url, true);
    this._myXMLHttpRequestObject.setRequestHeader("Content-Type", "text/xml");
    this._myXMLHttpRequestObject.send(this._getJsonStringRepresentingAllItems());
  }
  
};


/**
 * This is the event handler method that we register with the XMLHttpRequest
 * object's onreadystatechange property.
 *
 * @scope    private class method
 */
Stevedore._handleStateChangeForXMLHttpRequestObject = function () {
  alert("_handleStateChangeForXMLHttpRequestObject()\n"); // +
  //  "readyState: " + this._myXMLHttpRequestObject.readyState + "\n" +
  //  "status: " + this._myXMLHttpRequestObject.status + "\n" +
  //  "statusText: " + this._myXMLHttpRequestObject.statusText + "\n" +
  //  "responseText: " + this._myXMLHttpRequestObject.responseText + "\n");
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
