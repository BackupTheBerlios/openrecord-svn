/*****************************************************************************
 ProxyEntry.js
 
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
dojo.provide("orp.model.ProxyEntry");
dojo.require("orp.model.Entry");


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------
/**
 * For each Connection Entry, two instances of the ProxyEntry class 
 * serve as proxies between the connected items and the Connection Entry.
 *
 * <pre>
 *   item1 -- proxyEntry1 -- connectionEntry -- proxyEntry2 -- item2
 * </pre>
 *
 * @scope    protected instance constructor
 * @param    connectionEntry    The connection entry that this proxy is a proxy for. 
 * @param    item    The item that this is an entry of. 
 * @param    attribute    That attribute that this is an entry of. 
 * @param    value    The other item that this entry points to. 
 * @param    inverseAttribute    That attribute this is item is assigned to on the other item. 
 */
orp.model.ProxyEntry = function(connectionEntry, item, attribute, value, inverseAttribute) {
  this._connectionEntry = connectionEntry;
  this._item = item;
  this._attribute = attribute;
  this._value = value;
  this._inverseAttribute = inverseAttribute;
};


// -------------------------------------------------------------------
// ProxyEntry methods
// -------------------------------------------------------------------

/**
 * Returns ...
 *
 * @scope    public instance method
 * @return   ...
 */
orp.model.ProxyEntry.prototype.getInverseAttribute = function() {
  return this._inverseAttribute;
};


// -------------------------------------------------------------------
// Entry methods
// -------------------------------------------------------------------

/**
 * Returns the item that this is a entry of.
 *
 * @scope    public instance method
 * @return   The item that this is a entry of.
 */
orp.model.ProxyEntry.prototype.getItem = function() {
  return this._item;
};


/**
 * Returns the type of this entry
 *
 * @scope    public instance method
 * @return   the type of this entry
 */
orp.model.ProxyEntry.prototype.getType = function() {
  // alert("getType(): " + this._connectionEntry.toString());
  // alert("getType(): " + this._connectionEntry.getDisplayString());
  return this._connectionEntry.getType();
};


/**
 * If this entry was established as the replacement for a previous
 * entry, this method returns the previous entry.
 *
 * @scope    public instance method
 * @return   The previous entry, which this entry replaces. 
 */
orp.model.ProxyEntry.prototype.getPreviousEntry = function() {
  return this._connectionEntry.getPreviousEntry();
};


/**
 * Returns the attribute that this entry was assigned to, if any.
 *
 * @scope    public instance method
 * @return   An attribute item.
 */
orp.model.ProxyEntry.prototype.getAttribute = function() {
  return this._attribute;
};


/**
 * Returns the value that this entry holds.
 *
 * @scope    public instance method
 * @return   The value this entry was initialized to hold.
 */
orp.model.ProxyEntry.prototype.getValue = function() {
  return this._value;
};
  
  
/**
 * Returns the value of this entry as a string.
 *
 * @scope    public instance method
 * @return   A string representing the value in this entry.
 */
orp.model.ProxyEntry.prototype.getDisplayString = function() {
  return this._value.getDisplayString();
};


/**
 * Returns true if the entry has been replaced by a subsequent entry.
 *
 * @scope    public instance method
 * @return   True if this entry has been replaced. False if it has not.
 */
orp.model.ProxyEntry.prototype.hasBeenReplaced = function() {
  return this._connectionEntry.hasBeenReplaced();
};


/**
 * Called by a subsquent entry, to tell this entry that it has been replaced.
 *
 * @scope    private instance method
 * @param    entry    The entry that replaces this one.
 */
orp.model.ProxyEntry.prototype._addSubsequentEntry = function(entry) {
  this._connectionEntry._addSubsequentEntry(entry);
};


// -------------------------------------------------------------------
// ContentRecord methods
// -------------------------------------------------------------------

/**
 * Returns the ordinal number that this contentRecord was given at creation. 
 *
 * @scope    public instance method
 * @return   A number.
 */
