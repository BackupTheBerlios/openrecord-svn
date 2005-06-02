/*****************************************************************************
 World.js
 
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
//   Item.js
//   StubVirtualServer.js
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// World public class constants
// -------------------------------------------------------------------
World.RETRIEVAL_FILTER_LAST_EDIT_WINS = "RETRIEVAL_FILTER_LAST_EDIT_WINS";
World.RETRIEVAL_FILTER_SINGLE_USER = "RETRIEVAL_FILTER_SINGLE_USER";
World.RETRIEVAL_FILTER_DEMOCRATIC = "RETRIEVAL_FILTER_DEMOCRATIC";
World.RETRIEVAL_FILTER_UNABRIDGED = "RETRIEVAL_FILTER_UNABRIDGED";


World.NULL_UUID                        = "00000000-ce7f-11d9-8cd5-0011113ae5d6";
World.IDENTITY_UUID                    = "00000001-ce7f-11d9-8cd5-0011113ae5d6";

World.UUID_FOR_USER_AMY                = "00000100-ce7f-11d9-8cd5-0011113ae5d6";

World.UUID_FOR_ATTRIBUTE_NAME          = "00000101-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_ATTRIBUTE_SHORT_NAME    = "00000102-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_ATTRIBUTE_SUMMARY       = "00000103-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_ATTRIBUTE_BODY          = "00000104-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_ATTRIBUTE_CATEGORY      = "00000105-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_ATTRIBUTE_QUERY         = "00000106-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_CATEGORY = "00000107-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_ITEM = "00000108-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_ATTRIBUTE_UNFILED       = "00000109-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_ATTRIBUTE_EXPECTED_TYPE = "0000010a-ce7f-11d9-8cd5-0011113ae5d6";

World.UUID_FOR_CATEGORY_BOOK           = "0000010e-ce7f-11d9-8cd5-0011113ae5d6";  // here as an example only
World.UUID_FOR_CATEGORY_MOVIE          = "0000010f-ce7f-11d9-8cd5-0011113ae5d6";  // here as an example only
World.UUID_FOR_CATEGORY_ATTRIBUTE      = "00000110-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_CATEGORY_CATEGORY       = "00000111-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_CATEGORY_QUERY          = "00000112-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_CATEGORY_TYPE           = "00000113-ce7f-11d9-8cd5-0011113ae5d6";

World.UUID_FOR_TYPE_TEXT               = "00000120-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_TYPE_NUMBER             = "00000121-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_TYPE_DATE               = "00000122-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_TYPE_CHECK_MARK         = "00000123-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_TYPE_URL                = "00000124-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_TYPE_ITEM               = "00000130-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_TYPE_ANYTHING           = "00000140-ce7f-11d9-8cd5-0011113ae5d6";

// -------------------------------------------------------------------
// World private class constants
// -------------------------------------------------------------------
World.__TUPLE_KEY_LIST = "list";
World.__TUPLE_KEY_OBSERVERS = "observers";


/**
 * The World class represents a "world" of items.
 *
 * When the view code works with items, it accesses the items through the
 * context of a "world".  Items exist within a world.  Users can login to
 * a world to edit the items there.
 *
 * @scope    public instance constructor
 * @param    virtualServer    Optional. The datastore that this world gets its data from. 
 */
