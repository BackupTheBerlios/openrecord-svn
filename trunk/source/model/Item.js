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
// Dependencies:
//   Util.js
//   World.js
//   Entry.js
//   ContentRecord.js
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
 * @param    inWorld    The world that this item is a part of. 
 * @param    inUuid    The UUID for this item. 
 */
Item.prototype = new ContentRecord();  // makes Item be a subclass of ContentRecord
function Item(inWorld, inUuid) {
  this._ContentRecord(inWorld, inUuid);
  
  this.__myHashTableOfEntryListsKeyedByAttributeUuid = {};
  this.__myProvisionalFlag = false;
}


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
 * @param    inObserver    Optional. An object or method to be registered as an observer of the returned item. 
 * @param    inProvisionalFlag    True if the item is provisional; false if the item is normal. 
 */
Item.prototype._initialize = function (inObserver, inProvisionalFlag) {
  if (inProvisionalFlag) {
    this.__myProvisionalFlag = true;
  }
  if (inObserver) {
    this.addObserver(inObserver);
  }
};


// -------------------------------------------------------------------
// Entry adding methods
// -------------------------------------------------------------------

/**
 * Creates a new entry object and adds the new entry to the item's 
 * list of entries.
 *
 * @scope    public instance method
 * @param    inValue    The value to initialize the entry to.
 * @param    inType    Optional. An item representing a data type.
 * @return   An entry object.
 * @throws   Throws an Error if no user is logged in.
 */
Item.prototype.addEntry = function (inValue, inType) {
  var attributeCalledUnfiled = this.getWorld().getAttributeCalledUnfiled();
  return this._createNewEntry(null, attributeCalledUnfiled, inValue, inType);
};


/**
 * Assigns an entry to an attribute in this item.
 *
 * Given an attribute and value, creates an entry object with the 
 * value, and sets the item's attribute to the new entry.
 * For example, to make a Kermit green:
 * <pre>
 *    kermit.addEntryForAttribute(color, "green");
 * </pre>
 * Attributes can always have more than one assigned entry, so
 * you can make Kermit be both blue and green by doing:
 * <pre>
 *    kermit.addEntryForAttribute(color, "green");
 *    kermit.addEntryForAttribute(color, "blue");
 * </pre>
 *
 * @scope    public instance method
 * @param    inAttribute    The attribute to assign the entry to. 
 * @param    inValue    The value to initialize the entry with.
 * @param    inType    Optional. An item representing a data type.
 * @return   An entry object.
 * @throws   Throws an Error if no user is logged in.
 */
Item.prototype.addEntryForAttribute = function (inAttribute, inValue, inType) {
  return this._createNewEntry(null, inAttribute, inValue, inType);
};


/**
 * Replaces an existing entry with a new entry.
 *
 * @scope    public instance method
 * @param    inEntry    The old entry to be replaced.
 * @param    inValue    The value to initialize the new entry to.
 * @param    inType    Optional. An item representing a data type.
 * @return   The new replacement entry object.
 * @throws   Throws an Error if no user is logged in.
 */
Item.prototype.replaceEntry = function (inEntry, inValue, inType) {
  var attribute = inEntry.getAttributeForItem(this);
  return this._createNewEntry(inEntry, attribute, inValue, inType);
};


/**
 * Replaces an existing entry with a new entry, and assigns the new entry
 * to an attribute.
 *
 * @scope    public instance method
 * @param    inEntry    The old entry to be replaced.
 * @param    inAttribute    The attribute to assign the entry to. 
 * @param    inValue    The value to initialize the new entry to.
 * @param    inType    Optional. An item representing a data type.
 * @return   The new replacement entry object.
 * @throws   Throws an Error if no user is logged in.
 */
