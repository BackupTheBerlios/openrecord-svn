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
// Provides and Requires
// -------------------------------------------------------------------
dojo.provide("orp.model.World");
dojo.require("orp.archive.DeltaArchive");
dojo.require("orp.model.QueryRunner");
dojo.require("orp.model.Vote");
dojo.require("orp.model.Ordinal");
dojo.require("dojo.lang.*");
dojo.require("orp.lang.Lang");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global window */
/*global Util  */
/*global Item, Entry, Ordinal, Vote, ContentRecord  */
/*global QueryRunner  */ 
/*global DeltaArchive  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------
/**
 * The World class represents a "world" of items.
 *
 * When the view code works with items, it accesses the items through the
 * context of a "world".  Items exist within a world.  Users can login to
 * a world to edit the items there.
 *
 * @scope    public instance constructor
 * @param    archive    Optional. The orp.archive that this world gets its data from. 
 */
orp.model.World = function(archive) {
  this._hashTableOfObserverListsKeyedByItemUuid = {};
  this._listOfListObserverTuples = [];
  
  this._registeredQueryRunners = [];
  this._currentRetrievalFilter = "RETRIEVAL_FILTER_LAST_EDIT_WINS";

  if (archive) {
    this._archive = archive;
  } else {
    var filepath = window.location.pathname;
    var arrayOfSegments = filepath.split('/');
    var lastSegment = arrayOfSegments.pop();
    var arrayWithFilenameAndExtension = lastSegment.split('.');
    var filename = arrayWithFilenameAndExtension[0];
    var repositoryName = filename;
    this._archive = new orp.archive.DeltaArchive(repositoryName);
  }

  this._archive.setWorldAndLoadAxiomaticItems(this);
  this._loadAxiomaticItems();
  
  // FIXME: this is a hack
  if (this._archive.loadRepository) {
    this._archive.loadRepository();
  }
};


// -------------------------------------------------------------------
// Public constants
// -------------------------------------------------------------------
orp.model.World.RetrievalFilter = {
  LAST_EDIT_WINS: "RETRIEVAL_FILTER_LAST_EDIT_WINS",
  SINGLE_USER:    "RETRIEVAL_FILTER_SINGLE_USER",
  DEMOCRATIC:     "RETRIEVAL_FILTER_DEMOCRATIC",
  UNABRIDGED:     "RETRIEVAL_FILTER_UNABRIDGED" };

