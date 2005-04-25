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
//   Vote.js
//   Ordinal.js
//   Util.js
//   World.js
// -------------------------------------------------------------------

/**
 * The Entry class serves as an abstract superclass for the class Item
 * and the class Value.
 *
 * @scope    public instance constructor
 * @syntax   DO NOT CALL THIS CONSTRUCTOR
 */
function Entry() {
  throw new Error("Entry is an abstract superclass. You can't create instances of it.");
}


// -------------------------------------------------------------------
// Protected methods
// -------------------------------------------------------------------

/**
 * Called from the constructor function of each subclass of Entry.
 *
 * @scope    protected instance method
 * @param    inWorld    The world that this value is a part of. 
 * @param    inUuid    The UUID for this value. 
 */
Entry.prototype._Entry = function (inWorld, inUuid) {
  Util.assert(!inUuid || Util.isNumeric(inUuid));
  
  this.__myWorld = inWorld;
  this.__myUuid = inUuid;
  
  this.__myCreationTimestamp = null;
  this.__myCreationUserstamp = null;

  // Don't create these properties until we know we need them.
  // this.__mySetOfVotes = null;
  // this.__mySetOfOrdinals = null;
};


/**
 * Initializes a new entry that has just been created by a user action.
 *
 * WARNING: This method should be called ONLY from subclasses.
 *
 * @scope    protected instance method
 */
Entry.prototype._initializeEntry = function () {
  this.__myCreationTimestamp = new Date();
  this.__myCreationUserstamp = this.getWorld().getCurrentUser();
};


/**
 * Sets the properties of a newly rehydrated entry object.
 *
 * WARNING: This method should be called ONLY from subclasses.
 *
 * @scope    protected instance method
 * @param    inTimestamp    A Date object with the creation timestamp for this item. 
 * @param    inUserstamp    The user who created this item. 
 */
Entry.prototype._rehydrateEntry = function (inTimestamp, inUserstamp) {
  this.__myCreationTimestamp = new Date();
  this.__myCreationUserstamp = this.getWorld().getCurrentUser();
};


/**
 * Returns the UUID of the item. 
 *
 * WARNING: This method should be called ONLY from a 
 * VirtualServer implementation.
 *
 * If you're writing code in the view layer, call
 * item.getUniqueKeyString() instead of item._getUuid();
 *
 * @scope    protected instance method
 * @return   The UUID of the item.
 */
Entry.prototype._getUuid = function () {
  return this.__myUuid;
};


/**
 * Records a user's vote to retain or delete this value.
 *
 * @scope    protected instance method
 * @param    inVote    A vote to retain or delete this value. 
 */
Entry.prototype._addVote = function (inVote) {
  if (!this.__mySetOfVotes) {
    this.__mySetOfVotes = [];
  }
  this.__mySetOfVotes.push(inVote);
};


/**
 * Records the ordinal number that a user sets for this value.
 *
 * @scope    protected instance method
 * @param    inOrdinal    A vote to retain or delete this value. 
 */
Entry.prototype._addOrdinal = function (inOrdinal) {
  if (!this.__mySetOfOrdinals) {
    this.__mySetOfOrdinals = [];
  }
  this.__mySetOfOrdinals.push(inOrdinal);
};


// -------------------------------------------------------------------
// Simple accessor methods
// -------------------------------------------------------------------

/**
 * Returns the world that this item was created in.
 *
 * @scope    public instance method
 * @return   A world object.
 */
Entry.prototype.getWorld = function () {
  return this.__myWorld;
};


/**
 * Returns a Date object with the creation timestamp for this item.
 *
 * @scope    public instance method
 * @return   A Date object.
 */
Entry.prototype.getTimestamp = function () {
  return this.__myCreationTimestamp;
};


/**
 * Returns the item representing the user who created this item.
 *
 * @scope    public instance method
 * @return   A user item.
 */
Entry.prototype.getUserstamp = function () {
  return this.__myCreationUserstamp;
};


/**
 * Returns a string which can be used as a unique key in a hash table. 
 *
 * @scope    public instance method
 * @return   A string which can serve as a unique key.
 */
Entry.prototype.getUniqueKeyString = function () {
  return this.__myUuid;
};


/**
 * Returns the ordinal number that this entry was given at creation. 
 *
 * @scope    public instance method
 * @return   A number.
 */
Entry.prototype.getOrdinalNumberAtCreation = function () {
  return (0 - this.__myCreationTimestamp.getUTCMilliseconds());
};


// -------------------------------------------------------------------
// Accessor methods
// -------------------------------------------------------------------

/**
 * Returns the ordinal number for this entry. 
 *
 * @scope    public instance method
 * @return   A number.
 */
