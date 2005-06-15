/*****************************************************************************
 IdentifiedRecord.js
 
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
 * The IdentifiedRecord class serves as an abstract superclass for the class Item
 * and the class Entry.
 *
 * @scope    public instance constructor
 * @syntax   DO NOT CALL THIS CONSTRUCTOR
 */
function IdentifiedRecord() {
}


// -------------------------------------------------------------------
// Protected methods
// -------------------------------------------------------------------

/**
 * Called from the constructor function of each subclass of IdentifiedRecord.
 *
 * @scope    protected instance method
 * @param    inWorld    The world that this IdentifiedRecord is a part of. 
 * @param    inUuid    The UUID for this IdentifiedRecord. 
 */
IdentifiedRecord.prototype._IdentifiedRecord = function (inWorld, inUuid) {
  // Util.assert(!inUuid || Util.isNumeric(inUuid));
  
  this.__myWorld = inWorld;
  this.__myUuid = inUuid;
  
  this.__myCreationTimestamp = null;
  this.__myCreationUserstamp = null;

  // Don't create these properties until we know we need them.
  // this.__mySetOfVotes = null;
  // this.__mySetOfOrdinals = null;
};


/**
 * Initializes a new identifiedRecord that has just been created by a user action.
 *
 * WARNING: This method should be called ONLY from subclasses.
 *
 * @scope    protected instance method
 */
IdentifiedRecord.prototype._initializeIdentifiedRecord = function () {
};


/**
 * Sets the properties of a newly rehydrated identifiedRecord object.
 *
 * WARNING: This method should be called ONLY from subclasses.
 *
 * @scope    protected instance method
 * @param    inTimestamp    A Date object with the creation timestamp for this item. 
 * @param    inUserstamp    The user who created this item. 
 */