function World(virtualServer) {
  this._countOfNestedTransactions = 0;
  this._hashTableOfObserverListsKeyedByItemUuid = {};
  this._listOfListObserverTuples = [];

  this._currentRetrievalFilter = World.RETRIEVAL_FILTER_LAST_EDIT_WINS;

  var server;
  if (virtualServer) {
    server = virtualServer;
  } else {
    server = new StubVirtualServer();
  }
  this._virtualServer = server;

  server.setWorldAndLoadAxiomaticItems(this);
  
  // load the axiomatic attributes
  this._attributeCalledName                  = server.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_NAME);
  this._attributeCalledShortName             = server.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_SHORT_NAME);
  this._attributeCalledSummary               = server.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_SUMMARY);
  this._attributeCalledCategory              = server.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_CATEGORY);
  this._attributeCalledQuery                 = server.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_QUERY);
  this._attributeCalledQueryMatchingCategory = server.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_CATEGORY);
  this._attributeCalledQueryMatchingItem     = server.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_ITEM);
  this._attributeCalledUnfiled               = server.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_UNFILED);
  this._attributeCalledExpectedType          = server.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_EXPECTED_TYPE);

  // load the axiomatic categories
  this._categoryCalledAttribute   = server.getItemFromUuid(World.UUID_FOR_CATEGORY_ATTRIBUTE);
  this._categoryCalledCategory    = server.getItemFromUuid(World.UUID_FOR_CATEGORY_CATEGORY);
  this._categoryCalledQuery       = server.getItemFromUuid(World.UUID_FOR_CATEGORY_QUERY);
  this._categoryCalledType        = server.getItemFromUuid(World.UUID_FOR_CATEGORY_TYPE);

  // load the axiomatic types
  this._typeCalledText      = server.getItemFromUuid(World.UUID_FOR_TYPE_TEXT);
  this._typeCalledNumber    = server.getItemFromUuid(World.UUID_FOR_TYPE_NUMBER);
  this._typeCalledDate      = server.getItemFromUuid(World.UUID_FOR_TYPE_DATE);
  this._typeCalledCheckMark = server.getItemFromUuid(World.UUID_FOR_TYPE_CHECK_MARK);
  this._typeCalledUrl       = server.getItemFromUuid(World.UUID_FOR_TYPE_URL);
  this._typeCalledItem      = server.getItemFromUuid(World.UUID_FOR_TYPE_ITEM);
  this._typeCalledAnything  = server.getItemFromUuid(World.UUID_FOR_TYPE_ANYTHING);
}


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
World.prototype.beginTransaction = function() {
  this._countOfNestedTransactions += 1;
  // PENDING:
  //   This is just a stub method for now.  Once we start implementing
  //   support for transactions we'll have to put some real code here.
};
 

/**
 * Marks the end of a transaction.
 *
 * @scope    public instance method
 */
World.prototype.endTransaction = function() {
  this._countOfNestedTransactions -= 1;
  Util.assert(this._countOfNestedTransactions >= 0);
  // PENDING:
  //   This is just a stub method for now.  Once we start implementing
  //   support for transactions we'll have to put some real code here.
  if (this._countOfNestedTransactions === 0) {
    var listOfChangesMade = this._virtualServer.saveChangesToServer();
    if (listOfChangesMade.length > 0) {
      Util.displayStatusBlurb(listOfChangesMade.length + " changes made");
      this._notifyObserversOfChanges(listOfChangesMade);
    }
  }
};


// ===================================================================
// PENDING: Line of Completion. Beyond there be dragons...
/**
 * Sends notification messages to registered observers to let them know 
 * about any new changes to items or lists that they're observers of.
 *
 * @scope    private instance method
 * @param    listOfNewlyCreatedRecords    A list of records representing the changes. 
 */
