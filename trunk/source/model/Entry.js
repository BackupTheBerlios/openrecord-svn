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
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global ContentRecord */
/*global Util */
/*global World, Item */
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
 * @param    world    The world that this entry is a part of. 
 * @param    uuid    The UUID for this entry. 
 */
Entry.prototype = new ContentRecord();  // makes Entry be a subclass of ContentRecord
function Entry(world, uuid) {
  this._ContentRecord(world, uuid);
 
  this._previousEntry = null;
  this._listOfSubsequentEntries = [];
  this._item = null;

  this._attribute = null;
  this._value = null;
  this._type = null;
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
Entry.prototype._initialize = function(item, previousEntry, attribute, value, type) {
  this._item = item;
  this._attribute = attribute;

  if (previousEntry) {
    this._previousEntry = previousEntry;
    this._previousEntry.__addSubsequentEntry(this);
  } else {
    this._previousEntry = null;
  }
  
  if (type) {
    this._type = type;
  } else {
    if (Util.isNumber(value)) {
      this._type = this.getWorld().getTypeCalledNumber();
    }
    else if (Util.isString(value)) {
      this._type = this.getWorld().getTypeCalledText();
    }
    else if (Util.isDate(value)) {
      this._type = this.getWorld().getTypeCalledDate();
    }
    else if (value instanceof Item) {
      this._type = this.getWorld().getTypeCalledItem();
    }
    else {Util.assert(false, "unknown data type:" + (typeof value) + ' value: ' + value);}
  }
  this._value = value;
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
Entry.prototype._initializeConnection = function(previousEntry, itemOne, attributeOne, itemTwo, attributeTwo) {
  if (previousEntry) {
    this._previousEntry = previousEntry;
    this._previousEntry.__addSubsequentEntry(this);
  } else {
    this._previousEntry = null;
  }

  this._item = [itemOne, itemTwo];
  this._attribute = [attributeOne, attributeTwo];
  this._type = this.getWorld().getTypeCalledConnection();
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
 * @param    item    The item that this is an entry of. 
 * @param    inAttribute    The attribute that this entry is assigned to. May be null. 
 * @param    value    The value to initialize the entry with. 
 * @param    previousEntry    Optional. An old entry that this entry replaces. 
 * @param    type    Optional. An item representing a data type. 
 */
Entry.prototype._rehydrate = function(item, attribute, value, previousEntry, type) {
  this._item = item;
  if (previousEntry) {
    this._previousEntry = previousEntry;
    this._previousEntry.__addSubsequentEntry(this);
  } else {
    this._previousEntry = null;
  }

  this._attribute = attribute;
  this._value = value;
  
  this._type = type;

  if (this._item instanceof Item) {
    this._item._addRehydratedEntry(this, this._attribute);
  } else {
    Util.assert(Util.isArray(this._item));
    Util.assert(this._item.length == 2);
    Util.assert(Util.isArray(this._attribute));
    Util.assert(this._attribute.length == 2);
    
    var firstItem = this._item[0];
    var secondItem = this._item[1];
    firstItem._addRehydratedEntry(this, this._attribute[0]);
    secondItem._addRehydratedEntry(this, this._attribute[1]);
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
Entry.prototype.getItem = function() {
  return this._item;
};


/**
 * Returns the type of this entry
 *
 * @scope    public instance method
 * @return   the type of this entry
 */
Entry.prototype.getType = function() {
  return this._type;
};


/**
 * If this entry was established as the replacement for a previous
 * entry, this method returns the previous entry.
 *
 * @scope    public instance method
 * @return   The previous entry, which this entry replaces. 
 */
Entry.prototype.getPreviousEntry = function() {
  return this._previousEntry;
};


/**
 * Returns the attribute that this entry was assigned to, if any.
 *
 * @scope    public instance method
 * @return   An attribute item.
 */
Entry.prototype.getAttribute = function() {
  return this._attribute;
};


/**
 * If this is a ConnectionEntry, given one of the two connected items, this
 * method returns the attribute that this entry was assigned to in that item.
 *
 * @scope    public instance method
 * @param    item    The item that this is an entry of. 
 * @return   An attribute item.
 */
Entry.prototype.getAttributeForItem = function(item) {
  if (this._item == item) {
    return this._attribute;
  }
  if (Util.isArray(this._item)) {
    if (this._item[0] == item) {
      return this._attribute[0];
    }
    if (this._item[1] == item) {
      return this._attribute[1];
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
Entry.prototype.getConnectedItem = function(item) {
  Util.assert(item instanceof Item);
  if (this._item == item) {
    if (this._type == this.getWorld().getTypeCalledItem()) {
      return this._value;
    }
  }
  if (Util.isArray(this._item)) {
    if (this._item[0] == item) {
      return this._item[1];
    }
    if (this._item[1] == item) {
      return this._item[0];
    }
  }
  return null;
};


/**
 * Returns the value that this entry holds.
 *
 * @scope    public instance method
 * @param    item    The item that this is an entry of. 
 * @return   The value this entry was initialized to hold.
 */
Entry.prototype.getValue = function(item) {
  if (Util.isArray(this._item)) {
    if (this._item[0] == item) {
      return this._item[1];
    }
    if (this._item[1] == item) {
      return this._item[0];
    }
    Util.assert(false, "Entry.getValue() was called on a connection entry, but was not passed an item as a parameter.");
  }
  return this._value; 
};


/**
 * Returns the value of this entry as a string.
 *
 * @scope    public instance method
 * @return   A string representing the literal data in this entry.
 */
Entry.prototype.getDisplayString = function(callingItem) {
  var returnString = "";
  switch (this._type) {
    case this.getWorld().getTypeCalledNumber():
      var originalString = this._value.toString();
      var arrayOfTwoStrings = originalString.split('.');
      Util.assert(arrayOfTwoStrings.length < 3);
      wholeNumberString = arrayOfTwoStrings[0];
      fractionalNumberString = null;
      if (arrayOfTwoStrings.length == 2) {
        fractionalNumberString = arrayOfTwoStrings[1];
      }
      var length = wholeNumberString.length;
      if (length > 3) {
        var sections = [];
        var lengthOfFirstSection = length % 3;
        var plusOneIfFirstSection = (lengthOfFirstSection > 0) ? 1 : 0;
        var numberOfSections = ((length - lengthOfFirstSection) / 3) + plusOneIfFirstSection;
        for (i = 0; i < numberOfSections; ++i) {
          var end = length - (i * 3);
          var start = end - 3;
          if (start < 0) { start = 0; }
          sections[i] = wholeNumberString.slice(start, end);
        }
        sections.reverse();
        returnString = sections.join(',');
      } else {
        returnString = wholeNumberString;
      }
      if (fractionalNumberString) {
        returnString += '.' + fractionalNumberString;
      }
      break;
    case this.getWorld().getTypeCalledText():
      returnString = this._value;
      break;
    case this.getWorld().getTypeCalledDate():
      var aDate = this._value;
      // returnString = Util.getStringMonthDayYear(aDate);
      returnString = aDate.toShortLocaleDateString();
      break;
    case this.getWorld().getTypeCalledItem():
      returnString = this._value.getDisplayString();
      break;
    case this.getWorld().getTypeCalledConnection():
      var firstItem = this._item[0];
      var secondItem = this._item[1];
      if (callingItem) {
        if (callingItem == firstItem) {returnString = secondItem.getDisplayString();}
        else if (callingItem == secondItem) {returnString = firstItem.getDisplayString();}
        else {Util.assert(false, "callingItem isn't part of this Entry");}
      }
      else {
        returnString = 'connection between "' + firstItem.getDisplayString() + '" and "' + secondItem.getDisplayString() + '"';
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
Entry.prototype.toString = function() {
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
Entry.prototype.hasBeenReplaced = function() {
  var listOfEntries = this._listOfSubsequentEntries;

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
 * @param    entry    The entry that replaces this one.
 */
Entry.prototype.__addSubsequentEntry = function(entry) {
  this._listOfSubsequentEntries.push(entry);
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
