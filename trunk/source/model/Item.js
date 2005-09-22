/*****************************************************************************
 Item.js
 
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
dojo.provide("orp.model.Item");
dojo.require("orp.model.ContentRecord");
dojo.require("orp.model.World");
dojo.require("dojo.lang.*");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global ContentRecord */
/*global Util */
/*global World, Entry */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------

/**
 * Instances of the Item class know how to store and retrieve their
 * attribute entries.
 *
 * WARNING: This constructor method should be called ONLY from a 
 * VirtualServer implementation.
 *
 * If you're writing code in a view class, instead of calling this
 * constructor, call the newItem() method on World: world.newItem()
 * 
 * @scope    protected instance constructor
 * @param    world    The world that this item is a part of. 
 * @param    uuid    The UUID for this item. 
 */
orp.model.Item = function(world, uuid) {
  orp.model.ContentRecord.call(this);
  this._ContentRecord(world, uuid);
  
  this._hashTableOfEntryListsKeyedByAttributeUuid = {};
  this._provisionalFlag = false;

  this._noteChanges(null);
};

dj_inherits(orp.model.Item, orp.model.ContentRecord);  // makes Item be a subclass of ContentRecord


// -------------------------------------------------------------------
// Public class constants
// -------------------------------------------------------------------
orp.model.Item.NamedParameters = {
  attribute:      "attribute",
  value:          "value",
  type:           "type",
  previousEntry:  "previousEntry",
  myAttribute:    "myAttribute",
  otherItem:      "otherItem",
  otherAttribute: "otherAttribute"};


// -------------------------------------------------------------------
// Private methods
// -------------------------------------------------------------------

/**
 * Initializes a new item that has just been created by a user action.
 *
 * WARNING: This method should be called ONLY from a 
 * VirtualServer implementation.
 *
 * This method is NOT used for setting the properties of entries that
 * are being rehydrated from a dehydrated JSON string.  For that, you
 * need to call item.rehydrate();
 *
 * @scope    protected instance method
 * @param    observer    Optional. An object or method to be registered as an observer of the returned item. 
 * @param    provisionalFlag    True if the item is provisional; false if the item is normal. 
 */
orp.model.Item.prototype._initialize = function(observer, provisionalFlag) {
  if (provisionalFlag) {
    this._provisionalFlag = true;
  }
  if (observer) {
    this.addObserver(observer);
  }
};


// -------------------------------------------------------------------
// Entry adding methods
// -------------------------------------------------------------------

/* PENDING: refactor these methods as per Sept 12 plan:
// OLD
item.addConnectionEntry(myAttribute, otherItem, otherAttribute)
Item.replaceEntryWithConnection(previousEntry, myAttribute, otherItem, otherAttribute)

// NEW
item.addConnectionEntry({myAttribute:
                        otherItem:
                        otherAttribute: })

item.replaceEntryWithConnection({previousEntry: 
                        myAttribute:
                        otherItem:
                        otherAttribute: })
*/

/**
 * Creates a new entry object and adds the new entry to the item's 
 * list of entries.
 *
 * For example, to make Kermit green, you could use any of these:
 * <pre>
 *    kermit.addEntry({value: "green"});
 *    kermit.addEntry({attribute: color, value: "green"});
 *    kermit.addEntry({attribute: color, value: "green", type: string});
 * </pre>
 *
 * Attributes can always have more than one assigned entry, so
 * you can make Kermit be both blue and green by doing:
 * <pre>
 *    kermit.addEntry({attribute: color, value: "green"});
 *    kermit.addEntry({attribute: color, value: "blue"});
 * </pre>
 * 
 * @scope    public instance method
 * @namedParam    value    The value to initialize the entry to. 
 * @namedParam    type    Optional. An item representing a data type.
 * @namedParam    attribute    Optional.  The attribute to assign the entry to. 
 * @return   An entry object.
 * @throws   Throws an Error if no user is logged in.
 */
