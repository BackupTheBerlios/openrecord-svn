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


// -------------------------------------------------------------------
// setUp and tearDown
// -------------------------------------------------------------------

function setUp() {
	dojo.setModulePrefix("dojo", "../../../dojo/src"); // relative to testRunner.html
	dojo.setModulePrefix("orp", "../../../../source"); // relative to dojo.js?
	dojo.require("orp.util.LintTool");
}

function tearDown() {
}


// -------------------------------------------------------------------
// Test functions
// -------------------------------------------------------------------

function testJsLintOnGoodCodeFragment() {
	var textToRunLintOn = "function iggy() { var pop = 'no fun'; }";
	assertTrue("jslint says clean code is clean", !orp.util.LintTool.getErrorReportForCodeInString(textToRunLintOn));
}

function testJsLintOnBadCodeFragment() {
	// badFragmentOne has THIS_SYMBOL_IS_BAD, which JSLint should catch
	var badFragmentOne = "function iggy() { var pop = 'no fun'; } THIS_SYMBOL_IS_BAD";

	// badFragmentTwo has a backspace character in it, which our own isCodeCleanInString()
	// method should catch
	var badFragmentTwo = "function iggy()	\b { var pop = 'no fun'; } ";

	// badFragmentThree has a form feed character in it, which our own
	// isCodeCleanInString() method should catch
	var badFragmentThree = "function iggy() \f { var pop = 'no fun'; } ";

	assertFalse("jslint says dirty code is dirty", !orp.util.LintTool.getErrorReportForCodeInString(badFragmentOne));
	assertFalse("jslint says dirty code is dirty", !orp.util.LintTool.getErrorReportForCodeInString(badFragmentTwo));
	assertFalse("jslint says dirty code is dirty", !orp.util.LintTool.getErrorReportForCodeInString(badFragmentThree));
}

function testJsLintOnOpenRecordCode() {
	var listOfSourceCodeFiles = [
		"dom.js",
		"OpenRecordLoaderStepThree.js",
		"TablePlugin.js",
		"OutlinePlugin.js",
		"DetailPlugin.js",
		"BarChartPlugin.js"];
	var prefix = "../../../source/";
	var errorReport = orp.util.LintTool.getErrorReportFromListOfFilesnames(listOfSourceCodeFiles, prefix);
	var message = "Lint check \n" + errorReport;
	assertTrue(message, !errorReport);
}


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
