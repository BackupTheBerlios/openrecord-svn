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
//   IdentifiedRecord.js
//   Ordinal.js
//   Entry.js
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
  this.__myHashTableOfEntriesKeyedByUuid = {};
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
 * Throws an Error if there is no user currently logged in.
 *
 * @scope    private instance method
 * @throws   Throws an Error if no user is logged in.
 */
StubVirtualServer.prototype._throwErrorIfNoUserIsLoggedIn = function () {
  if (!this.__myCurrentUser) {
    var error = new Error("No user is logged in.  You can't write to the repository when nobody is logged in.");
    throw error;
  }
};


/**
 * Returns a newly created item.
 *
 * @scope    public instance method
 * @param    inName    Optional. A string, which will be assigned to the name attribute of the new item. 
 * @param    inObserver    Optional. An object or method to be registered as an observer of the returned item. 
 * @return   A newly created item.
 * @throws   Throws an Error if no user is logged in.
 */
StubVirtualServer.prototype.newItem = function (inName, inObserver) {
  this._throwErrorIfNoUserIsLoggedIn();
  var item = this._createNewItem(inObserver, false);
  if (inName) { 
    var attributeCalledName = this.__myWorld.getAttributeCalledName();
    item.addEntryForAttribute(attributeCalledName, inName);
  }
  return item;
};


/**
 * Returns a newly created "provisional" item.  At the time this item is 
 * created, it will only exist in local memory.  Unlike normal items, 
 * provisional items are not saved to the repository at the time they 
 * are created.  The provisional item is saved to the repository when 
 * an entry is set for one of the item's attributes.
 *
 * @scope    public instance method
 * @param    inObserver    Optional. An object or method to be registered as an observer of the returned item. 
 * @return   A newly created provisional item.
 * @throws   Throws an Error if no user is logged in.
 */
StubVirtualServer.prototype.newProvisionalItem = function (inObserver) {
  this._throwErrorIfNoUserIsLoggedIn();
  var item = this._createNewItem(inObserver, true);
  return item;
};


/**
 * Returns a newly created item: either a provisional item or a normal item.
 *
 * @scope    private instance method
 * @param    inObserver    Optional. An object or method to be registered as an observer of the returned item. 
 * @param    inProvisionalFlag    True if the item is provisional; false if the item is normal. 
 * @return   A newly created item.
 */
StubVirtualServer.prototype._createNewItem = function (inObserver, inProvisionalFlag) {
  var uuid = this.__getNewUuid();
  var item = new Item(this.__myWorld, uuid);
  item._initialize(inObserver, inProvisionalFlag);
  this.__myHashTableOfItemsKeyedByUuid[uuid] = item;
  if (!inProvisionalFlag) {
    this.__myChronologicalListOfNewlyCreatedRecords.push(item);
  }
  return item;
};


/**
 * Records the fact that a provisional item just became real.
 *
 * @scope    package instance method
 * @param    inItem    The item that was provisional and just became real. 
 */
StubVirtualServer.prototype._provisionalItemJustBecameReal = function (inItem) {
  this.__myChronologicalListOfNewlyCreatedRecords.push(inItem);
};


/**
 * Returns a newly created entry.
 *
 * @scope    public instance method
 * @param    inItemOrEntry    The item that this is a entry of, or the old entry that this entry is replacing. 
 * @param    inAttribute    The attribute that this entry is assigned to. May be null. 
 * @param    inValue    The value to initialize the entry with. 
 * @return   A newly created entry.
 * @throws   Throws an Error if no user is logged in.
 */
StubVirtualServer.prototype.newEntry = function (inItemOrEntry, inAttribute, inValue) {
  this._throwErrorIfNoUserIsLoggedIn();
  var uuid = this.__getNewUuid();
  var entry = new Entry(this.__myWorld, uuid);
  entry._initialize(inItemOrEntry, inAttribute, inValue);
  this.__myHashTableOfEntriesKeyedByUuid[uuid] = entry;
  this.__myChronologicalListOfNewlyCreatedRecords.push(entry);
  return entry;
};
 

/**
 * Returns a newly created ordinal.
 *
 * @scope    public instance method
 * @param    inIdentifiedRecord    The identifiedRecord that this is an ordinal for. 
 * @param    inOrdinalNumber    The ordinal number itself. 
 * @return   A newly created ordinal.
 * @throws   Throws an Error if no user is logged in.
 */
StubVirtualServer.prototype.newOrdinal = function (inIdentifiedRecord, inOrdinalNumber) {
  this._throwErrorIfNoUserIsLoggedIn();
  var ordinal = new Ordinal(inIdentifiedRecord, this.__myWorld.getCurrentUser(), inOrdinalNumber);
  this.__myChronologicalListOfNewlyCreatedRecords.push(ordinal);
  return ordinal;
};


