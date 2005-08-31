/*****************************************************************************
 Uuid.js
 
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
// -------------------------------------------------------------------


/**
 * The Uuid class offers methods for generating UUIDs and 
 * inspecting existing UUIDs.
 *
 * THIS IS AN ABSTRACT SUPERCLASS.  
 * DO NOT CALL THIS CONSTRUCTOR.
 *
 * @scope    public instance constructor
 */
function Uuid() {
  this._uuidString = null;
}


// -------------------------------------------------------------------
// Public instance methods
// -------------------------------------------------------------------

/**
 * Returns a 36-character string representing the UUID, such as: 
 * <pre>
 *   3B12F1DF-5232-1804-897E-917BF397618A
 * </pre>
 *
 * @scope    public instance method
 * @return   Returns a 36-character UUID string.
 */
Uuid.prototype.toString = function() {
  return this._uuidString;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
