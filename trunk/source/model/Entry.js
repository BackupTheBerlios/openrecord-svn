/*****************************************************************************
 Entry.js
 
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
//   World.js
//   ContentRecord.js
// -------------------------------------------------------------------

/**
 * Instances of the Entry class hold literal values (like strings
 * and numbers), or reference values (pointers to Items).
 *
 * WARNING: This constructor method should be called ONLY from a 
 * VirtualServer implementation.
 *
 * If you're writing code in a view class, instead of calling this
 * constructor, call a method on Item, like item.addAttributeEntry()
 *
 * @scope    protected instance constructor
 * @param    inWorld    The world that this entry is a part of. 
 * @param    inUuid    The UUID for this entry. 
 */
Entry.prototype = new ContentRecord();  // makes Entry be a subclass of ContentRecord
function Entry(inWorld, inUuid) {
  this._ContentRecord(inWorld, inUuid);
 
  this.__myPreviousEntry = null;
  this.__myListOfSubsequentEntries = [];
  this.__myItem = null;

  this.__myAttribute = null;
  this.__myValue = null;
  this._myType = null;
}


/**
 * Initializes a new entry that has just been created by a user action.
 *
 * WARNING: This method should be called ONLY from a 
 * VirtualServer implementation.
 *
 * This method is NOT used for setting the properties of entrys that
 * are being rehydrated from a dehydrated JSON string.  For that, you
 * need to call entry.rehydrate();
 *
 * @scope    protected instance method
 * @param    inItemOrEntry    The item that this is a entry of, or the old entry that this entry replaces. 

 * @param    item    The item that this is an entry of. 
 * @param    previousEntry    Optional. The old entry that this entry is replacing. 
 * @param    attribute    The attribute that this entry is assigned to. May be null. 
 * @param    value    The value to initialize the entry with. 
 * @param    type    Optional.  The data type to interpret the value as. 
 */
Entry.prototype._initialize = function (item, previousEntry, attribute, value, type) {
  this.__myItem = item;
  this.__myAttribute = attribute;

  if (previousEntry) {
    this.__myPreviousEntry = previousEntry;
    this.__myPreviousEntry.__addSubsequentEntry(this);
  } else {
    this.__myPreviousEntry = null;
  }
  
  if (type) {
    this._myType = type;
  } else {
    if (Util.isNumber(value)) {
      this._myType = this.getWorld().getTypeCalledNumber();
    }
    else if (Util.isString(value)) {
      this._myType = this.getWorld().getTypeCalledText();
    }
    else if (Util.isDate(value)) {
      this._myType = this.getWorld().getTypeCalledDate();
    }
    else if (value instanceof Item) {
      this._myType = this.getWorld().getTypeCalledItem();
    }
    else {Util.assert(false, "unknown data type:" + (typeof value) + ' value: ' + value);}
  }
  if (Util.isString(value)) {
    this.__myValue = Util.getCleanString(value);
  } else {
    this.__myValue = value;
  }
};


/**
 * Initializes a new entry that has just been created by a user action.
 *
 * WARNING: This method should be called ONLY from a 
 * VirtualServer implementation.
 *
 * This method is NOT used for setting the properties of entrys that
 * are being rehydrated from a dehydrated JSON string.  For that, you
 * need to call entry.rehydrate();
 *
 * @scope    protected instance method
 * @param    previousEntry    The entry that this entry will replace. Can be null.
 * @param    itemOne    One of the two items that this entry will connect. 
 * @param    attributeOne    The attribute of itemOne that this entry will be assigned to. 
 * @param    itemTwo    One of the two items that this entry will connect. 
 * @param    attributeTwo    Optional. The attribute of itemTwo that this entry will be assigned to.  
 */
