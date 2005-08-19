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
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global window */
/*global Util  */
/*global Item, Entry, Ordinal, Vote, ContentRecord  */
/*global QueryRunner  */ 
/*global DeltaVirtualServer  */
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

World.UUID_FOR_USER_AMY                = "00001000-ce7f-11d9-8cd5-0011113ae5d6";

World.UUID_FOR_ATTRIBUTE_NAME                     = "00001001-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_ATTRIBUTE_SHORT_NAME               = "00001002-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_ATTRIBUTE_SUMMARY                  = "00001003-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_ATTRIBUTE_BODY                     = "00001004-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_ATTRIBUTE_CATEGORY                 = "00001005-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_ATTRIBUTE_QUERY_SPEC               = "00001006-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_VALUE     = "00001007-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_ATTRIBUTE = "00001008-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_ATTRIBUTE_UNFILED                  = "00001009-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_ATTRIBUTE_EXPECTED_TYPE            = "0000100a-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_ATTRIBUTE_INVERSE_ATTRIBUTE        = "0000100b-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_ATTRIBUTE_ITEMS_IN_CATEGORY        = "0000100c-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_ATTRIBUTE_TAG                      = "0000100d-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_ATTRIBUTE_TAGGED_ITEMS             = "0000100e-ce7f-11d9-8cd5-0011113ae5d6";

World.UUID_FOR_TYPE_TEXT               = "00001020-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_TYPE_NUMBER             = "00001021-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_TYPE_DATE               = "00001022-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_TYPE_CHECK_MARK         = "00001023-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_TYPE_URL                = "00001024-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_TYPE_ITEM               = "00001030-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_TYPE_ANYTHING           = "00001040-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_TYPE_CONNECTION         = "00001050-ce7f-11d9-8cd5-0011113ae5d6";

World.UUID_FOR_CATEGORY_PERSON         = "00001201-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_CATEGORY_ATTRIBUTE      = "00001210-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_CATEGORY_CATEGORY       = "00001211-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_CATEGORY_QUERY          = "00001212-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_CATEGORY_TYPE           = "00001213-ce7f-11d9-8cd5-0011113ae5d6";
World.UUID_FOR_CATEGORY_TAG            = "00001214-ce7f-11d9-8cd5-0011113ae5d6";


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
  this._hashTableOfObserverListsKeyedByItemUuid = {};
  this._listOfListObserverTuples = [];
  
  this._registeredQueryRunners = [];
  
  this._currentRetrievalFilter = World.RETRIEVAL_FILTER_LAST_EDIT_WINS;

  var server;
  if (virtualServer) {
    server = virtualServer;
  } else {
    // server = new StubVirtualServer();
    var filepath = window.location.pathname;
    var arrayOfSegments = filepath.split('/');
    var lastSegment = arrayOfSegments.pop();
    var arrayWithFilenameAndExtension = lastSegment.split('.');
    var filename = arrayWithFilenameAndExtension[0];
    var repositoryName = filename;
    server = new DeltaVirtualServer(repositoryName);
  }
  this._virtualServer = server;

  server.setWorldAndLoadAxiomaticItems(this);
  
  // load the axiomatic attributes
  this._attributeCalledName                   = server.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_NAME);
  this._attributeCalledShortName              = server.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_SHORT_NAME);
  this._attributeCalledSummary                = server.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_SUMMARY);
  this._attributeCalledCategory               = server.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_CATEGORY);
  this._attributeCalledQuerySpec              = server.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_QUERY_SPEC);
  this._attributeCalledQueryMatchingValue     = server.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_VALUE);
  this._attributeCalledQueryMatchingAttribute = server.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_QUERY_MATCHING_ATTRIBUTE);
  this._attributeCalledUnfiled                = server.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_UNFILED);
  this._attributeCalledExpectedType           = server.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_EXPECTED_TYPE);
  this._attributeCalledInverseAttribute       = server.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_INVERSE_ATTRIBUTE);
  this._attributeCalledItemsInCategory        = server.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_ITEMS_IN_CATEGORY);
  this._attributeCalledTag                    = server.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_TAG);
  this._attributeCalledTaggedItems            = server.getItemFromUuid(World.UUID_FOR_ATTRIBUTE_TAGGED_ITEMS);

  // load the axiomatic types
  this._typeCalledText       = server.getItemFromUuid(World.UUID_FOR_TYPE_TEXT);
  this._typeCalledNumber     = server.getItemFromUuid(World.UUID_FOR_TYPE_NUMBER);
  this._typeCalledDate       = server.getItemFromUuid(World.UUID_FOR_TYPE_DATE);
  this._typeCalledCheckMark  = server.getItemFromUuid(World.UUID_FOR_TYPE_CHECK_MARK);
  this._typeCalledUrl        = server.getItemFromUuid(World.UUID_FOR_TYPE_URL);
  this._typeCalledItem       = server.getItemFromUuid(World.UUID_FOR_TYPE_ITEM);
  this._typeCalledAnything   = server.getItemFromUuid(World.UUID_FOR_TYPE_ANYTHING);
  this._typeCalledConnection = server.getItemFromUuid(World.UUID_FOR_TYPE_CONNECTION);

  // load the axiomatic categories 
  this._categoryCalledPerson      = server.getItemFromUuid(World.UUID_FOR_CATEGORY_PERSON);
  this._categoryCalledAttribute   = server.getItemFromUuid(World.UUID_FOR_CATEGORY_ATTRIBUTE);
  this._categoryCalledCategory    = server.getItemFromUuid(World.UUID_FOR_CATEGORY_CATEGORY);
  this._categoryCalledQuery       = server.getItemFromUuid(World.UUID_FOR_CATEGORY_QUERY);
  this._categoryCalledType        = server.getItemFromUuid(World.UUID_FOR_CATEGORY_TYPE);
  this._categoryCalledTag         = server.getItemFromUuid(World.UUID_FOR_CATEGORY_TAG);
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
  this._virtualServer.beginTransaction();
};
 

