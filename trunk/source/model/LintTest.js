/*****************************************************************************
 LintTest.js
 
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
 
var Lint = {};


/**
 * Given a string containing JavaScript code, returns true if the code passes 
 * the lint tests.
 *
 * @scope    public class method
 * @param    inString    A string containing JavaScript code. 
 * @return   A boolean value. True if the code is good (according to jslint).
 */
Lint.isCodeCleanInString = function(inString) {
  jslint.laxLineEnd = false;
  jslint.plusplus = true;
  jslint.cap = false;
  jslint.jscript = false;
  jslint(inString);
  var report = jslint.report();
  var jslingIsOkay = (report.substr(0, 2) == 'ok');
  var noTabs = (inString.indexOf("\t") == -1);
  var noBackspaces = (inString.indexOf("\b") == -1);
  var noCarriageReturns = (inString.indexOf("\r") == -1);
  var noFormFeeds = (inString.indexOf("\f") == -1);
  var allClean = jslingIsOkay && noTabs && noBackspaces && noCarriageReturns && noFormFeeds;
  return (allClean);
}; 


/**
 * Given the URL of a file, returns the contents of the file as a text string.
 *
 * @scope    public class method
 * @param    inUrl    A string with the URL of a file containing JavaScript code. 
 * @return   A string containing the contents of the file.
 */
// PENDING: move this up into Util.js
Util.getStringContentsOfFileAtURL = function (inUrl) {
  var anXMLHttpRequestObject = new XMLHttpRequest();
  anXMLHttpRequestObject.open("GET", inUrl, false);
  anXMLHttpRequestObject.send(null);
  var fileContents = anXMLHttpRequestObject.responseText;
  return fileContents;
};


/**
 * Given the URL of a file containing JavaScript code, returns true if the code 
 * passes the lint tests.
 *
 * @scope    public class method
 * @param    inUrl    A string with the URL of a file containing JavaScript code. 
 * @return   A boolean value. True if the code is good (according to jslint).
 */
Lint.isCodeCleanAtUrl = function (inUrl) {
  var fileContents = Util.getStringContentsOfFileAtURL(inUrl);
  return Lint.isCodeCleanInString(fileContents);
};


/**
 * Given the name of a file containing JavaScript code, returns true if the 
 * code passes the lint tests.
 *
 * @scope    public class method
 * @param    inFileName    A string with the name of a file containing JavaScript code. 
 * @return   A boolean value. True if the code is good (according to jslint).
 */
Lint.isCodeCleanInFile = function (inFileName) {
  var url  = "../../current/trunk/source/" + inFileName;
  return Lint.isCodeCleanAtUrl(url);
};

function setUp() {
}

function testJsLintOnGoodCodeFragment() {
  var textToRunLintOn = "function iggy() { var pop = 'no fun'; }";
  assertTrue("jslint says clean code is clean", Lint.isCodeCleanInString(textToRunLintOn));
}

function testJsLintOnBadCodeFragment() {
  // badFragmentOne has THIS_SYMBOL_IS_BAD, which JSLint should catch
  var badFragmentOne = "function iggy() { var pop = 'no fun'; } THIS_SYMBOL_IS_BAD";

  // badFragmentTwo has tab characters in it, which our own isCodeCleanInString()
  // method should catch
  var badFragmentTwo = "function iggy()		{ var pop = 'no fun'; } ";
  
  // badFragmentThree has a carriage return character in it, which our own 
  // isCodeCleanInString() method should catch
  var badFragmentThree = "function iggy() \r { var pop = 'no fun'; } ";
  
  assertFalse("jslint says dirty code is dirty", Lint.isCodeCleanInString(badFragmentOne));
  assertFalse("jslint says dirty code is dirty", Lint.isCodeCleanInString(badFragmentTwo));
  assertFalse("jslint says dirty code is dirty", Lint.isCodeCleanInString(badFragmentThree));
}

function testJsLintOnOpenRecordCode() {
  var listOfSourceCodeFiles = [
    "Ordinal.js",
    "Vote.js",
    "Entry.js",
    "Item.js",
    "Value.js",
    "World.js",
    "StubVirtualServer.js",
    "BigLumpVirtualServer.js",
    "ModelTest.js"];
  for (var key in listOfSourceCodeFiles) {
    var fileName = listOfSourceCodeFiles[key];
    assertTrue("jslint says " + fileName + " is clean", Lint.isCodeCleanInFile(fileName));
  }
}

function tearDown() {
}

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
