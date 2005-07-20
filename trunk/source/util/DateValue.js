/*****************************************************************************
 DateValue.js

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
// Util public class constants
// -------------------------------------------------------------------
DateValue.MONTH_JAN = 0;
DateValue.MONTH_FEB = 1;
DateValue.MONTH_MAR = 2;
DateValue.MONTH_APR = 3;
DateValue.MONTH_MAY = 4;
DateValue.MONTH_JUN = 5;
DateValue.MONTH_JUL = 6;
DateValue.MONTH_AUG = 7;
DateValue.MONTH_SEP = 8;
DateValue.MONTH_OCT = 9;
DateValue.MONTH_NOV = 10;
DateValue.MONTH_DEC = 11;

DateValue.ARRAY_OF_MONTH_SHORT_NAMES = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
DateValue.ARRAY_OF_MONTH_NAMES = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December");


/**
 * The DateValue class is similar to the JavaScript built-in Date class. 
 * DateValue objects can be used to represent "fuzzy" dates, such as "1999"
 * and "July 1965", as well as complete dates like "May 14, 1982".
 *
 * @scope    public instance constructor
 * @param    foo    A parameter. 
 */
function DateValue(year, month, day, hours, minutes, seconds, ms) {
  var date;

  // Step 1: 
  // Figure out what sort of arguments we've been given.
  //
  // If one string argument is passed, we parse the string.
  // If one numeric argument is passed, it represents milliseconds since 1970.
  // If two or more arguments are passed, they are year, month, day, hours, etc.
  var STRING          = "STRING";
  var MILLISECONDS    = "MILLISECONDS";
  var SEPARATE_FIELDS = "SEPARATE_FIELDS";
  var argumentType = null;
  
  if ((typeof year) == "string") {
    argumentType = STRING;
  }
  if ((typeof year) == "number") {
    if ((typeof month) == "number") {
      argumentType = SEPARATE_FIELDS;
    } else {
      argumentType = MILLISECONDS;
    }
  }
  
  // Step 2: 
  // Create a conventional JavaScript Date object.
  switch (argumentType) {
    case STRING:
      date = new Date(year);
      break;
    case MILLISECONDS:
      date = new Date(year);
      break;
    case SEPARATE_FIELDS:
      if (!day) {
        date = new Date(year, month);
      } else {
        hours = hours ? hours : null;
        minutes = minutes ? minutes : null;
        seconds = seconds ? seconds : null;
        ms = ms ? ms : null;
        date = new Date(year, month, day, hours, minutes, seconds, ms);
      }
      break;
  }
  
  // Step 3: 
  // Take note of whether this is just a year, a full timestamp, or something
  // in between.
  switch (argumentType) {
    case MILLISECONDS:
      date._hasTime = true;
      break;
    case SEPARATE_FIELDS:
      if (hours || minutes || seconds || ms) {
        date._hasTime = true;
        // date._hasDay = true;
        // date._hasMonth = true;
      } else {
        date._hasTime = false;
        date._hasDay = day ? true : false;
        date._hasMonth = true;
      }
      break;
    case STRING:
      date._hasTime = (year.indexOf(':') != -1) ? true : false;
      // if (date._hasTime) {
      //   date._hasDay = true;
      //   date._hasMonth = true;
      // }
      if (!date._hasTime) {
        if (!isNaN(date.valueOf())) {
          date._hasDay = true;
          date._hasMonth = true;
       } else {
          // If we get here, it means we may have been passed a string like 
          // "1944" or "July 1944", which the Date class was not able to parse.
          // We should try to parse the string ourselves and create a valid
          // Date object.
          //
          // PENDING: 
          // Right now we only have code to parse strings like "1944".
          // We should expand this to deal with strings like "Feb 1944",
          // "February 1944", "1944/02", etc.
          var yearAsInt = parseInt(year);
          if ((year.length == 4) && !isNaN(yearAsInt)) {
            date = new Date(yearAsInt, DateValue.MONTH_JAN);
            date._hasTime = false;
            date._hasDay = false;
            date._hasMonth = false;
          }
       }
      }
      break;
  }
  
  // Step 4: 
  // Add our own new DateValue methods to the conventional JavaScript Date object.
  date.isValid = function() {
    var valid = !isNaN(this.valueOf());
    return valid;
  };
  if (!date._hasTime) {
    date.toString = function() {
      if (this._hasDay && this._hasMonth) {
        return this.toLocaleDateString();
      } else {
        if (this._hasMonth) {
          return DateValue.ARRAY_OF_MONTH_SHORT_NAMES[this.getUTCMonth()] + ' ' + this.getUTCFullYear();
        } else {
          return this.getUTCFullYear();
        }
      }
    };
  }
  date.toShortLocaleDateString = function() {
    if (this._hasTime || (this._hasDay && this._hasMonth)) {
      return DateValue.ARRAY_OF_MONTH_SHORT_NAMES[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
    } else {
      if (this._hasMonth) {
        return DateValue.ARRAY_OF_MONTH_SHORT_NAMES[this.getUTCMonth()] + ' ' + this.getUTCFullYear();
      } else {
        return this.getUTCFullYear().toString();
      }
    }
  };

  return date;
}


// -------------------------------------------------------------------
// Public class methods
// -------------------------------------------------------------------

/**
 * Given a Date, returns a string like "Feb 14, 1944".
 *
 * @scope    public class method
 * @param    date    Either a Date or DateValue object. 
 * @return   A string like "Feb 14, 1944". 
 */
DateValue.getStringMonthDayYear = function(date) {
  return DateValue.ARRAY_OF_MONTH_SHORT_NAMES[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
