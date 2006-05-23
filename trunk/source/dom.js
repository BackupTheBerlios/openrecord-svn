/*****************************************************************************
 dom.js

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
dojo.provide("orp.dom");
dojo.require("dojo.dom");
dojo.require("orp.lang.Lang");


// -------------------------------------------------------------------
// Public functions
// -------------------------------------------------------------------

/**
 * Given an HTMLElement, and a keyword-value pair, this method associates
 * the value with the keyword for the given element.  To get the value
 * back again, use the orp.dom.getKeywordValueForElement() function.
 *
 * @scope    public function
 * @param    element    Any HTMLElement.
 * @param    keyword    A unique key string.
 * @param    value    Any value.
 */
orp.dom.setKeywordValueForElement = function(element, keyword, value) {
	orp.lang.assert(element instanceof HTMLElement);
	orp.lang.assertType(keyword, String);

	if (!element.id) {
		element.id = dojo.dom.getUniqueId();
	}
	if (!orp.dom._ourHashTableOfAssociationsKeyedByElementId) {
		orp.dom._ourHashTableOfAssociationsKeyedByElementId = {};
	}
	if (!orp.dom._ourHashTableOfAssociationsKeyedByElementId[element.id]) {
		orp.dom._ourHashTableOfAssociationsKeyedByElementId[element.id] = {};
	}
	var keyValueTable = orp.dom._ourHashTableOfAssociationsKeyedByElementId[element.id];
	keyValueTable[keyword] = value;
};


/**
 * Given an HTMLElement and a keyword, this method returns the value
 * that was associated with the keyword for the element using the
 * orp.dom.setKeywordValueForElement() function.
 *
 * @scope    public function
 * @param    element    Any HTMLElement.
 * @param    keyword    A unique key string.
 * @return   The value associated with the element and keyword.
 */
orp.dom.getKeywordValueForElement = function(element, keyword) {
	orp.lang.assert(element instanceof HTMLElement);
	orp.lang.assertType(keyword, String);

	if (!orp.dom._ourHashTableOfAssociationsKeyedByElementId || !element.id) {
		return null;
	}
	var keyValueTable = orp.dom._ourHashTableOfAssociationsKeyedByElementId[element.id];
	if (!keyValueTable) {
		return null;
	}
	return keyValueTable[keyword];
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
