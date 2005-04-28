/*****************************************************************************
 StubVirtualServer.js
 
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
//   Entry.js
//   Ordinal.js
//   Value.js
//   Vote.js
//   Vote.js
// -------------------------------------------------------------------


/**
 * The StubVirtualServer is a dummy place-holder datastore that does
 * a bare-minimum job of providing data to a World.
 *
 * @scope    public instance constructor
 */
function StubVirtualServer() {
}


/**
 * Initializes the instance variables for a newly created StubVirtualServer.
 *
 * @scope    private instance method
 * @param    inWorld    The world that we provide data for. 
 */
StubVirtualServer.prototype.__initialize = function (inWorld) {
  this.__myWorld = inWorld;
  
  this.__myNextAvailableUuid = 1;
  this.__myHashTableOfItemsKeyedByUuid = {};
  this.__myHashTableOfValuesKeyedByUuid = {};
  this.__myChronologicalListOfRecords = [];
  this.__myChronologicalListOfNewlyCreatedRecords = [];
  
  this.__myListOfUsers = [];
  this.__myHashTableOfUserAuthenticationInfo = {};
  this.__myCurrentUser = null;
};
 

/**
 * Initializes the instance variables for a newly created StubVirtualServer,
 * and does the initial loading of at least the axiomatic items.
 *
 * @scope    public instance method
 * @param    inWorld    The world that we provide data for. 
 */
StubVirtualServer.prototype.setWorldAndLoadAxiomaticItems = function (inWorld) {
  this.__initialize(inWorld);
  this.__loadAxiomaticItems();
};


// -------------------------------------------------------------------
// Methods for creating and changing items
// -------------------------------------------------------------------

/**
 * Returns a newly created item.
 *
 * @scope    public instance method
 * @param    inName    Optional. A string, which will be assigned to the name attribute of the new item. 
 * @param    inObserver    Optional. An object or method to be registered as an observer of the returned item. 
 * @return   A newly created item.
 */
StubVirtualServer.prototype.newItem = function (inName, inObserver) {
  var uuid = this.__getNewUuid();
  var item = new Item(this.__myWorld, uuid);
  item._initialize(inObserver);
  this.__myHashTableOfItemsKeyedByUuid[uuid] = item;
  this.__myChronologicalListOfNewlyCreatedRecords.push(item);
  if (inName) { 
    var attributeCalledName = this.__myWorld.getAttributeCalledName();
    item.addAttributeValue(attributeCalledName, inName);
  }
  return item;
};


/**
 * Returns a newly created value.
 *
 * @scope    public instance method
 * @param    inItemOrValue    The item that this is a value of, or the old value that this value is replacing. 
 * @param    inAttribute    The attribute that this value is assigned to. May be null. 
 * @param    inContentData    The content datat to initialize the value with. 
 * @return   A newly created value.
 */
StubVirtualServer.prototype.newValue = function (inItemOrValue, inAttribute, inContentData) {
  var uuid = this.__getNewUuid();
  var value = new Value(this.__myWorld, uuid);
  value._initialize(inItemOrValue, inAttribute, inContentData);
  this.__myHashTableOfValuesKeyedByUuid[uuid] = value;
  this.__myChronologicalListOfNewlyCreatedRecords.push(value);
  return value;
};
 

/**
 * Returns a newly created ordinal.
 *
 * @scope    public instance method
 * @param    inEntry    The entry that this is an ordinal for. 
 * @param    inOrdinalNumber    The ordinal number itself. 
 * @return   A newly created ordinal.
 */
StubVirtualServer.prototype.newOrdinal = function (inEntry, inOrdinalNumber) {
  var ordinal = new Ordinal(inEntry, this.__myWorld.getCurrentUser(), inOrdinalNumber);
  this.__myChronologicalListOfNewlyCreatedRecords.push(ordinal);
  return ordinal;
};