orp.model.World.UUID = {
  // NULL:                        "00000000-ce7f-11d9-8cd5-0011113ae5d6",
  // IDENTITY:                    "00000001-ce7f-11d9-8cd5-0011113ae5d6",

  USER_AMY_GOD:                       "00001000-ce7f-11d9-8cd5-0011113ae5d6",
  USER_PLUGIN_GOD:                    "00001800-65f4-11da-ba24-0011111f4abe",

  ATTRIBUTE_NAME:                     "00001001-ce7f-11d9-8cd5-0011113ae5d6",
  ATTRIBUTE_SHORT_NAME:               "00001002-ce7f-11d9-8cd5-0011113ae5d6",
  ATTRIBUTE_SUMMARY:                  "00001003-ce7f-11d9-8cd5-0011113ae5d6",
  ATTRIBUTE_CONTENT:                  "00001004-ce7f-11d9-8cd5-0011113ae5d6",
  ATTRIBUTE_CATEGORY:                 "00001005-ce7f-11d9-8cd5-0011113ae5d6",
  ATTRIBUTE_QUERY_SPEC:               "00001006-ce7f-11d9-8cd5-0011113ae5d6", // not general purpose
  ATTRIBUTE_QUERY_MATCHING_VALUE:     "00001007-ce7f-11d9-8cd5-0011113ae5d6", // not general purpose 
  ATTRIBUTE_QUERY_MATCHING_ATTRIBUTE: "00001008-ce7f-11d9-8cd5-0011113ae5d6", // not general purpose
  ATTRIBUTE_UNFILED:                  "00001009-ce7f-11d9-8cd5-0011113ae5d6", // not general purpose
  ATTRIBUTE_EXPECTED_TYPE:            "0000100a-ce7f-11d9-8cd5-0011113ae5d6", // not general purpose
  ATTRIBUTE_INVERSE_ATTRIBUTE:        "0000100b-ce7f-11d9-8cd5-0011113ae5d6", // not general purpose
  ATTRIBUTE_ITEMS_IN_CATEGORY:        "0000100c-ce7f-11d9-8cd5-0011113ae5d6", // not general purpose
  ATTRIBUTE_TAG:                      "0000100d-ce7f-11d9-8cd5-0011113ae5d6",
  ATTRIBUTE_TAGGED_ITEMS:             "0000100e-ce7f-11d9-8cd5-0011113ae5d6", // not general purpose
  ATTRIBUTE_CLASS_NAME:               "0000100f-ce7f-11d9-8cd5-0011113ae5d6", // not general purpose
  ATTRIBUTE_DEVELOPER_MODE:           "00001025-ce7f-11d9-8cd5-0011113ae5d6", // not general purpose

  // see also:
  //   orp.TablePlugin.UUID = {ATTRIBUTE_TABLE_COLUMNS: "0004010a-ce7f-11d9-8cd5-0011113ae5d6" };
  //   orp.view.EntryView.UUID = {ATTRIBUTE_NOT_LOZENGE: "0004010f-ce7f-11d9-8cd5-0011113ae5d6" };
  //   orp.view.PageView.UUID = {
  //     ATTRIBUTE_SECTIONS_IN_PAGE:             "00030000-ce7f-11d9-8cd5-0011113ae5d6",
  //     ATTRIBUTE_PAGE_THIS_SECTION_APPEARS_ON: "00030001-ce7f-11d9-8cd5-0011113ae5d6" };
  //   orp.view.SectionView.UUID = {
  //     ATTRIBUTE_PLUGIN_VIEW:       "00040101-ce7f-11d9-8cd5-0011113ae5d6",
  //     ATTRIBUTE_LAYOUT_DATA:       "00040102-ce7f-11d9-8cd5-0011113ae5d6",
  //     ATTRIBUTE_APPLIES_TO_PLUGIN: "00040103-ce7f-11d9-8cd5-0011113ae5d6",
  //     ATTRIBUTE_SECTION_THIS_LAYOUT_DATA_BELONGS_TO: "00040104-ce7f-11d9-8cd5-0011113ae5d6",
  //     ATTRIBUTE_SECTION_THIS_QUERY_BELONGS_TO: "00040105-ce7f-11d9-8cd5-0011113ae5d6",

  //   orp.view.SectionView.UUID = {
  //     CATEGORY_PLUGIN_VIEW:        "00040201-ce7f-11d9-8cd5-0011113ae5d6",
  //     CATEGORY_LAYOUT_DATA:        "00040202-ce7f-11d9-8cd5-0011113ae5d6" };
  //   orp.view.RootView.UUID = {
  //     CATEGORY_PAGE:    "00020000-ce7f-11d9-8cd5-0011113ae5d6",
  //     CATEGORY_SECTION: "00020100-ce7f-11d9-8cd5-0011113ae5d6" };
  
  
  // FIXME: 
  // we should change these UUID prefixes from "000010" to "000011"
  // but that will break existing repositories
  TYPE_TEXT:               "00001020-ce7f-11d9-8cd5-0011113ae5d6",
  TYPE_NUMBER:             "00001021-ce7f-11d9-8cd5-0011113ae5d6",
  TYPE_DATE:               "00001022-ce7f-11d9-8cd5-0011113ae5d6",
  TYPE_CHECK_MARK:         "00001023-ce7f-11d9-8cd5-0011113ae5d6",
  TYPE_URL:                "00001024-ce7f-11d9-8cd5-0011113ae5d6",
  TYPE_ITEM:               "00001030-ce7f-11d9-8cd5-0011113ae5d6",
  TYPE_ANYTHING:           "00001040-ce7f-11d9-8cd5-0011113ae5d6",
  TYPE_CONNECTION:         "00001050-ce7f-11d9-8cd5-0011113ae5d6",

  CATEGORY_PERSON:         "00001201-ce7f-11d9-8cd5-0011113ae5d6",
  CATEGORY_ATTRIBUTE:      "00001210-ce7f-11d9-8cd5-0011113ae5d6",   // not general purpose
  CATEGORY_CATEGORY:       "00001211-ce7f-11d9-8cd5-0011113ae5d6",   // not general purpose
  CATEGORY_QUERY:          "00001212-ce7f-11d9-8cd5-0011113ae5d6",   // not general purpose
  CATEGORY_TYPE:           "00001213-ce7f-11d9-8cd5-0011113ae5d6",   // not general purpose
  CATEGORY_TAG:            "00001214-ce7f-11d9-8cd5-0011113ae5d6",   // not general purpose
  CATEGORY_NOT_GENERAL_PURPOSE:   "00001215-ce7f-11d9-8cd5-0011113ae5d6"};  // not general purpose


// -------------------------------------------------------------------
// Private constants
// -------------------------------------------------------------------
orp.model.World._TUPLE_KEY_LIST = "list";
orp.model.World._TUPLE_KEY_OBSERVERS = "observers";


/**
 * Initialized the World's private instance variables to point to all
 * axiomatic attributes, types, and categories.
 *
 * @scope    private instance method
 */
