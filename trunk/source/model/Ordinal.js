/*****************************************************************************
 Ordinal.js
 
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
//   User.js
//   ContentRecord.js
// -------------------------------------------------------------------

/**
 * Each instance of the Ordinal class keeps track of the fact that
 * a user set an ordinal number for an item or a entry of an item.
 *
 * @scope    public instance constructor
 * @param    inContentRecord    The item or entry that this vote is attached to. 
 * @param    inUser    The user who voted. 
 * @param    inOrdinalNumber    The ordinal number itself. 
 * @param    inTimestamp    Optional. The time the vote was made. 
 */
function Ordinal(inContentRecord, inUser, inOrdinalNumber, inTimestamp) {
  this.__myContentRecord = inContentRecord;
  this.__myUserstamp = inUser;
  this.__myOrdinalNumber = inOrdinalNumber;
  if (inTimestamp) {
    this.__myTimestamp = inTimestamp;
  } else {
    this.__myTimestamp = new Date();
  }
  this.__myContentRecord._addOrdinal(this);
}

Ordinal.prototype.getContentRecord = function () {
  return this.__myContentRecord;
};

Ordinal.prototype.getTimestamp = function () {
  return this.__myTimestamp;
};

Ordinal.prototype.getUserstamp = function () {
  return this.__myUserstamp;
};

Ordinal.prototype.getOrdinalNumber = function () {
  return this.__myOrdinalNumber;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
