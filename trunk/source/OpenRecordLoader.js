/*****************************************************************************
 OpenRecordLoader.js
 
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


/**
 * The OpenRecordLoader class bootstraps the OpenRecord by loading all the
 * other files in the OpenRecord app.
 *
 * There is no need to ever call this constructor.  All the OpenRecordLoader
 * methods are class methods, not instance methods, and the only reason
 * this constructor exists is to cause the name "OpenRecordLoader" to be a 
 * globally-scoped class name, which the class methods can then be 
 * attached to.
 *
 * @scope    public instance constructor
 * @syntax   DO NOT CALL THIS CONSTRUCTOR
 */
function OpenRecordLoader() {
  throw new Error("OpenRecord is a static class. You can't create instances of it.");
}


/**
 * Given the URL of a stylesheet file, this method loads the stylesheet
 * by creating a new link element that points to the stylesheet. 
 *
 * @scope    public class method
 * @param    stylesheetUrl    A string with the URL of a file containing the stylesheet. 
 */
OpenRecordLoader.loadStylesheet = function(stylesheetUrl) {
  var stylesheetElement = document.createElement('link');
  stylesheetElement.setAttribute('rel', 'stylesheet');
  stylesheetElement.type = 'text/css';
  stylesheetElement.href = stylesheetUrl;
  document.getElementsByTagName('head')[0].appendChild(stylesheetElement);  
};


/**
 * Given the URL of a JavaScript file, this method loads the JavaScript file
 * by creating a new script element that points to the file. 
 *
 * @scope    public class method
 * @param    sourceUrl    A string with the URL of a file containing the JavaScript code. 
 */
OpenRecordLoader.loadSingleScript = function(sourceUrl) {
  var scriptElement = document.createElement('script');
  document.getElementsByTagName('head')[0].appendChild(scriptElement);
  scriptElement.language = 'javascript';
  scriptElement.type = 'text/javascript';
  scriptElement.src = sourceUrl;
};


/**
 * Given the path to the trunk directory of the OpenRecord code base,
 * this method loads the OpenRecord stylesheet and all of the OpenRecord
 * JavaScript files.
 *
 * @scope    public class method
 * @param    path    A string with the path to the trunk directory of the OpenRecord code base. 
 */
OpenRecordLoader.loadEverything = function(path) {
  path = path || "";
  OpenRecordLoader.loadStylesheet(path + "source/base_style.css"); 
  var listOfSourceCodeFiles = [
    // third_party
    "third_party/md5/md5.js",
    /* "third_party/dojo/dojo-0.1.0/dojo.js", */
    "third_party/scriptaculous/prototype.js",
    "third_party/scriptaculous/effects.js",
    "third_party/scriptaculous/dragdrop.js"];
  for (var i in listOfSourceCodeFiles) {
    var fileName = listOfSourceCodeFiles[i];
    var url = path + fileName;
    OpenRecordLoader.loadSingleScript(url);
  }
};


// -------------------------------------------------------------------
// This code is immediately executed when this file is first loaded.
// -------------------------------------------------------------------
djConfig = {
  isDebug: true,
  debugAtAllCosts: true };
  
dojo.hostenv.setModulePrefix("dojo", "../../dojo/dojo-0.1.0/src");
dojo.hostenv.setModulePrefix("orp", "../../../source");

OpenRecordLoader.loadEverything();

dojo.require("orp.model.World");
dojo.require("orp.view.RootView");

dojo.hostenv.writeIncludes(); // needed when using "debugAtAllCosts: true"

window.onload = function() { 
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


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