/**
 * Returns a newly created vote.
 *
 * @scope    public instance method
 * @param    inEntry    The entry to attach this vote to. 
 * @param    inRetainFlag    True if this is a vote to retain. False if this is a vote to delete. 
 * @return   A newly created vote.
 */
StubVirtualServer.prototype.newVote = function (inEntry, inRetainFlag) {
  var vote = new Vote(inEntry, this.__myWorld.getCurrentUser(), inRetainFlag);
  this.__myChronologicalListOfNewlyCreatedRecords.push(vote);
  return vote;
};


// -------------------------------------------------------------------
// Methods having to do with users
// -------------------------------------------------------------------

/**
 * Creates a new item, where the new item represents a user of this datastore.
 *
 * @scope    public instance method
 * @param    inName    A string, which will be assigned to the name attribute of the new item. 
 * @param    inAuthentication    A string which will be used as the login password for the user. 
 * @param    inObserver    Optional. An object or method to be registered as an observer of the returned item. 
 * @return   A newly created item representing a user.
 */
StubVirtualServer.prototype.newUser = function (inName, inAuthentication, inObserver) {
  var newUser = this.newItem(inName, inObserver);
  this.__myListOfUsers.push(newUser);
  this.__myHashTableOfUserAuthenticationInfo[newUser.getUniqueKeyString()] = inAuthentication;
  return newUser;
};


/**
 * Returns an list of all the items that represent users of this datastore.
 *
 * @scope    public instance method
 * @return   A list of items.
 */
StubVirtualServer.prototype.getUsers = function () {
  return this.__myListOfUsers;
};


/**
 * Returns an item representing the user who is currently logged in.
 *
 * @scope    public instance method
 * @return   An item representing the user who is currently logged in.
 */
StubVirtualServer.prototype.getCurrentUser = function () {
  return this.__myCurrentUser;
};


// -------------------------------------------------------------------
// Login and logout methods
// -------------------------------------------------------------------

/**
 * Attempts to login a user.
 *
 * @scope    public instance method
 * @param    inUser    The user to be logged in. 
 * @param    inAuthentication    Authentication info for the user. 
 * @return   True if we were able to log in the user. False if the login failed.
 */
StubVirtualServer.prototype.login = function (inUser, inAuthentication) {
  
  // Only one user can be logged in at once.  We consider it an error
  // if you try to log in a new user before logging out the old one.
  if (this.__myCurrentUser) {
    Util.assert(false);
  }
  
  var isKnownUser = Util.isObjectInSet(inUser, this.__myListOfUsers);
  if (!isKnownUser) {
    return false;
  }

  var realAuthentication = this.__getAuthenticationInfoForUser(inUser);
  var successfulAuthentication = (realAuthentication == inAuthentication);
  if (successfulAuthentication) {
    this.__myCurrentUser = inUser;
    return true;
  } else {
    return false;
  }
};


/**
 * Logs out the current user.
 *
 * @scope    public instance method
 * @return   True if the current user was logged out. False if there was no current user logged in.
 */
StubVirtualServer.prototype.logout = function () {
  if (this.__myCurrentUser) {
    this.__myCurrentUser = null;
    return true;
  } else {
    return false;
  }
};


// -------------------------------------------------------------------
// Other public methods
// -------------------------------------------------------------------

/**
 * Given a UUID, returns the item identified by that UUID.
 *
 * @scope    public instance method
 * @param    inUuid    The UUID of the item to be returned. 
 * @param    inObserver    Optional. An object to be registered as an observer of the returned item. 
 * @return   The item identified by the given UUID.
 */
StubVirtualServer.prototype.getItemFromUuid = function (inUuid, inObserver) {
  Util.assert(Util.isNumeric(inUuid));
  
  var item = this.__myHashTableOfItemsKeyedByUuid[inUuid];
  if (item && inObserver) {
    item.addObserver(inObserver);
  }
  return item;
};


/**
 * Sends all the changes to the server, so that the server can record the
 * changes.
 *
 * @scope    public instance method
 */
