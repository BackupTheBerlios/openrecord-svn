/*****************************************************************************
 item.js
 
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
// Dependencies:
//   util.js
//   stevedore.js
// -------------------------------------------------------------------


/**
 * Instances of the Item class know how to store and retrieve their
 * attribute values.
 *
 * @scope    public instance constructor
 */
function Item(inStevedore, inUuid) {
  Util.assert(!inUuid || Util.isNumeric(inUuid));
  
  this._myStevedore = inStevedore;
  this._myUuid = inUuid;
  this._myListOfObservers = [];
  this._myHashTableOfAssignmentsKeyedByAttributeUuid = {};
}


/**
 * Returns the display name of the item.
 *
 * @scope    public instance method
 * @return   A string with a display name for the item.
 */
Item.prototype.toString = function () {
  var returnString = "[Item #" + this.getUuid() + " ";
  var listOfCategories = this.getValueListFromAttribute(Stevedore.UUID_FOR_ATTRIBUTE_CATEGORY);
  for (var key in listOfCategories) {
    var category = listOfCategories[key];
    Util.assert(category instanceof Item);
    returnString += "(" + category.getDisplayName() + ")";
  }
  returnString += " \"" + this.getDisplayName() + "\"" + "]";
  return returnString; 
};


// -------------------------------------------------------------------
// Attribute Accessor Methods
// -------------------------------------------------------------------

/**
 * Returns the display name of the item.
 *
 * @scope    public instance method
 * @return   A string with a display name for the item.
 */
Item.prototype.getDisplayName = function (inDefaultString) {
  return this._getStringUsingNameAttributes(Stevedore.UUID_FOR_ATTRIBUTE_NAME, null, inDefaultString);
};
  
  
/**
 * Returns a short display name for the item.
 *
 * @scope    public instance method
 * @return   A string with a short display name for the item.
 */
Item.prototype.getShortName = function (inDefaultString) {
  return this._getStringUsingNameAttributes(Stevedore.UUID_FOR_ATTRIBUTE_SHORT_NAME, Stevedore.UUID_FOR_ATTRIBUTE_NAME, inDefaultString);
};


/**
 * Given an attribute, this method returns the list of values that 
 * have been assigned to that attribute for this item.
 *
 * For example, to find out what color Kermit is: 
 * <pre>
 *    var valueList = kermit.getValueListFromAttribute(color);
 *    for (var i = 0; i < valueList.length; ++i) {
 *      alert("Kermit is " + valueList[i]);
 *    }
 * </pre>
 *
 * @scope    public instance method
 * @param    inAttribute    The object to be removed from the set of observers. 
 */
Item.prototype.getValueListFromAttribute = function (inAttribute) {
  Util.assert(Util.isHashTable(this._myHashTableOfAssignmentsKeyedByAttributeUuid));
  
  var attributeUuid = this._myStevedore.getAttributeUuidFromAttributeOrUuid(inAttribute);
  // PENDING: 
  //   If this item isn't yet fully loaded into the cache, then we might need 
  //   to ask our stevedore to get the attribute values for us.
  var valueList = this._myHashTableOfAssignmentsKeyedByAttributeUuid[attributeUuid];
  return (valueList || null);
};


/**
 * Assigns a value to an attribute in this item.
 *
 * Given an attribute and a value, assigns that value to the
 * attribute of the item. For example, to make a Kermit green:
 * <pre>
 *    kermit.assign(color, "green");
 * </pre>
 * Attributes can always have more than one assigned value, so
 * you can make Kermit be both blue and green by doing:
 * <pre>
 *    kermit.assign(color, "green");
 *    kermit.assign(color, "blue");
 * </pre>
 *
 * @scope    public instance method
 * @param    inAttribute    The attribute to assign the value to, or the UUID of the attribute. 
 * @param    inValue    The value to be assigned. 
 */
Item.prototype.assign = function (inAttribute, inValue) {
  var cleanValue = inValue;
  // alert("assign(" + inAttribute + ", " + inValue + ")");
  if (Util.isString(inValue)) {
    var cleanValue = Util.getCleanString(inValue);
  }
  var valueWasSet = this._initializeAttributeValue(inAttribute, cleanValue);
  if (valueWasSet) {
    this._myStevedore.markDirty(this);
  }
  // PENDING: 
  //   We also need to create a change object, and we need to tell 
  //   this._myStevedore about the change.
  this._notifyObservers();
};


/**
 * Given an attribute, removes that attribute from the item's list
 * of attributes that have values assigned.
 *
 * @scope    public instance method
 * @param    inAttribute    The attribute to clear, or the UUID of the attribute. 
 * @return   Returns true if there was an existing attribute value to clear.
 */
Item.prototype.clear = function (inAttribute) {
  Util.assert(Util.isHashTable(this._myHashTableOfAssignmentsKeyedByAttributeUuid));

  var valueWasDeleted = false;
  var attributeUuid = this._myStevedore.getAttributeUuidFromAttributeOrUuid(inAttribute);
  var currentValueList = this._myHashTableOfAssignmentsKeyedByAttributeUuid[attributeUuid];
  if (currentValueList && (currentValueList.length > 0)) {
    this._myHashTableOfAssignmentsKeyedByAttributeUuid[attributeUuid] = null;
    valueWasDeleted = true;
    this._myStevedore.markDirty(this);
  }
  
  // PENDING: 
  //   We also need to create a change object, and we need to tell 
  //   this._myStevedore about the change.
  this._notifyObservers();
  
  return valueWasDeleted;
};


