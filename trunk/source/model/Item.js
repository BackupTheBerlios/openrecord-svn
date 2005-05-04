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
//   IdentifiedRecord.js
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
Item.prototype = new IdentifiedRecord();  // makes Item be a subclass of IdentifiedRecord
function Item(inWorld, inUuid) {
  this._IdentifiedRecord(inWorld, inUuid);
  
  this.__myListOfEntries = null;
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
 */
Item.prototype._initialize = function (inObserver) {
  this._initializeIdentifiedRecord();

  this.__myListOfEntries = [];
  if (inObserver) {
    this.addObserver(inObserver);
  }
};


/**
 * Sets the properties of a newly rehydrated item object.
 *
 * WARNING: This method should be called ONLY from a 
 * VirtualServer implementation.
 *
 * This method should only be called from VirtualServer code that is
 * rehydrating dehydrated item objects. 
 *
 * @scope    protected instance method
 * @param    inTimestamp    A Date object with the creation timestamp for this item. 
 * @param    inUserstamp    The user who created this item. 
 */
Item.prototype._rehydrate = function (inTimestamp, inUserstamp) {
  this._rehydrateIdentifiedRecord(inTimestamp, inUserstamp);
  
  this.__myListOfEntries = [];
};


// -------------------------------------------------------------------
// Entry adding methods
// -------------------------------------------------------------------

/**
 * Creates a new entry object and adds the new entry to the item's 
 * list of entries.
 *
 * @scope    public instance method
 * @param    inContentData    The content data to initialize the entry to.
 * @return   An entry object.
 */
Item.prototype.addEntry = function (inContentData) {
  var attributeCalledUnfiled = this.getWorld().getAttributeCalledUnfiled();
  return this.addAttributeEntry(attributeCalledUnfiled, inContentData);
};


/**
 * Assigns an entry to an attribute in this item.
 *
 * Given an attribute and content data, creates an entry object with the 
 * content data, and sets the item's attribute to the new entry.
 * For example, to make a Kermit green:
 * <pre>
 *    kermit.addAttributeEntry(color, "green");
 * </pre>
 * Attributes can always have more than one assigned entry, so
 * you can make Kermit be both blue and green by doing:
 * <pre>
 *    kermit.addAttributeEntry(color, "green");
 *    kermit.addAttributeEntry(color, "blue");
 * </pre>
 *
 * @scope    public instance method
 * @param    inAttribute    The attribute to assign the entry to. 
 * @param    inContentData    The content data to initialize the entry with.
 * @return   An entry object.
 */
Item.prototype.addAttributeEntry = function (inAttribute, inContentData) {
  return this.replaceEntryWithAttributeEntry(null, inAttribute, inContentData);
};


/**
 * Replaces an existing entry with a new entry.
 *
 * @scope    public instance method
 * @param    inEntry    The old entry to be replaced.
 * @param    inContentData    The content data to initialize the new entry to.
 * @return   The new replacement entry object.
 */
Item.prototype.replaceEntry = function (inEntry, inContentData) {
  var attribute = inEntry.getAttribute();
  return this.replaceEntryWithAttributeEntry(inEntry, attribute, inContentData);
};


/**
 * Replaces an existing entry with a new entry, and assigns the new entry
 * to an attribute.
 *
 * @scope    public instance method
 * @param    inEntry    The old entry to be replaced.
 * @param    inAttribute    The attribute to assign the entry to. 
 * @param    inContentData    The content data to initialize the new entry to.
 * @return   The new replacement entry object.
 */
Item.prototype.replaceEntryWithAttributeEntry = function (inEntry, inAttribute, inContentData) {
  var itemOrEntry = inEntry || this;
  var entry = this.getWorld()._newEntry(itemOrEntry, inAttribute, inContentData);
  this.__myListOfEntries.push(entry);
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
  var listOfEntriesForAttribute = [];
  var listOfEntries = this.getEntries();
  for (var key in listOfEntries) {
    var entry = listOfEntries[key];
    var attribute = entry.getAttribute();
    if (attribute == inAttribute) {
      listOfEntriesForAttribute.push(entry);
    }
  }
  listOfEntriesForAttribute.sort(IdentifiedRecord.compareOrdinals);
  return listOfEntriesForAttribute;
};


/**
 * Returns a list of all the entries assigned to an item.
 *
 * @scope    public instance method
 * @return   A list of entry objects.
 */
Item.prototype.getEntries = function () {
  var filter = this.getWorld().getRetrievalFilter();
  var listOfEntries = this.__myListOfEntries;
  var filteredListOfEntries = [];
  var key;
  var entry;
  
  switch (filter) {
    case World.RETRIEVAL_FILTER_LAST_EDIT_WINS:
      for (key in listOfEntries) {
        entry = listOfEntries[key];
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
      filteredListOfEntries = listOfEntries;
      break;
    default:
      // We should never get here.  If we get here, it's an error.
      Util.assert(false);
      break;
  }
  filteredListOfEntries.sort(IdentifiedRecord.compareOrdinals);
  return filteredListOfEntries;
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
  var listOfEntries = this.getEntries();
  for (var key in listOfEntries) {
    var entry = listOfEntries[key];
    var attribute = entry.getAttribute();
    Util.addObjectToSet(attribute, listOfAttributes);
  }
  listOfAttributes.sort(IdentifiedRecord.compareOrdinals);
  return listOfAttributes;
};


// -------------------------------------------------------------------
// Attribute accessor methods
// -------------------------------------------------------------------

/**
 * Returns a display name for the item.
 *
 * @scope    public instance method
 * @return   A string with a display name for the item.
 */
Item.prototype.getDisplayName = function (inDefaultString) {
  var displayName = inDefaultString || "(no name)";
  var listOfNameEntries = this.getName();
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
Item.prototype.getName = function (inDefaultString) {
  var attributeCalledName = this.getWorld().getAttributeCalledName();
  return this.getEntriesForAttribute(attributeCalledName);
};


/**
 * Returns a list of the entries assigned to the "short name" attribute.
 *
 * @scope    public instance method
 * @return   A list of the entries assigned to the "short name" attribute.
 */
Item.prototype.getShortName = function (inDefaultString) {
  var attributeCalledShortName = this.getWorld().getAttributeCalledShortName();
  return this.getEntriesForAttribute(attributeCalledShortName);
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
    Util.assert(category instanceof Item);
    returnString += "(" + category.getDisplayName() + ")";
  }
  returnString += " \"" + this.getDisplayName() + "\"" + "]";
  return returnString; 
};


// -------------------------------------------------------------------
// Non-Attribute Accessor Methods
// -------------------------------------------------------------------

/**
 * Given a category, returns "true" if the item has been assigned to 
 * that category.
 *
 * Also returns true if the item has been assigned to some category which is in
 * turn assigned to the given category, and so on, up the chain of category 
 * assignments.
 *
 * @scope    public instance method
 * @return   A boolean.  True if the item has been assigned to the category.
 */
Item.prototype.isInCategory = function (inCategory) {
  Util.assert(inCategory instanceof Item);

  var categoryAttribute = this.getWorld().getAttributeCalledCategory();
  var entryList = this.getEntriesForAttribute(categoryAttribute);
  var key;
  var entry;
  
  // look at all the categories this item is assigned to, and see if one of them is "inCategory"
  for (key in entryList) {
    entry = entryList[key];
    if (entry.getContentData() == inCategory) {
      return true;
    }
  }
  
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
    if ((entry.getContentData() != this) && (entry.getContentData().isInCategory(inCategory))) {
      return true;
    }
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
 */
Item.prototype._addRehydratedEntry = function (inEntry) {
  this.__myListOfEntries.push(inEntry);
};
  

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