StubVirtualServer.prototype.saveChangesToServer = function () {
  // The StubVirtualServer doesn't ever actually talk to a server.
  // Other VirtualServer implementations would be expected to actually
  // implement this method such that it saves changes to the server
  var listOfChangesMade = this.__myChronologicalListOfNewlyCreatedRecords;
  this.__myChronologicalListOfNewlyCreatedRecords = [];
  return listOfChangesMade;
};
  

// -------------------------------------------------------------------
// Query methods
// -------------------------------------------------------------------

/**
 * Given a query item, this method returns a list of all the items that 
 * match the query criteria.
 *
 * @scope    public instance method
 * @param    inQuery    A query item. 
 * @return   A list of items.
 */
StubVirtualServer.prototype.getListOfResultItemsForQuery = function (inQuery, inObserver) {
  Util.assert(inQuery instanceof Item);
  
  var attributeCalledQueryMatchingCategory = this.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_CATEGORY);
  var attributeCalledQueryMatchingItem = this.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_ITEM);

  var uuid = null;
  var item = null;
  var key;
  var listOfQueryResultItems = [];
  var listOfMatchingCategories = inQuery.getValuesForAttribute(attributeCalledQueryMatchingCategory);
  var listOfMatchingItems = inQuery.getValuesForAttribute(attributeCalledQueryMatchingItem);
  var isCategoryMatchingQuery = (listOfMatchingCategories && (listOfMatchingCategories.length > 0));
  var isItemMatchingQuery = (listOfMatchingItems && (listOfMatchingItems.length > 0));

  Util.assert(!(isCategoryMatchingQuery && isItemMatchingQuery));

  if (isItemMatchingQuery) {
    for (key in listOfMatchingItems) {
      var itemValue = listOfMatchingItems[key];
      item = itemValue.getContentData();
      listOfQueryResultItems.push(item);
    }
  }
  
  if (isCategoryMatchingQuery) {
    // This is a wildly inefficient search.  But maybe it doesn't matter,
    // because this code should all be replaced someday by server code.
    for (uuid in this.__myHashTableOfItemsKeyedByUuid) {
      item = this.__myHashTableOfItemsKeyedByUuid[uuid];
      if (!item.hasBeenDeleted()) {
        var includeItem = true;
        for (key in listOfMatchingCategories) {
          var categoryValue = listOfMatchingCategories[key];
          var category = categoryValue.getContentData();
          if (includeItem && !(item.isInCategory(category))) {
            includeItem = false;
          }
        }
        if (includeItem) {
          listOfQueryResultItems.push(item);
        }
      }
    }
  }
  
  if (!isItemMatchingQuery && !isCategoryMatchingQuery) {
    for (uuid in this.__myHashTableOfItemsKeyedByUuid) {
      item = this.__myHashTableOfItemsKeyedByUuid[uuid];
      if (!item.hasBeenDeleted()) {
        listOfQueryResultItems.push(item);
      }
    }
  }
  
  listOfQueryResultItems.sort(Entry.compareOrdinals);
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
StubVirtualServer.prototype.setItemToBeIncludedInQueryResultList = function (inItem, inQuery) {
  Util.assert(inItem instanceof Item);
  Util.assert(inQuery instanceof Item);

  var attributeCalledQueryMatchingCategory = this.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_CATEGORY);
  var attributeCalledQueryMatchingItem = this.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_ITEM);

  var listOfMatchingCategories = inQuery.getValuesForAttribute(attributeCalledQueryMatchingCategory);
  var listOfMatchingItems = inQuery.getValuesForAttribute(attributeCalledQueryMatchingItem);
  var isCategoryMatchingQuery = (listOfMatchingCategories && (listOfMatchingCategories.length > 0));
  var isItemMatchingQuery = (listOfMatchingItems && (listOfMatchingItems.length > 0));

  Util.assert(!(isCategoryMatchingQuery && isItemMatchingQuery));

  if (isItemMatchingQuery) {
    inQuery.addAttributeValue(attributeCalledQueryMatchingItem, inItem);
  }
  
  var attributeCalledCategory = this.__myWorld.getAttributeCalledCategory();
  if (isCategoryMatchingQuery) {
    for (var key in listOfMatchingCategories) {
      var categoryValue = listOfMatchingCategories[key];
      var category = categoryValue.getContentData();
      if (!(inItem.isInCategory(category))) {
        inItem.addAttributeValue(attributeCalledCategory, category);
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
StubVirtualServer.prototype.getListOfItemsInCategory = function (inCategory) {
  Util.assert(inCategory instanceof Item);

  var listOfItems = [];
  for (var uuid in this.__myHashTableOfItemsKeyedByUuid) {
    var item = this.__myHashTableOfItemsKeyedByUuid[uuid];
    if (!item.hasBeenDeleted() && item.isInCategory(inCategory)) {
      listOfItems.push(item);
    }
  }
  listOfItems.sort(Entry.compareOrdinals);
  return listOfItems; 
};


// -------------------------------------------------------------------
// Private methods
// -------------------------------------------------------------------

/**
 * Given a UUID, returns the item or value identified by that UUID.
 *
 * @scope    private instance method
 * @param    inUuid    The UUID of the item or value to be returned. 
 * @return   The item or value identified by the given UUID.
 */
StubVirtualServer.prototype.__getEntryFromUuid = function (inUuid) {
  var item = this.getItemFromUuid(inUuid);
  if (item) {
    return item;
  } else {
    return this.__myHashTableOfValuesKeyedByUuid[inUuid];
  }
};


/**
 * Creates a brand new UUID to allocate to an item or value.
 *
 * @scope    private instance method
 * @return   A newly created UUID.
 */
StubVirtualServer.prototype.__getNewUuid = function () {
  var newUuid = this.__myNextAvailableUuid;
  this.__myNextAvailableUuid += 1;
  return newUuid;
};


/**
 * Given an item representing a user, return the authentication info
 * associated with that user.
 *
 * @scope    private instance method
 * @param    inUser    An item representing a user. 
 * @return   The authentication info for the user.
 */
StubVirtualServer.prototype.__getAuthenticationInfoForUser = function (inUser) {
  return this.__myHashTableOfUserAuthenticationInfo[inUser.getUniqueKeyString()];
};


/**
 * Given a UUID, either (a) returns the existing item identified by that UUID, 
 * or (b) creates an new item object, set its UUID, and returns that object.
 *
 * @scope    private instance method
 * @param    inUuid    The UUID of the item to be returned. 
 * @return   The item identified by the given UUID.
 */
StubVirtualServer.prototype.__getItemFromUuidOrCreateNewItem = function (inUuid) {
  var item = this.getItemFromUuid(inUuid);
  if (!item) {
    this.__myNextAvailableUuid = Math.max(this.__myNextAvailableUuid, (inUuid + 1));   
    item = new Item(this.__myWorld, inUuid);
    item._initialize();
    this.__myHashTableOfItemsKeyedByUuid[inUuid] = item;
    this.__myChronologicalListOfNewlyCreatedRecords.push(item);
  }
  return item;
};


/**
 * Creates the basic items that needed in order to do anything else, 
 * like the items for "name", "attribute", and "category".
 *
 * @scope    private instance method
 */
StubVirtualServer.prototype.__loadAxiomaticItems = function () {
  var uuid;
  var name;
  var item;
  var value;
  
  var axiomaticUser = this.newUser("Amy ex machina", "null");
  this.__myCurrentUser = axiomaticUser;
  
  // associate display names with the UUIDs of all the attributes
  var hashTableOfAttributeNamesKeyedByUuid = {};
  hashTableOfAttributeNamesKeyedByUuid[World.UUID_FOR_ATTRIBUTE_NAME] = "Name";
  hashTableOfAttributeNamesKeyedByUuid[World.UUID_FOR_ATTRIBUTE_SHORT_NAME] = "Short Name";
  hashTableOfAttributeNamesKeyedByUuid[World.UUID_FOR_ATTRIBUTE_SUMMARY] = "Summary";
  hashTableOfAttributeNamesKeyedByUuid[World.UUID_FOR_ATTRIBUTE_BODY] = "Body";
  hashTableOfAttributeNamesKeyedByUuid[World.UUID_FOR_ATTRIBUTE_CATEGORY] = "Category";
  // hashTableOfAttributeNamesKeyedByUuid[World.UUID_FOR_ATTRIBUTE_USERSTAMP] = "Userstamp";
  // hashTableOfAttributeNamesKeyedByUuid[World.UUID_FOR_ATTRIBUTE_TIMESTAMP] = "Timestamp";
  hashTableOfAttributeNamesKeyedByUuid[World.UUID_FOR_ATTRIBUTE_SECTION] = "Section";
  hashTableOfAttributeNamesKeyedByUuid[World.UUID_FOR_ATTRIBUTE_QUERY] = "Query";
  hashTableOfAttributeNamesKeyedByUuid[World.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_CATEGORY] = "Matching Category";
  hashTableOfAttributeNamesKeyedByUuid[World.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_ITEM] = "Matching Item";
  hashTableOfAttributeNamesKeyedByUuid[World.UUID_FOR_ATTRIBUTE_PLUGIN_NAME] = "Plugin Name";

  // create all the Item objects for the attributes
  for (uuid in hashTableOfAttributeNamesKeyedByUuid) {
    this.__getItemFromUuidOrCreateNewItem(uuid);
  }
  
  // associate display names with the UUIDs of all the categories
  var hashTableOfCategoryNamesKeyedByUuid = {};
  hashTableOfCategoryNamesKeyedByUuid[World.UUID_FOR_CATEGORY_ATTRIBUTE] = "Attribute";
  hashTableOfCategoryNamesKeyedByUuid[World.UUID_FOR_CATEGORY_CATEGORY] = "Category";
  hashTableOfCategoryNamesKeyedByUuid[World.UUID_FOR_CATEGORY_PAGE] = "Page";
  hashTableOfCategoryNamesKeyedByUuid[World.UUID_FOR_CATEGORY_SECTION] = "Section";
  hashTableOfCategoryNamesKeyedByUuid[World.UUID_FOR_CATEGORY_QUERY] = "Query";

  // create all the Item objects for the categories
  for (uuid in hashTableOfCategoryNamesKeyedByUuid) {
    this.__getItemFromUuidOrCreateNewItem(uuid);
  }
 
  // set the display names of all the attributes, and put them in the category called "Attribute"
  var categoryCalledAttribute = this.getItemFromUuid(World.UUID_FOR_CATEGORY_ATTRIBUTE);
  var attributeCalledName = this.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_NAME);
  var attributeCalledCategory = this.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_CATEGORY);
  for (uuid in hashTableOfAttributeNamesKeyedByUuid) {
    item = this.getItemFromUuid(uuid);
    name = hashTableOfAttributeNamesKeyedByUuid[uuid];
    item.addAttributeValue(attributeCalledName, name);
    item.addAttributeValue(attributeCalledCategory, categoryCalledAttribute);
  }
  
  // set the display names of all the categories, and put them in the category called "Category"
  var categoryCalledCategory = this.__getItemFromUuidOrCreateNewItem(World.UUID_FOR_CATEGORY_CATEGORY);
  for (uuid in hashTableOfCategoryNamesKeyedByUuid) {
    item = this.getItemFromUuid(uuid);
    name = hashTableOfCategoryNamesKeyedByUuid[uuid];
    item.addAttributeValue(attributeCalledName, name);
    item.addAttributeValue(attributeCalledCategory, categoryCalledCategory);
  }
  
  this.__myChronologicalListOfNewlyCreatedRecords = [];
  this.__myCurrentUser = null;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
