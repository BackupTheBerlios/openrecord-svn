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
dojo.require("orp.lang.Lang");
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
 * WARNING: This constructor method should be called ONLY from an 
 * orp.archive implementation.
 *
 * If you're writing code in a view class, instead of calling this
 * constructor, call the newItem() method on World: world.newItem()
 * 
 * @scope    protected instance constructor
 * @param    world    The world that this item is a part of. 
 * @param    uuid    The UUID for this item. 
 */
orp.model.Item = function(world, uuid) {
  orp.model.ContentRecord.call(this, world, uuid);
  
  this._hashTableOfEntryListsKeyedByAttributeUuid = {};
  this._provisionalFlag = false;

  this._noteChanges(null);
};

dojo.inherits(orp.model.Item, orp.model.ContentRecord);  // makes Item be a subclass of ContentRecord


// -------------------------------------------------------------------
// Public class constants
// -------------------------------------------------------------------
orp.model.Item.NamedParameters = {
  attribute:        "attribute",
  value:            "value",
  type:             "type",
  previousEntry:    "previousEntry",
  inverseAttribute: "inverseAttribute"};

// -------------------------------------------------------------------
// Private methods
// -------------------------------------------------------------------

/**
 * Initializes a new item that has just been created by a user action.
 *
 * WARNING: This method should be called ONLY from an 
 * orp.archive implementation.
 *
 * This method is NOT used for setting the properties of entries that
 * are being revived from a serialized JSON string.  
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
 * @namedParam    value    The value to initialize the entry to. (Optional if previousEntry is provided.)
 * @namedParam    type    Optional. An item representing a data type.
 * @namedParam    attribute    Optional. The attribute to assign the entry to. 
 * @namedParam    previousEntry    Optional. The old entry to be replaced.
 * @namedParam    inverseAttribute    Optional. The attribute to use as the inverseAttribute of 'attribute'.
 * @return   An entry object.
 * @throws   Throws an Error if no user is logged in.
 */
orp.model.Item.prototype.addEntry = function(namedParameters) {
  orp.lang.assert(dojo.lang.isObject(namedParameters));
  var parameters = orp.model.Item.NamedParameters;
  var value = namedParameters[parameters.value];
  var attribute = namedParameters[parameters.attribute];
  var type = namedParameters[parameters.type];
  var previousEntry = namedParameters[parameters.previousEntry];
  var inverseAttribute = namedParameters[parameters.inverseAttribute];
  
  // Check for typos in parameter names
  orp.lang.assert(orp.util.hasNoUnexpectedProperties(namedParameters, parameters));
  
  if (previousEntry) {
    if (!attribute) {
      attribute = previousEntry.getAttribute();
    }
    if (dojo.lang.isUndefined(value)) {
      value = previousEntry.getValue();
    }
  } else {
    if (!attribute) {
      attribute = this.getWorld().getAttributeCalledUnfiled();
    }
  }

  return this._createNewEntry(previousEntry, attribute, value, type, inverseAttribute);
};
 

/**
 * Replaces an existing entry with a new entry.
 *
 * Examples:
 * <pre>
 *    var entry = item.addEntry({value: "green"});
 *    entry = item.replaceEntry({previousEntry: entry, value: "blue"});
 *    entry = item.replaceEntry({previousEntry: entry, attribute: color, value: "blue"});
 *    var textType = world.getTypeCalledText();
 *    entry = item.replaceEntry({previousEntry: entry, attribute: color, value: "blue", type: textType});
 * </pre>
 * 
 * @scope    public instance method
 * @namedParam    previousEntry    The old entry to be replaced.
 * @namedParam    value    Optional. The value to initialize the entry to. 
 * @namedParam    type    Optional. An item representing a data type.
 * @namedParam    attribute    Optional.  The attribute to assign the entry to. 
 * @return   The new replacement entry object.
 * @throws   Throws an Error if no user is logged in.
 */
orp.model.Item.prototype.replaceEntry = function(namedParameters) {
  orp.lang.assert(dojo.lang.isObject(namedParameters));
  var previousEntry = namedParameters[orp.model.Item.NamedParameters.previousEntry];

  orp.lang.assert(dojo.lang.isObject(previousEntry));
  return this.addEntry(namedParameters);
};


/**
 * Replaces an existing entry with a new entry, and assigns the new entry
 * to an attribute.
 *
 * @param    previousEntry    Optional. The old entry to be replaced.
 * @param    attribute    The attribute to assign the entry to. 
 * @param    value    The value to initialize the new entry to.
 * @param    type    Optional. An item representing a data type.
 * @param    inverseAttribute    Optional. The attribute to use as the inverseAttribute of 'attribute'.
 * @scope    private instance method
 */
