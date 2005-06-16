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
 * @param    inAttribute    The attribute that this entry is assigned to. May be null. 
 * @param    inValue    The value to initialize the entry with. 
* @param    inType    Optional.  The data type to interpret the value as. 
 */
Entry.prototype._initialize = function (inItemOrEntry, inAttribute, inValue, inType) {
  this._initializeContentRecord();

  if (inItemOrEntry instanceof Entry) {
    this.__myPreviousEntry = inItemOrEntry;
    this.__myItem = this.__myPreviousEntry.getItem();
    this.__myPreviousEntry.__addSubsequentEntry(this);
  } else {
    this.__myPreviousEntry = null;
    this.__myItem = inItemOrEntry;
  }
  
  this.__myAttribute = inAttribute;
  if (inType) {
    this._myType = inType;
  }
  else {
    var contentData = inValue;
    if (Util.isNumber(contentData)) {
      this._myType = this.getWorld().getTypeCalledNumber();
    }
    else if (Util.isString(contentData)) {
      this._myType = this.getWorld().getTypeCalledText();
    }
    else if (Util.isDate(contentData)) {
      this._myType = this.getWorld().getTypeCalledDate();
    }
    else if (contentData instanceof Item) {
      this._myType = this.getWorld().getTypeCalledItem();
    }
    else {Util.assert(false, "unknown data type");}
  }
  if (Util.isString(inValue)) {
    this.__myValue = Util.getCleanString(inValue);
  } else {
    this.__myValue = inValue;
  }
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
 * @param    inItemOrEntry    The item that this is a entry of, or the old entry that this entry replaces. 
 * @param    inAttribute    The attribute that this entry is assigned to. May be null. 
 * @param    inValue    The value to initialize the entry with. 
 * @param    inTimestamp    A Date object with the creation timestamp for this entry. 
 * @param    inUserstamp    The user who created this entry. 
 */
Entry.prototype._rehydrate = function (inItemOrEntry, inAttribute, inValue, inTimestamp, inUserstamp, inType) {
  this._rehydrateContentRecord(inTimestamp, inUserstamp);

  if (inItemOrEntry instanceof Entry) {
    this.__myPreviousEntry = inItemOrEntry;
    this.__myItem = this.__myPreviousEntry.getItem();
    this.__myPreviousEntry.__addSubsequentEntry(this);
  } else {
    this.__myPreviousEntry = null;
    this.__myItem = inItemOrEntry;
  }

  this.__myAttribute = inAttribute;
  this.__myValue = inValue;
  
  this._myType = inType;

  this.__myItem._addRehydratedEntry(this);
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
Entry.prototype.getDisplayString = function () {
  var returnString = "";
  if (this.__myValue instanceof Item) {
    returnString += this.__myValue.getDisplayName();
  } else {
    returnString += "" + this.__myValue;
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
