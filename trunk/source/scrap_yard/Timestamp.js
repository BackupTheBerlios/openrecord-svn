/*****************************************************************************
 Timestamp.js
 
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
//   Date
// -------------------------------------------------------------------


/**
 * A Timestamp instance records when it was created.  Each Timestamp
 * includes a Date object, which records the time in milliseconds since
 * 1970.  In some use cases, thousands of Timestamp objects may be
 * created within a single millisecond.  All of these Timestamps 
 * will have Date objects with identical values.  To determine the
 * sequence in which the Timestamps were created, we need each 
 * Timestamp to have not only a Date object, but also a "sequence
 * number".  Given two Timestamps with identical Date values, the 
 * sequence number tells which was created first.
 *
 * @scope    public instance constructor
 * @param    inDate    Optional. A Date object. 
 * @param    inSubMillisecondSequenceNumber    Optional. A number. 
 */
function Timestamp(inDate, inSequenceNumber) {
  if (inDate && inSubMillisecondSequenceNumber) {
    // We're "rehydrating" an old Timestamp that we already know
    // the internal state information of.
    this.__myDate = inDate;
    this.__mySequenceNumber = inSequenceNumber;
  } else {
    // We creating a brand new Timestamp, so we need to stamp it
    // with the current time.
    this.__myDate = new Date();
    if (!Timestamp.__ourCurrentMillisecond) {
      // This is the first Timestamp to ever be created
      Timestamp.__ourCurrentMillisecond = this.__myDate.valueOf();
      this.__mySequenceNumber = 1;
      Timestamp.__ourNextAvailableSequenceNumber = 2;
    } else {
      var dateInMilliseconds = this.__myDate.valueOf();
      if (dateInMilliseconds == Timestamp.__ourCurrentMillisecond) {
        // We've already created a previous Timestamp in this same
        // millisecond, so this new Timestamp needs a bigger 
        // sequence number.
        this.__mySequenceNumber = Timestamp.__ourNextAvailableSequenceNumber;
        Timestamp.__ourNextAvailableSequenceNumber += 1;
      } else {
        // The last Timestamp we gave out happened long ago.
        Timestamp.__ourCurrentMillisecond = dateInMilliseconds;
        this.__mySequenceNumber = 1;
        Timestamp.__ourNextAvailableSequenceNumber = 2;
      }
    }
  }
}

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
