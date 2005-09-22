/*****************************************************************************
 Transaction.js
 
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
dojo.provide("orp.model.Transaction");


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------
/**
 * A Transaction object represents a database transaction.  Each Transaction
 * contains a list of the records that were created during the transaction.
 *
 * @scope    public instance constructor
 */
orp.model.Transaction = function() {
  this._listOfRecords = [];
};


// -------------------------------------------------------------------
// Public Methods
// -------------------------------------------------------------------

/**
 * Records the fact that a record was created during the transaction.
 *
 * @scope    public instance method
 * @param    newRecord    A record created during the transaction. 
 */
orp.model.Transaction.prototype.addRecord = function(newRecord) {
  this._listOfRecords.push(newRecord);
};


/**
 * Returns a list of all the records created during the transaction.
 *
 * @scope    public instance method
 * @return   A list of records. 
 */
orp.model.Transaction.prototype.getRecords = function() {
  return this._listOfRecords;
};

    
// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