World.prototype._notifyObserversOfChanges = function(listOfNewlyCreatedRecords) {
  var hashTableOfNewlyCreatedRecordsKeyedByItemUuid = {};
  var key;
  var uuid;
  var item;
  var observer;
  var itemOrEntry;
  var listOfRecordsForItem;
  
  // Look at each of the newly created records to see what item it changes,
  // and build a hash table that divides up the records based on the item
  // being changed, so that we can easily find all the records that impact
  // a given item.
  for (key in listOfNewlyCreatedRecords) {
    var record = listOfNewlyCreatedRecords[key];
    item = null;
    if (record instanceof Item) {
      item = record;
    }
    if ((record instanceof Vote) || (record instanceof Ordinal)) {
      itemOrEntry = record.getIdentifiedRecord();
      if (itemOrEntry instanceof Item) {
        item = itemOrEntry;
      }
       if (itemOrEntry instanceof Entry) {
        item = itemOrEntry.getItem();
      }
    }
    if (record instanceof Entry) {
      item = record.getItem();
    }
    if (item) {
      listOfRecordsForItem = hashTableOfNewlyCreatedRecordsKeyedByItemUuid[item._getUuid()];
      if (!listOfRecordsForItem) {
        listOfRecordsForItem = [];
        hashTableOfNewlyCreatedRecordsKeyedByItemUuid[item._getUuid()] = listOfRecordsForItem;
      }
      listOfRecordsForItem.push(record);
    }
  }
  
  // For each of the items that was impacted by some changes, find
  // the observers of that item, and notify them of the changes.
  for (uuid in hashTableOfNewlyCreatedRecordsKeyedByItemUuid) {
    item = this.getItemFromUuid(uuid);
    listOfRecordsForItem = hashTableOfNewlyCreatedRecordsKeyedByItemUuid[uuid];
    var listOfObserversForItem = this._hashTableOfObserverListsKeyedByItemUuid[uuid];
    for (key in listOfObserversForItem) {
      observer = listOfObserversForItem[key];
      if (Util.isFunction(observer)) {
        observer.call(null, item, listOfRecordsForItem);
      } else {
        if (Util.isObject(observer)) {
          observer.observedItemHasChanged(item, listOfRecordsForItem);
        } else {
          // We should never get here.  If we do, consider it an error.
          Util.assert(false);
        }
      }
    }
  }
  
  // Look at all the observers who have registered interest in a 
  // list of items rather than in an individual item.  For each of
  // those observers, notify them of all the changes to all the items.
  for (var ikey in this._listOfListObserverTuples) {
    var observerTuple = this._listOfListObserverTuples[ikey];
    var listBeingObserved = observerTuple[World.__TUPLE_KEY_LIST];
    var setOfObservers = observerTuple[World.__TUPLE_KEY_OBSERVERS];
    var listOfItemChangeReports = null;
    for (key in listBeingObserved) {
      item = listBeingObserved[key];
      var changes = hashTableOfNewlyCreatedRecordsKeyedByItemUuid[item._getUuid()];
      if (changes) {
        var changeReportForItem = [item, changes];
        if (!listOfItemChangeReports) {
          listOfItemChangeReports = [];
        }
        listOfItemChangeReports.push(changeReportForItem);
      }
    }
    if (listOfItemChangeReports) {
      for (key in setOfObservers) {
        observer = setOfObservers[key];
        if (Util.isFunction(observer)) {
          observer.call(null, listBeingObserved, listOfItemChangeReports);
        } else {
          if (Util.isObject(observer)) {
            observer.observedListHasChanged(listBeingObserved, listOfItemChangeReports);
          } else {
            // We should never get here.  If we do, consider it an error.
            Util.assert(false);
          }
        }
      }
    }
  }
};


// -------------------------------------------------------------------
// Methods for the retrieval filters
// -------------------------------------------------------------------

/**
 * Returns the retrieval filter that this world is currently using.
 *
 * @scope    public instance method
 * @return   A string constant representing one of the three supported retrieval filters.
 */
World.prototype.getRetrievalFilter = function() {
  return this._currentRetrievalFilter;
};


/**
 * Sets the retrieval filter that this world will use.
 *
 * @scope    public instance method
 * @param    filter    A string constant representing one of the three supported retrieval filters.
 */
World.prototype.setRetrievalFilter = function(filter) {
  Util.assert(filter == World.RETRIEVAL_FILTER_LAST_EDIT_WINS ||
              filter == World.RETRIEVAL_FILTER_SINGLE_USER ||
              filter == World.RETRIEVAL_FILTER_DEMOCRATIC ||
              filter == World.RETRIEVAL_FILTER_UNABRIDGED);
  this._currentRetrievalFilter = filter;
};


/**
 * Given a list of items, returns a filtered list based on the
 * retrieval filter currently set for this world.
 *
 * @scope    public instance method
 * @return   A list of items that made it through the filter.
 */