orp.model.ProxyEntry.prototype.getOrdinalNumberAtCreation = function() {
  return this._connectionEntry.getOrdinalNumberAtCreation();
};


/**
 * Returns the ordinal number for this contentRecord. 
 *
 * @scope    public instance method
 * @return   A hex string.
 */
orp.model.ProxyEntry.prototype.getOrdinalNumber = function() {
  return this._connectionEntry.getOrdinalNumber();
};


/**
 * Returns true if this contentRecord has been deleted. 
 *
 * @scope    public instance method
 * @return   A boolean.
 */
orp.model.ProxyEntry.prototype.hasBeenDeleted = function() {
  return this._connectionEntry.hasBeenDeleted();
};

  
/**
 * Moves this contentRecord to a new position in a list, by creating a new
 * ordinal for this contentRecord with an ordinal number that is set such
 * that this contentRecord appears between two other entries.
 * The randomness is to avoid ever generating the same ordinal twice.
 *
 * @scope    public instance method
 * @param    contentRecordFirst    The contentRecord that should come before this one. 
 * @param    contentRecordThird    The contentRecord that should come after this one. 
 */
orp.model.ProxyEntry.prototype.reorderBetween = function(contentRecordFirst, contentRecordThird) {
  this._connectionEntry.reorderBetween(contentRecordFirst, contentRecordThird);
};


/**
 * Registers a vote to delete this contentRecord. 
 *
 * @scope    public instance method
 */
orp.model.ProxyEntry.prototype.voteToDelete = function() {
  this._connectionEntry.voteToDelete();
};


/**
 * Registers a vote to retain this contentRecord. 
 *
 * @scope    public instance method
 */
orp.model.ProxyEntry.prototype.voteToRetain = function() {
  this._connectionEntry.voteToRetain();
};


// -------------------------------------------------------------------
// Record methods
// -------------------------------------------------------------------

/**
 * Returns the world that this item was created in.
 *
 * @scope    public instance method
 * @return   A world object.
 */
orp.model.ProxyEntry.prototype.getWorld = function() {
  return this._connectionEntry.getWorld();
};


/**
 * Returns the item representing the user who created this record.
 *
 * @scope    public instance method
 * @return   A user item.
 */
orp.model.ProxyEntry.prototype.getUserstamp = function() {
  return this._connectionEntry.getUserstamp();
};


/**
 * Returns ???.
 *
 * @scope    public instance method
 * @return   ???.
 */
orp.model.ProxyEntry.prototype.getTimestamp = function() {
  return this._connectionEntry.getTimestamp();
};


/**
 * Returns a Date object with the creation timestamp for this record.
 *
 * @scope    public instance method
 * @return   A Date object.
 */
orp.model.ProxyEntry.prototype.getCreationDate = function() {
  return this._connectionEntry.getCreationDate();
};


/**
 * Returns the UUID of the record. 
 *
 * @scope    public instance method
 * @return   The UUID of the record.
 */
orp.model.ProxyEntry.prototype.getUuid = function() {
  return this._connectionEntry.getUuid();
};


/**
 * Returns a string representation of the UUID of the record. 
 *
 * @scope    public instance method
 * @return   A string representing the UUID of the record.
 */
orp.model.ProxyEntry.prototype.getUuidString = function() {
  return this._connectionEntry.getUuidString();
};


/**
 * Returns a string representation of the UUID of the item, wrapped in
 * quotes.  The return value will always be a 38-character string, 
 * where the first and last characters are quotes.  For example:  
 *
 * <pre>
 *   "3B12F1DF-5232-1804-897E-917BF397618A"
 * </pre>
 *
 * @scope    protected instance method
 * @return   The record's UUID, as a string, wrapped in quotes.
 */
orp.model.ProxyEntry.prototype._getUuidInQuotes = function() {
  return this._connectionEntry._getUuidInQuotes();
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
