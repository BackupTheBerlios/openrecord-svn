/*****************************************************************************
 ContentRecord.js
 
******************************************************************************
 Written in 2005 by 
    Brian Douglas Skinner <brian.skinner@gumption.org>
    Mignon Belongie
  
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
/*global Util  */
/*global World  */
/*global Record  */
// -------------------------------------------------------------------


/**
 * The ContentRecord class serves as an abstract superclass for the class Item
 * and the class Entry.
 *
 * @scope    public instance constructor
 * @syntax   DO NOT CALL THIS CONSTRUCTOR
 */
ContentRecord.prototype = new Record();  // makes ContentRecord be a subclass of Record
function ContentRecord() {
  // Don't create these properties until we know we need them.
  // this._setOfVotes = null;
  // this._setOfOrdinals = null;
}


// -------------------------------------------------------------------
// Package/module methods           
// -------------------------------------------------------------------

/**
 * Called from the constructor function of each subclass of ContentRecord.
 *
 * @scope    protected instance method
 * @param    world    The world that this ContentRecord is a part of. 
 * @param    uuid    The UUID for this ContentRecord. 
 */
ContentRecord.prototype._ContentRecord = function(world, uuid) {
  this._Record(world, uuid);
};


/**
 * Records a user's vote to retain or delete this ContentRecord.
 *
 * @scope    protected instance method
 * @param    vote    A vote to retain or delete this ContentRecord. 
 */
ContentRecord.prototype._addVote = function(vote) {
  if (!this._setOfVotes) {
    this._setOfVotes = [];
  }
  this._setOfVotes.push(vote);
};


/**
 * Records the ordinal number that a user sets for this ContentRecord.
 *
 * @scope    protected instance method
 * @param    ordinal    A vote to retain or delete this ContentRecord. 
 */
ContentRecord.prototype._addOrdinal = function(ordinal) {
  if (!this._setOfOrdinals) {
    this._setOfOrdinals = [];
  }
  this._setOfOrdinals.push(ordinal);
};


// -------------------------------------------------------------------
// Simple accessor methods
// -------------------------------------------------------------------

/**
 * Returns the ordinal number that this contentRecord was given at creation. 
 *
 * @scope    public instance method
 * @return   A number.
 */
ContentRecord.prototype.getOrdinalNumberAtCreation = function() {
  return this.getUuid().getTimestampAsHexString();
};


// -------------------------------------------------------------------
// Accessor methods
// -------------------------------------------------------------------

/**
 * Returns the ordinal number for this contentRecord. 
 *
 * @scope    public instance method
 * @return   A number.
 */
ContentRecord.prototype.getOrdinalNumber = function() {
  if (!this._setOfOrdinals || this._setOfOrdinals.length === 0) {
    return this.getOrdinalNumberAtCreation();
  }

  var ordinalNumber = this.getOrdinalNumberAtCreation();
  var key;
  var ordinal;
  var filter = this._world.getRetrievalFilter();
  
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
      var mostRecentOrdinal = this._setOfOrdinals[0];
      for (key in this._setOfOrdinals) {
        ordinal = this._setOfOrdinals[key];
        if (ordinal.getTimestamp() > mostRecentOrdinal.getTimestamp()) {
          mostRecentOrdinal = ordinal;
        }
      }
      */
      
      // APPROACH B: 
      //   This works, provided __mySetOfOrdinals is always initialized in
      //   chronological order.
      var mostRecentOrdinal = this._setOfOrdinals[this._setOfOrdinals.length - 1];

      ordinalNumber = mostRecentOrdinal.getOrdinalNumber();
      break;
    case World.RETRIEVAL_FILTER_SINGLE_USER:
      // PENDING: This still needs to be implemented.
      orp.util.assert(false);
      break;
    case World.RETRIEVAL_FILTER_DEMOCRATIC:
      // PENDING: This still needs to be implemented.
      orp.util.assert(false);
      break;
    case World.RETRIEVAL_FILTER_UNABRIDGED:
      // PENDING: This still needs to be implemented.
      orp.util.assert(false);
      break;
    default:
      // We should never get here.  If we get here, it's an error.
      orp.util.assert(false);
      break;
  }
  return ordinalNumber;
};


/**
 * Returns true if this contentRecord has been deleted. 
 *
 * @scope    public instance method
 * @return   A boolean.
 */
