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
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global Util  */
/*global World, Item, Entry, Ordinal, Vote, ContentRecord, Transaction  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// StubVirtualServer public class constants
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
StubVirtualServer.JSON_MEMBER_ORDINAL_NUMBER = "value";


/**
 * ??.
 *
 * @scope    private instance method
StubVirtualServer.prototype._processOptionalDefaultOverrides = function(optionalDefaultOverrides) {
  for (var key in optionalDefaultOverrides) {
    // Should I check first that there is already a property called 'key'?
    this[key] = optionalDefaultOverrides[key];
    // alert("key = " + key + "\noptionalDefaultOverrides[key] = " + optionalDefaultOverrides[key]);
  }
};
 */


/**
 * The StubVirtualServer is a dummy place-holder datastore that does
 * a bare-minimum job of providing data to a World.
 *
 * @scope    public instance constructor
 */
function StubVirtualServer(pathToTrunkDirectory) {
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
}

/**
 * Initializes the instance variables for a newly created StubVirtualServer.
 *
 * @scope    private instance method
 * @param    world    The world that we provide data for. 
 */
StubVirtualServer.prototype._initialize = function(world) {
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
 

/**
 * Initializes the instance variables for a newly created StubVirtualServer,
 * and does the initial loading of at least the axiomatic items.
 *
 * @scope    public instance method
 * @param    world    The world that we provide data for. 
 */
StubVirtualServer.prototype.setWorldAndLoadAxiomaticItems = function(world) {
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
StubVirtualServer.prototype.getWorld = function() {
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
StubVirtualServer.prototype.encodeText = function(rawText) {
  Util.assert(Util.isString(rawText));

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
StubVirtualServer.prototype.decodeText = function(encodedText) {
  Util.assert(Util.isString(encodedText));

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
    var listOfChangesMade = this._saveChangesToServer();
    this._currentTransaction = null;
    if (listOfChangesMade.length > 0) {
      // alert(listOfChangesMade.length + " changes made");
      // Util.displayStatusBlurb(listOfChangesMade.length + " changes made");
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
StubVirtualServer.prototype.getCurrentTransaction = function() {
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
StubVirtualServer.prototype.newItem = function(name, observer) {
  this._throwErrorIfNoUserIsLoggedIn();
  var item = this._createNewItem(observer, false);
  if (name) { 
    var attributeCalledName = this._world.getAttributeCalledName();
    item.addEntryForAttribute(attributeCalledName, name);
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
StubVirtualServer.prototype.newProvisionalItem = function(observer) {
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
StubVirtualServer.prototype._createNewItem = function(observer, provisionalFlag) {
  var uuid = this._getNewUuid();
  var item = new Item(this._world, uuid);
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
StubVirtualServer.prototype._provisionalItemJustBecameReal = function(item) {
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
StubVirtualServer.prototype.newEntry = function(item, previousEntry, attribute, value, type) {
  this._throwErrorIfNoUserIsLoggedIn();
  var uuid = this._getNewUuid();
  var entry = new Entry(this._world, uuid);
  entry._initialize(item, previousEntry, attribute, value, type);
  item.__addEntryToListOfEntriesForAttribute(entry, attribute);
  
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
StubVirtualServer.prototype.newConnectionEntry = function(previousEntry, itemOne, attributeOne, itemTwo, attributeTwo) {
  this._throwErrorIfNoUserIsLoggedIn();
  var uuid = this._getNewUuid();
  var entry = new Entry(this._world, uuid);
  entry._initializeConnection(previousEntry, itemOne, attributeOne, itemTwo, attributeTwo);

  itemOne.__addEntryToListOfEntriesForAttribute(entry, attributeOne);
  itemTwo.__addEntryToListOfEntriesForAttribute(entry, attributeTwo);

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
StubVirtualServer.prototype.newOrdinal = function(contentRecord, ordinalNumber) {
  this._throwErrorIfNoUserIsLoggedIn();
  var uuid = this._getNewUuid();
  var ordinal = new Ordinal(this._world, uuid, contentRecord, ordinalNumber);
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
StubVirtualServer.prototype.newVote = function(contentRecord, retainFlag) {
  this._throwErrorIfNoUserIsLoggedIn();
  var uuid = this._getNewUuid();
  var vote = new Vote(this._world, uuid, contentRecord, retainFlag);
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
StubVirtualServer.prototype.newUser = function(name, authentication, observer) {
  if (this._currentUser) {
    var error = new Error("A user is logged in.  You can't create a new user when somebody is already logged in.");
    throw error;
  }

  var newUser = this._createNewItem(observer, false);
  this._listOfUsers.push(newUser);
  
  var md5Authentication = null;
  if (authentication) {
    md5Authentication = Util.hex_md5(authentication);
  }
  this._hashTableOfUserAuthenticationInfo[newUser.getUuid()] = md5Authentication;

  this._currentUser = newUser;
  var categoryCalledPerson = this.getWorld().getCategoryCalledPerson();
  newUser.assignToCategory(categoryCalledPerson); 
  if (name) { 
    var attributeCalledName = this.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_NAME);
    var entry = newUser.addEntryForAttribute(attributeCalledName, name);
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
StubVirtualServer.prototype.getUsers = function() {
  return this._listOfUsers;
};


/**
 * Returns an item representing the user who is currently logged in.
 *
 * @scope    public instance method
 * @return   An item representing the user who is currently logged in.
 */
StubVirtualServer.prototype.getCurrentUser = function() {
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
StubVirtualServer.prototype.login = function(user, password) {
  
  // Only one user can be logged in at once.  We consider it an error
  // if you try to log in a new user before logging out the old one.
  if (this._currentUser) {
    Util.assert(false);
  }
  
  var isKnownUser = Util.isObjectInSet(user, this._listOfUsers);
  if (!isKnownUser) {
    return false;
  }

  if (user.getUuidString() == World.UUID_FOR_USER_AMY) {
    // nobody is allowed to log in as the axiomatic user
    return false;
  }
  
  var md5hashOfPassword = null;
  if (password) {
    md5hashOfPassword = Util.hex_md5(password);
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
StubVirtualServer.prototype.logout = function() {
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
StubVirtualServer.prototype.getItemFromUuid = function(uuid, observer) {
  Util.assert(Util.isUuidValue(uuid));
  
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
StubVirtualServer.prototype._saveChangesToServer = function () {
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
    for (var uuid in this._hashTableOfItemsKeyedByUuid) {
      var item = this._hashTableOfItemsKeyedByUuid[uuid];
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
 * @param    item    An item, which will be modified so that it matches the query. 
 * @param    query    A query item. 
 */
StubVirtualServer.prototype.setItemToBeIncludedInQueryResultList = function(item, query) {
  Util.assert(item instanceof Item);
  Util.assert(query instanceof Item);
  
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
    Util.assert(listOfMatchingAttrs.length==1, 'more than one matching attributes');
    matchingAttribute = listOfMatchingAttrs[0].getValue();
  }

  for (var key in listOfMatchingEntries) {
    var matchingEntry = listOfMatchingEntries[key];
    var match = matchingEntry.getValue();
    if (!item.hasAttributeValue(matchingAttribute, match)) {
      if ((matchingAttribute == attributeCalledCategory) && (match instanceof Item) && (match.isInCategory(categoryCalledCategory))) {
        item.assignToCategory(match);
      } else {
        item.addEntryForAttribute(matchingAttribute, match);
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
StubVirtualServer.prototype.getItemsInCategory = function(category) {
  Util.assert(category instanceof Item);

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
StubVirtualServer.prototype._throwErrorIfNoUserIsLoggedIn = function() {
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
StubVirtualServer.prototype._getContentRecordFromUuid = function(uuid) {
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
 * @param    pseudoNode    The pseudoNode value that the new UUID should have. 
 */
StubVirtualServer.prototype._generateUuid = function(pseudoNode) {
  return new TimeBasedUuid(pseudoNode);
};


/**
 * Creates a brand new UUID to allocate to an item or entry.
 *
 * @scope    private instance method
 * @return   A newly created UUID.
 */
StubVirtualServer.prototype._getNewUuid = function() {
  var newUuid;
  if (this._currentUser) {
    var uuidOfCurrentUser = this._currentUser.getUuid();
    // var arrayOfParts = uuidOfCurrentUser.split("-");
    // var pseudoNodeOfCurrentUser = arrayOfParts[4]; // "0123456789AB";
    var pseudoNodeOfCurrentUser = uuidOfCurrentUser.getNode(); // "0123456789AB";
    newUuid = this._generateUuid(pseudoNodeOfCurrentUser);
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
StubVirtualServer.prototype._getAuthenticationInfoForUser = function(user) {
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
StubVirtualServer.prototype._getItemFromUuidOrCreateNewItem = function(uuid) {
  var item = this.getItemFromUuid(uuid);
  if (!item) {
    item = new Item(this._world, uuid);
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
StubVirtualServer.prototype._loadAxiomaticItemsFromFileAtURL = function(url) {
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
StubVirtualServer.prototype.__getItemFromUuidOrBootstrapItem = function(uuid) {
  var item = this.getItemFromUuid(uuid);
  if (!item) {
    item = new Item(this.getWorld(), uuid);
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
StubVirtualServer.prototype.__getEntryFromUuid = function(uuid) {
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
StubVirtualServer.prototype.__getEntryFromUuidOrBootstrapEntry = function(uuid) {
  var entry = this._hashTableOfEntriesKeyedByUuid[uuid];
  if (!entry) {
    entry = new Entry(this.getWorld(), uuid);
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
StubVirtualServer.prototype._rehydrateRecords = function(listOfDehydratedRecords) {
  var key;
  var itemUuid;
  var item;
  var contentRecordUuid;
  var contentRecord;

  for (key in listOfDehydratedRecords) {
    var dehydratedRecord = listOfDehydratedRecords[key];

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
        this._chronologicalListOfRecords.push(item);
      }
      
      if (dehydratedUser) {
        var userUuid = dehydratedUser[StubVirtualServer.JSON_MEMBER_USER];
        var userPasswordHash = dehydratedUser[StubVirtualServer.JSON_MEMBER_PASSWORD];
        var user = this.__getItemFromUuidOrBootstrapItem(userUuid);
        this._listOfUsers.push(user);
        this._hashTableOfUserAuthenticationInfo[user.getUuid()] = userPasswordHash;
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
        this._chronologicalListOfRecords.push(vote);
      }
      
      if (dehydratedOrdinal) {
        var ordinalUuid = dehydratedOrdinal[StubVirtualServer.JSON_MEMBER_UUID];
        var ordinalNumber = dehydratedOrdinal[StubVirtualServer.JSON_MEMBER_ORDINAL_NUMBER];
        contentRecordUuid = dehydratedOrdinal[StubVirtualServer.JSON_MEMBER_RECORD];
        contentRecord = this._getContentRecordFromUuid(contentRecordUuid);
        var ordinal = new Ordinal(this.getWorld(), ordinalUuid, contentRecord, ordinalNumber);
        this._chronologicalListOfRecords.push(ordinal);
      }
      
      if (dehydratedEntry) {
        var entryUuid = dehydratedEntry[StubVirtualServer.JSON_MEMBER_UUID];
        var entry = this.__getEntryFromUuidOrBootstrapEntry(entryUuid);
        var previousEntryUuid = dehydratedEntry[StubVirtualServer.JSON_MEMBER_PREVIOUS_VALUE];
        var previousEntry = null;
        if (previousEntryUuid) {
          previousEntry = this.__getEntryFromUuidOrBootstrapEntry(previousEntryUuid);
        }
 
        var dataTypeUuid = dehydratedEntry[StubVirtualServer.JSON_MEMBER_TYPE];
        Util.assert(Util.isUuidValue(dataTypeUuid));
        var dataType = this.__getItemFromUuidOrBootstrapItem(dataTypeUuid);
        
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
              finalData = this.decodeText(rawData);
              break;
            case World.UUID_FOR_TYPE_NUMBER:
              finalData = parseFloat(rawData);
              break;
            case World.UUID_FOR_TYPE_DATE:
              finalData = new DateValue(rawData);
              // if (!finalData.isValid()) {
              //   alert(rawData + " " + finalData);
              // }
              Util.assert(finalData.isValid());
              break;
            default:
              Util.assert(false, 'Unknown data type while _rehydrating()');
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
