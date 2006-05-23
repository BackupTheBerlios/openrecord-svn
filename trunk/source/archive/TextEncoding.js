/*****************************************************************************
 TextEncoding.js

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
dojo.provide("orp.archive.TextEncoding");
dojo.require("orp.lang.Lang");


// -------------------------------------------------------------------
// Public functions
// -------------------------------------------------------------------

/**
 * Given a text string, this method returns a copy of the text string,
 * with certain special characters replaced by escape sequences.
 *
 * For example, given a string like this:
 * <pre>
 *    this.encodeText('The quick <brown> fox & the "lazy" hare.\n');
 * </pre>
 * The return value will be:
 * <pre>
 *    'The quick &lt;brown&gt; fox &amp; the &quot;lazy&quot; hare.&#10;'
 * </pre>
 *
 * @scope    public instance method
 * @param    rawText    A text string to encode.
 * @return   A copy of the rawText string, with the special characters escaped.
 */
orp.archive.TextEncoding.encodeText = function(rawText) {
	orp.lang.assertType(rawText, String);

	var returnString = rawText;
	// Note: it's important that we do '&' first, otherwise we'll accidentally
	// replace all the & characters that we add in the following lines.
	returnString = returnString.replace(new RegExp('&','g'), "&amp;");
	returnString = returnString.replace(new RegExp('<','g'), "&lt;");
	returnString = returnString.replace(new RegExp('>','g'), "&gt;");
	returnString = returnString.replace(new RegExp('"','g'), "&quot;");
	returnString = returnString.replace(new RegExp('\n','g'), "&#10;");
	returnString = returnString.replace(new RegExp('\r','g'), "&#13;");
	return returnString;
};


/**
 * Given a text string that was encoded using encodeText(), this method
 * returns a decoded copy of the text string, with the encoded escape
 * sequences now replaced by the original special characters.
 *
 * For example, given a string like this:
 * <pre>
 *    this.decodeText('The quick &lt;brown&gt; fox &amp; the &quot;lazy&quot; hare.&#10;');
 * </pre>
 * The return value will be:
 * <pre>
 *    'The quick <brown> fox & the "lazy" hare.\n'
 * </pre>
 *
 * @scope    public instance method
 * @param    encodedText    A text string to decode.
 * @return   A copy of the encodedText string, with the escaped characters replaced by the original special characters.
 */
orp.archive.TextEncoding.decodeText = function(encodedText) {
	orp.lang.assertType(encodedText, String);

	var returnString = encodedText;
	returnString = returnString.replace(new RegExp('&#13;','g'), "\r");
	returnString = returnString.replace(new RegExp('&#10;','g'), "\n");
	returnString = returnString.replace(new RegExp('&quot;','g'), '"');
	returnString = returnString.replace(new RegExp('&gt;','g'), ">");
	returnString = returnString.replace(new RegExp('&lt;','g'), "<");
	returnString = returnString.replace(new RegExp('&amp;','g'), "&");
	// Note: it's important that we do '&amp;' last, otherwise we won't correctly
	// handle a case like this:
	//   text = this.decodeText(this.encodeText('&lt;'));
	return returnString;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