orp.model.Item.prototype.addEntry = function(namedParameters) {
  orp.util.assert(dojo.lang.isObject(namedParameters));
  var arg = orp.model.Item.NamedParameters;
  var value = namedParameters[arg.value];
  var attribute = namedParameters[arg.attribute];
  var type = namedParameters[arg.type];
  
  // Check for typos in parameter names
  orp.util.assert(orp.util.hasNoUnexpectedProperties(namedParameters, [arg.value, arg.attribute, arg.type]));
  
  if (!attribute) {
    attribute = this.getWorld().getAttributeCalledUnfiled();
  }
  return this._createNewEntry(null, attribute, value, type);
};
 

/**
 * Replaces an existing entry with a new entry.
 *
 * Examples:
 * <pre>
 *    var entry = item.addEntry({value: "green"});
 *    entry = item.replaceEntry({previousEntry: entry, value: "green"});
 *    entry = item.replaceEntry({previousEntry: entry, attribute: color, value: "green"});
 *    entry = item.replaceEntry({previousEntry: entry, attribute: color, value: "green", type: string});
 * </pre>
 * 
 * @scope    public instance method
 * @namedParam    previousEntry    The old entry to be replaced.
 * @namedParam    value    The value to initialize the entry to. 
 * @namedParam    type    Optional. An item representing a data type.
 * @namedParam    attribute    Optional.  The attribute to assign the entry to. 
 * @return   The new replacement entry object.
 * @throws   Throws an Error if no user is logged in.
 */
orp.model.Item.prototype.replaceEntry = function(namedParameters) {
  orp.util.assert(dojo.lang.isObject(namedParameters));
  var arg = orp.model.Item.NamedParameters;
  var value = namedParameters[arg.value];
  var attribute = namedParameters[arg.attribute];
  var type = namedParameters[arg.type];
  var previousEntry = namedParameters[arg.previousEntry];

  // Check for typos in parameter names
  orp.util.assert(orp.util.hasNoUnexpectedProperties(namedParameters, [arg.value, arg.attribute, arg.type, arg.previousEntry]));
  
  orp.util.assert(dojo.lang.isObject(previousEntry));
  if (!attribute) {
    attribute = previousEntry.getAttributeForItem(this);
  }
  return this._createNewEntry(previousEntry, attribute, value, type);
};


/**
 * Replaces an existing entry with a new entry, and assigns the new entry
 * to an attribute.
 *
 * @param    previousEntry    Optional. The old entry to be replaced.
 * @param    attribute    The attribute to assign the entry to. 
 * @param    value    The value to initialize the new entry to.
 * @param    type    Optional. An item representing a data type.
 * @scope    private instance method
 */
orp.model.Item.prototype._createNewEntry = function(previousEntry, attribute, value, type) {

  // If we've just been asked to replace the string "Foo" with the string "Foo",
  // then don't even bother creating a new entry. 
  if (previousEntry) {
    var oldValue = previousEntry.getValue();
    var oldAttribute = previousEntry.getAttribute();
    if ((oldValue == value) && (oldAttribute == attribute)) {
      return null;
    }
  }
  
  this.getWorld().beginTransaction();
  if (this._provisionalFlag) {
    this._provisionalFlag = false;
    this.getWorld()._provisionalItemJustBecameReal(this);
  }
  
  var entry = this.getWorld()._newEntry(this, previousEntry, attribute, value, type);
  this.getWorld().endTransaction();
  this._noteChanges(null);
  return entry;
};


/**
 * Creates a new entry object representing a connection between two
 * items.
 * For example, to make a Tolkien be the author of The Hobbit:
 * <pre>
 *    theHobbit.addConnectionEntry(author, tolkien, booksAuthored);
 * </pre>
 * Or you could get exactly the same result by doing the reverse:
 * <pre>
 *    tolkien.addConnectionEntry(booksAuthored, theHobbit, author);
 * </pre>
 *
 * @scope    public instance method
 * @param    myAttribute    The attribute to assign the entry to. 
 * @param    otherItem    The item to create a connection to.
 * @param    otherAttribute    Optional. An attribute of the otherItem to assign the entry to on the otherItem.
 * @return   The new entry object.
 * @throws   Throws an Error if no user is logged in.
 */
