/*****************************************************************************
 StubArchive.js
 
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
dojo.provide("orp.archive.StubArchive");
dojo.provide("orp.archive.ArchiveLoader");
dojo.require("orp.model.World");
dojo.require("orp.model.Item");
dojo.require("orp.model.Entry");
dojo.require("orp.model.Transaction");
dojo.require("orp.util.DateValue");
// dojo.require("orp.uuid.Uuid");
dojo.require("orp.uuid.TimeBasedUuid");
dojo.require("orp.lang.Lang");
dojo.require("orp.archive.TextEncoding");
dojo.require("orp.archive.JsonDeserializer");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global Util  */
/*global World, Item, Entry, Ordinal, Vote, ContentRecord, Transaction  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------
/**
 * The StubArchive is a dummy place-holder datastore that does
 * a bare-minimum job of providing data to a World.
 *
 * @scope    public instance constructor
 */
orp.archive.StubArchive = function(pathToTrunkDirectory) {
  var fileName = "2005_june_axiomatic_items.json";
  var relUrlForAxiomaticFile = "source/model/" + fileName;
  if (pathToTrunkDirectory) {
    this._needCompletePath = true;
    var thisUrl = window.location.pathname; //e.g. /openrecord/trunk/source/model/TestRepositoryWriting.html.
    var arrayOfPathComponents = thisUrl.split('/');
    arrayOfPathComponents.pop();
    var thisDirectory = arrayOfPathComponents.join('/'); //e.g. /openrecord/trunk/source/model
    this._completePathToTrunkDirectory = thisDirectory + '/' + pathToTrunkDirectory;
    this._dehydratedAxiomFileURL = this._completePathToTrunkDirectory + '/' + relUrlForAxiomaticFile;
  } else {
    this._needCompletePath = false;
    this._dehydratedAxiomFileURL = relUrlForAxiomaticFile;    
  }
};


// -------------------------------------------------------------------
// Private methods
// -------------------------------------------------------------------

/**
 * Initializes the instance variables for a newly created StubArchive.
 *
 * @scope    private instance method
 * @param    world    The world that we provide data for. 
 */
orp.archive.StubArchive.prototype._initialize = function(world) {
  this._world = world;
  
  this._countOfNestedTransactions = 0;
  this._currentTransaction = null;

  this._hashTableOfItemsKeyedByUuid = {};
  this._hashTableOfEntriesKeyedByUuid = {};
  this._chronologicalListOfRecords = [];
  
  this._listOfUsers = [];
  this._hashTableOfUserAuthenticationInfo = {};
  this._currentUser = null;
};
 

// -------------------------------------------------------------------
// Public Methods
// -------------------------------------------------------------------

/**
 * Initializes the instance variables for a newly created StubArchive,
 * and does the initial loading of at least the axiomatic items.
 *
 * @scope    public instance method
 * @param    world    The world that we provide data for. 
 */
orp.archive.StubArchive.prototype.setWorldAndLoadAxiomaticItems = function(world) {
  this._initialize(world);
  this._loadAxiomaticItemsFromFileAtURL(this._dehydratedAxiomFileURL);
};


/**
 * Returns the World instance that this virtual server is using.
 *
 * @scope    public instance method
 * @return   A World object. 
 */
