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
// Provides and Requires
// -------------------------------------------------------------------
dojo.provide("orp.util.DateValue");
dojo.require("dojo.lang.*");
dojo.require("orp.util.Util");


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------

/**
 * The DateValue class is similar to the JavaScript built-in Date class.
 * DateValue objects can be used to represent "fuzzy" dates, such as "1999"
 * and "July 1965", as well as complete dates like "May 14, 1982".
 *
 * @scope    public instance constructor
 * @param    year-etc    Any of the same values that the Date class accepts.
 */
orp.util.DateValue = function(year, month, day, hours, minutes, seconds, ms) {
	var DateValue = orp.util.DateValue;
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
			var evalStr = orp.util.trimString(year).toLowerCase();
			if (evalStr == 'today') {
				date = new Date(Math.floor((Date.now()-DateValue.TIMEZONE_OFFSET)/DateValue.MILLISECS_IN_A_DAY) *
					DateValue.MILLISECS_IN_A_DAY + DateValue.TIMEZONE_OFFSET);
			}
			else if (evalStr == 'tomorrow') {
				date = new Date(Math.floor((Date.now()-DateValue.TIMEZONE_OFFSET)/DateValue.MILLISECS_IN_A_DAY) *
					DateValue.MILLISECS_IN_A_DAY+ DateValue.TIMEZONE_OFFSET+ DateValue.MILLISECS_IN_A_DAY);
			}
			else {
				date = new Date(year);
			}
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
			// (date._hasTime == true) implies _hasDay and _hasMonth, so we don't need to set them
			// date._hasDay = true;
			// date._hasMonth = true;
			break;
		case SEPARATE_FIELDS:
			if (hours || minutes || seconds || ms) {
				date._hasTime = true;
				// (date._hasTime == true) implies _hasDay and _hasMonth, so we don't need to set them
				// date._hasDay = true;
				// date._hasMonth = true;
			} else {
				date._hasTime = false;
				date._hasDay = day ? true : false;
				date._hasMonth = true;
			}
			break;
		case STRING:
			// If we were given a string like "Tue Apr 30 2005 09:45:00", then
			// we know not just the date, but also the time, and we set _hasTime
			// to true.  If we were given a string like "Apr 30 2005" then we
			// set _hasTime to false.
			date._hasTime = (year.indexOf(':') != -1) ? true : false;
			// (date._hasTime == true) implies _hasDay and _hasMonth, so we don't need to set them
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
					if ((year.length == 4) && !isNaN(yearAsInt) && (year == yearAsInt)) {
						// This code handles strings like "1944" and "2340"
						date = new Date(yearAsInt, DateValue.Month.JAN);
						date._hasTime = false;
						date._hasDay = false;
						date._hasMonth = false;
					}
					else {
						// This code handles strings like:
						//   "August 1944"
						//   "Aug 1944"
						//   "08/1944"
						var monthMatchStr = DateValue.ARRAY_OF_MONTH_SHORT_NAMES.concat(DateValue.ARRAY_OF_MONTH_NAMES).join('|');
						var regExpr = new RegExp("^\\s*("+monthMatchStr+")\\s+(\\d{4})\\s*$","i");
						var matchArray = year.match(regExpr);
						var monthIndex;
						if (matchArray) {
							monthIndex = orp.util.getArrayIndex(DateValue.ARRAY_OF_MONTH_SHORT_NAMES,matchArray[1]);
							if (monthIndex == -1) {
								monthIndex = orp.util.getArrayIndex(DateValue.ARRAY_OF_MONTH_NAMES,matchArray[1]);
							}
						}
						else {
							regExpr = new RegExp("^\\s*(\\d{1,2})\\s*[-|/]\\s*(\\d{4})\\s*$","i");
							matchArray = year.match(regExpr);
							if (matchArray) {
								monthIndex = parseInt(matchArray[1]) - 1;
								if (monthIndex > 11) {matchArray = null;}
							}
						}
						if (matchArray) {
							date = new Date(parseInt(matchArray[2]), monthIndex);
							date._hasTime = false;
							date._hasDay = false;
							date._hasMonth = true;
						}
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
			var timezoneOffsetMS = this.getTimezoneOffset()*60*1000; // converting from minutes to millisecs
			var todayInDays = Math.floor((Date.now()-timezoneOffsetMS)/DateValue.MILLISECS_IN_A_DAY);
			var dateInDays = Math.floor((this.getTime()-timezoneOffsetMS)/DateValue.MILLISECS_IN_A_DAY);
			var returnStr;
			if (dateInDays == todayInDays && !this._hasTime) {
				returnStr = 'Today';
			}
			else if (dateInDays == (todayInDays + 1) && !this._hasTime) {
				returnStr = 'Tomorrow';
			}
			else {
				returnStr = DateValue.ARRAY_OF_MONTH_SHORT_NAMES[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
			}
			if (this._hasTime) {
				//PENDING i18n settings
				var timeStr = '';
				var minutes = date.getMinutes();
				var hours = date.getHours();
				if (minutes !== 0 || hours !== 0) {
					returnStr += ' ' + (hours % 12);
					returnStr += ':' + (minutes < 10 ? '0' + minutes : minutes);
					returnStr += ' ' + (hours > 12 ? 'pm' : 'am');
				}
			}
			return returnStr;
		} else {
			if (this._hasMonth) {
				return DateValue.ARRAY_OF_MONTH_SHORT_NAMES[this.getUTCMonth()] + ' ' + this.getUTCFullYear();
			} else {
				return this.getUTCFullYear().toString();
			}
		}
	};

	return date;
};


// -------------------------------------------------------------------
// Public class constants
// -------------------------------------------------------------------
orp.util.DateValue.Month = {
	JAN: 0,
	FEB: 1,
	MAR: 2,
	APR: 3,
	MAY: 4,
	JUN: 5,
	JUL: 6,
	AUG: 7,
	SEP: 8,
	OCT: 9,
	NOV: 10,
	DEC: 11 };

orp.util.DateValue.MILLISECS_IN_A_DAY = 86400000;
orp.util.DateValue.TIMEZONE_OFFSET = new Date().getTimezoneOffset()*60*1000;

orp.util.DateValue.ARRAY_OF_MONTH_SHORT_NAMES = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
orp.util.DateValue.ARRAY_OF_MONTH_NAMES = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December");



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
orp.util.DateValue.getStringMonthDayYear = function(date) {
	return orp.util.DateValue.ARRAY_OF_MONTH_SHORT_NAMES[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
