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
// Provides and Requires
// -------------------------------------------------------------------
dojo.provide("orp.model.StubVirtualServer");
dojo.require("orp.model.World");
dojo.require("orp.model.Item");
dojo.require("orp.model.Entry");
dojo.require("orp.model.Transaction");
dojo.require("orp.util.TimeBasedUuid");
dojo.require("orp.util.DateValue");
dojo.require("orp.lang.Lang");

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
 * The StubVirtualServer is a dummy place-holder datastore that does
 * a bare-minimum job of providing data to a World.
 *
 * @scope    public instance constructor
 */
orp.model.StubVirtualServer = function(pathToTrunkDirectory) {
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
  
  /*
  if (optionalDefaultOverrides) {
    this._processOptionalDefaultOverrides(optionalDefaultOverrides, "Stub");
  }
  */
};


// -------------------------------------------------------------------
// Public constants
// -------------------------------------------------------------------
orp.model.StubVirtualServer.JSON_FORMAT = {
  FORMAT_2005_JUNE_CHRONOLOGICAL_LIST: "2005_JUNE_CHRONOLOGICAL_LIST" };

orp.model.StubVirtualServer.JSON_MEMBER = {
  FORMAT: "format",
  RECORDS: "records",
  TYPE: "type",
  VALUE: "value",
  UUID: "uuid",
  USER: "user",
  PASSWORD: "password",
  ITEM_CLASS: "Item",
  ENTRY_CLASS: "Entry",
  VOTE_CLASS: "Vote",
  ORDINAL_CLASS: "Ordinal",
  USER_CLASS: "User",
  TRANSACTION_CLASS: "Transaction",
  ATTRIBUTE: "attribute",
  PREVIOUS_VALUE: "previousEntry",
  RECORD: "record",
  ITEM: "item",
  RETAIN_FLAG: "retainFlag",
  ORDINAL_NUMBER: "value" };


/*
OLD?
StubVirtualServer.JSON_TYPE_TEXT_VALUE = "TextValue";
StubVirtualServer.JSON_TYPE_RELATED_UUID = "RelatedUuid";
StubVirtualServer.JSON_TYPE_NUMBER_VALUE = "NumberValue";
StubVirtualServer.JSON_TYPE_DATE_VALUE = "DateValue";
StubVirtualServer.JSON_TYPE_CHECKMARK_VALUE = "CheckMarkValue";
StubVirtualServer.JSON_TYPE_URL_VALUE = "UrlValue";
StubVirtualServer.JSON_TYPE_CONNECTION = "Connection";
*/


// -------------------------------------------------------------------
// Private methods
// -------------------------------------------------------------------

/**
 * Initializes the instance variables for a newly created StubVirtualServer.
 *
 * @scope    private instance method
 * @param    world    The world that we provide data for. 
 */