ContentRecord.prototype.hasBeenDeleted = function() {
  if (!this._setOfVotes || this._setOfVotes.length === 0) {
    return false;
  }
  
  var hasBeenDeleted = false;
  var key;
  var vote;
  var filter = this._world.getRetrievalFilter();
  
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
      var mostRecentVote = this._setOfVotes[0];
      for (key in this._setOfVotes) {
        vote = this._setOfVotes[key];
        if (vote.getTimestamp() > mostRecentVote.getTimestamp()) {
          mostRecentVote = vote;
        }
      }
      */
      
      // APPROACH B: 
      //   This works, provided __mySetOfVotes is always initialized in
      //   chronological order.
      var mostRecentVote = this._setOfVotes[this._setOfVotes.length - 1];
      
      hasBeenDeleted = !mostRecentVote.getRetainFlag();
      break;
    case World.RETRIEVAL_FILTER_SINGLE_USER:
      // PENDING: This still needs to be implemented.
      orp.util.assert(false);
      break;
    case World.RETRIEVAL_FILTER_DEMOCRATIC:
      // PENDING: This still needs to be implemented.
      orp.util.assert(false);
      break;
    case World.RETRIEVAL_FILTER_UNABRIDGED:
      hasBeenDeleted = false;
      break;
    default:
      // We should never get here.  If we get here, it's an error.
      orp.util.assert(false);
      break;
  }
  return hasBeenDeleted;
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
ContentRecord.prototype.reorderBetween = function(contentRecordFirst, contentRecordThird) {
  var firstOrdinalNumber = null;
  var secondOrdinalNumber = null;
  var thirdOrdinalNumber = null;
  
  // PENDING: this is a hack
  var sourceOfRandomness = contentRecordFirst ? contentRecordFirst.getUuid() : contentRecordThird.getUuid();
  
  if (contentRecordFirst) {
    firstOrdinalNumber = contentRecordFirst.getOrdinalNumber();
  }
  if (contentRecordThird) {
    thirdOrdinalNumber = contentRecordThird.getOrdinalNumber();
  }
  
  if (firstOrdinalNumber && thirdOrdinalNumber) {
    if (firstOrdinalNumber == thirdOrdinalNumber) {
      orp.util.assert(false, "Tried to reorder between two items with the same ordinal.");
    }
    else {
      if (firstOrdinalNumber > thirdOrdinalNumber) {
        temp = firstOrdinalNumber;
        firstOrdinalNumber = thirdOrdinalNumber;
        thirdOrdinalNumber = temp;
      }
      // PENDING: we should not be calling the private method _generateRandomEightCharacterHexString()
      var randomEightCharacterHexString = sourceOfRandomness._generateRandomEightCharacterHexString();
      secondOrdinalNumber = firstOrdinalNumber + randomEightCharacterHexString;
      var zeroes = "";
      while (secondOrdinalNumber >= thirdOrdinalNumber) {
        zeroes += "0";
        // PENDING: we should not be calling the private method _generateRandomEightCharacterHexString()
        randomEightCharacterHexString = sourceOfRandomness._generateRandomEightCharacterHexString();
        secondOrdinalNumber = firstOrdinalNumber + zeroes + randomEightCharacterHexString;
      }
    }
  }
  if (firstOrdinalNumber && !thirdOrdinalNumber) {
    secondOrdinalNumber = firstOrdinalNumber + sourceOfRandomness._generateRandomEightCharacterHexString();
  }
  if (!firstOrdinalNumber && thirdOrdinalNumber) {
    secondOrdinalNumber = thirdOrdinalNumber;
    i = secondOrdinalNumber.length - 1;
    while (secondOrdinalNumber.charAt(i) == '0') {
      i = i - 1;
    }
    var origLen = secondOrdinalNumber.length;
    prefix = secondOrdinalNumber.substring(0, i);
    firstNonZero = secondOrdinalNumber.charAt(i);
    firstNonZero = firstNonZero - 1;
    secondOrdinalNumber = prefix + firstNonZero;
    while (secondOrdinalNumber.length < origLen) {
      secondOrdinalNumber += "f";
    }
    secondOrdinalNumber += sourceOfRandomness._generateRandomEightCharacterHexString();
  }
  this.getWorld()._newOrdinal(this, secondOrdinalNumber);
};


/**
 * Registers a vote to delete this contentRecord. 
 *
 * @scope    public instance method
 */
ContentRecord.prototype.voteToDelete = function() {
  this.getWorld()._newVote(this, false);
};


/**
 * Registers a vote to retain this contentRecord. 
 *
 * @scope    public instance method
 */
ContentRecord.prototype.voteToRetain = function() {
  this.getWorld()._newVote(this, true);
};


// -------------------------------------------------------------------
// Class methods
// -------------------------------------------------------------------

/**
 * Uses lexicographic ordering.
 *
 * @scope    public class method
 */
ContentRecord.compareOrdinals = function(contentRecordOne, contentRecordTwo) {
  var ordinalNumberOne = contentRecordOne.getOrdinalNumber();
  var ordinalNumberTwo = contentRecordTwo.getOrdinalNumber();
  if (ordinalNumberOne < ordinalNumberTwo) {
    return -1;
  }
  if (ordinalNumberOne > ordinalNumberTwo) {
    return 1;
  }
  return 0;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