/**
 * Marks the end of a transaction.
 *
 * @scope    public instance method
 */
World.prototype.endTransaction = function() {
  this._virtualServer.endTransaction();
};


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
    var listOfItems = [];
    var itemOrPairOfItems = null;
    if (record instanceof Item) {
      listOfItems.push(record);
    }
    if ((record instanceof Vote) || (record instanceof Ordinal)) {
      itemOrEntry = record.getContentRecord();
      if (itemOrEntry instanceof Item) {
        listOfItems.push(itemOrEntry);
      }
      if (itemOrEntry instanceof Entry) {
        itemOrPairOfItems = itemOrEntry.getItem();
      }
    }
    if (record instanceof Entry) {
      itemOrPairOfItems = record.getItem();
    }
    if (itemOrPairOfItems) {
      if (itemOrPairOfItems instanceof Item) {
        listOfItems.push(itemOrPairOfItems); 
      }
      if (Util.isArray(itemOrPairOfItems)) {
        listOfItems.push(itemOrPairOfItems[0]);
        listOfItems.push(itemOrPairOfItems[1]);
      }
    }
    for (var j in listOfItems) {
      item = listOfItems[j];
      listOfRecordsForItem = hashTableOfNewlyCreatedRecordsKeyedByItemUuid[item._getUuid()];
      if (!listOfRecordsForItem) {
        listOfRecordsForItem = [];
        hashTableOfNewlyCreatedRecordsKeyedByItemUuid[item._getUuid()] = listOfRecordsForItem;
      }
      listOfRecordsForItem.push(record);
    }
  }
  
  // For each of the items that was impacted by some changes, 
  // notify that item of the changes.
  for (uuid in hashTableOfNewlyCreatedRecordsKeyedByItemUuid) {
    item = this.getItemFromUuid(uuid);
    listOfRecordsForItem = hashTableOfNewlyCreatedRecordsKeyedByItemUuid[uuid];
    item._noteChanges(listOfRecordsForItem);
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
  for (var iKey in this._listOfListObserverTuples) {
    var observerTuple = this._listOfListObserverTuples[iKey];
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
  
  // Look at all the QueryRunner objects that are registered, and for
  // each of the QueryRunners, notify them of changes they care about.
  for (key in this._registeredQueryRunners) {
    var queryRunner = this._registeredQueryRunners[key];
    var oldListOfResultItems = queryRunner.getResultItems();
    var reportChange = false;
    for (uuid in hashTableOfNewlyCreatedRecordsKeyedByItemUuid) {
      item = this.getItemFromUuid(uuid);
      if (Util.isObjectInSet(item, oldListOfResultItems)) {
        reportChange = true;
        break;
      } else {
        if (queryRunner.doesItemMatch(item)) {
          reportChange = true;
          break;
        }
      }
    }
    
    if (reportChange) {
      queryRunner._resultsHaveChanged();
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

  filteredList.sort(ContentRecord.compareOrdinals);
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

World.prototype.getAttributeCalledQuerySpec = function() {
  return this._attributeCalledQuerySpec;
};

World.prototype.getAttributeCalledQueryMatchingValue = function() {
  return this._attributeCalledQueryMatchingValue;
};

World.prototype.getAttributeCalledQueryMatchingAttribute = function() {
  return this._attributeCalledQueryMatchingAttribute;
};

World.prototype.getAttributeCalledUnfiled = function() {
  return this._attributeCalledUnfiled;
};

World.prototype.getAttributeCalledExpectedType = function() {
  return this._attributeCalledExpectedType;
};

World.prototype.getAttributeCalledInverseAttribute = function() {
  return this._attributeCalledInverseAttribute;
};

World.prototype.getAttributeCalledItemsInCategory = function() {
  return this._attributeCalledItemsInCategory;
};

World.prototype.getAttributeCalledTag = function() {
  return this._attributeCalledTag;
};

World.prototype.getAttributeCalledTaggedItems = function() {
  return this._attributeCalledTaggedItems;
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

World.prototype.getTypeCalledConnection = function() {
  return this._typeCalledConnection;
};


// -------------------------------------------------------------------
// Accessor methods for axiomatic categories
// -------------------------------------------------------------------
World.prototype.getCategoryCalledPerson = function() {
  return this._categoryCalledPerson;
};

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

World.prototype.getCategoryCalledTag = function() {
  return this._categoryCalledTag;
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
  var categoryCalledAttribute = this.getCategoryCalledAttribute();
  item.assignToCategory(categoryCalledAttribute);
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
  var categoryCalledCategory = this.getCategoryCalledCategory();
  item.assignToCategory(categoryCalledCategory);
  this.endTransaction();
  return item;
};


/**
 * Returns a newly created item representing a query.
 *
 * @scope    public instance method
 * @param    matchingAttribute    Attribute to query against
 * @param    matchingEntryOrListOfEntries    an Entry or array of entries to be matched against,  
 * @return   A newly created item representing a query.
 */
World.prototype.newQuery = function(matchingAttribute, matchingEntryOrListOfEntries) {
  Util.assert(matchingAttribute instanceof Item);
  this.beginTransaction();
  var item = this._virtualServer.newItem("A query");
  var categoryCalledQuery = this.getCategoryCalledQuery();
  item.assignToCategory(categoryCalledQuery);

  var attributeCalledQueryMatchingAttribute = this.getAttributeCalledQueryMatchingAttribute();
  var attributeCalledQueryMatchingValue = this.getAttributeCalledQueryMatchingValue();
  var matchingEntry;
  item.addEntryForAttribute(attributeCalledQueryMatchingAttribute, matchingAttribute);
  if (matchingEntryOrListOfEntries) {
    if (Util.isArray(matchingEntryOrListOfEntries)) {
      for (var key in matchingEntryOrListOfEntries) {
        matchingEntry = matchingEntryOrListOfEntries[key];
        item.addEntryForAttribute(attributeCalledQueryMatchingValue, matchingEntry);
      }
    }
    else {
      matchingEntry = matchingEntryOrListOfEntries;
      item.addEntryForAttribute(attributeCalledQueryMatchingValue, matchingEntry);
    }
  }

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
  var attributeCalledCategory = this.getAttributeCalledCategory();
  return this.newQuery(attributeCalledCategory, categoryOrListOfCategories);
};


/**
 * Returns a newly created QueryRunner object.
 *
 * @scope    public instance method
 * @param    querySpec    Optional. A query spec item, or an ad-hoc query. 
 * @param    observer    Optional. An object or method to be registered as an observer of the query. 
 * @return   A newly created QueryRunner object.
 */
World.prototype.newQueryRunner = function(querySpec, observer) {
  var queryRunner = new QueryRunner(this, querySpec, observer);
  return queryRunner;
};


/**
 * Registers a QueryRunner object, so that the QueryRunner will be
 * notified of changes to the repository.
 *
 * @scope    public instance method
 * @param    queryRunner    A QueryRunner object. 
 */
World.prototype._registerQueryRunner = function(queryRunner) {
  Util.assert(queryRunner instanceof QueryRunner);
  var success = Util.addObjectToSet(queryRunner, this._registeredQueryRunners);
  Util.assert(success);
};


/**
 * Unregisters a QueryRunner object, so that the QueryRunner will no 
 * longer be notified of changes to the repository.
 *
 * @scope    public instance method
 * @param    queryRunner    A previously registered QueryRunner object. 
 */
World.prototype._unregisterQueryRunner = function(queryRunner) {
  Util.assert(queryRunner instanceof QueryRunner);
  var success = Util.removeObjectFromSet(queryRunner, this._registeredQueryRunners);
  Util.assert(success);
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
 */
World.prototype._newEntry = function(item, previousEntry, attribute, value, type) {
  this.beginTransaction();
  var entry = this._virtualServer.newEntry(item, previousEntry, attribute, value, type);
  this.endTransaction();
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
 */
World.prototype._newConnectionEntry = function(previousEntry, itemOne, attributeOne, itemTwo, attributeTwo) {
  this.beginTransaction();
  var entry = this._virtualServer.newConnectionEntry(previousEntry, itemOne, attributeOne, itemTwo, attributeTwo);
  this.endTransaction();
  return entry;
};


/**
 * Returns a newly created ordinal.
 *
 * @scope    protected instance method
 * @param    contentRecord    The contentRecord that this is an ordinal for. 
 * @param    ordinalNumber    The ordinal number itself. 
 * @return   A newly created ordinal.
 */
World.prototype._newOrdinal = function(contentRecord, ordinalNumber) {
  this.beginTransaction();
  var ordinal = this._virtualServer.newOrdinal(contentRecord, ordinalNumber);
  this.endTransaction();
  return ordinal;
};


/**
 * Returns a newly created vote.
 *
 * @scope    protected instance method
 * @param    contentRecord    The contentRecord to attach this vote to. 
 * @param    retainFlag    True if this is a vote to retain. False if this is a vote to delete. 
 * @return   A newly created vote.
 */
World.prototype._newVote = function(contentRecord, retainFlag) {
  this.beginTransaction();
  var vote = this._virtualServer.newVote(contentRecord, retainFlag);
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

/**
 * Given a UUID, returns the entry identified by that UUID.
 *
 * @scope    public instance method
 * @param    uuid    The UUID of the item to be returned. 
 * @return   The entry identified by the given UUID.
 */
World.prototype.getEntryFromUuid = function(uuid) {
  return (this._virtualServer.__getEntryFromUuid(uuid));
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
World.prototype.getResultItemsForQueryRunner = function(queryRunner) {
  var listOfItems = this._virtualServer.getResultItemsForQueryRunner(queryRunner);
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
  // listOfItems = this._getFilteredList(listOfItems); PENDING: not sure if I should call this?
  this.__addListObserver(listOfItems, observer);
  return (listOfItems);
};


/**
 * Returns a list of all the items that represent categories.
 *
 * @scope    public instance method
 * @return   A list of items that represent categories.
 */
World.prototype.getCategories = function(observer) {
  var categoryCalledCategory = this.getCategoryCalledCategory();
  return this.getItemsInCategory(categoryCalledCategory, observer);
};

/**
 * Returns a list of all the items that represent attributes.
 *
 * @scope    public instance method
 * @return   A list of items that represent attributes.
 */
World.prototype.getAttributes = function(observer) {
  var categoryCalledAttribute = this.getCategoryCalledAttribute();
  return this.getItemsInCategory(categoryCalledAttribute, observer);
};


/**
 *
 */
World.prototype.getSuggestedItemsForAttribute = function(attribute, observer) {
  var listOfSuggestedItems = [];
  var key;
  var categoryCalledCategory = this.getCategoryCalledCategory();
  // var attributeCalledCategory = this.getAttributeCalledCategory();
  var attributeCalledExpectedType = this.getAttributeCalledExpectedType();
  var listOfExpectedTypeEntries = attribute.getEntriesForAttribute(attributeCalledExpectedType);
  var listOfCategories = [];
  for (key in listOfExpectedTypeEntries) {
    var expectedTypeEntry = listOfExpectedTypeEntries[key];
    var expectedType = expectedTypeEntry.getValue();
    if (expectedType.isInCategory(categoryCalledCategory)) {
      listOfCategories.push(expectedType);
    }
  }
  for (key in listOfCategories) {
    var category = listOfCategories[key];
    var listOfItems = this.getItemsInCategory(category);
    for (var keyToo in listOfItems) {
      var item = listOfItems[keyToo];
      Util.addObjectToSet(item, listOfSuggestedItems);
    }
  }
  this.__addListObserver(listOfSuggestedItems, observer);
  
  // For no suggested items, TablePlugin expects an empty array rather than null 
  return listOfSuggestedItems;
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