IdentifiedRecord.prototype._rehydrateIdentifiedRecord = function (inTimestamp, inUserstamp) {
  this.__myCreationTimestamp = inTimestamp;
  this.__myCreationUserstamp = inUserstamp;
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
IdentifiedRecord.prototype._getUuid = function () {
  return this.__myUuid;
};


/**
 * Records a user's vote to retain or delete this IdentifiedRecord.
 *
 * @scope    protected instance method
 * @param    inVote    A vote to retain or delete this IdentifiedRecord. 
 */
IdentifiedRecord.prototype._addVote = function (inVote) {
  if (!this.__mySetOfVotes) {
    this.__mySetOfVotes = [];
  }
  this.__mySetOfVotes.push(inVote);
};


/**
 * Records the ordinal number that a user sets for this IdentifiedRecord.
 *
 * @scope    protected instance method
 * @param    inOrdinal    A vote to retain or delete this IdentifiedRecord. 
 */
IdentifiedRecord.prototype._addOrdinal = function (inOrdinal) {
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
IdentifiedRecord.prototype.getWorld = function () {
  return this.__myWorld;
};


/**
 * Returns a Date object with the creation timestamp for this item.
 *
 * @scope    public instance method
 * @return   A Date object.
 */
IdentifiedRecord.prototype.getTimestamp = function() {
  if (this.__myCreationTimestamp) {
    // This case is now here only for the (temporary) benefit of _rehydrateIdentifiedRecord.
    return this.__myCreationTimestamp;
  }
  var hexTimeLow = this.__myUuid.split('-')[0];
  var hexTimeMid = this.__myUuid.split('-')[1];
  var hexTimeHigh = this.__myUuid.split('-')[2];
  var timeLow = parseInt(hexTimeLow, Util.HEX_RADIX);
  var timeMid = parseInt(hexTimeMid, Util.HEX_RADIX);
  var timeHigh = parseInt(hexTimeHigh, Util.HEX_RADIX);
  var hundredNanosecondIntervalsSince1582 = timeHigh & 0x0FFF;
  hundredNanosecondIntervalsSince1582 <<= 16;
  hundredNanosecondIntervalsSince1582 += timeMid;
  // What we really want to do next is shift left 32 bits, but the result will be too big
  // to fit in an int, so we'll multiply by 2^32, and the result will be a floating point approximation.
  hundredNanosecondIntervalsSince1582 *= 0x100000000;
  hundredNanosecondIntervalsSince1582 += timeLow;
  var millisecondsSince1582 = hundredNanosecondIntervalsSince1582 / 10000;

  // Again, this will be a floating point approximation.
  // We can make things exact later if we need to.
  var secondsPerHour = 60 * 60;
  var hoursBetween1582and1970 = Util.GREGORIAN_CHANGE_OFFSET_IN_HOURS;
  var secondsBetween1582and1970 = hoursBetween1582and1970 * secondsPerHour;
  var millisecondsBetween1582and1970 = secondsBetween1582and1970 * 1000;

  var millisecondsSince1970 = millisecondsSince1582 - millisecondsBetween1582and1970;
  return millisecondsSince1970;
};


/**
 * Returns the item representing the user who created this item.
 *
 * @scope    public instance method
 * @return   A user item.
 */
IdentifiedRecord.prototype.getUserstamp = function() {
  if (this.__myCreationUserstamp) {
    // This case is now here only for the (temporary) benefit of _rehydrateIdentifiedRecord.
    return this.__myCreationUserstamp;
  }
  var allUsers = this.__myWorld.getUsers();
  var myPseudonode = this.__myUuid.split('-')[4];
  for (key in allUsers) {
    var usersPseudonode = allUsers[key]._getUuid().split('-')[4];
    if (usersPseudonode == myPseudonode) {
      return allUsers[key];
    }
  }
  throw new Error("User not found.  Database may be corrupted.");
};


/**
 * Returns a string which can be used as a unique key in a hash table. 
 *
 * @scope    public instance method
 * @return   A string which can serve as a unique key.
 */
IdentifiedRecord.prototype.getUniqueKeyString = function () {
  return this.__myUuid;
};


/**
 * Returns the ordinal number that this identifiedRecord was given at creation. 
 *
 * @scope    public instance method
 * @return   A number.
 */
IdentifiedRecord.prototype.getOrdinalNumberAtCreation = function () {
  // return (0 - this.__myCreationTimestamp.valueOf());
  return (0 - this.__myUuid);
};


// -------------------------------------------------------------------
// Accessor methods
// -------------------------------------------------------------------

/**
 * Returns the ordinal number for this identifiedRecord. 
 *
 * @scope    public instance method
 * @return   A number.
 */
IdentifiedRecord.prototype.getOrdinalNumber = function () {
  if (!this.__mySetOfOrdinals || this.__mySetOfOrdinals.length === 0) {
    return this.getOrdinalNumberAtCreation();
  }

  var ordinalNumber = this.getOrdinalNumberAtCreation();
  var key;
  var ordinal;
  var filter = this.__myWorld.getRetrievalFilter();
  
  switch (filter) {
    case World.RETRIEVAL_FILTER_LAST_EDIT_WINS:
      // APPROACH A: 
      //   I tried this first, but it fails in the unit tests.
      //   It fails because two objects will have identical timestamps if they
      //   were created in the same millisecond.  One solution would be to
      //   create a Timestamp class that offers sub-millisecond timestamp
      //   resolution.  For example, see scrap_yard/Timestamp.js.  However,
      //   for now the simplest thing to do is just move on to APPROACH B:
      /*
      var mostRecentOrdinal = this.__mySetOfOrdinals[0];
      for (key in this.__mySetOfOrdinals) {
        ordinal = this.__mySetOfOrdinals[key];
        if (ordinal.getTimestamp() > mostRecentOrdinal.getTimestamp()) {
          mostRecentOrdinal = ordinal;
        }
      }
      */
      
      // APPROACH B: 
      //   This works, provided __mySetOfOrdinals is always initialized in
      //   chronological order.
      var mostRecentOrdinal = this.__mySetOfOrdinals[this.__mySetOfOrdinals.length - 1];

      ordinalNumber = mostRecentOrdinal.getOrdinalNumber();
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
 * Returns true if this identifiedRecord has been deleted. 
 *
 * @scope    public instance method
 * @return   A boolean.
 */
IdentifiedRecord.prototype.hasBeenDeleted = function () {
  if (!this.__mySetOfVotes || this.__mySetOfVotes.length === 0) {
    return false;
  }
  
  var hasBeenDeleted = false;
  var key;
  var vote;
  var filter = this.__myWorld.getRetrievalFilter();
  
  switch (filter) {
    case World.RETRIEVAL_FILTER_LAST_EDIT_WINS:
      // APPROACH A: 
      //   I tried this first, but it fails in the unit tests.
      //   It fails because two objects will have identical timestamps if they
      //   were created in the same millisecond.  One solution would be to
      //   create a Timestamp class that offers sub-millisecond timestamp
      //   resolution.  For example, see scrap_yard/Timestamp.js.  However,
      //   for now the simplest thing to do is just move on to APPROACH B:
      /*
      var mostRecentVote = this.__mySetOfVotes[0];
      for (key in this.__mySetOfVotes) {
        vote = this.__mySetOfVotes[key];
        if (vote.getTimestamp() > mostRecentVote.getTimestamp()) {
          mostRecentVote = vote;
        }
      }
      */
      
      // APPROACH B: 
      //   This works, provided __mySetOfVotes is always initialized in
      //   chronological order.
      var mostRecentVote = this.__mySetOfVotes[this.__mySetOfVotes.length - 1];
      
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
 * Moves this identifiedRecord to a new position in a list, by creating a new
 * ordinal for this identifiedRecord with an ordinal number that is set such
 * that this identifiedRecord appears between two other entries.
 *
 * @scope    public instance method
 * @param    inIdentifiedRecordFirst    The identifiedRecord that should come before this one. 
 * @param    inIdentifiedRecordThird    The identifiedRecord that should come after this one. 
 */
IdentifiedRecord.prototype.reorderBetween = function (inIdentifiedRecordFirst, inIdentifiedRecordThird) {
  var firstOrdinalNumber = null;
  var secondOrdinalNumber = null;
  var thirdOrdinalNumber = null;
  var arbitraryNumberToMoveUsUpOrDownSlightly = 0.01;
  
  if (inIdentifiedRecordFirst) {
    firstOrdinalNumber = inIdentifiedRecordFirst.getOrdinalNumber();
  }
  if (inIdentifiedRecordThird) {
    thirdOrdinalNumber = inIdentifiedRecordThird.getOrdinalNumber();
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
 * Registers a vote to delete this identifiedRecord. 
 *
 * @scope    public instance method
 */
IdentifiedRecord.prototype.voteToDelete = function () {
  this.getWorld()._newVote(this, false);
};


/**
 * Registers a vote to retain this identifiedRecord. 
 *
 * @scope    public instance method
 */
IdentifiedRecord.prototype.voteToRetain = function () {
  this.getWorld()._newVote(this, true);
};


// -------------------------------------------------------------------
// Class methods
// -------------------------------------------------------------------

/**
 * Registers a vote to retain this identifiedRecord. 
 *
 * @scope    public class method
 */
IdentifiedRecord.compareOrdinals = function (inIdentifiedRecordOne, inIdentifiedRecordTwo) {
  var ordinalNumberOne = inIdentifiedRecordOne.getOrdinalNumber();
  var ordinalNumberTwo = inIdentifiedRecordTwo.getOrdinalNumber();
  return (ordinalNumberTwo - ordinalNumberOne);
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