/**
 * Returns a newly created vote.
 *
 * @scope    public instance method
 * @param    inIdentifiedRecord    The identifiedRecord to attach this vote to. 
 * @param    inRetainFlag    True if this is a vote to retain. False if this is a vote to delete. 
 * @return   A newly created vote.
 * @throws   Throws an Error if no user is logged in.
 */
StubVirtualServer.prototype.newVote = function (inIdentifiedRecord, inRetainFlag) {
  this._throwErrorIfNoUserIsLoggedIn();
  var vote = new Vote(inIdentifiedRecord, this.__myWorld.getCurrentUser(), inRetainFlag);
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
 * @throws   Throws an Error if a user is logged in.
 */
StubVirtualServer.prototype.newUser = function (inName, inAuthentication, inObserver) {
  if (this.__myCurrentUser) {
    var error = new Error("A user is logged in.  You can't create a new user when somebody is already logged in.");
    throw error;
  }

  var newUser = this._createNewItem(inObserver, false);
  newUser.__myCreationUserstamp = newUser;
  this.__myListOfUsers.push(newUser);
  this.__myHashTableOfUserAuthenticationInfo[newUser.getUniqueKeyString()] = inAuthentication;

  if (inName) { 
    this.__myCurrentUser = newUser;
    var attributeCalledName = this.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_NAME);
    var entry = newUser.addEntryForAttribute(attributeCalledName, inName);
    // entry.__myCreationUserstamp = newUser;
    this.__myCurrentUser = null;
  }
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
  
  // PENDING: temporary hack
  // if (!successfulAuthentication) {
  //  successfulAuthentication = ("PENDING: magic super password" == inAuthentication);
  // }
  
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
StubVirtualServer.prototype.getResultItemsForQuery = function (inQuery, inObserver) {
  Util.assert(inQuery instanceof Item);
  
  var attributeCalledQueryMatchingCategory = this.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_CATEGORY);
  var attributeCalledQueryMatchingItem = this.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_ITEM);

  var uuid = null;
  var item = null;
  var key;
  var listOfQueryResultItems = [];
  var listOfMatchingCategories = inQuery.getEntriesForAttribute(attributeCalledQueryMatchingCategory);
  var listOfMatchingItems = inQuery.getEntriesForAttribute(attributeCalledQueryMatchingItem);
  var isCategoryMatchingQuery = (listOfMatchingCategories && (listOfMatchingCategories.length > 0));
  var isItemMatchingQuery = (listOfMatchingItems && (listOfMatchingItems.length > 0));

  Util.assert(!(isCategoryMatchingQuery && isItemMatchingQuery));

  if (isItemMatchingQuery) {
    for (key in listOfMatchingItems) {
      var itemEntry = listOfMatchingItems[key];
      item = itemEntry.getValue();
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
          var categoryEntry = listOfMatchingCategories[key];
          var category = categoryEntry.getValue();
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
  
  listOfQueryResultItems.sort(IdentifiedRecord.compareOrdinals);
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

  var listOfMatchingCategories = inQuery.getEntriesForAttribute(attributeCalledQueryMatchingCategory);
  var listOfMatchingItems = inQuery.getEntriesForAttribute(attributeCalledQueryMatchingItem);
  var isCategoryMatchingQuery = (listOfMatchingCategories && (listOfMatchingCategories.length > 0));
  var isItemMatchingQuery = (listOfMatchingItems && (listOfMatchingItems.length > 0));

  Util.assert(!(isCategoryMatchingQuery && isItemMatchingQuery));

  if (isItemMatchingQuery) {
    inQuery.addEntryForAttribute(attributeCalledQueryMatchingItem, inItem);
  }
  
  var attributeCalledCategory = this.__myWorld.getAttributeCalledCategory();
  if (isCategoryMatchingQuery) {
    for (var key in listOfMatchingCategories) {
      var categoryEntry = listOfMatchingCategories[key];
      var category = categoryEntry.getValue();
      if (!(inItem.isInCategory(category))) {
        inItem.addEntryForAttribute(attributeCalledCategory, category);
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
StubVirtualServer.prototype.getItemsInCategory = function (inCategory) {
  Util.assert(inCategory instanceof Item);

  var listOfItems = [];
  for (var uuid in this.__myHashTableOfItemsKeyedByUuid) {
    var item = this.__myHashTableOfItemsKeyedByUuid[uuid];
    if (!item.hasBeenDeleted() && item.isInCategory(inCategory)) {
      listOfItems.push(item);
    }
  }
  listOfItems.sort(IdentifiedRecord.compareOrdinals);
  return listOfItems; 
};


// -------------------------------------------------------------------
// Private methods
// -------------------------------------------------------------------

/**
 * Given a UUID, returns the item or entry identified by that UUID.
 *
 * @scope    private instance method
 * @param    inUuid    The UUID of the item or entry to be returned. 
 * @return   The item or entry identified by the given UUID.
 */
StubVirtualServer.prototype.__getIdentifiedRecordFromUuid = function (inUuid) {
  var item = this.getItemFromUuid(inUuid);
  if (item) {
    return item;
  } else {
    return this.__myHashTableOfEntriesKeyedByUuid[inUuid];
  }
};


/**
 * Creates a brand new UUID to allocate to an item or entry.
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
    if (Util.isString(inUuid)) {
      Util.assert(Util.isNumeric(inUuid));
      inUuid = parseInt(inUuid);
    }
    Util.assert(Util.isNumber(inUuid));
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
  var entry;
  
  this.__myWorld.beginTransaction();
  var axiomaticUser = this.__getItemFromUuidOrCreateNewItem(World.UUID_FOR_USER_AMY);
  axiomaticUser.__myCreationUserstamp = axiomaticUser;
  this.__myListOfUsers.push(axiomaticUser);
  this.__myHashTableOfUserAuthenticationInfo[axiomaticUser.getUniqueKeyString()] = null;
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
  // hashTableOfAttributeNamesKeyedByUuid[World.UUID_FOR_ATTRIBUTE_SECTION] = "Section";
  hashTableOfAttributeNamesKeyedByUuid[World.UUID_FOR_ATTRIBUTE_QUERY] = "Query";
  hashTableOfAttributeNamesKeyedByUuid[World.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_CATEGORY] = "Matching Category";
  hashTableOfAttributeNamesKeyedByUuid[World.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_ITEM] = "Matching Item";
  // hashTableOfAttributeNamesKeyedByUuid[World.UUID_FOR_ATTRIBUTE_PLUGIN_NAME] = "Plugin Name";
  hashTableOfAttributeNamesKeyedByUuid[World.UUID_FOR_ATTRIBUTE_UNFILED] = "Unfiled Entry";

  // create all the Item objects for the attributes
  for (uuid in hashTableOfAttributeNamesKeyedByUuid) {
    this.__getItemFromUuidOrCreateNewItem(uuid);
  }
  
  // associate display names with the UUIDs of all the categories
  var hashTableOfCategoryNamesKeyedByUuid = {};
  hashTableOfCategoryNamesKeyedByUuid[World.UUID_FOR_CATEGORY_ATTRIBUTE] = "Attribute";
  hashTableOfCategoryNamesKeyedByUuid[World.UUID_FOR_CATEGORY_CATEGORY] = "Category";
  // hashTableOfCategoryNamesKeyedByUuid[World.UUID_FOR_CATEGORY_PAGE] = "Page";
  // hashTableOfCategoryNamesKeyedByUuid[World.UUID_FOR_CATEGORY_SECTION] = "Section";
  hashTableOfCategoryNamesKeyedByUuid[World.UUID_FOR_CATEGORY_QUERY] = "Query";

  // create all the Item objects for the categories
  for (uuid in hashTableOfCategoryNamesKeyedByUuid) {
    this.__getItemFromUuidOrCreateNewItem(uuid);
  }
 
  // set the name of the axiomaticUser
  var attributeCalledName = this.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_NAME);
  axiomaticUser.addEntryForAttribute(attributeCalledName, "Amy ex machina");
  
  // set the names of all the attributes, and put them in the category called "Attribute"
  var categoryCalledAttribute = this.getItemFromUuid(World.UUID_FOR_CATEGORY_ATTRIBUTE);
  var attributeCalledCategory = this.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_CATEGORY);
  for (uuid in hashTableOfAttributeNamesKeyedByUuid) {
    item = this.getItemFromUuid(uuid);
    name = hashTableOfAttributeNamesKeyedByUuid[uuid];
    item.addEntryForAttribute(attributeCalledName, name);
    item.addEntryForAttribute(attributeCalledCategory, categoryCalledAttribute);
  }
  
  // set the names of all the categories, and put them in the category called "Category"
  var categoryCalledCategory = this.__getItemFromUuidOrCreateNewItem(World.UUID_FOR_CATEGORY_CATEGORY);
  for (uuid in hashTableOfCategoryNamesKeyedByUuid) {
    item = this.getItemFromUuid(uuid);
    name = hashTableOfCategoryNamesKeyedByUuid[uuid];
    item.addEntryForAttribute(attributeCalledName, name);
    item.addEntryForAttribute(attributeCalledCategory, categoryCalledCategory);
  }
  
  this.__myCurrentUser = null;

  for (var key in this.__myChronologicalListOfNewlyCreatedRecords) {
    var newRecord = this.__myChronologicalListOfNewlyCreatedRecords[key];
    this.__myChronologicalListOfRecords.push(newRecord);
  }
  var listOfNewlyCreatedRecords = this.__myChronologicalListOfNewlyCreatedRecords;
  this.__myChronologicalListOfNewlyCreatedRecords = [];
  this.__myWorld.endTransaction();
  return listOfNewlyCreatedRecords;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
