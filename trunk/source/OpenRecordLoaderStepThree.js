/*****************************************************************************
 OpenRecordLoaderStepThree.js
 
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

dojo.setModulePrefix("orp", "../../source");  // relative to dojo.js

dojo.require("orp.model.World");
dojo.require("orp.view.RootView");

// FIXME:
// These dojo.require() statements are needed in order to 
// get plugins/ButtonView.js to work.  Someday we should 
// delete these next six lines, and instead just have the
// identical lines in ButtonView.js.  But, for now we can't
// do that because dojo.require() statements don't work
// within plugins (see bug #113 in the to_do_list.txt file).
dojo.require("dojo.widget.*");
dojo.require("dojo.widget.Button");
dojo.require("dojo.widget.html.Button");
dojo.require("dojo.widget.Button2");
dojo.require("dojo.widget.html.Button2");
dojo.require("dojo.widget.Menu2");


if (djConfig.debugAtAllCosts) {
  dojo.hostenv.writeIncludes(); // needed when using "debugAtAllCosts: true"
}

orp.finishLoading = function(){
  // figure out if we're running in IE or Firefox
  var firefox = true;  // PENDING: hack!
  var errorMessage;
  if (!firefox) {
    errorMessage = "IE error message";
    // display errorMessage
    return;
  }
  if (firefox) {
    errorMessage = "Loading...";
    // display errorMessage
    try {
      var world = new orp.model.World();
      new orp.view.RootView(world);
    } catch (e) {
      alert(e);
    }
  }
};

dojo.addOnLoad(orp.finishLoading);

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