orp.model.Item.prototype._createNewEntry = function(previousEntry, attribute, value, type, inverseAttribute) {
  var newEntry;
  var world = this.getWorld();
  
  if (inverseAttribute) {
    var otherItem = value;
    var myAttribute = attribute;
    var otherAttribute = inverseAttribute;
    
    orp.lang.assert(otherItem instanceof orp.model.Item);
    orp.lang.assert(myAttribute instanceof orp.model.Item);
  
    // If we've just been asked to replace a connection to the item Foo with 
    // an identical connection to the item Foo,
    // then don't even bother creating a new entry. 
    if (previousEntry) {
      if (previousEntry.getType() == world.getTypeCalledConnection()) {
        var oldItem = previousEntry.getItem();
        var oldAttribute = previousEntry.getAttribute();
        var oldValue = previousEntry.getValue();
        var oldInverseAttribute = previousEntry.getInverseAttribute();
        if (((oldAttribute == myAttribute) &&  (oldInverseAttribute == otherAttribute) &&
          oldItem == this && oldValue == otherItem) ||
          ((oldInverseAttribute == myAttribute) &&  (oldAttribute == otherAttribute) &&
          oldValue == this && oldItem == otherItem)) {
          return null;
        }
      }
    }
  } else {
    // If we've just been asked to replace the string "Foo" with the string "Foo",
    // then don't even bother creating a new entry. 
    if (previousEntry) {
      oldAttribute = previousEntry.getAttribute();
      if (oldAttribute == attribute) {
        var typeCalledText = world.getTypeCalledText();
        var typeCalledDate = world.getTypeCalledDate();
        var typeCalledNumber = world.getTypeCalledNumber();
        var typeCalledItem = world.getTypeCalledItem();
        var typeCalledConnection = world.getTypeCalledConnection();
        oldValue = previousEntry.getValue();
        switch (previousEntry.getType()) {
          case typeCalledText:
            if (dojo.lang.isString(value) && (oldValue == value)) {
              return null;
            }
            break;
          case typeCalledDate:
            if (value instanceof Date) {
              if ((oldValue.valueOf() == value.valueOf()) &&
                (oldValue._hasTime == value._hasTime) &&
                (oldValue._hasDay == value._hasDay) && 
                (oldValue._hasMonth == value._hasMonth)) {
                return null;
              }
            }
            break;
          case typeCalledNumber:
            if (dojo.lang.isNumber(value) && (oldValue == value)) {
              return null;
            }
            break;
          case typeCalledItem:
            if ((value instanceof orp.model.Item) && (oldValue == value)) {
              return null;
            }
            break;
          case typeCalledConnection:
            if ((value instanceof orp.model.Item) && (oldValue == value)) {
              // FIXME: 
              // need to do a slightly complicated check here
              // we should re-factor this to combine it with the code
              // above -- see: "if (inverseAttribute) {"
            }
            break;
          default:
            orp.lang.assert(false); // We should never get here
            break;
        }
      }
      // FIXME: this works for string values, but it doesn't work for date values
      if ((oldValue == value) && (oldAttribute == attribute)) {
        return null;
      }
    }
  }
  
  world.beginTransaction();
  if (this._provisionalFlag) {
    this._provisionalFlag = false;
    world._provisionalItemJustBecameReal(this);
  }
  if (inverseAttribute) {
    if (otherItem._provisionalFlag) {
      otherItem._provisionalFlag = false;
      world._provisionalItemJustBecameReal(otherItem);
    }
    if (!otherAttribute) {
      otherAttribute = world.getAttributeCalledUnfiled();
    }
    newEntry = world._newConnectionEntry(previousEntry, this, myAttribute, otherItem, otherAttribute);
  } else {
    newEntry = world._newEntry(this, previousEntry, attribute, value, type);
  }
  world.endTransaction();
  this._noteChanges(null);
  if (inverseAttribute) {
    otherItem._noteChanges(null);
    if (previousEntry) {
      previousEntry.getItem()._noteChanges(null);
      if (previousEntry.getType() == world.getTypeCalledConnection()) {
        previousEntry.getValue()._noteChanges(null);
      }
    }
  }
  
  return newEntry;
};


/**
 * Creates a new entry object representing a connection between two
 * items.
 * For example, to make Tolkien be the author of The Hobbit:
 * <pre>
 *    theHobbit.addConnectionEntry({
 *      attribute: author, 
 *      value: tolkien,
 *      inverseAttribute: booksAuthored });
 * </pre>
 * Or you could get exactly the same result by doing the reverse:
 * <pre>
 *    tolkien.addConnectionEntry({
 *      attribute: booksAuthored, 
 *      value: theHobbit,
 *      inverseAttribute: author });
 * </pre>
 *
 * @scope    public instance method
 * @namedParam    attribute    Optional. The attribute to assign the entry to. 
 * @namedParam    value    The item to create a connection to.
 * @namedParam    previousEntry    Optional. The old entry to be replaced.
 * @namedParam    inverseAttribute    Optional. The attribute to use as the inverseAttribute of 'attribute'.
 * @return   The new entry object.
 * @throws   Throws an Error if no user is logged in.
 */
