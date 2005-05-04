/*****************************************************************************
 Value.js
 
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
//   IdentifiedRecord.js
// -------------------------------------------------------------------

/**
 * Instances of the Value class represent literal values, like strings
 * and numbers.
 *
 * WARNING: This constructor method should be called ONLY from a 
 * VirtualServer implementation.
 *
 * If you're writing code in a view class, instead of calling this
 * constructor, call a method on Item, like item.addAttributeValue()
 *
 * @scope    protected instance constructor
 * @param    inWorld    The world that this value is a part of. 
 * @param    inUuid    The UUID for this value. 
 */
Value.prototype = new IdentifiedRecord();  // makes Value be a subclass of IdentifiedRecord
function Value(inWorld, inUuid) {
  this._IdentifiedRecord(inWorld, inUuid);
 
  this.__myPreviousValue = null;
  this.__myListOfSubsequentValues = [];
  this.__myItem = null;

  this.__myAttribute = null;
  this.__myContentData = null;
}


/**
 * Initializes a new value that has just been created by a user action.
 *
 * WARNING: This method should be called ONLY from a 
 * VirtualServer implementation.
 *
 * This method is NOT used for setting the properties of values that
 * are being rehydrated from a dehydrated JSON string.  For that, you
 * need to call value.rehydrate();
 *
 * @scope    protected instance method
 * @param    inItemOrValue    The item that this is a value of, or the old value that this value replaces. 
 * @param    inAttribute    The attribute that this value is assigned to. May be null. 
 * @param    inContentData    The content datat to initialize the value with. 
 */
Value.prototype._initialize = function (inItemOrValue, inAttribute, inContentData) {
  this._initializeIdentifiedRecord();

  if (inItemOrValue instanceof Value) {
    this.__myPreviousValue = inItemOrValue;
    this.__myItem = this.__myPreviousValue.getItem();
    this.__myPreviousValue.__addSubsequentValue(this);
  } else {
    this.__myPreviousValue = null;
    this.__myItem = inItemOrValue;
  }
  
  this.__myAttribute = inAttribute;

  if (Util.isString(inContentData)) {
    this.__myContentData = Util.getCleanString(inContentData);
  } else {
    this.__myContentData = inContentData;
  }
};


/**
 * Sets the properties of a newly rehydrated value object.
 *
 * WARNING: This method should be called ONLY from a 
 * VirtualServer implementation.
 *
 * This method should only be called from VirtualServer code that is
 * rehydrating dehydrated value objects. 
 *
 * @scope    protected instance method
 * @param    inItemOrValue    The item that this is a value of, or the old value that this value replaces. 
 * @param    inAttribute    The attribute that this value is assigned to. May be null. 
 * @param    inContentData    The content data to initialize the value with. 
 * @param    inTimestamp    A Date object with the creation timestamp for this value. 
 * @param    inUserstamp    The user who created this value. 
 */
Value.prototype._rehydrate = function (inItemOrValue, inAttribute, inContentData, inTimestamp, inUserstamp) {
  this._rehydrateIdentifiedRecord(inTimestamp, inUserstamp);

  if (inItemOrValue instanceof Value) {
    this.__myPreviousValue = inItemOrValue;
    this.__myItem = this.__myPreviousValue.getItem();
    this.__myPreviousValue.__addSubsequentValue(this);
  } else {
    this.__myPreviousValue = null;
    this.__myItem = inItemOrValue;
  }

  this.__myAttribute = inAttribute;
  this.__myContentData = inContentData;

  this.__myItem._addRehydratedValue(this);
};


// -------------------------------------------------------------------
// Accessor methods
// -------------------------------------------------------------------

/**
 * Returns the item that this is a value of.
 *
 * @scope    public instance method
 * @return   The item that this is a value of.
 */
Value.prototype.getItem = function () {
  return this.__myItem;
};


/**
 * If this value was established as the replacement for a previous
 * value, this method returns the previous value.
 *
 * @scope    public instance method
 * @return   The previous value, which this value replaces. 
 */
Value.prototype.getPreviousValue = function () {
  return this.__myPreviousValue;
};


/**
 * Returns the attribute that this value was assigned to, if any.
 *
 * @scope    public instance method
 * @return   An attribute item.
 */
Value.prototype.getAttribute = function () {
  return this.__myAttribute;
};


/**
 * Returns the content data that this value holds.
 *
 * @scope    public instance method
 * @return   The content data this value was initialized to hold.
 */
Value.prototype.getContentData = function () {
  return this.__myContentData;
};


/**
 * Returns the content data of this value as a string.
 *
 * @scope    public instance method
 * @return   A string representing the literal data in this value.
 */
Value.prototype.getDisplayString = function () {
  var returnString = "";
  if (this.__myContentData instanceof Item) {
    returnString += this.__myContentData.getDisplayName();
  } else {
    returnString += "" + this.__myContentData;
  }
  return returnString;
};


/**
 * Returns a string describing the item.
 *
 * @scope    public instance method
 * @return   A string with a description of the item.
 */
Value.prototype.toString = function () {
  var returnString = "[Value #" + this.getUniqueKeyString() + 
    " \"" + this.getDisplayString() + "\"" + "]";
  return returnString;
};


/**
 * Returns true if the value has been replaced by a subsequent value.
 *
 * @scope    public instance method
 * @return   True if this value has been replaced. False if it has not.
 */
Value.prototype.hasBeenReplaced = function () {
  var listOfValues = this.__myListOfSubsequentValues;

  if (!listOfValues || listOfValues.length === 0) {
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
 * Called by a subsquent value, to tell this value that it has been replaced.
 *
 * @scope    private instance method
 * @param    inValue    The value that replaces this one.
 */
Value.prototype.__addSubsequentValue = function (inValue) {
  this.__myListOfSubsequentValues.push(inValue);
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
