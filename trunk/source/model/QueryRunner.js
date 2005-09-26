/*****************************************************************************
 QueryRunner.js
 
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
dojo.provide("orp.model.QueryRunner");
dojo.require("orp.model.World");
dojo.require("orp.lang.Lang");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global Util  */
/*global Item, World  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------
/**
 * A QueryRunner is used to run a query.  
 *
 * A QueryRunner can be initialized with a query spec item, so that when the
 * QueryRunner is executed it will return the item specified by the query spec.
 * 
 * Or, a QueryRunner can be initialized with an ad-hoc query instead of a 
 * query spec item.  Here are some examples of ad-hoc queries:
 *
 *  {attribute: attributeState, values:["MD", "DC"]}             // all items where State is MD or DC
 *  {attribute: attributeState, values:["MD", "DC", "CA", "WA"]} // all items in any of 4 states
 *  {attribute: attributeCategory, values:[categoryBug]}         // all items assigned to category Bug
 *  {values: [categoryBug]}                                      // all items assigned to category Bug
 *  [berlin, moscow, tokyo, seattle]                             // just these 4 items
 * 
 * @scope    public instance constructor
 * @param    world    The World of items this query will search within. 
 * @param    querySpec    Optional. A query spec item, or an ad-hoc query. 
 * @param    observer    Optional. An object or method to be registered as an observer of the query. 
 */
orp.model.QueryRunner = function(world, querySpec, observer) {
  orp.lang.assert(world instanceof orp.model.World);
  
  this._world = world;
  this._querySpec = querySpec;
  this._observer = observer;
  
  this._listOfResultItems = null;
  this._matchingAttribute = null;
  this._listOfMatchingValues = null;
  
  if (this._querySpec) {
    if (this._querySpec instanceof orp.model.Item) {
      this._querySpec.addObserver(this);
    }
    this._readQuerySpec();
    this._runQuery();
  }
  this.getWorld()._registerQueryRunner(this);
};

// -------------------------------------------------------------------
// Public constants
// -------------------------------------------------------------------
// orp.model.QueryRunner.EXPLICIT_LIST_OF_ITEMS = QueryRunner;
orp.model.QueryRunner.EXPLICIT_LIST_OF_ITEMS = "EXPLICIT_LIST_OF_ITEMS";
orp.model.QueryRunner.QuerySpec = {
  ATTRIBUTE: "attribute",
  VALUES:    "values" };


// -------------------------------------------------------------------
// Public methods 
// -------------------------------------------------------------------

/**
 * Returns the World instance that this QueryRunner is using.
 *
 * @scope    public instance method
 * @return   A World object. 
 */
orp.model.QueryRunner.prototype.getWorld = function() {
  return this._world;
};


/**
 * Returns the attribute item that this query evaluates against.
 *
 * @scope    public instance method
 * @return   An attribute item. 
 */
orp.model.QueryRunner.prototype.getMatchingAttribute = function() {
  return this._matchingAttribute;
};


/**
 * Returns the list of values that this query evaluates against.
 *
 * @scope    public instance method
 * @return   A list of values. 
 */
orp.model.QueryRunner.prototype.getMatchingValues = function() {
  return this._listOfMatchingValues;
};


/**
 * Returns the list of items that match the query.
 *
 * @scope    public instance method
 * @return   The list of items in the query result set. 
 */
orp.model.QueryRunner.prototype.getResultItems = function() {
  return this._listOfResultItems;
};


/**
 * Returns true if the given item matches the query criteria.
 *
 * @scope    public instance method
 * @param    item    An item to test. 
 * @return   A boolean value. True if the item matches the query criteria.
 */
orp.model.QueryRunner.prototype.doesItemMatch = function(item) {
  if (item.hasBeenDeleted()) {
    return false;
  }
  
  var matchingAttribute = this.getMatchingAttribute();
  var listOfMatchingValues = this.getMatchingValues();
  if (matchingAttribute == orp.model.QueryRunner.EXPLICIT_LIST_OF_ITEMS) {
    return orp.util.isObjectInSet(item, listOfMatchingValues);
  } else {
    for (var key in listOfMatchingValues) {
      var matchingValue = listOfMatchingValues[key];
      if (item.hasAttributeValue(matchingAttribute, matchingValue)) {
        return true;
      }
    }
  }
  
  return false;
};