World.prototype._getFilteredList = function(unfilteredList) {
  var filteredList = [];
  var item;
  
  var filter = this.getRetrievalFilter();
  switch (filter) {
    case World.RETRIEVAL_FILTER_LAST_EDIT_WINS:
      for (var key in unfilteredList) {
        item = unfilteredList[key];
        if (!item.hasBeenDeleted()) {
          filteredList.push(item);
        }
      }
      break;
    case World.RETRIEVAL_FILTER_SINGLE_USER:
      // PENDING: This still needs to be implemented.
      Util.assert(false);
      break;
    case World.RETRIEVAL_FILTER_DEMOCRATIC:
      // PENDING: This still needs to be implemented.
      Util.assert(false);
      break;
    case World.RETRIEVAL_FILTER_UNABRIDGED:
      filteredList = unfilteredList;
      break;
    default:
      // We should never get here.  If we get here, it's an error.
      Util.assert(false);
      break;
  }

  filteredList.sort(IdentifiedRecord.compareOrdinals);
  return filteredList;
};


// -------------------------------------------------------------------
// Accessor methods for axiomatic attributes
// -------------------------------------------------------------------
World.prototype.getAttributeCalledName = function() {
  return this._attributeCalledName;
};

World.prototype.getAttributeCalledShortName = function() {
  return this._attributeCalledShortName;
};

World.prototype.getAttributeCalledSummary = function() {
  return this._attributeCalledSummary;
};

World.prototype.getAttributeCalledCategory = function() {
  return this._attributeCalledCategory;
};

World.prototype.getAttributeCalledQuery = function() {
  return this._attributeCalledQuery;
};

World.prototype.getAttributeCalledQueryMatchingCategory = function() {
  return this._attributeCalledQueryMatchingCategory;
};

World.prototype.getAttributeCalledQueryMatchingItem = function() {
  return this._attributeCalledQueryMatchingItem;
};

World.prototype.getAttributeCalledUnfiled = function() {
  return this._attributeCalledUnfiled;
};

World.prototype.getAttributeCalledExpectedType = function() {
  return this._attributeCalledExpectedType;
};


// -------------------------------------------------------------------
// Accessor methods for axiomatic categories
// -------------------------------------------------------------------
World.prototype.getCategoryCalledAttribute = function() {
  return this._categoryCalledAttribute;
};

World.prototype.getCategoryCalledCategory = function() {
  return this._categoryCalledCategory;
};

World.prototype.getCategoryCalledQuery = function() {
  return this._categoryCalledQuery;
};

World.prototype.getCategoryCalledType = function() {
  return this._categoryCalledType;
};


// -------------------------------------------------------------------
// Accessor methods for axiomatic categories
// -------------------------------------------------------------------
World.prototype.getTypeCalledText = function() {
  return this._typeCalledText;
};

World.prototype.getTypeCalledNumber = function() {
  return this._typeCalledNumber;
};

World.prototype.getTypeCalledDate = function() {
  return this._typeCalledDate;
};

World.prototype.getTypeCalledCheckMark = function() {
  return this._typeCalledCheckMark;
};

World.prototype.getTypeCalledUrl = function() {
  return this._typeCalledUrl;
};

World.prototype.getTypeCalledItem = function() {
  return this._typeCalledItem;
};

World.prototype.getTypeCalledAnything = function() {
  return this._typeCalledAnything;
};



// -------------------------------------------------------------------
// Login and logout methods
// -------------------------------------------------------------------

/**
 * Attempts to login a user.
 *
 * @scope    public instance method
 * @param    user    The user to be logged in. 
 * @param    authentication    Authentication info for the user. 
 * @return   True if we were able to log in the user. False if the login failed.
 */
World.prototype.login = function(user, authentication) {
  return this._virtualServer.login(user, authentication);
};


/**
 * Logs out the current user.
 *
 * @scope    public instance method
 * @return   True if the current user was logged out. False if there was no current user logged in.
 */
World.prototype.logout = function() {
  return this._virtualServer.logout();
};


// -------------------------------------------------------------------
// Methods having to do with users
// -------------------------------------------------------------------

/**
 * Returns an list of all the items that represent users of this datastore.
 *
 * @scope    public instance method
 * @return   A list of items that represent users.
 */
World.prototype.getUsers = function() {
  var listOfUsers = this._virtualServer.getUsers();
  return this._getFilteredList(listOfUsers);
};


/**
 * Returns an item representing the user who is currently logged in.
 *
 * @scope    public instance method
 * @return   An item representing the user who is currently logged in.
 */