orp.model.Item.prototype.addConnectionEntry = function(myAttribute, otherItem, otherAttribute) {
  return this.replaceEntryWithConnection(null, myAttribute, otherItem, otherAttribute);
};


/**
 *
 */
orp.model.Item.prototype.replaceEntryWithConnection = function(previousEntry, myAttribute, otherItem, otherAttribute) {
  orp.util.assert(otherItem instanceof orp.model.Item);
  orp.util.assert(myAttribute instanceof orp.model.Item);

  // If we've just been asked to replace the string "Foo" with the string "Foo",
  // then don't even bother creating a new entry. 
  if (previousEntry) {
    // var oldValue = previousEntry.getValue(this);
    var oldPairOfAttributes = previousEntry.getAttribute();
    var oldPairOfItems = previousEntry.getItem();
    if (orp.util.isArray(oldPairOfAttributes)) {
      orp.util.assert(orp.util.isArray(oldPairOfAttributes));
      orp.util.assert(oldPairOfAttributes.length == 2);
      orp.util.assert(oldPairOfItems.length == 2);
      if (((oldPairOfAttributes[0] == myAttribute) &&  (oldPairOfAttributes[1] == otherAttribute) &&
        oldPairOfItems[0] == this && oldPairOfItems[1] == otherItem) ||
        ((oldPairOfAttributes[1] == myAttribute) &&  (oldPairOfAttributes[0] == otherAttribute) &&
        oldPairOfItems[1] == this && oldPairOfItems[0] == otherItem)) {
        return null;
      }
    }
  }

  this.getWorld().beginTransaction();
  if (this._provisionalFlag) {
    this._provisionalFlag = false;
    this.getWorld()._provisionalItemJustBecameReal(this);
  }
  if (otherItem._provisionalFlag) {
    otherItem._provisionalFlag = false;
    this.getWorld()._provisionalItemJustBecameReal(otherItem);
  }
  if (!otherAttribute) {
    otherAttribute = this.getWorld().getAttributeCalledUnfiled();
  }

  var entry = this.getWorld()._newConnectionEntry(previousEntry, this, myAttribute, otherItem, otherAttribute);
  this.getWorld().endTransaction();
  this._noteChanges(null);
  otherItem._noteChanges(null);
  if (previousEntry) {
    var oldItemOrPairOfItems = previousEntry.getItem();
    if (oldItemOrPairOfItems instanceof orp.model.Item) {
      oldItemOrPairOfItems._noteChanges(null);
    }
    if (orp.util.isArray(oldItemOrPairOfItems)) {
      oldItemOrPairOfItems[0]._noteChanges(null);
      oldItemOrPairOfItems[1]._noteChanges(null);
    }
  }
  return entry;  
};


/**
 * Given a category, this method puts the item in that category.
 *
 * @scope    public instance method
 * @param    category    An item representing a category. 
 */
orp.model.Item.prototype.assignToCategory = function(category) {
  var attributeCalledCategory = this.getWorld().getAttributeCalledCategory();
  var attributeCalledItemsInCategory = this.getWorld().getAttributeCalledItemsInCategory();
  this.addConnectionEntry(attributeCalledCategory, category, attributeCalledItemsInCategory);
};


// -------------------------------------------------------------------
// Accessor methods where the answer depends on the retrieval filter
// -------------------------------------------------------------------
/* PENDING: add this API

var entries = item.getValuesForAttribute(height);
for (var i in values) {
  var value = value[i];
  // display value on screen
}
*/

/**
 * Given an attribute, this method returns the list of all the entries that 
 * have been assigned to that attribute for this item.
 *
 * For example, to find out what color Kermit is: 
 * <pre>
 *    var entryList = kermit.getEntriesForAttribute(color);
 *    for (var i = 0; i < entryList.length; ++i) {
 *      alert("Kermit is " + entryList[i].getDisplayString());
 *    }
 * </pre>
 *
 * @scope    public instance method
 * @param    attribute    An attribute that we want to know the entries of. 
 * @return   A list of entry objects.
 */
