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
//   ContentRecord.js
//   Ordinal.js
//   Entry.js
//   Vote.js
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// DeltaVirtualServer public class constants
// -------------------------------------------------------------------
StubVirtualServer.JSON_MEMBER_FORMAT = "format";
StubVirtualServer.JSON_MEMBER_RECORDS = "records";

StubVirtualServer.JSON_FORMAT_2005_JUNE_RECORDS = "2005_JUNE_CHRONOLOGICAL_LIST";

StubVirtualServer.JSON_MEMBER_TYPE = "type";
StubVirtualServer.JSON_MEMBER_VALUE = "value";

StubVirtualServer.JSON_TYPE_TEXT_VALUE = "TextValue";
StubVirtualServer.JSON_TYPE_RELATED_UUID = "RelatedUuid";
StubVirtualServer.JSON_TYPE_NUMBER_VALUE = "NumberValue";
StubVirtualServer.JSON_TYPE_DATE_VALUE = "DateValue";
StubVirtualServer.JSON_TYPE_CHECKMARK_VALUE = "CheckMarkValue";
StubVirtualServer.JSON_TYPE_URL_VALUE = "UrlValue";
StubVirtualServer.JSON_TYPE_CONNECTION = "Connection";

StubVirtualServer.JSON_MEMBER_UUID = "uuid";
StubVirtualServer.JSON_MEMBER_USER = "user";
StubVirtualServer.JSON_MEMBER_PASSWORD = "password";

StubVirtualServer.JSON_MEMBER_ITEM_CLASS = "Item";
StubVirtualServer.JSON_MEMBER_ENTRY_CLASS = "Entry";
StubVirtualServer.JSON_MEMBER_VOTE_CLASS = "Vote";
StubVirtualServer.JSON_MEMBER_ORDINAL_CLASS = "Ordinal";
StubVirtualServer.JSON_MEMBER_USER_CLASS = "User";
StubVirtualServer.JSON_MEMBER_TRANSACTION_CLASS = "Transaction";

StubVirtualServer.JSON_MEMBER_ATTRIBUTE = "attribute";
StubVirtualServer.JSON_MEMBER_PREVIOUS_VALUE = "previousEntry";
StubVirtualServer.JSON_MEMBER_RECORD = "record";
StubVirtualServer.JSON_MEMBER_ITEM = "item";
StubVirtualServer.JSON_MEMBER_RETAIN_FLAG = "retainFlag";
StubVirtualServer.JSON_MEMBER_ORDINAL_NUMBER = "ordinalNumber";


/**
 * The StubVirtualServer is a dummy place-holder datastore that does
 * a bare-minimum job of providing data to a World.
 *
 * @scope    public instance constructor
 */
function StubVirtualServer(pathToTrunkDirectory) {
  var fileName = "2005_june_axiomatic_items.json";
  var urlForAxiomaticFile = "";
  if (pathToTrunkDirectory) {
    urlForAxiomaticFile = pathToTrunkDirectory;
  }
  urlForAxiomaticFile += "source/model/" + fileName;
  
  this._myDehydratedAxiomFileURL = urlForAxiomaticFile;
}


/**
 * Initializes the instance variables for a newly created StubVirtualServer.
 *
 * @scope    private instance method
 * @param    inWorld    The world that we provide data for. 
 */
StubVirtualServer.prototype._initialize = function (inWorld) {
  this.__myWorld = inWorld;
  
  this._countOfNestedTransactions = 0;
  this._currentTransaction = null;

  this.__myHashTableOfItemsKeyedByUuid = {};
  this.__myHashTableOfEntriesKeyedByUuid = {};
  this.__myChronologicalListOfRecords = [];
  
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
  this._initialize(inWorld);
  this._buildTypeHashTable();
  this._loadAxiomaticItemsFromFileAtURL(this._myDehydratedAxiomFileURL);
};


/**
 * Returns the World instance that this virtual server is using.
 *
 * @scope    public instance method
 * @return   A World object. 
 */
