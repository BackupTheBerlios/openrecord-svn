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

function setUp() {
  // TestVars = {};
  // TestVars.theHobbit = "The Hobbit";
}

function testDateValueConstructor() {
  var year = 1944;
  var month = DateValue.MONTH_FEB;
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
  for (var i in dates) {
    var dateValue = dates[i];
    assertTrue('DateValue is valid', dateValue.isValid());
    assertTrue('Util.isDate() returns true', Util.isDate(dateValue));
  }
  // var alertString = dates.join('\n');
  // alert(alertString);
}


function tearDown() {
  // TestVars = null;
}

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