Item.prototype.replaceEntryWithEntryForAttribute = function (inEntry, inAttribute, inValue, inType) {
  return this._createNewEntry(inEntry, inAttribute, inValue, inType);
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
Item.prototype._createNewEntry = function (previousEntry, attribute, value, type) {

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
  if (this.__myProvisionalFlag) {
    this.__myProvisionalFlag = false;
    this.getWorld()._provisionalItemJustBecameReal(this);
  }
  
  var entry = this.getWorld()._newEntry(this, previousEntry, attribute, value, type);
  this.getWorld().endTransaction();
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
Item.prototype.addConnectionEntry = function (myAttribute, otherItem, otherAttribute) {
  Util.assert(otherItem instanceof Item);
  
  this.getWorld().beginTransaction();
  if (this.__myProvisionalFlag) {
    this.__myProvisionalFlag = false;
    this.getWorld()._provisionalItemJustBecameReal(this);
  }
  if (otherItem.__myProvisionalFlag) {
    otherItem.__myProvisionalFlag = false;
    this.getWorld()._provisionalItemJustBecameReal(otherItem);
  }
  if (!otherAttribute) {
    otherAttribute = this.getWorld().getAttributeCalledUnfiled();
  }

  var entry = this.getWorld()._newConnectionEntry(this, myAttribute, otherItem, otherAttribute);
  this.getWorld().endTransaction();
  return entry;
};


// -------------------------------------------------------------------
// Accessor methods where the answer depends on the retrieval filter
// -------------------------------------------------------------------

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
 * @param    inAttribute    An attribute that we want to know the entries of. 
 * @return   A list of entry objects.
 */
Item.prototype.getEntriesForAttribute = function (inAttribute) {
  Util.assert(inAttribute instanceof Item);
  var listOfEntriesForAttribute = this.__myHashTableOfEntryListsKeyedByAttributeUuid[inAttribute._getUuid()];
  if (!listOfEntriesForAttribute) {
    listOfEntriesForAttribute = [];
  }
  
  var entry;
  var key;
  var filter = this.getWorld().getRetrievalFilter();
  var filteredListOfEntries = [];
  
  switch (filter) {
    case World.RETRIEVAL_FILTER_LAST_EDIT_WINS:
      for (key in listOfEntriesForAttribute) {
        entry = listOfEntriesForAttribute[key];
        if (!entry.hasBeenReplaced() && !entry.hasBeenDeleted()) {
          filteredListOfEntries.push(entry);
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
      Util.assert(false);
      filteredListOfEntries = listOfEntriesForAttribute;
      break;
    default:
      // We should never get here.  If we get here, it's an error.
      Util.assert(false);
      break;
  }
  filteredListOfEntries.sort(ContentRecord.compareOrdinals);
  return filteredListOfEntries;
};


/**
 * Returns a list of all the entries assigned to an item.
 *
 * @scope    public instance method
 * @return   A list of entry objects.
 */
Item.prototype.getEntries = function () {
  var listOfAllEntries = [];
  
  for (var uuid in this.__myHashTableOfEntryListsKeyedByAttributeUuid) {
    var listOfEntriesForAttribute = this.__myHashTableOfEntryListsKeyedByAttributeUuid[uuid];
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
Item.prototype.getAttributes = function () {
  var listOfAttributes = [];
  
  for (var uuid in this.__myHashTableOfEntryListsKeyedByAttributeUuid) {
    var attribute = this.getWorld().getItemFromUuid(uuid);
    listOfAttributes.push(attribute);
  }
  return listOfAttributes;
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
Item.prototype.isProvisional = function() {
  return this.__myProvisionalFlag;
};


/**
 * Returns a display name for the item.
 *
 * @scope    public instance method
 * @return   A string with a display name for the item.
 */
Item.prototype.getDisplayName = function (inDefaultString) {
  var displayName = inDefaultString || "(no name)";
  var listOfNameEntries = this.getNameEntries();
  if (listOfNameEntries.length > 0) {
    var primaryName = listOfNameEntries[0];
    displayName = primaryName.getDisplayString();
  }
  return displayName;
};
  

/**
 * Returns a list of the entries assigned to the "name" attribute.
 *
 * @scope    public instance method
 * @return   A list of the entries assigned to the "name" attribute.
 */
Item.prototype.getNameEntries = function () {
  var attributeCalledName = this.getWorld().getAttributeCalledName();
  return this.getEntriesForAttribute(attributeCalledName);
};


/**
 * Returns a list of the entries assigned to the "short name" attribute.
 *
 * @scope    public instance method
 * @return   A list of the entries assigned to the "short name" attribute.
 */
Item.prototype.getShortNameEntries = function () {
  var attributeCalledShortName = this.getWorld().getAttributeCalledShortName();
  return this.getEntriesForAttribute(attributeCalledShortName);
};


/**
 * Returns just the first entry of an item's attribute.
 *
 * @scope    public instance method
 * @return   A string with a description of the item.
 */
Item.prototype.getSingleEntryFromAttribute = function (inAttribute) {
  var listOfEntries = this.getEntriesForAttribute(inAttribute);
  if (listOfEntries) {
    return listOfEntries[0];
  }
  return null;
};


/**
 * Returns just the first entry's display string of an item's attribute.
 *
 * @scope    public instance method
 * @return   A string with a description of the item.
 */
Item.prototype.getSingleStringValueFromAttribute = function (inAttribute) {
  var singleEntry = this.getSingleEntryFromAttribute(inAttribute);
  if (singleEntry) {return singleEntry.getDisplayString();}
  return "";
};

/**
 * Returns a string describing the item.
 *
 * @scope    public instance method
 * @return   A string with a description of the item.
 */
Item.prototype.toString = function () {
  var returnString = "[Item #" + this.getUniqueKeyString() + " ";
  var attributeCategory = this.getWorld().getAttributeCalledCategory();
  var listOfCategories = this.getEntriesForAttribute(attributeCategory);
  for (var key in listOfCategories) {
    var category = listOfCategories[key];
    if (category instanceof Item) {
      returnString += "(" + category.getDisplayName() + ")";
    }
  }
  returnString += " \"" + this.getDisplayName() + "\"" + "]";
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
Item.prototype.hasAttributeValue = function (inAttribute, inValue) {
  Util.assert(inAttribute instanceof Item, inAttribute + ' is not an item');
  //Util.assert(inValue);
  var entryList = this.getEntriesForAttribute(inAttribute);

  // look at all the entries this item's attribute is assigned to, 
  // and see if one of them is "inEntry"
  for (var key in entryList) {
    var entry = entryList[key];
    if (entry.getValue() == inValue) {
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
Item.prototype.isInCategory = function (inCategory) {
  Util.assert(inCategory instanceof Item);

  var categoryAttribute = this.getWorld().getAttributeCalledCategory();
  return this.hasAttributeValue(categoryAttribute, inCategory);
  
  /*
   * Also returns true if the item has been assigned to some category which is in
   * turn assigned to the given category, and so on, up the chain of category 
   * assignments.
   *
  // look at all the categories this item is assigned to, and see if one of them
  // is in turn in the category "inCategory"
  for (key in entryList) {
    entry = entryList[key];
    // PENDING: 
    //   This will go into an infinite loop if there is ever a cycle in the category 
    //   assignments, like: A is in category B, and B is in C, and C is in A.
    //   We need to use a non-recursive search of the graph.
    // PENDING:
    //   Do we also need to register as an observer of something, so that if we later
    //   become a member of that category in question, then we can notify whoever
    //   is observing us?
    if ((entry.getValue() != this) && (entry.getValue().isInCategory(inCategory))) {
      return true;
    }
  }
  return false;
  */
};
 

// -------------------------------------------------------------------
// Observer/Observable Methods
// -------------------------------------------------------------------

/**
 * Registers an object or method as an observer of this item, so that
 * the observer will be notified when the item changes.
 *
 * @scope    public instance method
 * @param    inObserver    An object or method to be registered as an observer of the item. 
 */
Item.prototype.addObserver = function (inObserver) {
  this.getWorld().addItemObserver(this, inObserver);
};


/**
 * Removes an object or method from the set of observers of this item, so 
 * that the observer will no longer be notified when the item changes.
 *
 * @scope    public instance method
 * @param    inObserver    The object or method to be removed from the set of observers. 
 */
Item.prototype.removeObserver = function (inObserver) {
  this.getWorld().removeItemObserver(this, inObserver);
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
 * @param    inEntry    The entry to be associated with this item. 
 * @param    inAttribute    The attribute that this entry is assigned to. 
 */
Item.prototype._addRehydratedEntry = function (inEntry, inAttribute) {
  this.__addEntryToListOfEntriesForAttribute(inEntry, inAttribute);
};
  

// -------------------------------------------------------------------
// Private Methods
// -------------------------------------------------------------------

/**
 * Adds an entry to the list of entries that have been set for this item.
 * 
 * @scope    private instance method
 * @param    inEntry    The entry to be associated with this item. 
 * @param    attribute    The attribute that this entry is assigned to. 
 */
Item.prototype.__addEntryToListOfEntriesForAttribute = function (inEntry, attribute) {
  var attributeUuid = attribute._getUuid();
  var listOfEntries = this.__myHashTableOfEntryListsKeyedByAttributeUuid[attributeUuid];
  if (!listOfEntries) {
    listOfEntries = [];
    this.__myHashTableOfEntryListsKeyedByAttributeUuid[attributeUuid] = listOfEntries;
  }
  listOfEntries.push(inEntry);
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
