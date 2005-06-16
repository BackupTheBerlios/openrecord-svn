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
// Dependencies, expressed in the syntax that JSLint understands:
/*global Util, jslint */
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
function LintTool() {
  throw new Error("LintTool is a static class. You can't create instances of it.");
}


// -------------------------------------------------------------------
// String manipulation methods
// -------------------------------------------------------------------

/**
 * Given a string containing JavaScript code, returns null if the code passes 
 * the lint tests.
 *
 * @scope    public class method
 * @param    inString    A string containing JavaScript code. 
 * @return   Returns an error message string, or returns an empty string if there are no errors (according to jslint).
 */
LintTool.getErrorReportForCodeInString = function (inString) {
  var errorMessage = "";

  // call jslint, and see if it reported errors
  jslint.laxLineEnd = false;
  jslint.plusplus = true;
  jslint.cap = false;
  jslint.jscript = false;
  jslint(inString);
  var report = jslint.report();
  var jslintIsOkay = (report.substr(0, 2) == 'ok');
  if (!jslintIsOkay) {
    errorMessage = report + '\n';
  }
  
  // now check for tabs, backspaces, etc.
  var noTabs = (inString.indexOf("\t") == -1);
  if (!noTabs) {
    errorMessage += "There are tab characters in the file." + '\n';
  }
  var noBackspaces = (inString.indexOf("\b") == -1);
  if (!noBackspaces) {
    errorMessage += "There are backspace characters in the file." + '\n';
  }
  var noCarriageReturns = (inString.indexOf("\r") == -1);
  if (!noCarriageReturns) {
    errorMessage += "There are carriage return characters in the file." + '\n';
  }
  var noFormFeeds = (inString.indexOf("\f") == -1);
  if (!noCarriageReturns) {
    errorMessage += "There are carriage return characters in the file." + '\n';
  }
  // var allClean = jslintIsOkay && noTabs && noBackspaces && noCarriageReturns && noFormFeeds;
  return errorMessage;
}; 


/**
 * Given the URL of a file containing JavaScript code, returns null if the code passes 
 * the lint tests.
 *
 * @scope    public class method
 * @param    inUrl    A string with the URL of a file containing JavaScript code. 
 * @return   Returns an error message string, or returns an empty string if there are no errors (according to jslint).
 */
LintTool.getErrorReportForCodeAtUrl = function (inUrl) {
  var fileContents = Util.getStringContentsOfFileAtURL(inUrl);
  return LintTool.getErrorReportForCodeInString(fileContents);
};

        
/**
 * Given a list of file names, this method runs lint tests on all the files and 
 * returns null if the code passes the lint tests.
 *
 * @scope    public class method
 * @param    inListOfFilenames    A list of filename strings. 
 * @param    inPath    Optional.  A path prefix string to prepend to the filename strings. 
 * @return   Returns an error message string, or returns an empty string if there are no errors (according to jslint).
 */
LintTool.getErrorReportFromListOfFilesnames = function (inListOfFilenames, inPath) {
  Util.assert(Util.isArray(inListOfFilenames));
  if (inPath) {
    Util.assert(Util.isString(inPath));
  } else {
    inPath = "";
  }
  
  var aggregateErrorReport = "";
  var separatorLine = "_____________________________________" + "\n";
  for (var key in inListOfFilenames) {
    var filename = inListOfFilenames[key];
    var url = inPath + filename;
    var errorReportForFile = LintTool.getErrorReportForCodeAtUrl(url);
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
