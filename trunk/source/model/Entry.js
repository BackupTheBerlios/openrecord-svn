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
// Provides and Requires
// -------------------------------------------------------------------
dojo.provide("orp.model.Entry");
dojo.require("orp.model.ContentRecord");
dojo.require("orp.model.World");
dojo.require("orp.lang.Lang");


// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global ContentRecord */
/*global World, Item */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Constructor
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
orp.model.Entry = function(world, uuid) {
  orp.model.ContentRecord.call(this, world, uuid);
 
  this._previousEntry = null;
  this._listOfSubsequentEntries = [];
  this._item = null;

  this._attribute = null;
  this._value = null;
  this._type = null;
};

dj_inherits(orp.model.Entry, orp.model.ContentRecord);  // makes Entry be a subclass of ContentRecord


// -------------------------------------------------------------------
// Private methods
// -------------------------------------------------------------------
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
orp.model.Entry.prototype._initialize = function(item, previousEntry, attribute, value, type) {
  this._item = item;
  this._attribute = attribute;

  if (previousEntry) {
    this._previousEntry = previousEntry;
    this._previousEntry._addSubsequentEntry(this);
  } else {
    this._previousEntry = null;
  }
  
  if (type) {
    this._type = type;
  } else {
    if (orp.util.isNumber(value)) {
      this._type = this.getWorld().getTypeCalledNumber();
    }
    else if (orp.util.isString(value)) {
      this._type = this.getWorld().getTypeCalledText();
    }
    else if (orp.util.isDate(value)) {
      this._type = this.getWorld().getTypeCalledDate();
    }
    else if (value instanceof orp.model.Item) {
      this._type = this.getWorld().getTypeCalledItem();
    }
    else {orp.lang.assert(false, "unknown data type:" + (typeof value) + ' value: ' + value);}
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
orp.model.Entry.prototype._initializeConnection = function(previousEntry, itemOne, attributeOne, itemTwo, attributeTwo) {
  if (previousEntry) {
    this._previousEntry = previousEntry;
    this._previousEntry._addSubsequentEntry(this);
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
orp.model.Entry.prototype._rehydrate = function(item, attribute, value, previousEntry, type) {
  this._item = item;
  if (previousEntry) {
    this._previousEntry = previousEntry;
    this._previousEntry._addSubsequentEntry(this);
  } else {
    this._previousEntry = null;
  }

  this._attribute = attribute;
  this._value = value;
  
  this._type = type;

  if (this._item instanceof orp.model.Item) {
    this._item._addRehydratedEntry(this, this._attribute);
  } else {
    orp.lang.assertType(this._item, Array);
    orp.lang.assertType(this._attribute, Array);
    orp.lang.assert(this._item.length == 2);
    orp.lang.assert(this._attribute.length == 2);
    
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
orp.model.Entry.prototype.getItem = function() {
  return this._item;
};


/**
 * Returns the type of this entry
 *
 * @scope    public instance method
 * @return   the type of this entry
 */
orp.model.Entry.prototype.getType = function() {
  return this._type;
};


/**
 * If this entry was established as the replacement for a previous
 * entry, this method returns the previous entry.
 *
 * @scope    public instance method
 * @return   The previous entry, which this entry replaces. 
 */
orp.model.Entry.prototype.getPreviousEntry = function() {
  return this._previousEntry;
};


/**
 * Returns the attribute that this entry was assigned to, if any.
 *
 * @scope    public instance method
 * @return   An attribute item.
 */
orp.model.Entry.prototype.getAttribute = function() {
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
orp.model.Entry.prototype.getAttributeForItem = function(item) {
  if (this._item == item) {
    return this._attribute;
  }
  if (orp.util.isArray(this._item)) {
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
orp.model.Entry.prototype.getConnectedItem = function(item) {
  orp.lang.assert(item instanceof orp.model.Item);
  if (this._item == item) {
    if (this._type == this.getWorld().getTypeCalledItem()) {
      return this._value;
    }
  }
  if (dojo.lang.isArray(this._item)) {
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
orp.model.Entry.prototype.getValue = function(item) {
  if (orp.util.isArray(this._item)) {
    if (this._item[0] == item) {
      return this._item[1];
    }
    if (this._item[1] == item) {
      return this._item[0];
    }
    orp.lang.assert(false, "orp.model.Entry.getValue() was called on a connection entry, but was not passed an item as a parameter.");
  }
  return this._value; 
};


/**
 * Returns the value of this entry as a string.
 *
 * @scope    public instance method
 * @return   A string representing the literal data in this entry.
 */
orp.model.Entry.prototype.getDisplayString = function(callingItem) {
  var returnString = "";
  switch (this._type) {
    case this.getWorld().getTypeCalledNumber():
      var originalString = this._value.toString();
      var arrayOfTwoStrings = originalString.split('.');
      orp.lang.assert(arrayOfTwoStrings.length < 3);
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
      // returnString = orp.util.getStringMonthDayYear(aDate);
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
        else {orp.lang.assert(false, "callingItem isn't part of this orp.model.Entry");}
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
orp.model.Entry.prototype.toString = function() {
  var returnString = "[Entry #" + this.getUuid() + 
    " \"" + this.getDisplayString() + "\"" + "]";
  return returnString;
};


/**
 * Returns true if the entry has been replaced by a subsequent entry.
 *
 * @scope    public instance method
 * @return   True if this entry has been replaced. False if it has not.
 */
orp.model.Entry.prototype.hasBeenReplaced = function() {
  var listOfEntries = this._listOfSubsequentEntries;

  if (!listOfEntries || listOfEntries.length === 0) {
    return false;
  }
  
  var filter = this.getWorld().getRetrievalFilter();

  switch (filter) {
    case orp.model.World.RetrievalFilter.LAST_EDIT_WINS:
      return true;
    case orp.model.World.RetrievalFilter.SINGLE_USER:
      // PENDING: This still needs to be implemented.
      orp.lang.assert(false);
      break;
    case orp.model.World.RetrievalFilter.DEMOCRATIC:
      // PENDING: This still needs to be implemented.
      orp.lang.assert(false);
      break;
    case orp.model.World.RetrievalFilter.UNABRIDGED:
      return false;
    default:
      // We should never get here.  If we get here, it's an error.
      orp.lang.assert(false);
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
orp.model.Entry.prototype._addSubsequentEntry = function(entry) {
  this._listOfSubsequentEntries.push(entry);
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
