/*****************************************************************************
 Record.js
 
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


/**
 * The Record class serves as an abstract superclass for the classes Vote,
 * Ordinal, and ContentRecord.  ContentRecord is the abstract superclass
 * for Item and Entry.
 *
 * @scope    public instance constructor
 * @syntax   DO NOT CALL THIS CONSTRUCTOR
 */
function Record() {
  // Don't create these properties until we know we need them.
  // this._creationTimestamp = null;
  // this._creationUserstamp = null;
}


// -------------------------------------------------------------------
// Package/module methods           
// -------------------------------------------------------------------

/**
 * Called from the constructor function of each subclass of Record.
 *
 * @scope    protected instance method
 * @param    world    The world that this Record is a part of. 
 * @param    uuid    The UUID for this Record. 
 */
Record.prototype._Record = function(world, uuid) {
  Util.assert(Util.isUuid(uuid));
  
  this._world = world;
  this._uuid = uuid;
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
Record.prototype.getWorld = function() {
  return this._world;
};


/**
 * Returns a string which can be used as a unique key in a hash table. 
 *
 * @scope    public instance method
 * @return   A string which can serve as a unique key.
 */
Record.prototype.getUniqueKeyString = function() {
  return this._uuid;
};


/**
 * Returns the item representing the user who created this item.
 *
 * @scope    public instance method
 * @return   A user item.
 */
Record.prototype.getUserstamp = function() {
  if (this._creationUserstamp) {
    return this._creationUserstamp;
  }
  var allUsers = this._world.getUsers();
  var myPseudonode = this._uuid.split('-')[4];
  for (var key in allUsers) {
    var usersPseudonode = allUsers[key]._getUuid().split('-')[4];
    if (usersPseudonode == myPseudonode) {
      this._creationUserstamp = allUsers[key];
      return this._creationUserstamp;
    }
  }
  throw new Error("We ran into item or entry that has a UUID which was not created by any known user.  The database may be corrupted.");
};


/**
 * Returns ???.
 *
 * @scope    public instance method
 * @return   ???.
 */
Record.prototype.getTimestamp = function() {
  if (this._creationTimestamp) {
    return this._creationTimestamp;
  }
  var hexTimeLow = this._uuid.split('-')[0];
  var hexTimeMid = this._uuid.split('-')[1];
  var hexTimeHigh = this._uuid.split('-')[2];
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

  // PENDING: 
  // Do we want this to return a Date object rather than a floating point
  // value?
  this._creationTimestamp = millisecondsSince1970;
  return millisecondsSince1970;
};


/**
 * Returns a Date object with the creation timestamp for this item.
 *
 * @scope    public instance method
 * @return   A Date object.
 */
Record.prototype.getGetCreationDate = function() {
  var date = new Date(this.getTimestamp());
  return date;
};


// -------------------------------------------------------------------
// Package/module methods           
// -------------------------------------------------------------------

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
Record.prototype._getUuid = function() {
  return this._uuid;
};



// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