StubVirtualServer.prototype.getWorld = function () {
  return this.__myWorld;
};


// -------------------------------------------------------------------
// Transaction Methods
// -------------------------------------------------------------------

/**
 * Marks the beginning of a transaction.
 *
 * Each time you call beginTransaction() you open a new transaction, 
 * which you need to close later using endTransaction().  Transactions
 * may be nested, but the beginTransaction and endTransaction calls
 * always need to come in pairs. 
 *
 * @scope    public instance method
 */
StubVirtualServer.prototype.beginTransaction = function() {
  if (this._countOfNestedTransactions === 0) {
    this._currentTransaction = new Transaction();
  }
  this._countOfNestedTransactions += 1;
};
 

/**
 * Marks the end of a transaction.
 *
 * @scope    public instance method
 */
StubVirtualServer.prototype.endTransaction = function() {
  this._countOfNestedTransactions -= 1;
  Util.assert(this._countOfNestedTransactions >= 0);

  if (this._countOfNestedTransactions === 0) {
    var listOfChangesMade = this.saveChangesToServer();
    this._currentTransaction = null;
    if (listOfChangesMade.length > 0) {
      // alert(listOfChangesMade.length + " changes made");
      // Util.displayStatusBlurb(listOfChangesMade.length + " changes made");
      this.__myWorld._notifyObserversOfChanges(listOfChangesMade);
    }
  }
};


/**
 * Returns the Transaction object for the current transaction.
 *
 * @scope    public instance method
 * @return   A Transaction object, or null if there is no transaction in progress. 
 */