// -------------------------------------------------------------------
// Non-Attribute Accessor Methods
// -------------------------------------------------------------------

/**
 * Returns the UUID of the item.
 *
 * @scope    public instance method
 * @return   The UUID of the item.
 */
Item.prototype.getUuid = function () {
  return this._myUuid;
};


/**
 * Returns a list of the UUIDs for all the attributes that this item
 * has values assigned to.
 *
 * @scope    public instance method
 * @return   A list of UUIDs of attribute items.
 */
Item.prototype.getListOfAttributeUuids = function () {
  var listOfAttributeUuids = [];
  for (var attributeUuid in this._myHashTableOfAssignmentsKeyedByAttributeUuid) {
    listOfAttributeUuids.push(attributeUuid);
  }
  return listOfAttributeUuids;
};


/**
 * Given a category, returns "true" if the item has been assigned to 
 * that category.
 *
 * Also returns true if the item has been assigned to some category which is in
 * turn assigned to the given category, and so on, up the chain of category 
 * assignments.
 *
 * @scope    public instance method
 * @return   A boolean.  True if the item has been assigned to the category.
 */
Item.prototype.isInCategory = function (inCategory) {
  Util.assert(inCategory instanceof Item);

  var valueList = this.getValueListFromAttribute(Stevedore.UUID_FOR_ATTRIBUTE_CATEGORY);
  var key;
  var value;
  
  // look at all the categories this item is assigned to, and see if one of them is "inCategory"
  for (key in valueList) {
    value = valueList[key];
    if (value == inCategory) {
      return true;
    }
  }
  
  // look at all the categories this item is assigned to, and see if one of them
  // is in turn in the categoery "inCategory"
  for (key in valueList) {
    value = valueList[key];
    // PENDING: 
    //   This will go into an infinite loop if there is ever a cycle in the category 
    //   assignments, like: A is in category B, and B is in C, and C is in A.
    //   We need to use a non-recursive search of the graph.
    // PENDING:
    //   Do we also need to register as an observer of something, so that if we later
    //   become a member of that category in question, then we can notify whoever
    //   is observing us?
    if ((value != this) && (value.isInCategory(inCategory))) {
      return true;
    }
  }
  return false;
};
 

// -------------------------------------------------------------------
// Observer/Observable Methods
// -------------------------------------------------------------------

/**
 * Given an object, registers the object as an observer of this item, so that
 * the object will be notified when the item changes.
 *
 * @scope    public instance method
 * @param    inObserver    An object to be registered as an observer of the item. 
 */
Item.prototype.addObserver = function (inObserver) {
  Util.addObjectToSet(inObserver, this._myListOfObservers);
};


/**
 * Given an object, removes that object from the set of observers of this item, so 
 * that the object will no longer be notified when the item changes.
 *
 * @scope    public instance method
 * @param    inObserver    The object to be removed from the set of observers. 
 */
Item.prototype.removeObserver = function (inObserver) {
  Util.removeObjectFromSet(inObserver, this._myListOfObservers);
};


// -------------------------------------------------------------------
// Private Methods
// -------------------------------------------------------------------

/**
 * Set the value of an attribute when the item is first being loaded
 * by the Stevedore.
 *
 * @scope    private instance method
 * @param    inAttribute    The attribute to assign the value to, or the UUID of the attribute. 
 * @param    inValue    The value to be assigned. 
 * @return   Returns true if the value was assigned.
 */
Item.prototype._initializeAttributeValue = function (inAttribute, inValue) {
  Util.assert(Util.isHashTable(this._myHashTableOfAssignmentsKeyedByAttributeUuid));

  var attributeUuid = this._myStevedore.getAttributeUuidFromAttributeOrUuid(inAttribute);
  if (!this._myHashTableOfAssignmentsKeyedByAttributeUuid[attributeUuid]) {
    this._myHashTableOfAssignmentsKeyedByAttributeUuid[attributeUuid] = [];
  }
  // var 
  var valueList = this._myHashTableOfAssignmentsKeyedByAttributeUuid[attributeUuid];
  var valueWasAddedFlag = Util.addObjectToSet(inValue, valueList);
  return valueWasAddedFlag;
};


/**
 * Returns some display name for the item, drawing on both the "name" and
 * "short name" attributes.
 *
 * @scope    private instance method
 * @return   A string with a display name for the item.
 */
Item.prototype._getStringUsingNameAttributes = function (inPrimaryAttributeUuid, inSecondaryAttributeUuid, inDefaultString) {
  var returnString = null;
  var nameList = this.getValueListFromAttribute(inPrimaryAttributeUuid);
  if (nameList) {
    returnString = nameList[0];
  }
  if (!returnString && inSecondaryAttributeUuid) {
    nameList = this.getValueListFromAttribute(inSecondaryAttributeUuid);
    if (nameList) {
      returnString = nameList[0];
    }
  }
  if (!returnString) {
    returnString = inDefaultString;
  }
  if (!returnString) {
    returnString = "";
  }
  return returnString;
};
  

/**
 * Sends messages to all the registered observers to let them know that
 * this item has changed.
 *
 * @scope    private instance method
 */
Item.prototype._notifyObservers = function () {
  for (var key in this._myListOfObservers) {
    var observer = this._myListOfObservers[key];
    observer.observedItemHasChanged(this);
  }
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