orp.model.Item.prototype.getEntriesForAttribute = function(attribute) {
  orp.util.assert(attribute instanceof orp.model.Item);
  
  if (this._cachedEntriesKeyedByAttributeUuid !== null) {
    var listOfCachedEntries = this._cachedEntriesKeyedByAttributeUuid[attribute.getUuid()];
    if (listOfCachedEntries) {
      return listOfCachedEntries;
    }
  }
  
  var listOfEntriesForAttribute = this._hashTableOfEntryListsKeyedByAttributeUuid[attribute.getUuid()];
  if (!listOfEntriesForAttribute) {
    listOfEntriesForAttribute = [];
  }
  
  var entry;
  var key;
  var filter = this.getWorld().getRetrievalFilter();
  var filteredListOfEntries = [];
  
  switch (filter) {
    case orp.model.World.RetrievalFilter.LAST_EDIT_WINS:
      for (key in listOfEntriesForAttribute) {
        entry = listOfEntriesForAttribute[key];
        if (!entry.hasBeenReplaced() && !entry.hasBeenDeleted()) {
          filteredListOfEntries.push(entry);
        }
      }
      break;
    case orp.model.World.RetrievalFilter.SINGLE_USER:
      // PENDING: This still needs to be implemented.
      orp.util.assert(false);
      break;
    case orp.model.World.RetrievalFilter.DEMOCRATIC:
      // PENDING: This still needs to be implemented.
      orp.util.assert(false);
      break;
    case orp.model.World.RetrievalFilter.UNABRIDGED:
      filteredListOfEntries = listOfEntriesForAttribute;
      break;
    default:
      // We should never get here.  If we get here, it's an error.
      orp.util.assert(false);
      break;
  }
  filteredListOfEntries.sort(orp.model.ContentRecord.compareOrdinals);

  if (!this._cachedEntriesKeyedByAttributeUuid) {
    this._cachedEntriesKeyedByAttributeUuid = {};
  }
  this._cachedEntriesKeyedByAttributeUuid[attribute.getUuid()] = filteredListOfEntries;

  return filteredListOfEntries;
};


/**
 * Returns a list of all the entries assigned to an item.
 *
 * @scope    public instance method
 * @return   A list of entry objects.
 */
orp.model.Item.prototype.getEntries = function() {
  var listOfAllEntries = [];
  
  for (var uuid in this._hashTableOfEntryListsKeyedByAttributeUuid) {
    var listOfEntriesForAttribute = this._hashTableOfEntryListsKeyedByAttributeUuid[uuid];
    for (var key in listOfEntriesForAttribute) {
      var entry = listOfEntriesForAttribute[key];
      listOfAllEntries.push(entry);
    }
  }
  return listOfAllEntries;
};


/**
 * Returns a list of all the attributes that this item has entries
 * assigned to.
 *
 * @scope    public instance method
 * @return   A list of attribute items.
 */
orp.model.Item.prototype.getAttributes = function() {
  var listOfAttributes = [];
  
  for (var uuid in this._hashTableOfEntryListsKeyedByAttributeUuid) {
    var attribute = this.getWorld().getItemFromUuid(uuid);
    listOfAttributes.push(attribute);
  }
  return listOfAttributes;
};


/**
 *
 */
orp.model.Item.prototype.getFirstCategory = function() {
  if (this._cachedFirstCategory !== null) {
    return this._cachedFirstCategory;
  } else {
    var attributeCalledCategory = this.getWorld().getAttributeCalledCategory();
    var listOfCategoryEntries = this.getEntriesForAttribute(attributeCalledCategory);
    var returnEntry = null;
    if (listOfCategoryEntries && listOfCategoryEntries.length > 0) {
      var firstEntry = listOfCategoryEntries[0];
      var returnCategory = firstEntry.getValue(this);
    }
    this._cachedFirstCategory = returnCategory;
    return returnCategory;
  }
};

// -------------------------------------------------------------------
// Attribute accessor methods
// -------------------------------------------------------------------

/**
 * Returns whether item is provisional
 *
 * @scope    public instance method
 * @return   Boolean whether item is provisional
 */
orp.model.Item.prototype.isProvisional = function() {
  return this._provisionalFlag;
};


