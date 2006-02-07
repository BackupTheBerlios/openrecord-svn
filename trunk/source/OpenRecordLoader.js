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
 * OpenRecordLoader bootstraps OpenRecord by loading all the files required
 * by the OpenRecord app: all the OpenRecord JavaScript files, plus third
 * party libraries, plus the OpenRecord stylesheet file.  
 *
 * OpenRecordLoader.js relies on two follow-up files, OpenRecordLoaderStepTwo.js
 * and OpenRecordLoaderStepThree.js.  It would be nice if we could merge these
 * all into one file, but unfortunately they need to be loaded separately
 * so that we get all the files evaluated in the right order -- first 
 * OpenRecordLoader.js and then dojo.js, and only after dojo is loaded, then 
 * OpenRecordLoaderStepThree.js, which uses dojo to load orp.model.World
 * and orp.model.RootView.
 */
var orp = {};
orp.loader = {};


/**
 * Given the URL of a JavaScript file, this function loads the JavaScript file
 * by creating a new script element that points to the file. 
 *
 * @param    sourceUrl    A string with the URL of a file containing the JavaScript code. 
 */
orp.loader.loadScript = function(sourceUrl) {
  try {
		document.write("<script type='text/javascript' src='" + sourceUrl + "'></script>");
  } catch(e) {
    var scriptElement = document.createElement('script');
    scriptElement.language = 'javascript';
    scriptElement.type = 'text/javascript';
    scriptElement.src = sourceUrl;
    var headElement = document.getElementsByTagName("head")[0];
    headElement.appendChild(scriptElement);
  }
};


/**
 * Given the URL of a stylesheet file, this function loads the stylesheet
 * by creating a new link element that points to the stylesheet. 
 *
 * @param    stylesheetUrl    A string with the URL of a file containing the stylesheet. 
 */
orp.loader.loadStylesheet = function(stylesheetUrl) {
  try {
    document.write("<link rel='stylesheet' type='text/css' href='" + stylesheetUrl + "'></link>");
  } catch(e) {
    var stylesheetElement = document.createElement('link');
    stylesheetElement.setAttribute('rel', 'stylesheet');
    stylesheetElement.type = 'text/css';
    stylesheetElement.href = stylesheetUrl;
    var headElement = document.getElementsByTagName("head")[0];
    headElement.appendChild(stylesheetElement);
  }
};

// -------------------------------------------------------------------
// This code is immediately executed when this file is first loaded.
// -------------------------------------------------------------------
var djConfig = {
  debugContainerId: "dojoDebug",
  isDebug: true, 
  debugAtAllCosts: true
};

orp.loader.loadStylesheet("source/base_style.css");

orp.loader.loadScript("third_party/dojo/dojo.js");

orp.loader.loadScript("source/OpenRecordLoaderStepTwo.js");


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