orp.model.World.prototype._loadAxiomaticItems = function() {
  var UUID = orp.model.World.UUID;
  var server = this._archive;

  // load the axiomatic attributes
  this._attributeCalledName                   = server.getItemFromUuid(UUID.ATTRIBUTE_NAME);
  this._attributeCalledShortName              = server.getItemFromUuid(UUID.ATTRIBUTE_SHORT_NAME);
  this._attributeCalledSummary                = server.getItemFromUuid(UUID.ATTRIBUTE_SUMMARY);
  this._attributeCalledCategory               = server.getItemFromUuid(UUID.ATTRIBUTE_CATEGORY);
  this._attributeCalledQuerySpec              = server.getItemFromUuid(UUID.ATTRIBUTE_QUERY_SPEC);
  this._attributeCalledQueryMatchingValue     = server.getItemFromUuid(UUID.ATTRIBUTE_QUERY_MATCHING_VALUE);
  this._attributeCalledQueryMatchingAttribute = server.getItemFromUuid(UUID.ATTRIBUTE_QUERY_MATCHING_ATTRIBUTE);
  this._attributeCalledUnfiled                = server.getItemFromUuid(UUID.ATTRIBUTE_UNFILED);
  this._attributeCalledExpectedType           = server.getItemFromUuid(UUID.ATTRIBUTE_EXPECTED_TYPE);
  this._attributeCalledInverseAttribute       = server.getItemFromUuid(UUID.ATTRIBUTE_INVERSE_ATTRIBUTE);
  this._attributeCalledItemsInCategory        = server.getItemFromUuid(UUID.ATTRIBUTE_ITEMS_IN_CATEGORY);
  this._attributeCalledTag                    = server.getItemFromUuid(UUID.ATTRIBUTE_TAG);
  this._attributeCalledTaggedItems            = server.getItemFromUuid(UUID.ATTRIBUTE_TAGGED_ITEMS);
  this._attributeCalledClassName              = server.getItemFromUuid(UUID.ATTRIBUTE_CLASS_NAME);
  this._attributeCalledDeveloperMode          = server.getItemFromUuid(UUID.ATTRIBUTE_DEVELOPER_MODE);

  // load the axiomatic types
  this._typeCalledText       = server.getItemFromUuid(UUID.TYPE_TEXT);
  this._typeCalledNumber     = server.getItemFromUuid(UUID.TYPE_NUMBER);
  this._typeCalledDate       = server.getItemFromUuid(UUID.TYPE_DATE);
  this._typeCalledCheckMark  = server.getItemFromUuid(UUID.TYPE_CHECK_MARK);
  this._typeCalledUrl        = server.getItemFromUuid(UUID.TYPE_URL);
  this._typeCalledItem       = server.getItemFromUuid(UUID.TYPE_ITEM);
  this._typeCalledAnything   = server.getItemFromUuid(UUID.TYPE_ANYTHING);
  this._typeCalledConnection = server.getItemFromUuid(UUID.TYPE_CONNECTION);

  // load the axiomatic categories 
  this._categoryCalledPerson      = server.getItemFromUuid(UUID.CATEGORY_PERSON);
  this._categoryCalledAttribute   = server.getItemFromUuid(UUID.CATEGORY_ATTRIBUTE);
  this._categoryCalledCategory    = server.getItemFromUuid(UUID.CATEGORY_CATEGORY);
  this._categoryCalledQuery       = server.getItemFromUuid(UUID.CATEGORY_QUERY);
  this._categoryCalledType        = server.getItemFromUuid(UUID.CATEGORY_TYPE);
  this._categoryCalledTag         = server.getItemFromUuid(UUID.CATEGORY_TAG);
  this._categoryCalledNotGeneralPurpose = server.getItemFromUuid(UUID.CATEGORY_NOT_GENERAL_PURPOSE);
  
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
orp.model.World.prototype.beginTransaction = function() {
  this._archive.beginTransaction();
};
 

/**
 * Marks the end of a transaction.
 *
 * @scope    public instance method
 */
orp.model.World.prototype.endTransaction = function() {
  this._archive.endTransaction();
};


/**
 * Sends notification messages to registered observers to let them know 
 * about any new changes to items or lists that they're observers of.
 *
 * @scope    private instance method
 * @param    listOfNewlyCreatedRecords    A list of records representing the changes. 
 */
orp.model.World.prototype._notifyObserversOfChanges = function(listOfNewlyCreatedRecords) {
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
    if (record instanceof orp.model.Item) {
      listOfItems.push(record);
    }
    if ((record instanceof orp.model.Vote) || (record instanceof orp.model.Ordinal)) {
      itemOrEntry = record.getContentRecord();
      if (itemOrEntry instanceof orp.model.Item) {
        listOfItems.push(itemOrEntry);
      }
      if (itemOrEntry instanceof orp.model.Entry) {
        itemOrPairOfItems = itemOrEntry.getItem();
      }
    }
    if (record instanceof orp.model.Entry) {
      itemOrPairOfItems = record.getItem();
    }
    if (itemOrPairOfItems) {
      if (itemOrPairOfItems instanceof orp.model.Item) {
        listOfItems.push(itemOrPairOfItems); 
      }
      if (dojo.lang.isArray(itemOrPairOfItems)) {
        listOfItems.push(itemOrPairOfItems[0]);
        listOfItems.push(itemOrPairOfItems[1]);
      }
    }
    for (var j in listOfItems) {
      item = listOfItems[j];
      listOfRecordsForItem = hashTableOfNewlyCreatedRecordsKeyedByItemUuid[item.getUuid()];
      if (!listOfRecordsForItem) {
        listOfRecordsForItem = [];
        hashTableOfNewlyCreatedRecordsKeyedByItemUuid[item.getUuid()] = listOfRecordsForItem;
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
      if (dojo.lang.isFunction(observer)) {
        observer.call(null, item, listOfRecordsForItem);
      } else {
        if (dojo.lang.isObject(observer)) {
          observer.observedItemHasChanged(item, listOfRecordsForItem);
        } else {
          // We should never get here.  If we do, consider it an error.
          orp.lang.assert(false);
        }
      }
    }
  }
  
  // Look at all the observers who have registered interest in a 
  // list of items rather than in an individual item.  For each of
  // those observers, notify them of all the changes to all the items.
  for (var iKey in this._listOfListObserverTuples) {
    var observerTuple = this._listOfListObserverTuples[iKey];
    var listBeingObserved = observerTuple[orp.model.World._TUPLE_KEY_LIST];
    var setOfObservers = observerTuple[orp.model.World._TUPLE_KEY_OBSERVERS];
    var listOfItemChangeReports = null;
    for (key in listBeingObserved) {
      item = listBeingObserved[key];
      var changes = hashTableOfNewlyCreatedRecordsKeyedByItemUuid[item.getUuid()];
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
        if (dojo.lang.isFunction(observer)) {
          observer.call(null, listBeingObserved, listOfItemChangeReports);
        } else {
          if (dojo.lang.isObject(observer)) {
            observer.observedListHasChanged(listBeingObserved, listOfItemChangeReports);
          } else {
            // We should never get here.  If we do, consider it an error.
            orp.lang.assert(false);
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
      if (orp.util.isObjectInSet(item, oldListOfResultItems)) {
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
orp.model.World.prototype.getRetrievalFilter = function() {
  return this._currentRetrievalFilter;
};


/**
 * Sets the retrieval filter that this world will use.
 *
 * @scope    public instance method
 * @param    filter    A string constant representing one of the three supported retrieval filters.
 */
orp.model.World.prototype.setRetrievalFilter = function(filter) {
  orp.lang.assert(filter == orp.model.World.RetrievalFilter.LAST_EDIT_WINS ||
              filter == orp.model.World.RetrievalFilter.SINGLE_USER ||
              filter == orp.model.World.RetrievalFilter.DEMOCRATIC ||
              filter == orp.model.World.RetrievalFilter.UNABRIDGED);
  this._currentRetrievalFilter = filter;
};


/**
 * Given a list of items, returns a filtered list based on the
 * retrieval filter currently set for this world.
 *
 * @scope    public instance method
 * @return   A list of items that made it through the filter.
 */
orp.model.World.prototype._getFilteredList = function(unfilteredList) {
  var filteredList = [];
  var item;
  
  var filter = this.getRetrievalFilter();
  switch (filter) {
    case orp.model.World.RetrievalFilter.LAST_EDIT_WINS:
      for (var key in unfilteredList) {
        item = unfilteredList[key];
        if (!item.hasBeenDeleted()) {
          filteredList.push(item);
        }
      }
      break;
    case orp.model.World.RetrievalFilter.SINGLE_USER:
      // PENDING: This still needs to be implemented.
      orp.lang.assert(false);
      break;
    case orp.model.World.RetrievalFilter.DEMOCRATIC:
      // PENDING: This still needs to be implemented.
      orp.lang.assert(false);
      break;
    case orp.model.World.RetrievalFilter.UNABRIDGED:
      filteredList = unfilteredList;
      break;
    default:
      // We should never get here.  If we get here, it's an error.
      orp.lang.assert(false);
      break;
  }

  filteredList.sort(orp.model.ContentRecord.compareOrdinals);
  return filteredList;
};


// -------------------------------------------------------------------
// Accessor methods for axiomatic attributes
// -------------------------------------------------------------------
orp.model.World.prototype.getAttributeCalledName = function() {
  return this._attributeCalledName;
};

orp.model.World.prototype.getAttributeCalledShortName = function() {
  return this._attributeCalledShortName;
};

orp.model.World.prototype.getAttributeCalledSummary = function() {
  return this._attributeCalledSummary;
};

orp.model.World.prototype.getAttributeCalledCategory = function() {
  return this._attributeCalledCategory;
};

orp.model.World.prototype.getAttributeCalledQuerySpec = function() {
  return this._attributeCalledQuerySpec;
};

orp.model.World.prototype.getAttributeCalledQueryMatchingValue = function() {
  return this._attributeCalledQueryMatchingValue;
};

orp.model.World.prototype.getAttributeCalledQueryMatchingAttribute = function() {
  return this._attributeCalledQueryMatchingAttribute;
};

orp.model.World.prototype.getAttributeCalledUnfiled = function() {
  return this._attributeCalledUnfiled;
};

orp.model.World.prototype.getAttributeCalledExpectedType = function() {
  return this._attributeCalledExpectedType;
};

orp.model.World.prototype.getAttributeCalledInverseAttribute = function() {
  return this._attributeCalledInverseAttribute;
};

orp.model.World.prototype.getAttributeCalledItemsInCategory = function() {
  return this._attributeCalledItemsInCategory;
};

orp.model.World.prototype.getAttributeCalledTag = function() {
  return this._attributeCalledTag;
};

orp.model.World.prototype.getAttributeCalledTaggedItems = function() {
  return this._attributeCalledTaggedItems;
};

orp.model.World.prototype.getAttributeCalledClassName = function() {
  return this._attributeCalledClassName;
};

orp.model.World.prototype.getAttributeCalledDeveloperMode = function() {
  return this._attributeCalledDeveloperMode;
};


// -------------------------------------------------------------------
// Accessor methods for axiomatic categories
// -------------------------------------------------------------------
orp.model.World.prototype.getTypeCalledText = function() {
  return this._typeCalledText;
};

orp.model.World.prototype.getTypeCalledNumber = function() {
  return this._typeCalledNumber;
};

orp.model.World.prototype.getTypeCalledDate = function() {
  return this._typeCalledDate;
};

orp.model.World.prototype.getTypeCalledCheckMark = function() {
  return this._typeCalledCheckMark;
};

orp.model.World.prototype.getTypeCalledUrl = function() {
  return this._typeCalledUrl;
};

orp.model.World.prototype.getTypeCalledItem = function() {
  return this._typeCalledItem;
};

orp.model.World.prototype.getTypeCalledAnything = function() {
  return this._typeCalledAnything;
};

orp.model.World.prototype.getTypeCalledConnection = function() {
  if (!this._typeCalledConnection) {
    this._typeCalledConnection = this._archive.getItemFromUuid(orp.model.World.UUID.TYPE_CONNECTION);
  }
  return this._typeCalledConnection;
};


// -------------------------------------------------------------------
// Accessor methods for axiomatic categories
// -------------------------------------------------------------------
orp.model.World.prototype.getCategoryCalledPerson = function() {
  return this._categoryCalledPerson;
};

orp.model.World.prototype.getCategoryCalledAttribute = function() {
  return this._categoryCalledAttribute;
};

orp.model.World.prototype.getCategoryCalledCategory = function() {
  return this._categoryCalledCategory;
};

orp.model.World.prototype.getCategoryCalledQuery = function() {
  return this._categoryCalledQuery;
};

orp.model.World.prototype.getCategoryCalledType = function() {
  return this._categoryCalledType;
};

orp.model.World.prototype.getCategoryCalledTag = function() {
  return this._categoryCalledTag;
};

orp.model.World.prototype.getCategoryCalledNotGeneralPurpose = function() {
  return this._categoryCalledNotGeneralPurpose;
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
orp.model.World.prototype.login = function(user, authentication) {
  return this._archive.login(user, authentication);
};


/**
 * Logs out the current user.
 *
 * @scope    public instance method
 * @return   True if the current user was logged out. False if there was no current user logged in.
 */
orp.model.World.prototype.logout = function() {
  return this._archive.logout();
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
orp.model.World.prototype.getUsers = function() {
  var listOfUsers = this._archive.getUsers();
  return this._getFilteredList(listOfUsers);
};


/**
 * Returns an item representing the user who is currently logged in.
 *
 * @scope    public instance method
 * @return   An item representing the user who is currently logged in.
 */
orp.model.World.prototype.getCurrentUser = function() {
  return this._archive.getCurrentUser();
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
orp.model.World.prototype.newUser = function(name, authentication, observer) {
  this.beginTransaction();
  var newUser = this._archive.newUser(name, authentication, observer);
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
orp.model.World.prototype.newItem = function(name, observer) {
  this.beginTransaction();
  var item = this._archive.newItem(name, observer);
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
orp.model.World.prototype.newProvisionalItem = function(observer) {
  return this._archive.newProvisionalItem(observer);
};


/**
 * Records the fact that a provisional item just became real.
 *
 * @scope    package instance method
 * @param    item    The item that was provisional and just became real. 
 */
orp.model.World.prototype._provisionalItemJustBecameReal = function(item) {
  this._archive._provisionalItemJustBecameReal(item);
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
orp.model.World.prototype.newAttribute = function(name, observer) {
  this.beginTransaction();
  var item = this._archive.newItem(name, observer);
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
orp.model.World.prototype.newCategory = function(name, observer) {
  this.beginTransaction();
  var item = this._archive.newItem(name, observer);
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
orp.model.World.prototype.newQuery = function(matchingAttribute, matchingEntryOrListOfEntries) {
  orp.lang.assert(matchingAttribute instanceof orp.model.Item);
  this.beginTransaction();
  var item = this._archive.newItem("A query");
  var categoryCalledQuery = this.getCategoryCalledQuery();
  item.assignToCategory(categoryCalledQuery);

  var attributeCalledQueryMatchingAttribute = this.getAttributeCalledQueryMatchingAttribute();
  var attributeCalledQueryMatchingValue = this.getAttributeCalledQueryMatchingValue();
  var matchingEntry;
  item.addEntry({attribute:attributeCalledQueryMatchingAttribute, value:matchingAttribute});
  if (matchingEntryOrListOfEntries) {
    if (dojo.lang.isArray(matchingEntryOrListOfEntries)) {
      for (var key in matchingEntryOrListOfEntries) {
        matchingEntry = matchingEntryOrListOfEntries[key];
        item.addEntry({attribute:attributeCalledQueryMatchingValue, value:matchingEntry});
      }
    } else {
      matchingEntry = matchingEntryOrListOfEntries;
      item.addEntry({attribute:attributeCalledQueryMatchingValue, value:matchingEntry});
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
orp.model.World.prototype.newQueryForItemsByCategory = function(categoryOrListOfCategories) {
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
orp.model.World.prototype.newQueryRunner = function(querySpec, observer) {
  var queryRunner = new orp.model.QueryRunner(this, querySpec, observer);
  return queryRunner;
};


/**
 * Registers a QueryRunner object, so that the QueryRunner will be
 * notified of changes to the repository.
 *
 * @scope    public instance method
 * @param    queryRunner    A QueryRunner object. 
 */
orp.model.World.prototype._registerQueryRunner = function(queryRunner) {
  orp.lang.assert(queryRunner instanceof orp.model.QueryRunner);
  var success = orp.util.addObjectToSet(queryRunner, this._registeredQueryRunners);
  orp.lang.assert(success);
};


/**
 * Unregisters a QueryRunner object, so that the QueryRunner will no 
 * longer be notified of changes to the repository.
 *
 * @scope    public instance method
 * @param    queryRunner    A previously registered QueryRunner object. 
 */
orp.model.World.prototype._unregisterQueryRunner = function(queryRunner) {
  orp.lang.assert(queryRunner instanceof orp.model.QueryRunner);
  var success = orp.util.removeObjectFromSet(queryRunner, this._registeredQueryRunners);
  orp.lang.assert(success);
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
orp.model.World.prototype._newEntry = function(item, previousEntry, attribute, value, type) {
  this.beginTransaction();
  var entry = this._archive.newEntry(item, previousEntry, attribute, value, type);
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
orp.model.World.prototype._newConnectionEntry = function(previousEntry, itemOne, attributeOne, itemTwo, attributeTwo) {
  this.beginTransaction();
  var entry = this._archive.newConnectionEntry(previousEntry, itemOne, attributeOne, itemTwo, attributeTwo);
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
orp.model.World.prototype._newOrdinal = function(contentRecord, ordinalNumber) {
  this.beginTransaction();
  var ordinal = this._archive.newOrdinal(contentRecord, ordinalNumber);
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
orp.model.World.prototype._newVote = function(contentRecord, retainFlag) {
  this.beginTransaction();
  var vote = this._archive.newVote(contentRecord, retainFlag);
  this.endTransaction();
  return vote;
};


/**
 * Given a UUID, returns the item identified by that UUID.
 *
 * @scope    public instance method
 * @param    uuid    The UUID of the item to be returned. 
 * @param    observer    Optional. An object to be registered as an observer of the returned item. 
 * @return   Returns he item identified by the given UUID, or returns undefined if there is no item for that UUID.
 */
orp.model.World.prototype.getItemFromUuid = function(uuid, observer) {
  return (this._archive.getItemFromUuid(uuid, observer));
};


/**
 * Given a UUID, returns the entry identified by that UUID.
 *
 * @scope    public instance method
 * @param    uuid    The UUID of the item to be returned. 
 * @return   Returns the entry identified by the given UUID, or returns undefined if there is no item for that UUID.
 */
orp.model.World.prototype.getEntryFromUuid = function(uuid) {
  return (this._archive._getEntryFromUuid(uuid));
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
orp.model.World.prototype.getResultItemsForQueryRunner = function(queryRunner) {
  var listOfItems = this._archive.getResultItemsForQueryRunner(queryRunner);
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
orp.model.World.prototype.setItemToBeIncludedInQueryResultList = function(item, query) {
  this._archive.setItemToBeIncludedInQueryResultList(item, query);
};


/**
 * Given a category, this method returns a list of all the items that have been 
 * assigned to that category.
 *
 * @scope    public instance method
 * @param    category    A category item. 
 * @param    observer    Optional. An object or method to be registered as an observer of the returned item. 
 * @param    filterOutNonGeneralPurposeItems    Optional. Boolean. 
 * @return   A list of items.
 */
orp.model.World.prototype.getItemsInCategory = function(category, observer, filterOutNonGeneralPurposeItems) {
  var listOfItems = this._archive.getItemsInCategory(category);
  var returnList;
  if (filterOutNonGeneralPurposeItems) {
    var currentUser = this.getCurrentUser();
    var attributeCalledDeveloperMode = this.getAttributeCalledDeveloperMode();
    var inDeveloperMode = (currentUser.getSingleValueFromAttribute(attributeCalledDeveloperMode) == "true"); // FIXME
    var categoryCalledNotGeneralPurpose = this.getCategoryCalledNotGeneralPurpose();
    if (inDeveloperMode) {
      returnList = listOfItems;
    } else {
      returnList = [];
      for (var i in listOfItems) {
        var item = listOfItems[i];
        var itemIsGeneralPurpose = !(item.isInCategory(categoryCalledNotGeneralPurpose));
        if (itemIsGeneralPurpose) {
          returnList.push(item);
        }
      }
    }
  } else {
    returnList = listOfItems;
  }
  this._addListObserver(returnList, observer);
  return (returnList);
};


/**
 * Returns a list of all the items that represent categories.
 *
 * @scope    public instance method
 * @return   A list of items that represent categories.
 */
orp.model.World.prototype.getCategories = function(observer) {
  var categoryCalledCategory = this.getCategoryCalledCategory();
  return this.getItemsInCategory(categoryCalledCategory, observer);
};


/**
 * Returns a list of all the items that represent attributes.
 *
 * @scope    public instance method
 * @return   A list of items that represent attributes.
 */
orp.model.World.prototype.getAttributes = function(observer) {
  var categoryCalledAttribute = this.getCategoryCalledAttribute();
  var filterOutNonGeneralPurposeItems = true;
  return this.getItemsInCategory(categoryCalledAttribute, observer, filterOutNonGeneralPurposeItems);
};


/**
 *
 */
orp.model.World.prototype.getSuggestedItemsForAttribute = function(attribute, observer) {
  var listOfSuggestedItems = [];
  var categoryCalledCategory = this.getCategoryCalledCategory();
  var attributeCalledExpectedType = this.getAttributeCalledExpectedType();
  var listOfExpectedTypeEntries = attribute.getEntriesForAttribute(attributeCalledExpectedType);
  var listOfCategories = [];
  for (var i in listOfExpectedTypeEntries) {
    var expectedTypeEntry = listOfExpectedTypeEntries[i];
    var expectedType = expectedTypeEntry.getValue();
    if (expectedType.isInCategory(categoryCalledCategory)) {
      listOfCategories.push(expectedType);
    }
  }

  for (var j in listOfCategories) {
    var category = listOfCategories[j];
    var filterOutNonGeneralPurposeItems = true;
    var listOfItems = this.getItemsInCategory(category, null, filterOutNonGeneralPurposeItems);
    for (var k in listOfItems) {
      var item = listOfItems[k];
      orp.util.addObjectToSet(item, listOfSuggestedItems);
    }
  }
  this._addListObserver(listOfSuggestedItems, observer);
  
  // For no suggested items, TablePlugin expects an empty array rather than null 
  return listOfSuggestedItems;
};


/**
 * Given a string value and a list of types, this method tries to
 * transform the value to one of the types. 
 *
 * @scope    private instance method
 * @param    value    A string value. 
 * @param    listOfTypes    An array of items representing data types. 
 * @return   A number, a DateValue, an item, or the original string value.
 */
orp.model.World.prototype.transformValueToExpectedType = function(value, listOfTypes) {
  if (value && dojo.lang.isString(value) && listOfTypes && dojo.lang.isArray(listOfTypes)) {
    var categoryCalledCategory = this.getCategoryCalledCategory();
    var typeCalledText = this.getTypeCalledText();
    var typeCalledDate = this.getTypeCalledDate();
    var typeCalledNumber = this.getTypeCalledNumber();
    for (var i in listOfTypes) {
      var aType = listOfTypes[i];
      switch (aType) {
        case typeCalledText:
          return value;
        case typeCalledNumber:
          var valueWithoutCommas = value.replace(new RegExp(',','g'), '');
          var floatVal = parseFloat(valueWithoutCommas);
          if (!isNaN(floatVal)) {return floatVal;}
          break;
        case typeCalledDate:
          var dateValue = new orp.util.DateValue(value);
          if (dateValue.isValid()) {return dateValue;}
          break;
        default:
          if (aType.isInCategory(categoryCalledCategory)) {
            var listOfItems = this.getItemsInCategory(aType);
            var item;
            for (var j in listOfItems) {
              item = listOfItems[j];
              if (item.doesStringMatchName(value)) {
                return item;
              }
            }
            item = this.newItem(value);
            item.assignToCategory(aType);
            return item;
          }
          break;
      }
    }
  }
  return value;
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
orp.model.World.prototype._addListObserver = function(listOfItems, observer) {
  var observerWasAdded = false;
  if (!observer) {
    return observerWasAdded;
  }
  var weNeedToMakeANewTupleForThisList = true;
  var listOfTuples = this._listOfListObserverTuples;
  for (var key in listOfTuples) {
    var tuple = listOfTuples[key];
    if (tuple[orp.model.World._TUPLE_KEY_LIST] == listOfItems) {
      weNeedToMakeANewTupleForThisList = false;
      var setOfObservers = tuple[orp.model.World._TUPLE_KEY_OBSERVERS];
      observerWasAdded = orp.util.addObjectToSet(observer, setOfObservers);
    }
  }
  if (weNeedToMakeANewTupleForThisList) {
    var newTuple = {};
    newTuple[orp.model.World._TUPLE_KEY_LIST] = listOfItems;
    newTuple[orp.model.World._TUPLE_KEY_OBSERVERS] = [observer];
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
orp.model.World.prototype.removeListObserver = function(listOfItems, observer) {
  var observerWasRemoved = false;
  var listOfTuples = this._listOfListObserverTuples;
  for (var key in listOfTuples) {
    var tuple = listOfTuples[key];
    if (tuple[orp.model.World._TUPLE_KEY_LIST] == listOfItems) {
      var setOfObservers = tuple[orp.model.World._TUPLE_KEY_OBSERVERS];
      observerWasRemoved = orp.util.removeObjectFromSet(observer, setOfObservers);
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
orp.model.World.prototype.addItemObserver = function(item, observer) {
  var observerList = this._hashTableOfObserverListsKeyedByItemUuid[item.getUuid()];
  if (!observerList) {
    observerList = [];
    this._hashTableOfObserverListsKeyedByItemUuid[item.getUuid()] = observerList;
  }
  var observerWasAdded = orp.util.addObjectToSet(observer, observerList);
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
orp.model.World.prototype.removeItemObserver = function(item, observer) {
  var observerWasRemoved = false;
  var observerList = this._hashTableOfObserverListsKeyedByItemUuid[item.getUuid()];
  if (observerList) {
    observerWasRemoved = orp.util.removeObjectFromSet(observer, observerList);
  } 
  return observerWasRemoved;
};


// -------------------------------------------------------------------
// Methods for importing content from other worlds/repositories
// -------------------------------------------------------------------

/**
 * Creates a new item in this repository that corresponds to an existing
 * item from somewhere else.  The new item in this repository will have
 * the same UUID as the corresponding item in other repositories.
 *
 * @scope    public instance method
 * @param    uuid    The UUID of the item.
 * @return   The new item.
 * @throws   Throws an Error if the UUID is already in use.
 */
orp.model.World.prototype.importItem = function(uuid) {
  this.beginTransaction();
  var item = this._archive.importItem(uuid);
  this.endTransaction();
  return item;
};


/**
 * Creates a new entry in this repository that corresponds to an existing
 * entry from somewhere else.  The new entry in this repository will have
 * the same UUID as the corresponding entries in other repositories.
 *
 * @scope    public instance method
 * @namedParam    uuid    The UUID of the entry.
 * @namedParam    item    The item this is an entry of.
 * @namedParam    value    The value to initialize the entry to. (Optional if previousEntry is provided.)
 * @namedParam    type    Optional. An item representing a data type.
 * @namedParam    attribute    Optional. The attribute to assign the entry to. 
 * @namedParam    previousEntry    Optional. The old entry to be replaced.
 * @namedParam    inverseAttribute    Optional. The attribute to use as the inverseAttribute of 'attribute'.
 * @return   An entry object.
 * @throws   Throws an Error if the UUID is already in use.
 */
orp.model.World.prototype.importEntry = function(namedParameters) {
  orp.lang.assert(dojo.lang.isObject(namedParameters));

  var parameters = orp.model.Item.NamedParameters;
  var uuidParameter = "uuid";
  var itemParameter = "item";

  var value = namedParameters[parameters.value];
  var attribute = namedParameters[parameters.attribute];
  var type = namedParameters[parameters.type];
  var previousEntry = namedParameters[parameters.previousEntry];
  var inverseAttribute = namedParameters[parameters.inverseAttribute];
  var uuid = namedParameters[uuidParameter];
  var item = namedParameters[itemParameter];

  this.beginTransaction();
  var entry;
  if (inverseAttribute) {
    var attributeOne = attribute;
    var itemTwo = value;
    var attributeTwo = inverseAttribute;
    entry = this._archive.importConnectionEntry(uuid, previousEntry, item, attributeOne, itemTwo, attributeTwo);
  } else {
    entry = this._archive.importEntry(uuid, item, previousEntry, attribute, value, type);
  }
  this.endTransaction();
  return entry;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
