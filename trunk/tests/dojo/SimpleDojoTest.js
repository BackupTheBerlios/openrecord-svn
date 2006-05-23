/*****************************************************************************
 SimpleDojoTest.js

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
	dojo.setModulePrefix("dojo", "../../dojo/src");  // relative to testRunner.html
	// alert("Dojo version: " + dojo.version.toString()); // "Dojo version: 0.2.0 (2540)"
	// alert("dojo.hostenv.getBaseScriptUri() = " + dojo.hostenv.getBaseScriptUri());
		// "dojo.hostenv.getBaseScriptUri() = ../../third_party/dojo/"
	dojo.require("dojo.lang.*");
	dojo.require("dojo.text.*");
	dojo.require("dojo.crypto.MD5");
}

function tearDown() {
	// do nothing
}


// -------------------------------------------------------------------
// Test functions
// -------------------------------------------------------------------

function testDojoTextTrim() {
	var string = "     Just Foo    ";
	var trimmedString = dojo.text.trim(string);
	assertTrue("'Just Foo' remains after trimming.", trimmedString == "Just Foo");
}

function testDojoLang() {
	assertTrue("'Iggy Pop' is a string.", dojo.lang.isString("Iggy Pop"));
}

function testDojoInherits() {
	classA = function() {
		this._a = 3;
	};
	classB = function() {
		classA.call(this);
		this._b = 4;
	};
	dojo.inherits(classB, classA);
	var b = new classB();
	assertTrue("b should be an instance of classB.", b instanceof classB);
	assertTrue("b should be an instance of classA.", b instanceof classA);
	assertTrue("b._a == 3", b._a == 3);
}

function testMD5() {
	var whenInTheCourse = "When in the course of human events: d41d8cd98f00b204e9800998ecf8427e";
	var theQuickBrownFox = "The quick brown fox jumps over the lazy dog";
	var theRainInSpain = "The rain in Spain falls mainly on the plain.";
	assertTrue('md5 of "" is correct', (getHexMD5("") == "d41d8cd98f00b204e9800998ecf8427e"));
	assertTrue('md5 of "abc" is correct', (getHexMD5("abc") == "900150983cd24fb0d6963f7d28e17f72"));
	assertTrue('md5 of "iggy" is correct', (getHexMD5("iggy") == "0e026f55a72c0861a93e750c2a5427b1"));
	assertTrue('md5 of "The quick brown fox..." is correct', (getHexMD5(theQuickBrownFox) == "9e107d9d372bb6826bd81d3542a419d6"));
	assertTrue('md5 of "When in the course..." is correct', (getHexMD5(whenInTheCourse) == "4d694e03af399831c6f0c1f1bcc2fc93"));
	assertTrue('md5 of "The rain in Spain..." is correct', (getHexMD5(theRainInSpain) == "3948716d567532d9aee33c7d2f34b970"));
}

// -------------------------------------------------------------------
// Helper functions
// -------------------------------------------------------------------

function getHexMD5(string) {
	// return dojo.crypto.toBinHex(dojo.crypto.MD5.compute(string));
	return dojo.crypto.MD5.compute(string, dojo.crypto.outputTypes.Hex);
}


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