Entry.prototype._initializeConnection = function (previousEntry, itemOne, attributeOne, itemTwo, attributeTwo) {
  if (previousEntry) {
    this.__myPreviousEntry = previousEntry;
    this.__myPreviousEntry.__addSubsequentEntry(this);
  } else {
    this.__myPreviousEntry = null;
  }

  this.__myItem = [itemOne, itemTwo];
  this.__myAttribute = [attributeOne, attributeTwo];
  this._myType = this.getWorld().getTypeCalledConnection();
};


/**
 * Sets the properties of a newly rehydrated entry object.
 *
 * WARNING: This method should be called ONLY from a 
 * VirtualServer implementation.
 *
 * This method should only be called from VirtualServer code that is
 * rehydrating dehydrated entry objects. 
 *
 * @scope    protected instance method
 * @param    inItem    The item that this is an entry of. 
 * @param    inAttribute    The attribute that this entry is assigned to. May be null. 
 * @param    inValue    The value to initialize the entry with. 
 * @param    inPreviousEntry    Optional. An old entry that this entry replaces. 
 * @param    inType    Optional. An item representing a data type. 
 */
Entry.prototype._rehydrate = function (inItem, inAttribute, inValue, inPreviousEntry, inType) {
  this.__myItem = inItem;
  if (inPreviousEntry) {
    this.__myPreviousEntry = inPreviousEntry;
    this.__myPreviousEntry.__addSubsequentEntry(this);
  } else {
    this.__myPreviousEntry = null;
  }

  this.__myAttribute = inAttribute;
  this.__myValue = inValue;
  
  this._myType = inType;

  if (this.__myItem instanceof Item) {
    this.__myItem._addRehydratedEntry(this, inAttribute);
  } else {
    Util.assert(Util.isArray(this.__myItem));
    Util.assert(this.__myItem.length == 2);
    Util.assert(Util.isArray(this.__myAttribute));
    Util.assert(this.__myAttribute.length == 2);
    
    var firstItem = this.__myItem[0];
    var secondItem = this.__myItem[1];
    firstItem._addRehydratedEntry(this, this.__myAttribute[0]);
    secondItem._addRehydratedEntry(this, this.__myAttribute[1]);
  }
};


// -------------------------------------------------------------------
// Accessor methods
// -------------------------------------------------------------------

/**
 * Returns the item that this is a entry of.
 *
 * @scope    public instance method
 * @return   The item that this is a entry of.
 */
Entry.prototype.getItem = function () {
  return this.__myItem;
};


/**
 * Returns the type of this entry
 *
 * @scope    public instance method
 * @return   the type of this entry
 */
Entry.prototype.getType = function () {
  return this._myType;
};


/**
 * If this entry was established as the replacement for a previous
 * entry, this method returns the previous entry.
 *
 * @scope    public instance method
 * @return   The previous entry, which this entry replaces. 
 */
Entry.prototype.getPreviousEntry = function () {
  return this.__myPreviousEntry;
};


/**
 * Returns the attribute that this entry was assigned to, if any.
 *
 * @scope    public instance method
 * @return   An attribute item.
 */
Entry.prototype.getAttribute = function () {
  return this.__myAttribute;
};


/**
 * If this is a ConnectionEntry, given one of the two connected items, this
 * method returns the attribute that this entry was assigned to in that item.
 *
 * @scope    public instance method
 * @param    item    The item that this is an entry of. 
 * @return   An attribute item.
 */
Entry.prototype.getAttributeForItem = function (item) {
  if (this.__myItem == item) {
    return this.__myAttribute;
  }
  if (Util.isArray(this.__myItem)) {
    if (this.__myItem[0] == item) {
      return this.__myAttribute[0];
    }
    if (this.__myItem[1] == item) {
      return this.__myAttribute[1];
    }
  }
  return null;
};


/**
 * If this is a ConnectionEntry, given one of the two connected items, this
 * method returns the other connected item.
 *
 * @scope    public instance method
 * @param    item    The item that this is an entry of. 
 * @return   The item that is connected to the given item.
 */