orp.model.StubVirtualServer.prototype._initialize = function(world) {
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
 * Initializes the instance variables for a newly created StubVirtualServer,
 * and does the initial loading of at least the axiomatic items.
 *
 * @scope    public instance method
 * @param    world    The world that we provide data for. 
 */
orp.model.StubVirtualServer.prototype.setWorldAndLoadAxiomaticItems = function(world) {
  this._initialize(world);
  // this._buildTypeHashTable();
  this._loadAxiomaticItemsFromFileAtURL(this._dehydratedAxiomFileURL);
};


/**
 * Returns the World instance that this virtual server is using.
 *
 * @scope    public instance method
 * @return   A World object. 
 */
orp.model.StubVirtualServer.prototype.getWorld = function() {
  return this._world;
};


/**
 * Given a text string, this method returns a copy of the text string, 
 * with certain special characters replaced by escape sequences.
 * 
 * For example, given a string like this:
 * <pre>
 *    this.encodeText('The quick <brown> fox & the "lazy" hare.\n');
 * </pre>
 * The return value will be:
 * <pre>
 *    'The quick &lt;brown&gt; fox &amp; the &quot;lazy&quot; hare.&#10;'
 * </pre>
 * 
 * @scope    public instance method
 * @param    rawText    A text string to encode. 
 * @return   A copy of the rawText string, with the special characters escaped. 
 */
orp.model.StubVirtualServer.prototype.encodeText = function(rawText) {
  // orp.util.assert(orp.util.isString(rawText));
  orp.lang.assertType(rawText, String);

  var returnString = rawText;
  // Note: it's important that we do '&' first, otherwise we'll accidentally
  // replace all the & characters that we add in the following lines.
  returnString = returnString.replace(new RegExp('&','g'), "&amp;");
  returnString = returnString.replace(new RegExp('<','g'), "&lt;");
  returnString = returnString.replace(new RegExp('>','g'), "&gt;");
  returnString = returnString.replace(new RegExp('"','g'), "&quot;");
  returnString = returnString.replace(new RegExp('\n','g'), "&#10;");
  returnString = returnString.replace(new RegExp('\r','g'), "&#13;");
  return returnString;
};


/**
 * Given a text string that was encoded using encodeText(), this method 
 * returns a decoded copy of the text string, with the encoded escape 
 * sequences now replaced by the original special characters.
 *
 * For example, given a string like this:
 * <pre>
 *    this.decodeText('The quick &lt;brown&gt; fox &amp; the &quot;lazy&quot; hare.&#10;');
 * </pre>
 * The return value will be:
 * <pre>
 *    'The quick <brown> fox & the "lazy" hare.\n'
 * </pre>
 *
 * @scope    public instance method
 * @param    encodedText    A text string to decode. 
 * @return   A copy of the encodedText string, with the escaped characters replaced by the original special characters. 
 */
orp.model.StubVirtualServer.prototype.decodeText = function(encodedText) {
  // orp.util.assert(orp.util.isString(encodedText));
  orp.lang.assertType(encodedText, String);
  
  var returnString = encodedText;
  returnString = returnString.replace(new RegExp('&#13;','g'), "\r");
  returnString = returnString.replace(new RegExp('&#10;','g'), "\n");
  returnString = returnString.replace(new RegExp('&quot;','g'), '"');
  returnString = returnString.replace(new RegExp('&gt;','g'), ">");
  returnString = returnString.replace(new RegExp('&lt;','g'), "<");
  returnString = returnString.replace(new RegExp('&amp;','g'), "&");
  // Note: it's important that we do '&amp;' last, otherwise we won't correctly
  // handle a case like this:
  //   text = this.decodeText(this.encodeText('&lt;'));
  return returnString;
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
orp.model.StubVirtualServer.prototype.beginTransaction = function() {
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
orp.model.StubVirtualServer.prototype.endTransaction = function() {
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
orp.model.StubVirtualServer.prototype.getCurrentTransaction = function() {
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
orp.model.StubVirtualServer.prototype.newItem = function(name, observer) {
  this._throwErrorIfNoUserIsLoggedIn();
  var item = this._createNewItem(observer, false);
  if (name) { 
    var attributeCalledName = this._world.getAttributeCalledName();
    // item.addEntryForAttribute(attributeCalledName, name);
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
orp.model.StubVirtualServer.prototype.newProvisionalItem = function(observer) {
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
orp.model.StubVirtualServer.prototype._createNewItem = function(observer, provisionalFlag) {
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
orp.model.StubVirtualServer.prototype._provisionalItemJustBecameReal = function(item) {
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
orp.model.StubVirtualServer.prototype.newEntry = function(item, previousEntry, attribute, value, type) {
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
orp.model.StubVirtualServer.prototype.newConnectionEntry = function(previousEntry, itemOne, attributeOne, itemTwo, attributeTwo) {
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
orp.model.StubVirtualServer.prototype.newOrdinal = function(contentRecord, ordinalNumber) {
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
orp.model.StubVirtualServer.prototype.newVote = function(contentRecord, retainFlag) {
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
orp.model.StubVirtualServer.prototype.newUser = function(name, authentication, observer) {
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
orp.model.StubVirtualServer.prototype.getUsers = function() {
  return this._listOfUsers;
};


/**
 * Returns an item representing the user who is currently logged in.
 *
 * @scope    public instance method
 * @return   An item representing the user who is currently logged in.
 */
orp.model.StubVirtualServer.prototype.getCurrentUser = function() {
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
orp.model.StubVirtualServer.prototype.login = function(user, password) {
  
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
  var realAuthentication = this._getAuthenticationInfoForUser(user);
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
orp.model.StubVirtualServer.prototype.logout = function() {
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
orp.model.StubVirtualServer.prototype.getItemFromUuid = function(uuid, observer) {
  orp.lang.assert(dojo.lang.isString(uuid) || uuid instanceof orp.util.Uuid);
  
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
orp.model.StubVirtualServer.prototype._saveChangesToServer = function () {
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
 * Given a QueryRunner object, this method returns a list of all the items that 
 * match the query criteria.
 *
 * @scope    public instance method
 * @param    queryRunner    A QueryRunner object. 
 * @return   A list of items.
 */
orp.model.StubVirtualServer.prototype.getResultItemsForQueryRunner = function(queryRunner) {
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
orp.model.StubVirtualServer.prototype.setItemToBeIncludedInQueryResultList = function(item, query) {
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
        // item.addEntryForAttribute(matchingAttribute, match);
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
orp.model.StubVirtualServer.prototype.getItemsInCategory = function(category) {
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
orp.model.StubVirtualServer.prototype._throwErrorIfNoUserIsLoggedIn = function() {
  if (!this._currentUser) {
    var error = new Error("No user is logged in.  You can't write to the repository when nobody is logged in.");
    throw error;
  }
};


/**
 * Given a UUID, returns the item or entry identified by that UUID.
 *
 * @scope    private instance method
 * @param    uuid    The UUID of the item or entry to be returned. 
 * @return   The item or entry identified by the given UUID.
 */
orp.model.StubVirtualServer.prototype._getContentRecordFromUuid = function(uuid) {
  var item = this.getItemFromUuid(uuid);
  if (item) {
    return item;
  } else {
    return this._hashTableOfEntriesKeyedByUuid[uuid];
  }
};


/**
 * Returns a newly created UUID.
 *
 * @scope    private instance method
 * @param    node    The node value that the new UUID should have. 
 */
orp.model.StubVirtualServer.prototype._generateUuid = function(node) {
  if (node) {
    return new orp.util.TimeBasedUuid({'node': node});
  } else {
    return new orp.util.TimeBasedUuid();
  }
};


/**
 * Creates a brand new UUID to allocate to an item or entry.
 *
 * @scope    private instance method
 * @return   A newly created UUID.
 */
orp.model.StubVirtualServer.prototype._getNewUuid = function() {
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
 * @scope    private instance method
 * @param    user    An item representing a user. 
 * @return   The authentication info for the user.
 */
orp.model.StubVirtualServer.prototype._getAuthenticationInfoForUser = function(user) {
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
orp.model.StubVirtualServer.prototype._getItemFromUuidOrCreateNewItem = function(uuid) {
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
orp.model.StubVirtualServer.prototype._loadAxiomaticItemsFromFileAtURL = function(url) {
  // var fileContentString = orp.util.getStringContentsOfFileAtURL(url);
  var fileContentString = dojo.hostenv.getText(url);
  // orp.util.assert(orp.util.isString(fileContentString));
  orp.lang.assertType(fileContentString, String);
  fileContentString += " ] }";

  var dehydratedRecords = null;
  eval("dehydratedRecords = " + fileContentString + ";");
  // orp.util.assert(orp.util.isObject(dehydratedRecords));
  orp.lang.assertType(dehydratedRecords, Object);
  var recordFormat = dehydratedRecords[orp.model.StubVirtualServer.JSON_MEMBER.FORMAT];
  orp.lang.assert(recordFormat == orp.model.StubVirtualServer.JSON_FORMAT.FORMAT_2005_JUNE_CHRONOLOGICAL_LIST);
  var listOfRecords = dehydratedRecords[orp.model.StubVirtualServer.JSON_MEMBER.RECORDS];
  // orp.util.assert(orp.util.isArray(listOfRecords));
  orp.lang.assertType(listOfRecords, Array);
  
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
orp.model.StubVirtualServer.prototype._getItemFromUuidOrBootstrapItem = function(uuid) {
  var item = this.getItemFromUuid(uuid);
  if (!item) {
    item = new orp.model.Item(this.getWorld(), uuid);
    this._hashTableOfItemsKeyedByUuid[uuid] = item;
  }
  return item;
};

/**
 * Given a UUID, returns the existing entry identified by that UUID. 
 * 
 * @scope    private instance method
 * @param    uuid    The UUID of the entry to be returned. 
 * @return   The entry identified by the given UUID.
 */
orp.model.StubVirtualServer.prototype._getEntryFromUuid = function(uuid) {
  return this._hashTableOfEntriesKeyedByUuid[uuid];
};

/**
 * Given a UUID, either (a) returns the existing entry identified by that UUID, 
 * or (b) creates an new entry object, set its UUID, and returns that object.
 *
 * @scope    private instance method
 * @param    uuid    The UUID of the entry to be returned. 
 * @return   The entry identified by the given UUID.
 */
orp.model.StubVirtualServer.prototype._getEntryFromUuidOrBootstrapEntry = function(uuid) {
  var entry = this._hashTableOfEntriesKeyedByUuid[uuid];
  if (!entry) {
    entry = new orp.model.Entry(this.getWorld(), uuid);
    this._hashTableOfEntriesKeyedByUuid[uuid] = entry;
  }
  return entry;
};


/**
 * Given a dehydrated list of records, rehydrates each of the records.
 *
 * @scope    private instance method
 * @param    listOfDehydratedRecords    A list of dehydrated records. 
 */
orp.model.StubVirtualServer.prototype._rehydrateRecords = function(listOfDehydratedRecords) {
  var key;
  var itemUuid;
  var item;
  var contentRecordUuid;
  var contentRecord;
  var JSON_MEMBER = orp.model.StubVirtualServer.JSON_MEMBER;

  for (key in listOfDehydratedRecords) {
    var dehydratedRecord = listOfDehydratedRecords[key];

    var dehydratedTransaction = dehydratedRecord[JSON_MEMBER.TRANSACTION_CLASS];
    if (dehydratedTransaction) {
      var listOfRecordsInTransaction = dehydratedTransaction;
      this._rehydrateRecords(listOfRecordsInTransaction);
    } else {
      var dehydratedItem = dehydratedRecord[JSON_MEMBER.ITEM_CLASS];
      var dehydratedUser = dehydratedRecord[JSON_MEMBER.USER_CLASS];
      var dehydratedVote = dehydratedRecord[JSON_MEMBER.VOTE_CLASS];
      var dehydratedOrdinal = dehydratedRecord[JSON_MEMBER.ORDINAL_CLASS];
      var dehydratedEntry = dehydratedRecord[JSON_MEMBER.ENTRY_CLASS];
        
      if (dehydratedItem) {
        itemUuid = dehydratedItem[JSON_MEMBER.UUID];
        item = this._getItemFromUuidOrBootstrapItem(itemUuid);
        this._chronologicalListOfRecords.push(item);
      }
      
      if (dehydratedUser) {
        var userUuid = dehydratedUser[JSON_MEMBER.USER];
        var userPasswordHash = dehydratedUser[JSON_MEMBER.PASSWORD];
        var user = this._getItemFromUuidOrBootstrapItem(userUuid);
        this._listOfUsers.push(user);
        this._hashTableOfUserAuthenticationInfo[user.getUuid()] = userPasswordHash;
      }
      
      if (dehydratedVote) {
        var voteUuid = dehydratedVote[JSON_MEMBER.UUID];
        var retainFlagString = dehydratedVote[JSON_MEMBER.RETAIN_FLAG];
        var retainFlag = null;
        if (retainFlagString == "true") {
          retainFlag = true;
        }
        if (retainFlagString == "false") {
          retainFlag = false;
        }
        orp.lang.assert(retainFlag !== null);
        contentRecordUuid = dehydratedVote[JSON_MEMBER.RECORD];
        contentRecord = this._getContentRecordFromUuid(contentRecordUuid);
        var vote = new orp.model.Vote(this.getWorld(), voteUuid, contentRecord, retainFlag);
        this._chronologicalListOfRecords.push(vote);
      }
      
      if (dehydratedOrdinal) {
        var ordinalUuid = dehydratedOrdinal[JSON_MEMBER.UUID];
        var ordinalNumber = dehydratedOrdinal[JSON_MEMBER.ORDINAL_NUMBER];
        contentRecordUuid = dehydratedOrdinal[JSON_MEMBER.RECORD];
        contentRecord = this._getContentRecordFromUuid(contentRecordUuid);
        var ordinal = new orp.model.Ordinal(this.getWorld(), ordinalUuid, contentRecord, ordinalNumber);
        this._chronologicalListOfRecords.push(ordinal);
      }
      
      if (dehydratedEntry) {
        var entryUuid = dehydratedEntry[JSON_MEMBER.UUID];
        var entry = this._getEntryFromUuidOrBootstrapEntry(entryUuid);
        var previousEntryUuid = dehydratedEntry[JSON_MEMBER.PREVIOUS_VALUE];
        var previousEntry = null;
        if (previousEntryUuid) {
          previousEntry = this._getEntryFromUuidOrBootstrapEntry(previousEntryUuid);
        }
 
        var dataTypeUuid = dehydratedEntry[JSON_MEMBER.TYPE];
        var dataType = this._getItemFromUuidOrBootstrapItem(dataTypeUuid);
        
        if (dataTypeUuid == orp.model.World.UUID.TYPE_CONNECTION) {
          var listOfItemUuids = dehydratedEntry[JSON_MEMBER.ITEM];
          var firstItemUuid = listOfItemUuids[0];
          var secondItemUuid = listOfItemUuids[1];
          var firstItem = this._getItemFromUuidOrBootstrapItem(firstItemUuid);
          var secondItem = this._getItemFromUuidOrBootstrapItem(secondItemUuid);

          var listOfAttributeUuids = dehydratedEntry[JSON_MEMBER.ATTRIBUTE];
          var firstAttributeUuid = listOfAttributeUuids[0];
          var secondAttributeUuid = listOfAttributeUuids[1];
          var firstAttribute = this._getItemFromUuidOrBootstrapItem(firstAttributeUuid);
          var secondAttribute = this._getItemFromUuidOrBootstrapItem(secondAttributeUuid);
          
          var pairOfItems = [firstItem, secondItem];
          var pairOfAttributes = [firstAttribute, secondAttribute];
          entry._rehydrate(pairOfItems, pairOfAttributes, null, previousEntry, dataType);
        } else {
          itemUuid = dehydratedEntry[JSON_MEMBER.ITEM];
          item = this._getItemFromUuidOrBootstrapItem(itemUuid);
          var attributeUuid = dehydratedEntry[JSON_MEMBER.ATTRIBUTE];
          var attribute = null;
          if (attributeUuid) {
            attribute = this._getItemFromUuidOrBootstrapItem(attributeUuid);
          } else {
            orp.lang.assert(false); // the attributeUuid should always be there
          }
          var rawData = dehydratedEntry[JSON_MEMBER.VALUE];
          var finalData = null;
          switch (dataTypeUuid) {
            case orp.model.World.UUID.TYPE_ITEM:
              finalData = this._getItemFromUuidOrBootstrapItem(rawData);
              break;
            case orp.model.World.UUID.TYPE_TEXT:
              finalData = this.decodeText(rawData);
              break;
            case orp.model.World.UUID.TYPE_NUMBER:
              finalData = parseFloat(rawData);
              break;
            case orp.model.World.UUID.TYPE_DATE:
              finalData = new orp.util.DateValue(rawData);
              // if (!finalData.isValid()) {
              //   alert(rawData + " " + finalData);
              // }
              orp.lang.assert(finalData.isValid());
              break;
            default:
              orp.lang.assert(false, 'Unknown data type while _rehydrating()');
          }
          entry._rehydrate(item, attribute, finalData, previousEntry, dataType);
        }
        this._chronologicalListOfRecords.push(entry);
      }
      
    }
  }
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