Entry.prototype.getOrdinalNumber = function () {
  if (!this.__mySetOfOrdinals || this.__mySetOfOrdinals.length === 0) {
    return this.getOrdinalNumberAtCreation();
  }

  var ordinalNumber = this.getOrdinalNumberAtCreation();
  var key;
  var ordinal;
  var filter = this.__myWorld.getRetrievalFilter();
  
  switch (filter) {
    case World.RETRIEVAL_FILTER_LAST_EDIT_WINS:
      var mostRecentOrdinal = this.__mySetOfOrdinals[0];
      for (key in this.__mySetOfOrdinals) {
        ordinal = this.__mySetOfOrdinals[key];
        if (ordinal.getTimestamp() > mostRecentOrdinal.getTimestamp()) {
          mostRecentOrdinal = ordinal;
        }
      }
      ordinalNumber = !mostRecentOrdinal.getOrdinalNumber();
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
      // PENDING: This still needs to be implemented.
      Util.assert(false);
      break;
    default:
      // We should never get here.  If we get here, it's an error.
      Util.assert(false);
      break;
  }
  return ordinalNumber;
};


/**
 * Returns true if this entry has been deleted. 
 *
 * @scope    public instance method
 * @return   A boolean.
 */
Entry.prototype.hasBeenDeleted = function () {
  if (!this.__mySetOfVotes || this.__mySetOfVotes.length === 0) {
    return false;
  }
  
  var hasBeenDeleted = false;
  var key;
  var vote;
  var filter = this.__myWorld.getRetrievalFilter();
  
  switch (filter) {
    case World.RETRIEVAL_FILTER_LAST_EDIT_WINS:
      var mostRecentVote = this.__mySetOfVotes[0];
      for (key in this.__mySetOfVotes) {
        vote = this.__mySetOfVotes[key];
        if (vote.getTimestamp() > mostRecentVote.getTimestamp()) {
          mostRecentVote = vote;
        }
      }
      hasBeenDeleted = !mostRecentVote.getRetainFlag();
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
      hasBeenDeleted = false;
      break;
    default:
      // We should never get here.  If we get here, it's an error.
      Util.assert(false);
      break;
  }
  return hasBeenDeleted;
};


/**
 * Moves this entry to a new position in a list, by creating a new
 * ordinal for this entry with an ordinal number that is set such
 * that this entry appears between two other entries.
 *
 * @scope    public instance method
 * @param    inEntryFirst    The entry that should come before this one. 
 * @param    inEntryThird    The entry that should come after this one. 
 */
Entry.prototype.reorderBetween = function (inEntryFirst, inEntryThird) {
  var firstOrdinalNumber = null;
  var secondOrdinalNumber = null;
  var thirdOrdinalNumber = null;
  var arbitraryNumberToMoveUsUpOrDownSlightly = 100;
  
  if (inEntryFirst) {
    firstOrdinalNumber = inEntryFirst.getOrdinalNumber();
  }
  if (inEntryThird) {
    thirdOrdinalNumber = inEntryThird.getOrdinalNumber();
  }
  
  if (firstOrdinalNumber && thirdOrdinalNumber) {
    secondOrdinalNumber = (firstOrdinalNumber + thirdOrdinalNumber) / 2;
  }
  if (firstOrdinalNumber && !thirdOrdinalNumber) {
    secondOrdinalNumber = (firstOrdinalNumber - arbitraryNumberToMoveUsUpOrDownSlightly);
  }
  if (!firstOrdinalNumber && thirdOrdinalNumber) {
    secondOrdinalNumber = (firstOrdinalNumber + arbitraryNumberToMoveUsUpOrDownSlightly);
  }
  
  this.getWorld()._newOrdinal(this, secondOrdinalNumber);
};


/**
 * Registers a vote to delete this entry. 
 *
 * @scope    public instance method
 */
Entry.prototype.voteToDelete = function () {
  this.getWorld()._newVote(this, false);
};


/**
 * Registers a vote to retain this entry. 
 *
 * @scope    public instance method
 */
Entry.prototype.voteToRetain = function () {
  this.getWorld()._newVote(this, true);
};


// -------------------------------------------------------------------
// Class methods
// -------------------------------------------------------------------

/**
 * Registers a vote to retain this entry. 
 *
 * @scope    public class method
 */
Entry.compareOrdinals = function (inEntryOne, inEntryTwo) {
  var ordinalNumberOne = inEntryOne.getOrdinalNumber();
  var ordinalNumberTwo = inEntryTwo.getOrdinalNumber();
  return (ordinalNumberTwo - ordinalNumberOne);
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