Entry.prototype.getConnectedItem = function (item) {
  Util.assert(item instanceof Item);
  if (this.__myItem == item) {
    if (this._myType == this.getWorld().getTypeCalledItem()) {
      return this.__myValue;
    }
  }
  if (Util.isArray(this.__myItem)) {
    if (this.__myItem[0] == item) {
      return this.__myItem[1];
    }
    if (this.__myItem[1] == item) {
      return this.__myItem[0];
    }
  }
  return null;
};


/**
 * Returns the value that this entry holds.
 *
 * @scope    public instance method
 * @return   The value this entry was initialized to hold.
 */
Entry.prototype.getValue = function () {
  return this.__myValue;
};


/**
 * Returns the value of this entry as a string.
 *
 * @scope    public instance method
 * @return   A string representing the literal data in this entry.
 */
Entry.prototype.getDisplayString = function (myItem) {
  var returnString = "";
  switch (this._myType) {
    case this.getWorld().getTypeCalledNumber():
      returnString = "" + this.__myValue;
      break;
    case this.getWorld().getTypeCalledText():
      returnString = this.__myValue;
      break;
    case this.getWorld().getTypeCalledDate():
      var aDate = this.__myValue;
      returnString = Util.ABBREV_MONTHS_ARRAY[aDate.getMonth()] + ' ' + aDate.getDate() + ', '+ (aDate.getYear()+1900);
      break;
    case this.getWorld().getTypeCalledItem():
      returnString = this.__myValue.getDisplayName();
      break;
    case this.getWorld().getTypeCalledConnection():
      var firstItem = this.__myItem[0];
      var secondItem = this.__myItem[1];
      if (myItem) {
        if (myItem == firstItem) {returnString = secondItem.getDisplayName();}
        else if (myItem == secondItem) {returnString = firstItem.getDisplayName();}
        else {Util.assert(false, "myItem isn't part of this Entry");}
      }
      else {
        returnString = 'connection between "' + firstItem.getDisplayName() + '" and "' + secondItem.getDisplayName() + '"';
      }
      break;
  }
  return returnString;
};


/**
 * Returns a string describing the item.
 *
 * @scope    public instance method
 * @return   A string with a description of the item.
 */
Entry.prototype.toString = function () {
  var returnString = "[Entry #" + this.getUniqueKeyString() + 
    " \"" + this.getDisplayString() + "\"" + "]";
  return returnString;
};


/**
 * Returns true if the entry has been replaced by a subsequent entry.
 *
 * @scope    public instance method
 * @return   True if this entry has been replaced. False if it has not.
 */
Entry.prototype.hasBeenReplaced = function () {
  var listOfEntries = this.__myListOfSubsequentEntries;

  if (!listOfEntries || listOfEntries.length === 0) {
    return false;
  }
  
  var filter = this.getWorld().getRetrievalFilter();

  switch (filter) {
    case World.RETRIEVAL_FILTER_LAST_EDIT_WINS:
      return true;
    case World.RETRIEVAL_FILTER_SINGLE_USER:
      // PENDING: This still needs to be implemented.
      Util.assert(false);
      break;
    case World.RETRIEVAL_FILTER_DEMOCRATIC:
      // PENDING: This still needs to be implemented.
      Util.assert(false);
      break;
    case World.RETRIEVAL_FILTER_UNABRIDGED:
      return false;
    default:
      // We should never get here.  If we get here, it's an error.
      Util.assert(false);
      break;
  }
};

// -------------------------------------------------------------------
// Private methods
// -------------------------------------------------------------------

/**
 * Called by a subsquent entry, to tell this entry that it has been replaced.
 *
 * @scope    private instance method
 * @param    inEntry    The entry that replaces this one.
 */
Entry.prototype.__addSubsequentEntry = function (inEntry) {
  this.__myListOfSubsequentEntries.push(inEntry);
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