orp.archive.StubArchive.prototype.getWorld = function() {
  return this._world;
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
orp.archive.StubArchive.prototype.beginTransaction = function() {
  if (this._countOfNestedTransactions === 0) {
    this._currentTransaction = new orp.model.Transaction();
  }
  this._countOfNestedTransactions += 1;
};
 

/**
 * Marks the end of a transaction.
 *
 * @scope    public instance method
 */
orp.archive.StubArchive.prototype.endTransaction = function() {
  this._countOfNestedTransactions -= 1;
  orp.lang.assert(this._countOfNestedTransactions >= 0);

  if (this._countOfNestedTransactions === 0) {
    var listOfChangesMade = this._saveChangesToServer();
    this._currentTransaction = null;
    if (listOfChangesMade.length > 0) {
      // alert(listOfChangesMade.length + " changes made");
      // orp.util.displayStatusBlurb(listOfChangesMade.length + " changes made");
      this._world._notifyObserversOfChanges(listOfChangesMade);
    }
  }
};


/**
 * Returns the Transaction object for the current transaction.
 *
 * @scope    public instance method
 * @return   A Transaction object, or null if there is no transaction in progress. 
 */
orp.archive.StubArchive.prototype.getCurrentTransaction = function() {
  return this._currentTransaction;
};


// -------------------------------------------------------------------
// Methods for creating and changing items
// -------------------------------------------------------------------

/**
 * Returns a newly created item.
 *
 * @scope    public instance method
 * @param    name    Optional. A string, which will be assigned to the name attribute of the new item. 
 * @param    observer    Optional. An object or method to be registered as an observer of the returned item. 
 * @return   A newly created item.
 * @throws   Throws an Error if no user is logged in.
 */
orp.archive.StubArchive.prototype.newItem = function(name, observer) {
  this._throwErrorIfNoUserIsLoggedIn();
  var item = this._createNewItem(observer, false);
  if (name) { 
    var attributeCalledName = this._world.getAttributeCalledName();
    item.addEntry({attribute:attributeCalledName, value:name});
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
 * @param    observer    Optional. An object or method to be registered as an observer of the returned item. 
 * @return   A newly created provisional item.
 * @throws   Throws an Error if no user is logged in.
 */
orp.archive.StubArchive.prototype.newProvisionalItem = function(observer) {
  this._throwErrorIfNoUserIsLoggedIn();
  var item = this._createNewItem(observer, true);
  return item;
};


/**
 * Returns a newly created item: either a provisional item or a normal item.
 *
 * @scope    private instance method
 * @param    observer    Optional. An object or method to be registered as an observer of the returned item. 
 * @param    provisionalFlag    True if the item is provisional; false if the item is normal. 
 * @return   A newly created item.
 */
orp.archive.StubArchive.prototype._createNewItem = function(observer, provisionalFlag) {
  var uuid = this._getNewUuid();
  var item = new orp.model.Item(this._world, uuid);
  item._initialize(observer, provisionalFlag);
  this._hashTableOfItemsKeyedByUuid[uuid] = item;
  if (!provisionalFlag) {
    this._currentTransaction.addRecord(item);
  }
  return item;
};


/**
 * Records the fact that a provisional item just became real.
 *
 * @scope    package instance method
 * @param    item    The item that was provisional and just became real. 
 */
orp.archive.StubArchive.prototype._provisionalItemJustBecameReal = function(item) {
  this._currentTransaction.addRecord(item);
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
orp.archive.StubArchive.prototype.newEntry = function(item, previousEntry, attribute, value, type) {
  this._throwErrorIfNoUserIsLoggedIn();
  var uuid = this._getNewUuid();
  var entry = new orp.model.Entry(this._world, uuid);
  entry._initialize(item, previousEntry, attribute, value, type);
  item._addEntryToListOfEntriesForAttribute(entry, attribute);
  
  this._hashTableOfEntriesKeyedByUuid[uuid] = entry;
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
orp.archive.StubArchive.prototype.newConnectionEntry = function(previousEntry, itemOne, attributeOne, itemTwo, attributeTwo) {
  this._throwErrorIfNoUserIsLoggedIn();
  var uuid = this._getNewUuid();
  var entry = new orp.model.Entry(this._world, uuid);
  entry._initializeConnection(previousEntry, itemOne, attributeOne, itemTwo, attributeTwo);

  itemOne._addEntryToListOfEntriesForAttribute(entry, attributeOne);
  itemTwo._addEntryToListOfEntriesForAttribute(entry, attributeTwo);

  this._hashTableOfEntriesKeyedByUuid[uuid] = entry;
  this._currentTransaction.addRecord(entry);
  return entry;
};


/**
 * Returns a newly created ordinal.
 *
 * @scope    public instance method
 * @param    contentRecord    The contentRecord that this is an ordinal for. 
 * @param    ordinalNumber    The ordinal number itself. 
 * @return   A newly created ordinal.
 * @throws   Throws an Error if no user is logged in.
 */
orp.archive.StubArchive.prototype.newOrdinal = function(contentRecord, ordinalNumber) {
  this._throwErrorIfNoUserIsLoggedIn();
  var uuid = this._getNewUuid();
  var ordinal = new orp.model.Ordinal(this._world, uuid, contentRecord, ordinalNumber);
  this._currentTransaction.addRecord(ordinal);
  return ordinal;
};


/**
 * Returns a newly created vote.
 *
 * @scope    public instance method
 * @param    contentRecord    The contentRecord to attach this vote to. 
 * @param    retainFlag    True if this is a vote to retain. False if this is a vote to delete. 
 * @return   A newly created vote.
 * @throws   Throws an Error if no user is logged in.
 */
orp.archive.StubArchive.prototype.newVote = function(contentRecord, retainFlag) {
  this._throwErrorIfNoUserIsLoggedIn();
  var uuid = this._getNewUuid();
  var vote = new orp.model.Vote(this._world, uuid, contentRecord, retainFlag);
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
 * @param    name    A string, which will be assigned to the name attribute of the new item. 
 * @param    authentication    A string which will be used as the login password for the user. 
 * @param    observer    Optional. An object or method to be registered as an observer of the returned item. 
 * @return   A newly created item representing a user.
 * @throws   Throws an Error if a user is logged in.
 */
orp.archive.StubArchive.prototype.newUser = function(name, authentication, observer) {
  if (this._currentUser) {
    var error = new Error("A user is logged in.  You can't create a new user when somebody is already logged in.");
    throw error;
  }

  var newUser = this._createNewItem(observer, false);
  this._listOfUsers.push(newUser);
  
  var md5Authentication = null;
  if (authentication) {
    md5Authentication = orp.util.hex_md5(authentication);
  }
  this._hashTableOfUserAuthenticationInfo[newUser.getUuid()] = md5Authentication;

  this._currentUser = newUser;
  var categoryCalledPerson = this.getWorld().getCategoryCalledPerson();
  newUser.assignToCategory(categoryCalledPerson); 
  if (name) { 
    var attributeCalledName = this.getItemFromUuid(orp.model.World.UUID.ATTRIBUTE_NAME);
    var entry = newUser.addEntry({attribute:attributeCalledName, value:name});
  }
  this._currentUser = null;
  
  return newUser;
};


/**
 * Returns an list of all the items that represent users of this datastore.
 *
 * @scope    public instance method
 * @return   A list of items.
 */
orp.archive.StubArchive.prototype.getUsers = function() {
  return this._listOfUsers;
};


/**
 * Returns an item representing the user who is currently logged in.
 *
 * @scope    public instance method
 * @return   An item representing the user who is currently logged in.
 */
orp.archive.StubArchive.prototype.getCurrentUser = function() {
  return this._currentUser;
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
orp.archive.StubArchive.prototype.login = function(user, password) {
  
  // Only one user can be logged in at once.  We consider it an error
  // if you try to log in a new user before logging out the old one.
  if (this._currentUser) {
    orp.lang.assert(false);
  }
  
  var isKnownUser = orp.util.isObjectInSet(user, this._listOfUsers);
  if (!isKnownUser) {
    return false;
  }

  if (user.getUuidString() == orp.model.World.UUID.USER_AMY) {
    // nobody is allowed to log in as the axiomatic user
    return false;
  }
  
  var md5hashOfPassword = null;
  if (password) {
    md5hashOfPassword = orp.util.hex_md5(password);
  }
  var realAuthentication = this.getAuthenticationInfoForUser(user);
  var successfulAuthentication = ((realAuthentication == md5hashOfPassword) || !realAuthentication);
  
  // PENDING: temporary hack
  // if (!successfulAuthentication) {
  //  successfulAuthentication = ("PENDING: magic super password" == authentication);
  // }
  
  if (successfulAuthentication) {
    this._currentUser = user;
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
orp.archive.StubArchive.prototype.logout = function() {
  if (this._currentUser) {
    this._currentUser = null;
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
 * @param    uuid    The UUID of the item to be returned. 
 * @param    observer    Optional. An object to be registered as an observer of the returned item. 
 * @return   The item identified by the given UUID.
 */
orp.archive.StubArchive.prototype.getItemFromUuid = function(uuid, observer) {
  orp.lang.assert(dojo.lang.isString(uuid) || uuid instanceof orp.uuid.Uuid);
  
  var item = this._hashTableOfItemsKeyedByUuid[uuid];
  if (item && observer) {
    item.addObserver(observer);
  }
  return item;
};


/**
 * Sends all the changes to the server, so that the server can record the
 * changes.
 *
 * @scope    private instance method
 */
orp.archive.StubArchive.prototype._saveChangesToServer = function () {
  // The StubArchive doesn't ever actually talk to a server.
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
 * Given a QueryRunner object, this method returns a list of all the items that 
 * match the query criteria.
 *
 * @scope    public instance method
 * @param    queryRunner    A QueryRunner object. 
 * @return   A list of items.
 */
orp.archive.StubArchive.prototype.getResultItemsForQueryRunner = function(queryRunner) {
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
        orp.util.addObjectToSet(itemInCategory, listOfQueryResultItems);
      }
    }
  } else {
    // General case code for any sort of query. 
    for (var uuid in this._hashTableOfItemsKeyedByUuid) {
      var item = this._hashTableOfItemsKeyedByUuid[uuid];
      var includeItem = queryRunner.doesItemMatch(item);
      if (includeItem) {
        listOfQueryResultItems.push(item);
      }
    }
  }
  listOfQueryResultItems.sort(orp.model.ContentRecord.compareOrdinals);
  return listOfQueryResultItems; 
};


/**
 * Given an item and a query item, this method modifies the attributes 
 * of the item so that when the query is next evaluated the item will be 
 * included in query result list.
 *
 * @scope    public instance method
 * @param    item    An item, which will be modified so that it matches the query. 
 * @param    query    A query item. 
 */
orp.archive.StubArchive.prototype.setItemToBeIncludedInQueryResultList = function(item, query) {
  orp.lang.assert(item instanceof orp.model.Item);
  orp.lang.assert(query instanceof orp.model.Item);
  
  var attributeCalledQueryMatchingValue = this.getWorld().getAttributeCalledQueryMatchingValue();
  var attributeCalledQueryMatchingAttribute = this.getWorld().getAttributeCalledQueryMatchingAttribute();
  var attributeCalledCategory = this.getWorld().getAttributeCalledCategory();
  var categoryCalledCategory = this.getWorld().getCategoryCalledCategory();
  
  var listOfMatchingEntries = query.getEntriesForAttribute(attributeCalledQueryMatchingValue);
  var listOfMatchingAttrs = query.getEntriesForAttribute(attributeCalledQueryMatchingAttribute);
  if (!(listOfMatchingEntries && (listOfMatchingEntries.length > 0))) {return;} // query not fully formed, so nothing to add
  var matchingAttribute;
  if (listOfMatchingAttrs.length === 0) {
    // by default matching attribute is category
    matchingAttribute = attributeCalledCategory;
  }
  else {
    orp.lang.assert(listOfMatchingAttrs.length==1, 'more than one matching attributes');
    matchingAttribute = listOfMatchingAttrs[0].getValue();
  }

  for (var key in listOfMatchingEntries) {
    var matchingEntry = listOfMatchingEntries[key];
    var match = matchingEntry.getValue();
    if (!item.hasAttributeValue(matchingAttribute, match)) {
      if ((matchingAttribute == attributeCalledCategory) && (match instanceof orp.model.Item) && (match.isInCategory(categoryCalledCategory))) {
        item.assignToCategory(match);
      } else {
        item.addEntry({attribute:matchingAttribute, value:match});
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
orp.archive.StubArchive.prototype.getItemsInCategory = function(category) {
  orp.lang.assert(category instanceof orp.model.Item);

  var attributeCalledItemsInCategory = this.getWorld().getAttributeCalledItemsInCategory();
  var listOfEntries = category.getEntriesForAttribute(attributeCalledItemsInCategory);
  var listOfItems = [];
  for (var key in listOfEntries) {
    var entry = listOfEntries[key];
    var item = entry.getValue(category);
    listOfItems.push(item);
  }
  listOfItems.sort(orp.model.ContentRecord.compareOrdinals);
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
orp.archive.StubArchive.prototype._throwErrorIfNoUserIsLoggedIn = function() {
  if (!this._currentUser) {
    var error = new Error("No user is logged in.  You can't write to the repository when nobody is logged in.");
    throw error;
  }
};


/**
 * Returns a newly created UUID.
 *
 * @scope    private instance method
 * @param    node    The node value that the new UUID should have. 
 */
orp.archive.StubArchive.prototype._generateUuid = function(node) {
  if (node) {
    return new orp.uuid.TimeBasedUuid({'node': node});
  } else {
    return new orp.uuid.TimeBasedUuid();
  }
};


/**
 * Creates a brand new UUID to allocate to an item or entry.
 *
 * @scope    private instance method
 * @return   A newly created UUID.
 */
orp.archive.StubArchive.prototype._getNewUuid = function() {
  var newUuid;
  if (this._currentUser) {
    var uuidOfCurrentUser = this._currentUser.getUuid();
    var nodeForCurrentUser = uuidOfCurrentUser.getNode(); // "0123456789AB";
    newUuid = this._generateUuid(nodeForCurrentUser);
  } else {
    newUuid = this._generateUuid();
  }
  return newUuid;
};


/**
 * Given an item representing a user, return the authentication info
 * associated with that user.
 *
 * @scope    public instance method
 * @param    user    An item representing a user. 
 * @return   The authentication info for the user.
 */
orp.archive.StubArchive.prototype.getAuthenticationInfoForUser = function(user) {
  return this._hashTableOfUserAuthenticationInfo[user.getUuid()];
};


/**
 * Given a UUID, either (a) returns the existing item identified by that UUID, 
 * or (b) creates an new item object, set its UUID, and returns that object.
 *
 * @scope    private instance method
 * @param    uuid    The UUID of the item to be returned. 
 * @return   The item identified by the given UUID.
 */
orp.archive.StubArchive.prototype._getItemFromUuidOrCreateNewItem = function(uuid) {
  var item = this.getItemFromUuid(uuid);
  if (!item) {
    item = new orp.model.Item(this._world, uuid);
    item._initialize();
    this._hashTableOfItemsKeyedByUuid[uuid] = item;
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
orp.archive.StubArchive.prototype._loadAxiomaticItemsFromFileAtURL = function(url) {
  var fileContentString = dojo.hostenv.getText(url);
  orp.lang.assertType(fileContentString, String);
  
  var archiveLoader = new orp.archive.ArchiveLoader(this);
  var deserializer = new orp.archive.JsonDeserializer(archiveLoader);
  fileContentString += deserializer.getRepositoryFooter();
  deserializer.deserializeFromString(fileContentString);
};


/**
 * Given a UUID, returns the existing entry identified by that UUID. 
 * 
 * @scope    private instance method
 * @param    uuid    The UUID of the entry to be returned. 
 * @return   The entry identified by the given UUID.
 */
orp.archive.StubArchive.prototype._getEntryFromUuid = function(uuid) {
  return this._hashTableOfEntriesKeyedByUuid[uuid];
};


// -------------------------------------------------------------------
// ArchiveLoader helper class
// -------------------------------------------------------------------

/**
 * The ArchiveLoader class provides a "package-level" interface to the 
 * StubArchive class, which the deserialization code can use to load
 * serialized records from disk or from over a network.
 *
 * @scope    public instance constructor
 * @param    archive    The orp.archive.StubArchive instance that this ArchiveLoader is working for.
 */
orp.archive.ArchiveLoader = function(archive) {
  this._archive = archive;
};


// -------------------------------------------------------------------
// ArchiveLoader private methods 
// -------------------------------------------------------------------

/**
 * Returns the instance of orp.archive.StubArchive that this ArchiveLoader is working for.
 *
 * @scope    private instance method
 * @return   An instance of orp.archive.StubArchive.
 */
orp.archive.ArchiveLoader.prototype._getArchive = function() {
  return this._archive;
};


// -------------------------------------------------------------------
// ArchiveLoader public methods
// -------------------------------------------------------------------

/**
 * Returns the World instance that this virtual server is using.
 *
 * @scope    public instance method
 * @return   A World object. 
 */
orp.archive.ArchiveLoader.prototype.getWorld = function() {
  return this._getArchive().getWorld();
};



/**
 * Given a UUID, either (a) returns the existing item identified by that UUID, 
 * or (b) creates an new item object, set its UUID, and returns that object.
 *
 * @scope    public instance method
 * @param    inUuid    The UUID of the item to be returned. 
 * @return   The item identified by the given UUID.
 */
orp.archive.ArchiveLoader.prototype.getItemFromUuidOrBootstrapItem = function(uuid) {
  var archive = this._getArchive();
  
  var item = archive.getItemFromUuid(uuid);
  if (!item) {
    item = new orp.model.Item(archive.getWorld(), uuid);
    archive._hashTableOfItemsKeyedByUuid[uuid] = item;
  }
  return item;
};


/**
 * Given a UUID, either (a) returns the existing entry identified by that UUID, 
 * or (b) creates an new entry object, set its UUID, and returns that object.
 *
 * @scope    public instance method
 * @param    uuid    The UUID of the entry to be returned. 
 * @return   The entry identified by the given UUID.
 */
orp.archive.ArchiveLoader.prototype.getEntryFromUuidOrBootstrapEntry = function(uuid) {
  var archive = this._getArchive();

  var entry = archive._hashTableOfEntriesKeyedByUuid[uuid];
  if (!entry) {
    entry = new orp.model.Entry(archive.getWorld(), uuid);
    archive._hashTableOfEntriesKeyedByUuid[uuid] = entry;
  }
  return entry;
};


/**
 * Adds a record to the archive's _chronologicalListOfRecords.
 *
 * @scope    public instance method
 * @param    record    An orp.model.Record object. 
 */
orp.archive.ArchiveLoader.prototype.addRecordToChronologicalList = function(record) {
  var archive = this._getArchive();
  archive._chronologicalListOfRecords.push(record);
};


/**
 * Adds a user to the archive's _listOfUsers.
 *
 * @scope    public instance method
 * @param    user    An orp.model.Item object. 
 * @param    userPasswordHash    A string with the user's password hash. 
 */
orp.archive.ArchiveLoader.prototype.addUserToListOfUsers = function(user, userPasswordHash) {
  var archive = this._getArchive();
  archive._listOfUsers.push(user);
  archive._hashTableOfUserAuthenticationInfo[user.getUuid()] = userPasswordHash;
};


/**
 * Given a UUID, returns the item or entry identified by that UUID.
 *
 * @scope    public instance method
 * @param    uuid    The UUID of the item or entry to be returned. 
 * @return   The item or entry identified by the given UUID.
 */
orp.archive.ArchiveLoader.prototype.getContentRecordFromUuid = function(uuid) {
  var archive = this._getArchive();

  var item = archive.getItemFromUuid(uuid);
  if (item) {
    return item;
  } else {
    return archive._hashTableOfEntriesKeyedByUuid[uuid];
  }
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
