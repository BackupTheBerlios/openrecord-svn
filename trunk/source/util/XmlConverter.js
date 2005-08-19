/*****************************************************************************
 XmlConverter.js
 
******************************************************************************
 Written in 2005 by Mignon Belongie
  
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

/**
 * @param    tagPath    A sequence of nested XML tags (relative to an 'item-element'; see below).
 * @param    attribute  Will be assigned a value for every text node whose path equals the tag path.
 *
 * @scope    public instance constructor
 */
function XmlToAttributeSpecifier(tagPath, attribute) {
  Util.assert(tagPath instanceof Array);
  Util.assert(attribute instanceof Item);
  this.tagPath = tagPath;
  this.attribute = attribute;
  var attributeCalledExpectedType = attribute.getWorld().getAttributeCalledExpectedType();
  var listOfExpectedTypeEntries = attribute.getEntriesForAttribute(attributeCalledExpectedType);
  this.listOfTypes = [];
  for (j in listOfExpectedTypeEntries) {
    var entry = listOfExpectedTypeEntries[j];
    this.listOfTypes.push(entry.getValue());
  }
  var attributeCalledInverseAttribute = attribute.getWorld().getAttributeCalledInverseAttribute();
  var inverseAttributeEntry = attribute.getSingleEntryFromAttribute(attributeCalledInverseAttribute);
  this.inverseAttribute = inverseAttributeEntry? inverseAttributeEntry.getValue(attribute) : null;
}

/**
 * The XmlConverter class knows how to load an XML file and make items
 * out of specified parts of the data.
 *
 * @scope    public instance constructor
 */
function XmlConverter() {
}

/**
 * Given the URL of an XML file, a tag name used in the file, and optionally
 * a list of tag paths, items are created from the elements with the given
 * tag name ('item-elements') with attributes corresponding to the tag paths.  
 * If no tag paths are specified, attributes will come from all direct children
 * of item-elements with nodeType TEXT_NODE.  A category named nameSpace:itemTagName
 * will be created and the new items assigned to it.
 * 
 * For example, if file.xml contains the following:
 *
 * <Food_Glossary>
 * <Record>
 * <name>carrot</name><color>orange</color><flavor>sweet</flavor><vitamins><A>lots</A><C>lots</C></vitamins>
 * </Record>
 * <Record>
 * <name>cheese puff</name><color>orange</color><flavor>salty</flavor><vitamins><A>0.0</A><C>0.0</C></vitamins>
 * </Record>
 * <Record>
 * <name>radish</name><color>red</color><flavor>hot</flavor><vitamins><A>maybe</A><C>some</C></vitamins>
 * </Record>
 * </Food_Glossary>
 * 
 * then makeItemsFromXmlFile("file:.../file.xml", "food", "Record") would result
 * in three items each with attributes called 'food:name', 'food:color' and 'food:flavor',
 * while makeItemsFromXmlFile("file:.../file.xml", "food", "Record", [["name"], ["vitamins", "C"]) 
 *                            [new XmlToAttributeSpecifier(["name"], world.getAttributeCalledName()),
 *                             new XmlToAttributeSpecifier(["vitamins", "C"], world.newAttribute("Vitamin C"))]);
 * would result in three items each with attributes called 'name' and 'Vitamin C'.
 * In both cases, the three items are assigned to the category food:Record.
 *
 * @scope    public instance method
 * @param    world             
 * @param    url                       (of an XML file)
 * @param    nameSpace                 If null, the name of the file will be used.
 * @param    itemTagName               Items will be made from elements with this tag name
 * @param    xmlToAttributeSpecifiers  Array of type XmlToAttributeSpecifier
 *
 * @return   Returns an array of created items.
 */
