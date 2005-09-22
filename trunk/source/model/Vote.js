/*****************************************************************************
 Vote.js
 
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
dojo.provide("orp.model.Vote");
dojo.require("orp.model.Record");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global Record */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------
/**
 * Each instance of the Vote class keeps track of a vote to retain or delete
 * an item or a entry of an item.
 *
 * @scope    public instance constructor
 * @param    world    The world that this Vote is a part of. 
 * @param    uuid    The UUID for this Vote. 
 * @param    contentRecord    The item or entry that this vote is attached to. 
 * @param    retainFlag    True if this is a vote to retain. False if this is a vote to delete. 
 */
orp.model.Vote = function(world, uuid, contentRecord, retainFlag) {
  this._Record(world, uuid);

  this._contentRecord = contentRecord;
  this._retainFlag = retainFlag;
  this._contentRecord._addVote(this);
};

dj_inherits(orp.model.Vote, orp.model.Record);  // makes Vote be a subclass of Record


// -------------------------------------------------------------------
// Public methods
// -------------------------------------------------------------------

/**
 * Returns the item or entry that this vote applies to.
 *
 * @scope    public instance method
 * @return   An item or entry.
 */
orp.model.Vote.prototype.getContentRecord = function() {
  return this._contentRecord;
};


/**
 * Returns a boolean value that tells whether this is a vote to retain or a 
 * vote to delete.
 *
 * @scope    public instance method
 * @return   A boolean. True if this is a vote to retain, or false if this is a vote to delete.
 */
orp.model.Vote.prototype.getRetainFlag = function() {
  return this._retainFlag;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