World.prototype.getCurrentUser = function() {
  return this._virtualServer.getCurrentUser();
};


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
World.prototype.newUser = function(name, authentication, observer) {
  this.beginTransaction();
  var newUser = this._virtualServer.newUser(name, authentication, observer);
  this.endTransaction();
  return newUser;
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
World.prototype.newItem = function(name, observer) {
  this.beginTransaction();
  var item = this._virtualServer.newItem(name, observer);
  this.endTransaction();
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
World.prototype.newProvisionalItem = function(observer) {
  return this._virtualServer.newProvisionalItem(observer);
};


/**
 * Records the fact that a provisional item just became real.
 *
 * @scope    package instance method
 * @param    item    The item that was provisional and just became real. 
 */
World.prototype._provisionalItemJustBecameReal = function(item) {
  this._virtualServer._provisionalItemJustBecameReal(item);
};


/**
 * Returns a newly created item representing an attribute.
 *
 * @scope    public instance method
 * @param    name    Optional. A string, which will be assigned to the name attribute of the new item. 
 * @param    observer    Optional. An object or method to be registered as an observer of the returned item. 
 * @return   A newly created item representing an attribute.
 * @throws   Throws an Error if no user is logged in.
 */
World.prototype.newAttribute = function(name, observer) {
  this.beginTransaction();
  var item = this._virtualServer.newItem(name, observer);
  var attributeCalledCategory = this.getAttributeCalledCategory();
  var categoryCalledAttribute = this.getCategoryCalledAttribute();
  item.addEntryForAttribute(attributeCalledCategory, categoryCalledAttribute);
  this.endTransaction();
  return item;
};


/**
 * Returns a newly created item representing a category.
 *
 * @scope    public instance method
 * @param    name    Optional. A string, which will be assigned to the name attribute of the new item. 
 * @param    observer    Optional. An object or method to be registered as an observer of the returned item. 
 * @return   A newly created item representing a category.
 * @throws   Throws an Error if no user is logged in.
 */
World.prototype.newCategory = function(name, observer) {
  this.beginTransaction();
  var item = this._virtualServer.newItem(name, observer);
  var attributeCalledCategory = this.getAttributeCalledCategory();
  var categoryCalledCategory = this.getCategoryCalledCategory();
  item.addEntryForAttribute(attributeCalledCategory, categoryCalledCategory);
  this.endTransaction();
  return item;
};


/**
 * Returns a newly created item representing a query.
 *
 * @scope    public instance method
 * @param    category    Optional. A category item, or an array of category items. 
 * @return   A newly created item representing a query.
 */
World.prototype.newQueryForItemsByCategory = function(categoryOrListOfCategories) {
  this.beginTransaction();
  var item = this._virtualServer.newItem("A query");
  var attributeCalledCategory = this.getAttributeCalledCategory();
  var categoryCalledQuery = this.getCategoryCalledQuery();
  item.addEntryForAttribute(attributeCalledCategory, categoryCalledQuery);

  var attributeCalledQueryMatchingCategory = this.getAttributeCalledQueryMatchingCategory();
  var category;
  if (categoryOrListOfCategories) {
    if (categoryOrListOfCategories instanceof Item) {
      category = categoryOrListOfCategories;
      item.addEntryForAttribute(attributeCalledQueryMatchingCategory, category);
    }
    if (Util.isArray(categoryOrListOfCategories)) {
      var listOfCategories = categoryOrListOfCategories;
      for (var key in listOfCategories) {
        category = listOfCategories[key];
        item.addEntryForAttribute(attributeCalledQueryMatchingCategory, category);
      }
    }
  }

  this.endTransaction();
  return item;
};


/**
 * Returns a newly created item representing a query.
 *
 * @scope    public instance method
 * @param    itemOrListOfItems    Optional. An item, or an array of items. 
 * @return   A newly created item representing a query.
 */
World.prototype.newQueryForSpecificItems = function(itemOrListOfItems) {
  this.beginTransaction();
  var item = this._virtualServer.newItem("A query");
  var attributeCalledCategory = this.getAttributeCalledCategory();
  var categoryCalledQuery = this.getCategoryCalledQuery();
  item.addEntryForAttribute(attributeCalledCategory, categoryCalledQuery);

  var attributeCalledQueryMatchingItem = this.getAttributeCalledQueryMatchingItem();
  if (itemOrListOfItems) {
    if (itemOrListOfItems instanceof Item) {
      item.addEntryForAttribute(attributeCalledQueryMatchingItem, itemOrListOfItems);
    }
    if (Util.isArray(itemOrListOfItems)) {
      var listOfItems = itemOrListOfItems;
      for (var key in listOfItems) {
        var matchingItem = listOfItems[key];
        item.addEntryForAttribute(attributeCalledQueryMatchingItem, matchingItem);
      }
    }
  }

  this.endTransaction();
  return item;
};


/**
 * Returns a newly created entry.
 *
 * @scope    public instance method
 * @param    itemOrEntry    The item that this is a entry of, or the old entry that this entry is replacing. 
 * @param    attribute    The attribute that this entry is assigned to. May be null. 
 * @param    value    The value to initialize the entry with. 
 * @return   A newly created entry.
 */
World.prototype._newEntry = function(itemOrEntry, attribute, value) {
  this.beginTransaction();
  var entry = this._virtualServer.newEntry(itemOrEntry, attribute, value);
  this.endTransaction();
  return entry;
};


/**
 * Returns a newly created ordinal.
 *
 * @scope    protected instance method
 * @param    identifiedRecord    The identifiedRecord that this is an ordinal for. 
 * @param    ordinalNumber    The ordinal number itself. 
 * @return   A newly created ordinal.
 */
World.prototype._newOrdinal = function(identifiedRecord, ordinalNumber) {
  this.beginTransaction();
  var ordinal = this._virtualServer.newOrdinal(identifiedRecord, ordinalNumber);
  this.endTransaction();
  return ordinal;
};


/**
 * Returns a newly created vote.
 *
 * @scope    protected instance method
 * @param    identifiedRecord    The identifiedRecord to attach this vote to. 
 * @param    retainFlag    True if this is a vote to retain. False if this is a vote to delete. 
 * @return   A newly created vote.
 */
World.prototype._newVote = function(identifiedRecord, retainFlag) {
  this.beginTransaction();
  var vote = this._virtualServer.newVote(identifiedRecord, retainFlag);
  this.endTransaction();
  return vote;
};


/**
 * Given a UUID, returns the item identified by that UUID.
 *
 * @scope    public instance method
 * @param    uuid    The UUID of the item to be returned. 
 * @param    observer    Optional. An object to be registered as an observer of the returned item. 
 * @return   The item identified by the given UUID.
 */
World.prototype.getItemFromUuid = function(uuid, observer) {
  return (this._virtualServer.getItemFromUuid(uuid, observer));
};


// -------------------------------------------------------------------
// Query methods
// -------------------------------------------------------------------

/**
 * Given a query item, this method returns a list of all the items that 
 * match the query criteria.
 *
 * @scope    public instance method
 * @param    query    A query item. 
 * @param    observer    Optional. An object or method to be registered as an observer of the returned item. 
 * @return   A list of items.
 */
World.prototype.getResultItemsForQuery = function(query, observer) {
  var listOfItems = this._virtualServer.getResultItemsForQuery(query);
  this.__addListObserver(listOfItems, observer);
  return listOfItems;
};


/**
 * Given an item and a query item, this method modifies the attributes 
 * of the item so that when the query is next evaluated the item will be 
 * included in query result list.
 *
 * @scope    public instance method
 * @param    item    An item, which will be modified so that it matches the query. 
 * @param    query    A query item. 
 * @throws   Throws an Error if no user is logged in.
 */
World.prototype.setItemToBeIncludedInQueryResultList = function(item, query) {
  this._virtualServer.setItemToBeIncludedInQueryResultList(item, query);
};


/**
 * Given a category, this method returns a list of all the items that have been 
 * assigned to that category.
 *
 * @scope    public instance method
 * @param    category    A category item. 
 * @param    observer    Optional. An object or method to be registered as an observer of the returned item. 
 * @return   A list of items.
 */
World.prototype.getItemsInCategory = function(category, observer) {
  var listOfItems = this._virtualServer.getItemsInCategory(category);
  this.__addListObserver(listOfItems, observer);
  return listOfItems;
};


/**
 * Returns an list of all the items that represent categories.
 *
 * @scope    public instance method
 * @return   A list of items that represent categories.
 */
World.prototype.getCategories = function() {
  var listOfCategories = this._virtualServer.getCategories();
  return this._getFilteredList(listOfCategories);
};


// -------------------------------------------------------------------
// Observer methods
// -------------------------------------------------------------------

/**
 * Registers an object or method as an observer of a list, so that
 * the observer will be notified when items in the list change.
 *
 * PENDING: 
 * Really we should observe queries, not lists of items.  If a change
 * to an item causes it to fall into the query result set, the observers
 * of the query should be notified.
 *
 * @scope    private instance method
 * @param    listOfItems    The list of items to be observed. 
 * @param    observer    An object or method to be registered as an observer of the item. 
 */
World.prototype.__addListObserver = function(listOfItems, observer) {
  var observerWasAdded = false;
  if (!observer) {
    return observerWasAdded;
  }
  var weNeedToMakeANewTupleForThisList = true;
  var listOfTuples = this._listOfListObserverTuples;
  for (var key in listOfTuples) {
    var tuple = listOfTuples[key];
    if (tuple[World.__TUPLE_KEY_LIST] == listOfItems) {
      weNeedToMakeANewTupleForThisList = false;
      var setOfObservers = tuple[World.__TUPLE_KEY_OBSERVERS];
      observerWasAdded = Util.addObjectToSet(observer, setOfObservers);
    }
  }
  if (weNeedToMakeANewTupleForThisList) {
    var newTuple = {};
    newTuple[World.__TUPLE_KEY_LIST] = listOfItems;
    newTuple[World.__TUPLE_KEY_OBSERVERS] = [observer];
    listOfTuples.push(newTuple);
    observerWasAdded = true;
  }
  return observerWasAdded;
};


/**
 * Removes an object or method from the set of observers of a list, so that 
 * the observer will no longer be notified when items in the list change.
 *
 * @scope    public instance method
 * @param    listOfItems    The list of items that was being observed. 
 * @param    observer    The object or method to be removed from the set of observers. 
 */
World.prototype.removeListObserver = function(listOfItems, observer) {
  var observerWasRemoved = false;
  var listOfTuples = this._listOfListObserverTuples;
  for (var key in listOfTuples) {
    var tuple = listOfTuples[key];
    if (tuple[World.__TUPLE_KEY_LIST] == listOfItems) {
      var setOfObservers = tuple[World.__TUPLE_KEY_OBSERVERS];
      observerWasRemoved = Util.removeObjectFromSet(observer, setOfObservers);
    }
  }
  return observerWasRemoved;
};


/**
 * Registers an object or method as an observer of an item, so that
 * the observer will be notified when the item changes.
 *
 * @scope    public instance method
 * @param    item    The item to be observed. 
 * @param    observer    An object or method to be registered as an observer of the item. 
 */
World.prototype.addItemObserver = function(item, observer) {
  var observerList = this._hashTableOfObserverListsKeyedByItemUuid[item._getUuid()];
  if (!observerList) {
    observerList = [];
    this._hashTableOfObserverListsKeyedByItemUuid[item._getUuid()] = observerList;
  }
  var observerWasAdded = Util.addObjectToSet(observer, observerList);
  return observerWasAdded;
};


/**
 * Removes an object or method from the set of observers of an item, so 
 * that the observer will no longer be notified when the item changes.
 *
 * @scope    public instance method
 * @param    item    The item that was being observed. 
 * @param    observer    The object or method to be removed from the set of observers. 
 */
World.prototype.removeItemObserver = function(item, observer) {
  var observerWasRemoved = false;
  var observerList = this._hashTableOfObserverListsKeyedByItemUuid[item._getUuid()];
  if (observerList) {
    observerWasRemoved = Util.removeObjectFromSet(observer, observerList);
  } 
  return observerWasRemoved;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