XmlConverter.prototype.makeItemsFromXmlFile = function(world, url, nameSpace, itemTagName, xmlToAttributeSpecifiers) {
  Util.assert(world instanceof World);
  var urlSeparators = new RegExp("\\.|\\/");
  var urlParts = url.split(urlSeparators);
  var len = urlParts.length;
  Util.assert(urlParts[len-1] == "xml");
  if (nameSpace == null)
    nameSpace = urlParts[len-2];
  Util.assert(Util.isString(itemTagName));

  var xmlDoc = document.implementation.createDocument("", "doc", null);
  var objXMLHTTP = new XMLHttpRequest();
  objXMLHTTP.open("GET", url, false);
  objXMLHTTP.send(null);
  xmlDoc = objXMLHTTP.responseXML;
  var itemElements = xmlDoc.getElementsByTagName(itemTagName);
  var newCategoryName = nameSpace + ":" + itemTagName;
  var newCategory = world.newCategory(newCategoryName);

  world.beginTransaction();
  var listOfOutputItems = [];
  if (xmlToAttributeSpecifiers == null) {
    listOfOutputItems = this._doDefaultConversion(world, nameSpace, itemElements, newCategory);
  }
  else {
    Util.assert(xmlToAttributeSpecifiers instanceof Array);
    Util.assert(xmlToAttributeSpecifiers[0] instanceof XmlToAttributeSpecifier);
    //alert("itemElements.length = " + itemElements.length);
    for (var i = 0; i < itemElements.length; ++i) {
      var newItem = world.newItem();
      newItem.assignToCategory(newCategory);
      for (var j in xmlToAttributeSpecifiers) {
        var tagPath = xmlToAttributeSpecifiers[j].tagPath;
        this._processElementTree(0, tagPath.length, itemElements[i], newItem, xmlToAttributeSpecifiers[j]);
      }
      listOfOutputItems.push(newItem);
    }
  }
  world.endTransaction();
  return listOfOutputItems;
}

XmlConverter.prototype._doDefaultConversion = function(world, nameSpace, itemElements, newCategory) {
  var listOfOutputItems = [];
  var hashTableOfAttributesKeyedByName = [];
  for (var i = 0; i < itemElements.length; ++i) {
    var newItem = world.newItem();
    newItem.assignToCategory(newCategory);
    e = itemElements[i];
    for (var j = 0; j < e.childNodes.length; ++j) {
      var node = e.childNodes[j];
      if (node.nodeType == Node.ELEMENT_NODE && node.firstChild && node.firstChild.nodeType == Node.TEXT_NODE) {
        var attrName = nameSpace + ":" + node.tagName;
        var attr = hashTableOfAttributesKeyedByName[attrName];
        if (!attr) {
          attr = world.newAttribute(attrName);
          hashTableOfAttributesKeyedByName[attrName] = attr;
        }
        newItem.addEntryForAttribute(attr, node.firstChild.nodeValue);
      }
    }
    listOfOutputItems.push(newItem);
  }
  return listOfOutputItems;
}

XmlConverter.prototype._processElementTree = function(level, maxLevel, node, newItem, xmlToAttributeSpecifier) {
  if (level == maxLevel) {
    if (node.childNodes && node.childNodes.length > 0 && node.childNodes[0].nodeType == Node.TEXT_NODE) {
      value = EntryView._transformValueToExpectedType(world, node.childNodes[0].nodeValue, xmlToAttributeSpecifier.listOfTypes);
      if (xmlToAttributeSpecifier.inverseAttribute) {
        newItem.addConnectionEntry(xmlToAttributeSpecifier.attribute, value, xmlToAttributeSpecifier.inverseAttribute);
      } else {
        newItem.addEntryForAttribute(xmlToAttributeSpecifier.attribute, value);
      }
    }
    return;
  }
  var tagName = xmlToAttributeSpecifier.tagPath[level];
  var matchingElements = node.getElementsByTagName(tagName);
  if (matchingElements == null)
    return;
  for (i in matchingElements) {
    if (matchingElements[i].childNodes && matchingElements[i].childNodes.length > 0) {
      this._processElementTree(level + 1, maxLevel, matchingElements[i], newItem, xmlToAttributeSpecifier)
    }
  }
}

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