/**
 * Does final clean-up.
 *
 * @scope    public instance method
 */
orp.model.QueryRunner.prototype.endOfLife = function() {
  this.getWorld()._unregisterQueryRunner(this);
};


// -------------------------------------------------------------------
// QuerySpec observer method 
// -------------------------------------------------------------------

/**
 * Called when there has been a change to the querySpec.
 *
 * @scope    public instance method
 * @param    querySpec    The querySpec that was changed. 
 * @param    listOfChangeRecords    A list of the records that impacted the querySpec. 
 */
orp.model.QueryRunner.prototype.observedItemHasChanged = function(querySpec, listOfChangeRecords) {
  orp.lang.assert(querySpec == this._querySpec);
  this._readQuerySpec();
  this._runQuery();
};


// -------------------------------------------------------------------
// Change notification methods 
// -------------------------------------------------------------------

/**
 * Called by the world if there has been a change to the result set during
 * a transaction.
 *
 * @scope    package instance method
 */
orp.model.QueryRunner.prototype._resultsHaveChanged = function() {
  this._runQuery();
};


// -------------------------------------------------------------------
// Private methods 
// -------------------------------------------------------------------

/**
 * Reads the querySpec and sets our own query representation to match
 * the query spec.
 *
 * @scope    public instance method
 */
orp.model.QueryRunner.prototype._readQuerySpec = function() {
  this._matchingAttribute = null;
  this._listOfMatchingValues = null;
  
  if (!this._querySpec) {
    return;
  }

  // Handle the case where we have a query spec item
  if (this._querySpec instanceof orp.model.Item) {
    // read the matching attribute from the query spec
    var attributeCalledQueryMatchingAttribute = this.getWorld().getAttributeCalledQueryMatchingAttribute();
    var listOfMatchingAttributeEntries = this._querySpec.getEntriesForAttribute(attributeCalledQueryMatchingAttribute);
    if (listOfMatchingAttributeEntries.length === 0) {
      // by default the matching attribute is category
      this._matchingAttribute = this.getWorld().getAttributeCalledCategory();
    } else {
      orp.lang.assert(listOfMatchingAttributeEntries.length == 1, 'There should only be one matching attribute on a Query Spec item.');
      this._matchingAttribute = listOfMatchingAttributeEntries[0].getValue();
    }

    // read the matching values from the query spec
    this._listOfMatchingValues = [];
    var attributeCalledQueryMatchingValue = this.getWorld().getAttributeCalledQueryMatchingValue();
    var listOfMatchingEntries = this._querySpec.getEntriesForAttribute(attributeCalledQueryMatchingValue);
    for (var key in listOfMatchingEntries) {
      var matchingEntry = listOfMatchingEntries[key];
      var matchingValue = matchingEntry.getValue();
      this._listOfMatchingValues.push(matchingValue);
    }
    
    return;
  }
  
  // Handle the case where we have an ad-hoc query 
  // that just has a list of items.
  if (dojo.lang.isArray(this._querySpec)) {
    var querySpecArray = this._querySpec;
    this._matchingAttribute = orp.model.QueryRunner.EXPLICIT_LIST_OF_ITEMS;
    this._listOfMatchingValues = querySpecArray;
    
    return;
  }
  
  // Handle the case where we have an ad-hoc query that
  // povides a matching attribute and matching values.
  if (dojo.lang.isObject(this._querySpec)) {
    var querySpecJson = this._querySpec;
    this._matchingAttribute = querySpecJson[orp.model.QueryRunner.QuerySpec.ATTRIBUTE];
    if (!this._matchingAttribute) {
      this._matchingAttribute = this.getWorld().getAttributeCalledCategory();
    }
    this._listOfMatchingValues = querySpecJson[orp.model.QueryRunner.QuerySpec.VALUES];
    
    return;
  }  
};


/**
 * Runs the query.
 *
 * @scope    public instance method
 */
orp.model.QueryRunner.prototype._runQuery = function() {
  if (this._matchingAttribute == orp.model.QueryRunner.EXPLICIT_LIST_OF_ITEMS) {
    this._listOfResultItems = this._listOfMatchingValues;
  } else {
    this._listOfResultItems = this.getWorld().getResultItemsForQueryRunner(this);
  }
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