/**
 * Returns a string with the display name of the item.
 *
 * @scope    public instance method
 * @param    defaultString    Optional.  This string will be returned if the item has no display name. 
 * @return   A string with a display name for the item.
 */
orp.model.Item.prototype.getDisplayName = function(defaultString) {
  if (this._cachedDisplayName !== null) {
    return this._cachedDisplayName;
  } else {
    var displayName = defaultString || "(no name)";
    var listOfNameEntries = this.getNameEntries();
    if (listOfNameEntries.length > 0) {
      var primaryName = listOfNameEntries[0];
      displayName = primaryName.getDisplayString();
      this._cachedDisplayName = displayName;
    }
    return displayName;
  }
};
  

/**
 * Returns a string with either the short name of the item or the name of the item.
 *
 * @scope    public instance method
 * @param    defaultString    Optional.  This string will be returned if the item has no short name or name. 
 * @return   A string with a name for the item.
 */
orp.model.Item.prototype.getDisplayString = function(defaultString) {
  if (this._cachedDisplayString !== null) {
    return this._cachedDisplayString;
  } else {
    var attributeCalledShortName = this.getWorld().getAttributeCalledShortName();
    var shortNameString = this.getSingleStringValueFromAttribute(attributeCalledShortName);
    if (!shortNameString) {
      shortNameString = this.getDisplayName(defaultString);
    }
    this._cachedDisplayString = shortNameString;
    return shortNameString;
  }
};


/**
 *
 */
orp.model.Item.prototype.getDisplayStringForEntry = function(entry) {
  orp.util.assert(entry instanceof orp.model.Entry);
  return entry.getDisplayString(this);
};


/**
 * Returns a list of the entries assigned to the "name" attribute.
 *
 * @scope    public instance method
 * @return   A list of the entries assigned to the "name" attribute.
 */
orp.model.Item.prototype.getNameEntries = function() {
  var attributeCalledName = this.getWorld().getAttributeCalledName();
  return this.getEntriesForAttribute(attributeCalledName);
};


/**
 * Returns a list of the entries assigned to the "short name" attribute.
 *
 * @scope    public instance method
 * @return   A list of the entries assigned to the "short name" attribute.
 */
orp.model.Item.prototype.getShortNameEntries = function() {
  var attributeCalledShortName = this.getWorld().getAttributeCalledShortName();
  return this.getEntriesForAttribute(attributeCalledShortName);
};


/**
 * Returns just the first entry of an item's attribute.
 *
 * @scope    public instance method
 * @param    attribute    An item representing an attribute. 
 * @return   A string with a description of the item.
 */
orp.model.Item.prototype.getSingleEntryFromAttribute = function(attribute) {
  var listOfEntries = this.getEntriesForAttribute(attribute);
  if (listOfEntries) {
    return listOfEntries[0];
  }
  return null;
};


/**
 * Returns just the first entry's display string of an item's attribute.
 *
 * @scope    public instance method
 * @param    attribute    An item representing an attribute. 
 * @return   A string with a description of the item.
 */
orp.model.Item.prototype.getSingleStringValueFromAttribute = function(attribute) {
  var singleEntry = this.getSingleEntryFromAttribute(attribute);
  if (singleEntry) {return singleEntry.getDisplayString();}
  return "";
};


/**
 * Returns a string describing the item.
 *
 * @scope    public instance method
 * @return   A string with a description of the item.
 */
orp.model.Item.prototype.toString = function() {
  var returnString = "[Item #" + this.getUuid() + " ";
  var attributeCategory = this.getWorld().getAttributeCalledCategory();
  var listOfCategories = this.getEntriesForAttribute(attributeCategory);
  for (var key in listOfCategories) {
    var category = listOfCategories[key];
    if (category instanceof orp.model.Item) {
      returnString += "(" + category.getDisplayString() + ")";
    }
  }
  returnString += " \"" + this.getDisplayString() + "\"" + "]";
  return returnString; 
};


// -------------------------------------------------------------------
// Non-Attribute Accessor Methods
// -------------------------------------------------------------------

/**
 * Does this item have an attribute with a particular entry?
 * Used in getting query results
 *
 * @scope public instance method
 * @return Boolean. True if this item has an attribute with the entry
 */
