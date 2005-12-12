/*****************************************************************************
 create_new_plugin.js
 
******************************************************************************
 Written in 2005 by 
   Brian Douglas Skinner <brian.skinner@gumption.org>
   Mignon Belongie

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
 
dojo.hostenv.setModulePrefix("orp", "../../../source"); // relative to dojo
dojo.require("dojo.text.*");
dojo.require("dojo.event.*");
dojo.require("orp.uuid.TimeBasedUuid");

function startHere() {
  var createButton = document.getElementById("button");
  dojo.event.connect(createButton, "onclick", userClickedOnButton);

  var outputArea = document.getElementById("output_area");
  outputArea.style.visibility = "hidden";
}

function userClickedOnButton() {
  var classNameField = document.getElementById("plugin_class_name");
  var nameField = document.getElementById("plugin_name");
  var authorField = document.getElementById("plugin_author");
  var outputArea = document.getElementById("output_area");
  
  var generatedContents;

  var className = classNameField.value;
  if (className.match(/^[A-Z]\w*$/)) {
    var name      = nameField.value;
    var author    = authorField.value;
    generatedContents = generateContents(className, name, author);
  }
  else {
    generatedContents = "Error: ClassName must contain only alphanumeric characters " + 
                        "and underscores, and must start with an uppercase letter.  " +
                        "Example: MySuperFooView";
  }

  outputArea.value = generatedContents;
  outputArea.style.visibility = "visible";
  // alert(generatedContents);
  
  // var uuid = new orp.uuid.TimeBasedUuid();
  // alert(uuid);
  
  // var string = "     Just Foo    ";
  // var trimmedString = dojo.text.trim(string);
  // alert(trimmedString);
}

function generateContents(className, name, author) {
  var templateFileContents = dojo.hostenv.getText("create_new_plugin_template.js");
  var itemUuid = new orp.uuid.TimeBasedUuid();
  var entryUuid1 = new orp.uuid.TimeBasedUuid();
  var entryUuid2 = new orp.uuid.TimeBasedUuid();
  var entryUuid3 = new orp.uuid.TimeBasedUuid();
  var entryUuid4 = new orp.uuid.TimeBasedUuid();
  
  var intermediateResult = templateFileContents;
  intermediateResult = intermediateResult.replace(/%\(AUTHOR\)/g, author);
  intermediateResult = intermediateResult.replace(/%\(CLASS_NAME\)/g, className);
  intermediateResult = intermediateResult.replace(/%\(DISPLAY_NAME\)/g, name);
  intermediateResult = intermediateResult.replace(/%\(ITEM_UUID\)/g, itemUuid);
  intermediateResult = intermediateResult.replace(/%\(ENTRY_UUID_1\)/g, entryUuid1);
  intermediateResult = intermediateResult.replace(/%\(ENTRY_UUID_2\)/g, entryUuid2);
  intermediateResult = intermediateResult.replace(/%\(ENTRY_UUID_3\)/g, entryUuid3);
  intermediateResult = intermediateResult.replace(/%\(ENTRY_UUID_4\)/g, entryUuid4);
  var finalString = intermediateResult;
  
  return finalString;
}

dojo.event.connect(window, "onload", startHere);


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
