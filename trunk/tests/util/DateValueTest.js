/*****************************************************************************
 DateValueTest.js

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

var TestVars = null;


// -------------------------------------------------------------------
// setUp and tearDown
// -------------------------------------------------------------------

function setUp() {
	dojo.setModulePrefix("dojo", "../../dojo/src"); // relative to testRunner.html
	dojo.setModulePrefix("orp", "../../../source"); // relative to dojo.js
	dojo.require("orp.util.Util");
	dojo.require("orp.util.DateValue");
	// TestVars = {};
}

function tearDown() {
	// TestVars = null;
}


// -------------------------------------------------------------------
// Test functions
// -------------------------------------------------------------------

function testDateValueConstructor() {
	var DateValue = orp.util.DateValue;

	var year = 1944;
	var month = DateValue.Month.FEB;
	var day = 14;
	var hours = 9;
	var minutes = 30;
	var seconds = 15;
	var ms = 444;
	var dates = new Array();
	dates[0] = new DateValue("1944");
	dates[1] = new DateValue("2/14/1944");
	dates[2] = new DateValue("Feb 14 1944");
	dates[3] = new DateValue(-816710400000);
	dates[4] = new DateValue(year, month);
	dates[5] = new DateValue(year, month, day);
	dates[6] = new DateValue(year, month, day, hours);
	dates[7] = new DateValue(year, month, day, hours, minutes);
	dates[8] = new DateValue(year, month, day, hours, minutes, seconds);
	dates[9] = new DateValue(year, month, day, hours, minutes, seconds, ms);
	dates[10] = new DateValue(' today  ');
	dates[11] = new DateValue(Date.now());
	dates[12] = new DateValue('tomorrow');
	dates[13] = new DateValue('April 2006');
	dates[14] = new DateValue('7/2003');
	for (var i in dates) {
		var dateValue = dates[i];
		assertTrue('DateValue is valid', dateValue.isValid());
		assertTrue('orp.util.isDate() returns true', orp.util.isDate(dateValue));
	}
	assertTrue('Time display is right', dates[8].toShortLocaleDateString() == 'Feb 14, 1944 9:30 am');
	assertTrue('Today is parsed correctly', dates[10].toShortLocaleDateString() =='Today');
	assertTrue('Today does not display if _hasTime', dates[11].toShortLocaleDateString().indexOf('Today') != 0);
	assertTrue('Tomorrow is parsed correctly', dates[12].toShortLocaleDateString().toLowerCase() == 'tomorrow');
	assertTrue('today is correct in millisecs', Date.now() - dates[10].getTime() < DateValue.MILLISECS_IN_A_DAY);
	assertTrue('Month/Year parsing is right', dates[13].getYear() == 106 && dates[13].getMonth() == 3);
	assertTrue('Numeric month/year parsing correct', dates[14].getYear() == 103 && dates[14].getMonth() == 6);
	for (i in dates) {
		var asString = dates[i].toShortLocaleDateString();
		assertTrue("All DateValue's should be round tripped: "+ i + ", " + asString, (new DateValue(asString)).isValid());
	}



	var notDates = new Array();
	notDates[0] = new DateValue("194z");
	notDates[1] = new DateValue("");
	notDates[2] = new DateValue("8979789");
	notDates[3] = new DateValue("April");
	for (var j in notDates) {
		var notDateValue = notDates[j];
		assertTrue('DateValue is not valid', !notDateValue.isValid());
	}

	// var alertString = dates.join('\n');
	// alert(alertString);
}

function not_yet_testDateRangeConstructor() {
	// NOTE:
	//   The only DateValue methods that OpenRecord
	// actually relies on are:
	//   toString()
	//   isValid()
	//   orp.util.DateValue.getStringMonthDayYear()

	// TO DO:
	//   create a DateValue with range
	//   serialize a DateValue with range
	//   round trip DVs
	//   make sure isValid is False for bad strings
	var DateValue = orp.util.DateValue;
	var dates = new Array();
	dates[0] = new DateValue("1944");
	dates[1] = new DateValue("1944 - 1994");
	dates[2] = new DateValue("April 1944 - June 1944");
	for (var i in dates) {
		var dateValue = dates[i];
		assertTrue('DateValue is valid', dateValue.isValid());
	}
}


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