orp.model.Item.prototype.hasAttributeValue = function(attribute, value) {
  orp.util.assert(attribute instanceof orp.model.Item);
  var entryList = this.getEntriesForAttribute(attribute);

  // look at all the entries this item's attribute is assigned to, 
  // and see if one of them is "inEntry"
  for (var i in entryList) {
    var entry = entryList[i];
    if (entry.getValue(this) == value) {
      return true;
    }
  }
  return false;
};


/**
 * Given a category, returns "true" if the item has been assigned to 
 * that category.
 *
 * @scope    public instance method
 * @return   A boolean.  True if the item has been assigned to the category.
 */
orp.model.Item.prototype.isInCategory = function(category) {
  orp.util.assert(category instanceof orp.model.Item);

  var categoryAttribute = this.getWorld().getAttributeCalledCategory();
  return this.hasAttributeValue(categoryAttribute, category);
};
 

/**
 * Given a string, returns "true" if the string is the same as the name
 * or the short name of the item.  The comparison is case insensitive.
 *
 * @scope    public instance method
 * @return   A boolean.  True if the string matches the item's name.
 */
orp.model.Item.prototype.doesStringMatchName = function(string) {
  if (string.toLowerCase() == this.getDisplayName().toLowerCase()) {
    return true;
  }
  if (string.toLowerCase() == this.getDisplayString().toLowerCase()) {
    return true;
  }
  return false;
};


// -------------------------------------------------------------------
// Observer/Observable Methods
// -------------------------------------------------------------------

/**
 * Registers an object or method as an observer of this item, so that
 * the observer will be notified when the item changes.
 *
 * @scope    public instance method
 * @param    observer    An object or method to be registered as an observer of the item. 
 */
orp.model.Item.prototype.addObserver = function(observer) {
  this.getWorld().addItemObserver(this, observer);
};


/**
 * Removes an object or method from the set of observers of this item, so 
 * that the observer will no longer be notified when the item changes.
 *
 * @scope    public instance method
 * @param    observer    The object or method to be removed from the set of observers. 
 */
orp.model.Item.prototype.removeObserver = function(observer) {
  this.getWorld().removeItemObserver(this, observer);
};


// -------------------------------------------------------------------
// Protected Methods
// -------------------------------------------------------------------

/**
 * Adds a new entry to the item when the items and entries are first
 * being loaded by the backing store.
 *
 * WARNING: This method should be called ONLY from the  
 * entry._rehydrate() method.
 * 
 * @scope    protected instance method
 * @param    entry    The entry to be associated with this item. 
 * @param    attribute    The attribute that this entry is assigned to. 
 */
orp.model.Item.prototype._addRehydratedEntry = function(entry, attribute) {
  this._addEntryToListOfEntriesForAttribute(entry, attribute);
};
  

/**
 * Called by the world to let this item know that it was modified
 * during the last transaction.
 *
 * WARNING: This method should be called ONLY from the  
 * world._notifyObserversOfChanges() method.
 * 
 * @scope    protected instance method
 * @param    listOfRecords    A list of the modifications. 
 */
orp.model.Item.prototype._noteChanges = function(listOfRecords) {
  this._cachedDisplayName = null;
  this._cachedDisplayString = null;
  this._cachedFirstCategory = null;
  this._cachedEntriesKeyedByAttributeUuid = null;
};

// -------------------------------------------------------------------
// Private Methods
// -------------------------------------------------------------------

/**
 * Adds an entry to the list of entries that have been set for this item.
 * 
 * @scope    private instance method
 * @param    entry    The entry to be associated with this item. 
 * @param    attribute    The attribute that this entry is assigned to. 
 */
orp.model.Item.prototype._addEntryToListOfEntriesForAttribute = function(entry, attribute) {
  var attributeUuid = attribute.getUuid();
  var listOfEntries = this._hashTableOfEntryListsKeyedByAttributeUuid[attributeUuid];
  if (!listOfEntries) {
    listOfEntries = [];
    this._hashTableOfEntryListsKeyedByAttributeUuid[attributeUuid] = listOfEntries;
  }
  listOfEntries.push(entry);
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
