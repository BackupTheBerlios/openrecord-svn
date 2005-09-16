/*****************************************************************************
 LintTool.js
 
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
dojo.provide("orp.util.LintTool");
dojo.require("dojo.lang.*");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
/*global Util, jslint */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------

/**
 * The LintTool class is just a thin wrapper around Douglas Crockford's
 * JSLint utility.
 *
 * There is no need to ever call this constructor.  All the LintTool
 * methods are class methods, not instance methods, and the only 
 * reason this constructor exists is to cause the name "LintTool"
 * to be a globally-scoped class name, which the class methods 
 * can then be attached to.
 *
 * @scope    public instance constructor
 * @syntax   DO NOT CALL THIS CONSTRUCTOR
 */
orp.util.LintTool = function() {
  throw new Error("LintTool is a static class. You can't create instances of it.");
};


// -------------------------------------------------------------------
// String manipulation methods
// -------------------------------------------------------------------

/**
 * Given a string containing JavaScript code, returns null if the code passes 
 * the lint tests.
 *
 * @scope    public class method
 * @param    codeString    A string containing JavaScript code. 
 * @return   Returns an error message string, or returns an empty string if there are no errors (according to jslint).
 */
orp.util.LintTool.getErrorReportForCodeInString = function(codeString) {
  var errorMessage = "";

  // Call jslint, and see if it reported errors.
  jslint.laxLineEnd = false;
  jslint.plusplus = true;
  jslint.cap = false;
  jslint.jscript = false;
  jslint(codeString);
  var report = jslint.report();
  var jslintIsOkay = (report.substr(0, 2) == 'ok');
  if (!jslintIsOkay) {
    errorMessage = report + '\n';
  }
  
  // Check for tabs, backspaces, etc.
  errorMessage += orp.util.LintTool.checkForString(codeString, '\t', "There are tab characters in the file.");
  errorMessage += orp.util.LintTool.checkForString(codeString, '\b', "There are backspace characters in the file.");
  errorMessage += orp.util.LintTool.checkForString(codeString, '\r', "There are carriage return characters in the file.");
  errorMessage += orp.util.LintTool.checkForString(codeString, '\f', "There are form feed characters in the file.");
  
  // Check for discouraged code
  // We have to break 'document' + '.write' into two parts, or else this LintTool.js
  // file won't pass its own lint test.
  errorMessage += orp.util.LintTool.checkForString(codeString, 'document' + '.write');
  errorMessage += orp.util.LintTool.checkForString(codeString, 'document' + '.all');
  errorMessage += orp.util.LintTool.checkForString(codeString, 'document' + '.layers');

  return errorMessage;
}; 


/**
 * Given a string containing JavaScript code, this method checks to make
 * sure the code does not contain some specific sub-string, and returns 
 * an error message if the sub-string is found.
 *
 * @scope    public class method
 * @param    codeString    A string containing JavaScript code. 
 * @param    memberString    The sub-string that should not be in the code. 
 * @param    errorMessage    Optional. The error message to return if the memberString was found in codeString. 
 * @return   Returns an error message string, or returns an empty string if there are no errors.
 */
orp.util.LintTool.checkForString = function(codeString, memberString, errorMessage) {
  var returnString = "";
  var clean = (codeString.indexOf(memberString) == -1);
  if (!clean) {
    if (!errorMessage) {
      errorMessage = 'The file contains discouraged code: "' + memberString + '"';
    }
    returnString += errorMessage + '\n';
  }
  return returnString;
};
  

/**
 * Given the URL of a file containing JavaScript code, returns null if the code passes 
 * the lint tests.
 *
 * @scope    public class method
 * @param    url    A string with the URL of a file containing JavaScript code. 
 * @return   Returns an error message string, or returns an empty string if there are no errors (according to jslint).
 */
orp.util.LintTool.getErrorReportForCodeAtUrl = function(url) {
  var fileContents = Util.getStringContentsOfFileAtURL(url);
  return orp.util.LintTool.getErrorReportForCodeInString(fileContents);
};

        
/**
 * Given a list of file names, this method runs lint tests on all the files and 
 * returns null if the code passes the lint tests.
 *
 * @scope    public class method
 * @param    listOfFilenames    A list of filename strings. 
 * @param    path    Optional.  A path prefix string to prepend to the filename strings. 
 * @return   Returns an error message string, or returns an empty string if there are no errors (according to jslint).
 */
orp.util.LintTool.getErrorReportFromListOfFilesnames = function(listOfFilenames, path) {
  Util.assert(Util.isArray(listOfFilenames));
  if (path) {
    Util.assert(dojo.lang.isString(path));
  } else {
    path = "";
  }
  
  var aggregateErrorReport = "";
  var separatorLine = "_____________________________________" + "\n";
  for (var key in listOfFilenames) {
    var filename = listOfFilenames[key];
    var url = path + filename;
    var errorReportForFile = orp.util.LintTool.getErrorReportForCodeAtUrl(url);
    if (errorReportForFile) {
      var message = separatorLine + filename + "\n" + errorReportForFile;
      aggregateErrorReport += message;
    }
  }
  if (aggregateErrorReport) {
    aggregateErrorReport += separatorLine;
  }
  return aggregateErrorReport;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