orp.model.Item.prototype.addConnectionEntry = function(namedParameters) {
  orp.lang.assert(dojo.lang.isObject(namedParameters));

  var typeCalledConnection = this.getWorld().getTypeCalledConnection();
  var type = namedParameters[orp.model.Item.NamedParameters.type];
  if (type) {
    orp.lang.assert(type == typeCalledConnection);
  } else {
    namedParameters[orp.model.Item.NamedParameters.type] = typeCalledConnection;
  }
  
  return this.addEntry(namedParameters);
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
  this.addEntry({
    attribute: attributeCalledCategory, 
    value: category,
    inverseAttribute: attributeCalledItemsInCategory });
  // this.addConnectionEntry(attributeCalledCategory, category, attributeCalledItemsInCategory);
};


// -------------------------------------------------------------------
// Accessor methods where the answer depends on the retrieval filter
// -------------------------------------------------------------------

/**
 * Given an attribute, this method returns the list of all the values that 
 * have been assigned to that attribute for this item.
 *
 * For example, to find out what color Kermit is: 
 * <pre>
 * var listOfValues = kermit.getValuesForAttribute(color);
 * for (var i in listOfValues) {
 *   var value = listOfValues[i];
 *   alert("Kermit is " + value);
 * }
 * </pre>
 *
 * @scope    public instance method
 * @param    attribute    An attribute that we want to know the value of. 
 * @return   A list of value objects (may include strings, numbers, Items, Dates, etc.)
*/
orp.model.Item.prototype.getValuesForAttribute = function(attribute) {
  var listOfEntries = this.getEntriesForAttribute(attribute);
  var listOfValues = [];
  for (var i in listOfEntries) {
    var entry = listOfEntries[i];
    listOfValues.push(entry.getValue());
  }
  return listOfValues;
};


/**
 * Given an attribute, this method returns the list of all the entries that 
 * have been assigned to that attribute for this item.
 *
 * For example, to find out what color Kermit is: 
 * <pre>
 *    var listOfEntries = kermit.getEntriesForAttribute(color);
 *    for (var i in listOfEntries) {
 *      alert("Kermit is " + listOfEntries[i].getDisplayString());
 *    }
 * </pre>
 *
 * @scope    public instance method
 * @param    attribute    An attribute that we want to know the entries of. 
 * @return   A list of entry objects.
 */
orp.model.Item.prototype.getEntriesForAttribute = function(attribute) {
  orp.lang.assert(attribute instanceof orp.model.Item);
  
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
      orp.lang.assert(false);
      break;
    case orp.model.World.RetrievalFilter.DEMOCRATIC:
      // PENDING: This still needs to be implemented.
      orp.lang.assert(false);
      break;
    case orp.model.World.RetrievalFilter.UNABRIDGED:
      filteredListOfEntries = listOfEntriesForAttribute;
      break;
    default:
      // We should never get here.  If we get here, it's an error.
      orp.lang.assert(false);
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
  if (!this._cachedFirstCategory) {
    var attributeCalledCategory = this.getWorld().getAttributeCalledCategory();
    this._cachedFirstCategory = this.getSingleValueFromAttribute(attributeCalledCategory);
  }
  return this._cachedFirstCategory;
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
  orp.lang.assert(entry instanceof orp.model.Entry);
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
 * Returns null if the item does not have any entries for the given
 * attribute.
 *
 * @scope    public instance method
 * @param    attribute    An item representing an attribute. 
 * @return   An Entry object, or null.
 */
orp.model.Item.prototype.getSingleEntryFromAttribute = function(attribute) {
  var listOfEntries = this.getEntriesForAttribute(attribute);
  if (listOfEntries && (listOfEntries.length > 0)) {
    return listOfEntries[0];
  }
  return null;
};


/**
 * Returns the value held in the first entry of an item's attribute. 
 * Returns null if the item does not have any entries for the given
 * attribute.
 *
 * @scope    public instance method
 * @param    attribute    An item representing an attribute. 
 * @return   A data value, or null.
 */
orp.model.Item.prototype.getSingleValueFromAttribute = function(attribute) {
  var firstEntry = this.getSingleEntryFromAttribute(attribute);
  if (firstEntry) {
    return firstEntry.getValue();
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
  var listOfCategories = this.getValuesForAttribute(attributeCategory);
  for (var i in listOfCategories) {
    var category = listOfCategories[i];
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
 * @scope   public instance method
 * @return   Boolean. True if this item has an attribute with the entry
 */
orp.model.Item.prototype.hasAttributeValue = function(attribute, value) {
  orp.lang.assert(attribute instanceof orp.model.Item);
  var listOfValues = this.getValuesForAttribute(attribute);
  for (var i in listOfValues) {
    if (listOfValues[i] == value) {
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
  orp.lang.assert(category instanceof orp.model.Item);

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
 * being loaded from storage.
 *
 * WARNING: This method should be called ONLY from the  
 * entry._revive() method.
 * 
 * @scope    protected instance method
 * @param    entry    The entry to be associated with this item. 
 * @param    attribute    The attribute that this entry is assigned to. 
 */
orp.model.Item.prototype._addRevivedEntry = function(entry, attribute) {
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