StubVirtualServer.prototype.getCurrentTransaction = function () {
  return this._currentTransaction;
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
  var uuid = this._getNewUuid();
  var item = new Item(this.__myWorld, uuid);
  item._initialize(inObserver, inProvisionalFlag);
  this.__myHashTableOfItemsKeyedByUuid[uuid] = item;
  if (!inProvisionalFlag) {
    this._currentTransaction.addRecord(item);
    // this.__myChronologicalListOfNewlyCreatedRecords.push(item);
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
  this._currentTransaction.addRecord(inItem);
};


/**
 * Returns a newly created entry.
 *
 * @scope    public instance method
 * @param    item    The item that this is an entry of. 
 * @param    previousEntry    Optional. The old entry that this entry is replacing. 
 * @param    attribute    The attribute that this entry is assigned to. May be null. 
 * @param    value    The value to initialize the entry with. 
 * @param    type    Optional. An item representing the data type of the value. 
 * @return   A newly created entry.
 * @throws   Throws an Error if no user is logged in.
 */
StubVirtualServer.prototype.newEntry = function (item, previousEntry, attribute, value, type) {
  this._throwErrorIfNoUserIsLoggedIn();
  var uuid = this._getNewUuid();
  var entry = new Entry(this.__myWorld, uuid);
  entry._initialize(item, previousEntry, attribute, value, type);
  item.__addEntryToListOfEntriesForAttribute(entry, attribute);
  
  this.__myHashTableOfEntriesKeyedByUuid[uuid] = entry;
  this._currentTransaction.addRecord(entry);
  return entry;
};
 

/**
 * Returns a newly created entry.
 *
 * @scope    public instance method
 * @param    previousEntry    The entry that this entry will replace. Can be null.
 * @param    itemOne    One of the two items that this entry will connect. 
 * @param    attributeOne    The attribute of itemOne that this entry will be assigned to. 
 * @param    itemTwo    One of the two items that this entry will connect. 
 * @param    attributeTwo    The attribute of itemTwo that this entry will be assigned to.  
 * @return   A newly created entry.
 * @throws   Throws an Error if no user is logged in.
 */
StubVirtualServer.prototype.newConnectionEntry = function(previousEntry, itemOne, attributeOne, itemTwo, attributeTwo) {
  this._throwErrorIfNoUserIsLoggedIn();
  var uuid = this._getNewUuid();
  var entry = new Entry(this.__myWorld, uuid);
  entry._initializeConnection(previousEntry, itemOne, attributeOne, itemTwo, attributeTwo);

  itemOne.__addEntryToListOfEntriesForAttribute(entry, attributeOne);
  itemTwo.__addEntryToListOfEntriesForAttribute(entry, attributeTwo);

  this.__myHashTableOfEntriesKeyedByUuid[uuid] = entry;
  this._currentTransaction.addRecord(entry);
  return entry;
};


/**
 * Returns a newly created ordinal.
 *
 * @scope    public instance method
 * @param    inContentRecord    The contentRecord that this is an ordinal for. 
 * @param    inOrdinalNumber    The ordinal number itself. 
 * @return   A newly created ordinal.
 * @throws   Throws an Error if no user is logged in.
 */
StubVirtualServer.prototype.newOrdinal = function (inContentRecord, inOrdinalNumber) {
  this._throwErrorIfNoUserIsLoggedIn();
  var uuid = this._getNewUuid();
  var ordinal = new Ordinal(this.__myWorld, uuid, inContentRecord, inOrdinalNumber);
  this._currentTransaction.addRecord(ordinal);
  return ordinal;
};


/**
 * Returns a newly created vote.
 *
 * @scope    public instance method
 * @param    inContentRecord    The contentRecord to attach this vote to. 
 * @param    inRetainFlag    True if this is a vote to retain. False if this is a vote to delete. 
 * @return   A newly created vote.
 * @throws   Throws an Error if no user is logged in.
 */
StubVirtualServer.prototype.newVote = function (inContentRecord, inRetainFlag) {
  this._throwErrorIfNoUserIsLoggedIn();
  var uuid = this._getNewUuid();
  var vote = new Vote(this.__myWorld, uuid, inContentRecord, inRetainFlag);
  this._currentTransaction.addRecord(vote);
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
  this.__myListOfUsers.push(newUser);
  
  var md5Authentication = null;
  if (inAuthentication) {
    md5Authentication = Util.hex_md5(inAuthentication);
  }
  this.__myHashTableOfUserAuthenticationInfo[newUser.getUniqueKeyString()] = md5Authentication;

  this.__myCurrentUser = newUser;
  var categoryCalledPerson = this.getWorld().getCategoryCalledPerson();
  newUser.assignToCategory(categoryCalledPerson); 
  if (inName) { 
    var attributeCalledName = this.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_NAME);
    var entry = newUser.addEntryForAttribute(attributeCalledName, inName);
  }
  this.__myCurrentUser = null;
  
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
 * @param    inPassword    Password supplied at login. 
 * @return   True if we were able to log in the user. False if the login failed.
 */
StubVirtualServer.prototype.login = function (inUser, inPassword) {
  
  // Only one user can be logged in at once.  We consider it an error
  // if you try to log in a new user before logging out the old one.
  if (this.__myCurrentUser) {
    Util.assert(false);
  }
  
  var isKnownUser = Util.isObjectInSet(inUser, this.__myListOfUsers);
  if (!isKnownUser) {
    return false;
  }

  if (inUser._getUuid() == World.UUID_FOR_USER_AMY) {
    // nobody is allowed to log in as the axiomatic user
    return false;
  }
  
  var md5hashOfPassword = null;
  if (inPassword) {
    md5hashOfPassword = Util.hex_md5(inPassword);
  }
  var realAuthentication = this._getAuthenticationInfoForUser(inUser);
  var successfulAuthentication = ((realAuthentication == md5hashOfPassword) || !realAuthentication);
  
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
  Util.assert(Util.isUuid(inUuid), inUuid + ' is not a Uuid');
  
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
  var listOfChangesMade = this._currentTransaction.getRecords();
  this._currentTransaction = null;
  return listOfChangesMade;
};
  

// -------------------------------------------------------------------
// Query methods
// -------------------------------------------------------------------

/**
 * Given a query item, this method returns a list of all the items that 
 * match the query criteria.
 *
 * @deprecated    PENDING: use getResultItemsForQueryRunner() instead.
 * @scope    public instance method
 * @param    inQuery    A query item. 
 * @return   A list of items.
 */
StubVirtualServer.prototype.getResultItemsForQuery = function (inQuery, inObserver) {
  Util.assert(inQuery instanceof Item);
  
  var attributeCalledQueryMatchingValue = this.getWorld().getAttributeCalledQueryMatchingValue();
  var attributeCalledQueryMatchingAttribute = this.getWorld().getAttributeCalledQueryMatchingAttribute();

  var uuid = null;
  var item = null;
  var key;
  var listOfQueryResultItems = [];
  var listOfMatchingEntries = inQuery.getEntriesForAttribute(attributeCalledQueryMatchingValue);
  var listOfMatchingAttrs = inQuery.getEntriesForAttribute(attributeCalledQueryMatchingAttribute);
  if (!listOfMatchingEntries || listOfMatchingEntries.length === 0) {
    return [];
  }
  var matchingAttribute;
  if (listOfMatchingAttrs.length === 0) {
    // by default matching attribute is category
    matchingAttribute = this.getWorld().getAttributeCalledCategory();
  }
  else {
    Util.assert(listOfMatchingAttrs.length==1, 'more than one matching attributes');
    matchingAttribute = listOfMatchingAttrs[0].getValue();
  }

  // This is a wildly inefficient search.  But maybe it doesn't matter,
  // because this code should all be replaced someday by server code.
  for (uuid in this.__myHashTableOfItemsKeyedByUuid) {
    item = this.__myHashTableOfItemsKeyedByUuid[uuid];
    if (!item.hasBeenDeleted()) {
      var includeItem = true;
      for (key in listOfMatchingEntries) {
        var matchingEntry = listOfMatchingEntries[key];
        var match = matchingEntry.getValue();
        if (includeItem && !(item.hasAttributeValue(matchingAttribute, match))) {
          includeItem = false;
        }
      }
      if (includeItem) {
        listOfQueryResultItems.push(item);
      }
    }
  }
  
  listOfQueryResultItems.sort(ContentRecord.compareOrdinals);
  return listOfQueryResultItems; 
};


/**
 * Given a QueryRunner object, this method returns a list of all the items that 
 * match the query criteria.
 *
 * @scope    public instance method
 * @param    queryRunner    A QueryRunner object. 
 * @return   A list of items.
 */
StubVirtualServer.prototype.getResultItemsForQueryRunner = function(queryRunner) {
  var matchingAttribute = queryRunner.getMatchingAttribute();
  var listOfMatchingValues = queryRunner.getMatchingValues();
  var listOfQueryResultItems = [];
  var key;
  
  if (!matchingAttribute || !listOfMatchingValues) {
    return listOfQueryResultItems;
  }
    
  var attributeCalledCategory = this.getWorld().getAttributeCalledCategory();
  if (matchingAttribute == attributeCalledCategory) {
    // If this is a query for all the item in a category,
    // then handle that as a special case, because we can
    // do that way faster than more general queries.
    var attributeCalledItemsInCategory = this.getWorld().getAttributeCalledItemsInCategory();
    for (key in listOfMatchingValues) {
      var category = listOfMatchingValues[key];
      var listOfEntriesForItemsInCategory = category.getEntriesForAttribute(attributeCalledItemsInCategory);
      for (var innerKey in listOfEntriesForItemsInCategory) {
        var entry = listOfEntriesForItemsInCategory[innerKey];
        var itemInCategory = entry.getValue(category);
        Util.addObjectToSet(itemInCategory, listOfQueryResultItems);
      }
    }
  } else {
    // General case code for any sort of query. 
    for (var uuid in this.__myHashTableOfItemsKeyedByUuid) {
      var item = this.__myHashTableOfItemsKeyedByUuid[uuid];
      var includeItem = queryRunner.doesItemMatch(item);
      if (includeItem) {
        listOfQueryResultItems.push(item);
      }
    }
  }
  listOfQueryResultItems.sort(ContentRecord.compareOrdinals);
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
  var attributeCalledQueryMatchingValue = this.getWorld().getAttributeCalledQueryMatchingValue();
  var attributeCalledQueryMatchingAttribute = this.getWorld().getAttributeCalledQueryMatchingAttribute();
  var attributeCalledCategory = this.getWorld().getAttributeCalledCategory();
  var categoryCalledCategory = this.getWorld().getCategoryCalledCategory();
  
  var listOfMatchingEntries = inQuery.getEntriesForAttribute(attributeCalledQueryMatchingValue);
  var listOfMatchingAttrs = inQuery.getEntriesForAttribute(attributeCalledQueryMatchingAttribute);
  if (!(listOfMatchingEntries && (listOfMatchingEntries.length > 0))) {return;} // query not fully formed, so nothing to add
  var matchingAttribute;
  if (listOfMatchingAttrs.length === 0) {
    // by default matching attribute is category
    matchingAttribute = attributeCalledCategory;
  }
  else {
    Util.assert(listOfMatchingAttrs.length==1, 'more than one matching attributes');
    matchingAttribute = listOfMatchingAttrs[0].getValue();
  }

  for (var key in listOfMatchingEntries) {
    var matchingEntry = listOfMatchingEntries[key];
    var match = matchingEntry.getValue();
    if (!inItem.hasAttributeValue(matchingAttribute, match)) {
      if ((matchingAttribute == attributeCalledCategory) && (match instanceof Item) && (match.isInCategory(categoryCalledCategory))) {
        inItem.assignToCategory(match);
      } else {
        inItem.addEntryForAttribute(matchingAttribute, match);
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
StubVirtualServer.prototype.getItemsInCategory = function (category) {
  Util.assert(category instanceof Item);

/*  
  var listOfItems = [];
  for (var uuid in this.__myHashTableOfItemsKeyedByUuid) {
    var item = this.__myHashTableOfItemsKeyedByUuid[uuid];
    if (!item.hasBeenDeleted() && item.isInCategory(category)) {
      listOfItems.push(item);
    }
  }
  listOfItems.sort(ContentRecord.compareOrdinals);
  return listOfItems; 
  */
  var attributeCalledItemsInCategory = this.getWorld().getAttributeCalledItemsInCategory();
  var listOfEntries = category.getEntriesForAttribute(attributeCalledItemsInCategory);
  var listOfItems = [];
  for (var key in listOfEntries) {
    var entry = listOfEntries[key];
    var item = entry.getValue(category);
    listOfItems.push(item);
  }
  listOfItems.sort(ContentRecord.compareOrdinals);
  return listOfItems; 
};


// -------------------------------------------------------------------
// Private methods
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
 * Given a UUID, returns the item or entry identified by that UUID.
 *
 * @scope    private instance method
 * @param    inUuid    The UUID of the item or entry to be returned. 
 * @return   The item or entry identified by the given UUID.
 */
StubVirtualServer.prototype._getContentRecordFromUuid = function (inUuid) {
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
StubVirtualServer.prototype._getNewUuid = function() {
  var newUuid;
  if (this.__myCurrentUser) {
    var uuidOfCurrentUser = this.__myCurrentUser._getUuid();
    var arrayOfParts = uuidOfCurrentUser.split("-");
    var pseudoNodeOfCurrentUser = arrayOfParts[4];//"0123456789AB";
    newUuid = Util.generateTimeBasedUuid(pseudoNodeOfCurrentUser);
  }
  else {
    newUuid = Util.generateTimeBasedUuid();
  }
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
StubVirtualServer.prototype._getAuthenticationInfoForUser = function (inUser) {
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
StubVirtualServer.prototype._getItemFromUuidOrCreateNewItem = function (inUuid) {
  var item = this.getItemFromUuid(inUuid);
  if (!item) {
    item = new Item(this.__myWorld, inUuid);
    item._initialize();
    this.__myHashTableOfItemsKeyedByUuid[inUuid] = item;
    this._currentTransaction.addRecord(item);
  }
  return item;
};


/**
 * Creates the basic items that needed in order to do anything else, 
 * like the items for "name", "attribute", and "category".
 *
 * @scope    private instance method
 */
StubVirtualServer.prototype._loadAxiomaticItemsFromFileAtURL = function (url) {
  var fileContentString = Util.getStringContentsOfFileAtURL(url);
  Util.assert(Util.isString(fileContentString));
  fileContentString += " ] }";

  Util.assert(Util.isString(fileContentString));
  var dehydratedRecords = null;
  eval("dehydratedRecords = " + fileContentString + ";");
  Util.assert(Util.isObject(dehydratedRecords));
  var recordFormat = dehydratedRecords[StubVirtualServer.JSON_MEMBER_FORMAT];
  Util.assert(recordFormat == StubVirtualServer.JSON_FORMAT_2005_JUNE_RECORDS);
  var listOfRecords = dehydratedRecords[StubVirtualServer.JSON_MEMBER_RECORDS];
  Util.assert(Util.isArray(listOfRecords));
  
  this._rehydrateRecords(listOfRecords);
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
    item = new Item(this.getWorld(), inUuid);
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
    entry = new Entry(this.getWorld(), inUuid);
    this.__myHashTableOfEntriesKeyedByUuid[inUuid] = entry;
  }
  return entry;
};


/**
 * PENDING.
 *
 * @scope    private instance method
 */
StubVirtualServer.prototype._buildTypeHashTable = function () {
  var text      = this.__getItemFromUuidOrBootstrapItem(World.UUID_FOR_TYPE_TEXT);
  var number    = this.__getItemFromUuidOrBootstrapItem(World.UUID_FOR_TYPE_NUMBER);
  var dateType  = this.__getItemFromUuidOrBootstrapItem(World.UUID_FOR_TYPE_DATE);
  var checkMark = this.__getItemFromUuidOrBootstrapItem(World.UUID_FOR_TYPE_CHECK_MARK);
  var url       = this.__getItemFromUuidOrBootstrapItem(World.UUID_FOR_TYPE_URL);
  var itemType  = this.__getItemFromUuidOrBootstrapItem(World.UUID_FOR_TYPE_ITEM);
  var connectionType  = this.__getItemFromUuidOrBootstrapItem(World.UUID_FOR_TYPE_CONNECTION);
  
  this._myHashTableOfTypesKeyedByToken = {};
  this._myHashTableOfTypesKeyedByToken[StubVirtualServer.JSON_TYPE_TEXT_VALUE] = text;
  this._myHashTableOfTypesKeyedByToken[StubVirtualServer.JSON_TYPE_NUMBER_VALUE] = number;
  this._myHashTableOfTypesKeyedByToken[StubVirtualServer.JSON_TYPE_DATE_VALUE] = dateType;
  this._myHashTableOfTypesKeyedByToken[StubVirtualServer.JSON_TYPE_CHECKMARK_VALUE] = checkMark;
  this._myHashTableOfTypesKeyedByToken[StubVirtualServer.JSON_TYPE_URL_VALUE] = url;
  this._myHashTableOfTypesKeyedByToken[StubVirtualServer.JSON_TYPE_RELATED_UUID] = itemType;
  this._myHashTableOfTypesKeyedByToken[StubVirtualServer.JSON_TYPE_CONNECTION] = connectionType;
};


/**
 * Given an item that represents that represents a basic data type, this method
 * returns the corresponding string token that represents the same data type.
 *
 * @scope    private instance method
 * @param    inType    An item that represents a basic data type, like Text, Number, or URL. 
 * @return   A string token that represents a basic data type.
 */
StubVirtualServer.prototype._getTypeTokenFromType = function (inType) {
  for (var token in this._myHashTableOfTypesKeyedByToken) {
    typeItem = this._myHashTableOfTypesKeyedByToken[token];
    if (inType == typeItem) {
      return token;
    }
  }
  Util.assert(false, "no such type: " + inType.getDisplayString());
};


/**
 * Given a string token that represents a basic data type, this method
 * returns the corresponding item that represents the same data type.
 *
 * @scope    private instance method
 * @param    inToken    A string token that represents a basic data type.
 * @return   An item that represents a basic data type, like Text, Number, or URL. 
 */
StubVirtualServer.prototype._getTypeFromTypeToken = function (inToken) {
  return this._myHashTableOfTypesKeyedByToken[inToken];
};


/**
 * Given a dehydrated list of records, rehydrates each of the records.
 *
 * @scope    private instance method
 * @param    inListOfRecords    A list of dehydrated records. 
 */
StubVirtualServer.prototype._rehydrateRecords = function (inListOfRecords) {
  var key;
  var itemUuid;
  var item;
  var contentRecordUuid;
  var contentRecord;

  for (key in inListOfRecords) {
    var dehydratedRecord = inListOfRecords[key];

    var dehydratedTransaction = dehydratedRecord[StubVirtualServer.JSON_MEMBER_TRANSACTION_CLASS];
    if (dehydratedTransaction) {
      var listOfRecordsInTransaction = dehydratedTransaction;
      this._rehydrateRecords(listOfRecordsInTransaction);
    } else {
      var dehydratedItem = dehydratedRecord[StubVirtualServer.JSON_MEMBER_ITEM_CLASS];
      var dehydratedUser = dehydratedRecord[StubVirtualServer.JSON_MEMBER_USER_CLASS];
      var dehydratedVote = dehydratedRecord[StubVirtualServer.JSON_MEMBER_VOTE_CLASS];
      var dehydratedOrdinal = dehydratedRecord[StubVirtualServer.JSON_MEMBER_ORDINAL_CLASS];
      var dehydratedEntry = dehydratedRecord[StubVirtualServer.JSON_MEMBER_ENTRY_CLASS];
        
      if (dehydratedItem) {
        itemUuid = dehydratedItem[StubVirtualServer.JSON_MEMBER_UUID];
        item = this.__getItemFromUuidOrBootstrapItem(itemUuid);
        this.__myChronologicalListOfRecords.push(item);
      }
      
      if (dehydratedUser) {
        var userUuid = dehydratedUser[StubVirtualServer.JSON_MEMBER_USER];
        var userPasswordHash = dehydratedUser[StubVirtualServer.JSON_MEMBER_PASSWORD];
        var user = this.__getItemFromUuidOrBootstrapItem(userUuid);
        this.__myListOfUsers.push(user);
        this.__myHashTableOfUserAuthenticationInfo[user.getUniqueKeyString()] = userPasswordHash;
      }
      
      if (dehydratedVote) {
        var voteUuid = dehydratedVote[StubVirtualServer.JSON_MEMBER_UUID];
        var retainFlagString = dehydratedVote[StubVirtualServer.JSON_MEMBER_RETAIN_FLAG];
        var retainFlag = null;
        if (retainFlagString == "true") {
          retainFlag = true;
        }
        if (retainFlagString == "false") {
          retainFlag = false;
        }
        Util.assert(retainFlag !== null);
        contentRecordUuid = dehydratedVote[StubVirtualServer.JSON_MEMBER_RECORD];
        contentRecord = this._getContentRecordFromUuid(contentRecordUuid);
        var vote = new Vote(this.getWorld(), voteUuid, contentRecord, retainFlag);
        this.__myChronologicalListOfRecords.push(vote);
      }
      
      if (dehydratedOrdinal) {
        var ordinalUuid = dehydratedOrdinal[StubVirtualServer.JSON_MEMBER_UUID];
        var ordinalNumber = dehydratedOrdinal[StubVirtualServer.JSON_MEMBER_ORDINAL_NUMBER];
        contentRecordUuid = dehydratedOrdinal[StubVirtualServer.JSON_MEMBER_RECORD];
        contentRecord = this._getContentRecordFromUuid(contentRecordUuid);
        var ordinal = new Ordinal(this.getWorld(), ordinalUuid, contentRecord, ordinalNumber);
        this.__myChronologicalListOfRecords.push(ordinal);
      }
      
      if (dehydratedEntry) {
        var entryUuid = dehydratedEntry[StubVirtualServer.JSON_MEMBER_UUID];
        var entry = this.__getEntryFromUuidOrBootstrapEntry(entryUuid);
        var previousEntryUuid = dehydratedEntry[StubVirtualServer.JSON_MEMBER_PREVIOUS_VALUE];
        var previousEntry = null;
        if (previousEntryUuid) {
          previousEntry = this.__getEntryFromUuidOrBootstrapEntry(previousEntryUuid);
        }
 
        var dataType;
        var dataTypeUuid = dehydratedEntry[StubVirtualServer.JSON_MEMBER_TYPE];
        var PENDING_debug = false;
        if (Util.isUuid(dataTypeUuid)) {
          PENDING_debug = true;
          dataType = this.__getItemFromUuidOrBootstrapItem(dataTypeUuid);
        } else {
          // code to deal with the old pre-July-2005 file format
          var dataTypeToken = dataTypeUuid;
          dataType = this._getTypeFromTypeToken(dataTypeToken);
          dataTypeUuid = dataType._getUuid();
        }
        
        if (dataTypeUuid == World.UUID_FOR_TYPE_CONNECTION) {
          var listOfItemUuids = dehydratedEntry[StubVirtualServer.JSON_MEMBER_ITEM];
          var firstItemUuid = listOfItemUuids[0];
          var secondItemUuid = listOfItemUuids[1];
          var firstItem = this.__getItemFromUuidOrBootstrapItem(firstItemUuid);
          var secondItem = this.__getItemFromUuidOrBootstrapItem(secondItemUuid);

          var listOfAttributeUuids = dehydratedEntry[StubVirtualServer.JSON_MEMBER_ATTRIBUTE];
          var firstAttributeUuid = listOfAttributeUuids[0];
          var secondAttributeUuid = listOfAttributeUuids[1];
          var firstAttribute = this.__getItemFromUuidOrBootstrapItem(firstAttributeUuid);
          var secondAttribute = this.__getItemFromUuidOrBootstrapItem(secondAttributeUuid);
          
          var pairOfItems = [firstItem, secondItem];
          var pairOfAttributes = [firstAttribute, secondAttribute];
          entry._rehydrate(pairOfItems, pairOfAttributes, null, previousEntry, dataType);
        } else {
          itemUuid = dehydratedEntry[StubVirtualServer.JSON_MEMBER_ITEM];
          item = this.__getItemFromUuidOrBootstrapItem(itemUuid);
          var attributeUuid = dehydratedEntry[StubVirtualServer.JSON_MEMBER_ATTRIBUTE];
          var attribute = null;
          if (attributeUuid) {
            attribute = this.__getItemFromUuidOrBootstrapItem(attributeUuid);
          } else {
            Util.assert(false); // the attributeUuid should always be there
          }
          var rawData = dehydratedEntry[StubVirtualServer.JSON_MEMBER_VALUE];
          var finalData = null;
          switch (dataTypeUuid) {
            case World.UUID_FOR_TYPE_ITEM:
              finalData = this.__getItemFromUuidOrBootstrapItem(rawData);
              break;
            case World.UUID_FOR_TYPE_TEXT:
              // if (PENDING_debug) {
              //   alert(rawData + "\n" + dataType);
              // }
              finalData = rawData;
              break;
            case World.UUID_FOR_TYPE_NUMBER:
              finalData = rawData;
              break;
            case World.UUID_FOR_TYPE_DATE:
              finalData = new Date(rawData);
              break;
            default:
              Util.assert(false,'Unknown data type while _rehydrating()');
          }
          entry._rehydrate(item, attribute, finalData, previousEntry, dataType);
        }
        this.__myChronologicalListOfRecords.push(entry);
      }
      
    }
  }
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
