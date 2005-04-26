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

World.UUID_FOR_USER_AMY = 1;

World.UUID_FOR_ATTRIBUTE_UUID = 100;
World.UUID_FOR_ATTRIBUTE_NAME = 102;
World.UUID_FOR_ATTRIBUTE_SHORT_NAME = 101;
World.UUID_FOR_ATTRIBUTE_SUMMARY = 103;
World.UUID_FOR_ATTRIBUTE_BODY = 104;
World.UUID_FOR_ATTRIBUTE_CATEGORY = 105;
World.UUID_FOR_ATTRIBUTE_ORDINAL = 113;
World.UUID_FOR_ATTRIBUTE_USERSTAMP = 106;
World.UUID_FOR_ATTRIBUTE_TIMESTAMP = 107;
World.UUID_FOR_ATTRIBUTE_QUERY = 109;
World.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_CATEGORY = 110;
World.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_ITEM = 111;

World.UUID_FOR_CATEGORY_BOOK = 141;      // here as an example only
World.UUID_FOR_CATEGORY_MOVIE = 142;     // here as an example only
World.UUID_FOR_CATEGORY_ATTRIBUTE = 143;
World.UUID_FOR_CATEGORY_CATEGORY = 144;
World.UUID_FOR_CATEGORY_QUERY = 147;


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
 * @param    inVirtualServer    Optional. The datastore that this world gets its data from. 
 */
function World(inVirtualServer) {
  this.__myCountOfNestedTransactions = 0;
  this.__myHashTableOfObserverListsKeyedByItemUuid = {};
  this.__myListOfListObserverTuples = [];

  this.__myCurrentRetrievalFilter = World.RETRIEVAL_FILTER_LAST_EDIT_WINS;
  if (inVirtualServer) {
    this.__myVirtualServer = inVirtualServer;
  } else {
    this.__myVirtualServer = new StubVirtualServer();
  }
  this.__myVirtualServer.setWorldAndLoadAxiomaticItems(this);
  
  // load the axiomatic attributes
  this.__myAttributeCalledName = this.__myVirtualServer.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_NAME);
  this.__myAttributeCalledShortName = this.__myVirtualServer.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_SHORT_NAME);
  this.__myAttributeCalledSummary = this.__myVirtualServer.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_SUMMARY);
  this.__myAttributeCalledCategory = this.__myVirtualServer.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_CATEGORY);
  // this.__myAttributeCalledOrdinal = this.__myVirtualServer.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_ORDINAL);
  // this.__myAttributeCalledCreationUserstamp = this.__myVirtualServer.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_USERSTAMP);
  // this.__myAttributeCalledCreationTimestamp = this.__myVirtualServer.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_TIMESTAMP);
  this.__myAttributeCalledQuery = this.__myVirtualServer.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_QUERY);

  // load the axiomatic categories
  this.__myCategoryCalledAttribute = this.__myVirtualServer.getItemFromUuid(World.UUID_FOR_CATEGORY_ATTRIBUTE);
  this.__myCategoryCalledCategory = this.__myVirtualServer.getItemFromUuid(World.UUID_FOR_CATEGORY_CATEGORY);
  this.__myCategoryCalledQuery = this.__myVirtualServer.getItemFromUuid(World.UUID_FOR_CATEGORY_QUERY);
}


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
World.prototype.beginTransaction = function () {
  this.__myCountOfNestedTransactions += 1;
  // PENDING:
  //   This is just a stub method for now.  Once we start implementing
  //   support for transactions we'll have to put some real code here.
};
 

/**
 * Marks the end of a transaction.
 *
 * @scope    public instance method
 */
World.prototype.endTransaction = function () {
  this.__myCountOfNestedTransactions -= 1;
  Util.assert(this.__myCountOfNestedTransactions >= 0);
  // PENDING:
  //   This is just a stub method for now.  Once we start implementing
  //   support for transactions we'll have to put some real code here.
  if (this.__myCountOfNestedTransactions === 0) {
    // PENDING: 
    // World.js should not depend on RootView.js like this.
    // Instead, the view code should hand the world a "status display function"
    // that the world can use to display status info.
    var listOfChangesMade = this.__myVirtualServer.saveChangesToServer();
    if (listOfChangesMade.length > 0) {
      Util.displayStatusBlurb(listOfChangesMade.length + " changes made");
      this.__notifyObserversOfChanges(listOfChangesMade);
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
 * @param    inListOfNewlyCreatedRecords    A list of records representing the changes. 
 */
World.prototype.__notifyObserversOfChanges = function (inListOfNewlyCreatedRecords) {
  var hashTableOfNewlyCreatedRecordsKeyedByItemUuid = {};
  var key;
  var uuid;
  var item;
  var observer;
  var itemOrValue;
  var listOfRecordsForItem;
  
  // Look at each of the newly created records to see what item it changes,
  // and build a hash table that divides up the records based on the item
  // being changed, so that we can easily find all the records that impact
  // a given item.
  for (key in inListOfNewlyCreatedRecords) {
    var record = inListOfNewlyCreatedRecords[key];
    item = null;
    if (record instanceof Item) {
      item = record;
    }
    if ((record instanceof Vote) || (record instanceof Ordinal)) {
      itemOrValue = record.getEntry();
      if (itemOrValue instanceof Item) {
        item = itemOrValue;
      }
       if (itemOrValue instanceof Value) {
        item = itemOrValue.getItem();
      }
    }
    if (record instanceof Value) {
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
    var listOfObserversForItem = this.__myHashTableOfObserverListsKeyedByItemUuid[uuid];
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
  for (var ikey in this.__myListOfListObserverTuples) {
    var observerTuple = this.__myListOfListObserverTuples[ikey];
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
World.prototype.getRetrievalFilter = function () {
  return this.__myCurrentRetrievalFilter;
};


/**
 * Sets the retrieval filter that this world will use.
 *
 * @scope    public instance method
 * @param    inFilter    A string constant representing one of the three supported retrieval filters.
 */
World.prototype.setRetrievalFilter = function (inFilter) {
  Util.assert(inFilter == World.RETRIEVAL_FILTER_LAST_EDIT_WINS ||
              inFilter == World.RETRIEVAL_FILTER_SINGLE_USER ||
              inFilter == World.RETRIEVAL_FILTER_DEMOCRATIC ||
              inFilter == World.RETRIEVAL_FILTER_UNABRIDGED);
  this.__myCurrentRetrievalFilter = inFilter;
};


// -------------------------------------------------------------------
// Accessor methods for axiomatic attributes
// -------------------------------------------------------------------
World.prototype.getAttributeCalledName = function () {
  return this.__myAttributeCalledName;
};

World.prototype.getAttributeCalledShortName = function () {
  return this.__myAttributeCalledShortName;
};

World.prototype.getAttributeCalledSummary = function () {
  return this.__myAttributeCalledSummary;
};

World.prototype.getAttributeCalledCategory = function () {
  return this.__myAttributeCalledCategory;
};

World.prototype.getAttributeCalledQuery = function () {
  return this.__myAttributeCalledQuery;
};


// -------------------------------------------------------------------
// Accessor methods for axiomatic categories
// -------------------------------------------------------------------
World.prototype.getCategoryCalledAttribute = function () {
  return this.__myCategoryCalledAttribute;
};

World.prototype.getCategoryCalledCategory = function () {
  return this.__myCategoryCalledCategory;
};

World.prototype.getCategoryCalledQuery = function () {
  return this.__myCategoryCalledQuery;
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
World.prototype.login = function (inUser, inAuthentication) {
  return this.__myVirtualServer.login(inUser, inAuthentication);
};


/**
 * Logs out the current user.
 *
 * @scope    public instance method
 * @return   True if the current user was logged out. False if there was no current user logged in.
 */
World.prototype.logout = function () {
  return this.__myVirtualServer.logout();
};


// -------------------------------------------------------------------
// Methods having to do with users
// -------------------------------------------------------------------

/**
 * Returns an list of all the items that represent users of this datastore.
 *
 * @scope    public instance method
 * @return   A list of items.
 */
World.prototype.getUsers = function () {
  var listOfUsers = this.__myVirtualServer.getUsers();
  var filteredListOfUsers = [];
  var user;
  
  var filter = this.getRetrievalFilter();
  switch (filter) {
    case World.RETRIEVAL_FILTER_LAST_EDIT_WINS:
      for (var key in listOfUsers) {
        user = listOfUsers[key];
        if (!user.hasBeenDeleted()) {
          filteredListOfUsers.push(user);
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
      filteredListOfUsers = listOfUsers;
      break;
    default:
      // We should never get here.  If we get here, it's an error.
      Util.assert(false);
      break;
  }

  filteredListOfUsers.sort(Entry.compareOrdinals);
  return filteredListOfUsers;
};


/**
 * Returns an item representing the user who is currently logged in.
 *
 * @scope    public instance method
 * @return   An item representing the user who is currently logged in.
 */
World.prototype.getCurrentUser = function () {
  return this.__myVirtualServer.getCurrentUser();
};


/**
 * Creates a new item, where the new item represents a user of this datastore.
 *
 * @scope    public instance method
 * @param    inName    A string, which will be assigned to the name attribute of the new item. 
 * @param    inAuthentication    A string which will be used as the login password for the user. 
 * @param    inObserver    Optional. An object or method to be registered as an observer of the returned item. 
 * @return   A newly created item representing a user.
 */
World.prototype.newUser = function (inName, inAuthentication, inObserver) {
  this.beginTransaction();
  var newUser = this.__myVirtualServer.newUser(inName, inAuthentication, inObserver);
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
 * @param    inName    Optional. A string, which will be assigned to the name attribute of the new item. 
 * @param    inObserver    Optional. An object or method to be registered as an observer of the returned item. 
 * @return   A newly created item.
 */
World.prototype.newItem = function (inName, inObserver) {
  this.beginTransaction();
  var item = this.__myVirtualServer.newItem(inName, inObserver);
  this.endTransaction();
  return item;
};


/**
 * Returns a newly created attribute item.
 *
 * @scope    public instance method
 * @param    inName    Optional. A string, which will be assigned to the name attribute of the new item. 
 * @param    inObserver    Optional. An object or method to be registered as an observer of the returned item. 
 * @return   A newly created attribute item.
 */
World.prototype.newAttribute = function (inName, inObserver) {
  this.beginTransaction();
  var item = this.__myVirtualServer.newItem(inName, inObserver);
  var attributeCalledCategory = this.getAttributeCalledCategory();
  var categoryCalledAttribute = this.getCategoryCalledAttribute();
  item.addAttributeValue(attributeCalledCategory, categoryCalledAttribute);
  this.endTransaction();
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
World.prototype._newValue = function (inItemOrValue, inAttribute, inContentData) {
  this.beginTransaction();
  var value = this.__myVirtualServer.newValue(inItemOrValue, inAttribute, inContentData);
  this.endTransaction();
  return value;
};


/**
 * Returns a newly created ordinal.
 *
 * @scope    protected instance method
 * @param    inEntry    The entry that this is an ordinal for. 
 * @param    inOrdinalNumber    The ordinal number itself. 
 * @return   A newly created ordinal.
 */
World.prototype._newOrdinal = function (inEntry, inOrdinalNumber) {
  this.beginTransaction();
  var ordinal = this.__myVirtualServer.newOrdinal(inEntry, inOrdinalNumber);
  this.endTransaction();
  return ordinal;
};


/**
 * Returns a newly created vote.
 *
 * @scope    protected instance method
 * @param    inEntry    The entry to attach this vote to. 
 * @param    inRetainFlag    True if this is a vote to retain. False if this is a vote to delete. 
 * @return   A newly created vote.
 */
World.prototype._newVote = function (inEntry, inRetainFlag) {
  this.beginTransaction();
  var vote = this.__myVirtualServer.newVote(inEntry, inRetainFlag);
  this.endTransaction();
  return vote;
};


/**
 * Given a UUID, returns the item identified by that UUID.
 *
 * @scope    public instance method
 * @param    inUuid    The UUID of the item to be returned. 
 * @param    inObserver    Optional. An object to be registered as an observer of the returned item. 
 * @return   The item identified by the given UUID.
 */
World.prototype.getItemFromUuid = function (inUuid, inObserver) {
  return (this.__myVirtualServer.getItemFromUuid(inUuid, inObserver));
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
 * @param    inObserver    Optional. An object or method to be registered as an observer of the returned item. 
 * @return   A list of items.
 */
World.prototype.getListOfResultItemsForQuery = function (inQuery, inObserver) {
  var listOfItems = this.__myVirtualServer.getListOfResultItemsForQuery(inQuery);
  this.__addListObserver(listOfItems, inObserver);
  return listOfItems;
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
World.prototype.setItemToBeIncludedInQueryResultList = function (inItem, inQuery) {
  this.__myVirtualServer.setItemToBeIncludedInQueryResultList(inItem, inQuery);
};


/**
 * Given a category, this method returns a list of all the items that have been 
 * assigned to that category.
 *
 * @scope    public instance method
 * @param    inCategory    A category item. 
 * @param    inObserver    Optional. An object or method to be registered as an observer of the returned item. 
 * @return   A list of items.
 */
World.prototype.getListOfItemsInCategory = function (inCategory, inObserver) {
  var listOfItems = this.__myVirtualServer.getListOfItemsInCategory(inCategory);
  this.__addListObserver(listOfItems, inObserver);
  return listOfItems;
};


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
 * @param    inList    The list of items to be observed. 
 * @param    inObserver    An object or method to be registered as an observer of the item. 
 */
World.prototype.__addListObserver = function (inList, inObserver) {
  var weNeedToMakeANewTupleForThisList = true;
  var observerWasAdded = false;
  var listOfTuples = this.__myListOfListObserverTuples;
  for (var key in listOfTuples) {
    var tuple = listOfTuples[key];
    if (tuple[World.__TUPLE_KEY_LIST] == inList) {
      weNeedToMakeANewTupleForThisList = false;
      var setOfObservers = tuple[World.__TUPLE_KEY_OBSERVERS];
      observerWasAdded = Util.addObjectToSet(inObserver, setOfObservers);
    }
  }
  if (weNeedToMakeANewTupleForThisList) {
    var newTuple = {};
    newTuple[World.__TUPLE_KEY_LIST] = inList;
    newTuple[World.__TUPLE_KEY_OBSERVERS] = [inObserver];
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
 * @param    inList    The list of items that was being observed. 
 * @param    inObserver    The object or method to be removed from the set of observers. 
 */
World.prototype.removeListObserver = function (inList, inObserver) {
  var observerWasRemoved = false;
  var listOfTuples = this.__myListOfListObserverTuples;
  for (var key in listOfTuples) {
    var tuple = listOfTuples[key];
    if (tuple[World.__TUPLE_KEY_LIST] == inList) {
      var setOfObservers = tuple[World.__TUPLE_KEY_OBSERVERS];
      observerWasRemoved = Util.removeObjectFromSet(inObserver, setOfObservers);
    }
  }
  return observerWasRemoved;
};


/**
 * Registers an object or method as an observer of an item, so that
 * the observer will be notified when the item changes.
 *
 * @scope    public instance method
 * @param    inItem    The item to be observed. 
 * @param    inObserver    An object or method to be registered as an observer of the item. 
 */
World.prototype.addItemObserver = function (inItem, inObserver) {
  var observerList = this.__myHashTableOfObserverListsKeyedByItemUuid[inItem._getUuid()];
  if (!observerList) {
    observerList = [];
    this.__myHashTableOfObserverListsKeyedByItemUuid[inItem._getUuid()] = observerList;
  }
  var observerWasAdded = Util.addObjectToSet(inObserver, observerList);
  return observerWasAdded;
};


/**
 * Removes an object or method from the set of observers of an item, so 
 * that the observer will no longer be notified when the item changes.
 *
 * @scope    public instance method
 * @param    inItem    The item that was being observed. 
 * @param    inObserver    The object or method to be removed from the set of observers. 
 */
World.prototype.removeItemObserver = function (inItem, inObserver) {
  var observerWasRemoved = false;
  var observerList = this.__myHashTableOfObserverListsKeyedByItemUuid[inItem._getUuid()];
  if (observerList) {
    observerWasRemoved = Util.removeObjectFromSet(inObserver, observerList);
  } 
  return observerWasRemoved;
};


// -------------------------------------------------------------------
// Code that should move up into the view layer
// -------------------------------------------------------------------

World.UUID_FOR_ATTRIBUTE_SECTION = 108;
World.UUID_FOR_ATTRIBUTE_PLUGIN_NAME = 112;

World.UUID_FOR_CATEGORY_PAGE = 145;
World.UUID_FOR_CATEGORY_SECTION = 146;

World.UUID_FOR_HOME_PAGE = 2000;

/**
 * Returns the page item to be used as the home page.
 *
 * @scope    public instance method
 * @return   A page item.
 */
// PENDING: 
// We should move this method up into the view code.
// It shouldn't be down here in the model layer.
World.prototype.getHomePage = function () {
  return this.getItemFromUuid(World.UUID_FOR_HOME_PAGE);
};


/**
 * Returns true if the given value is a function.
 *
 * @scope    public class method
 * @param    inValue    Any object or literal value. 
 * @return   A boolean value. True if inValue is a function.
 */
// PENDING: 
// Need to move this up into Util.js.
Util.isFunction = function (inValue) {
  return ((typeof inValue) == "function");
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
