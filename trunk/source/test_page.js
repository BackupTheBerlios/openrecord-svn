/*****************************************************************************
 test_page.js
 
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
//   repository.js
//   root_view.js
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Global constants
// -------------------------------------------------------------------
window.GLOBAL_ELEMENT_ID_NAVBAR_DIV = "navbar_div";
window.GLOBAL_ELEMENT_ID_CONTENT_VIEW_DIV = "content_view_div";
window.GLOBAL_ELEMENT_ID_DEBUG_DIV = "debug_div";
window.GLOBAL_ELEMENT_ID_MAIN_CONTROL_SPAN = "main_control_span";
window.GLOBAL_ELEMENT_ID_STATUS_BLURB_SPAN = "status_blurb_span";
                  

/**
 * Called when the window first loads. Calls all the functions that do 
 * initialization when the page is loaded.
 *
 * @scope    global function
 */
window.doOnloadActions = function() {  
  Util.setTargetsForExternalLinks();
  
  // Repository.initialize();
  
  var navbarDivElement = document.getElementById(window.GLOBAL_ELEMENT_ID_NAVBAR_DIV);
  var contentViewDivElement = document.getElementById(window.GLOBAL_ELEMENT_ID_CONTENT_VIEW_DIV);
  var debugDivElement = document.getElementById(window.GLOBAL_ELEMENT_ID_DEBUG_DIV);
  var mainControlSpanElement = document.getElementById(window.GLOBAL_ELEMENT_ID_MAIN_CONTROL_SPAN);
  var statusBlurbSpanElement = document.getElementById(window.GLOBAL_ELEMENT_ID_STATUS_BLURB_SPAN);

  Util.assert(navbarDivElement instanceof HTMLDivElement);
  Util.assert(contentViewDivElement instanceof HTMLDivElement);
  Util.assert(debugDivElement instanceof HTMLDivElement);
  Util.assert(mainControlSpanElement instanceof HTMLSpanElement);
  Util.assert(statusBlurbSpanElement instanceof HTMLSpanElement);

  var stevedore = new Stevedore();
  stevedore._loadItemsFromList(Stevedore._ourRepositoryInJsonFormat);
  window.rootView = new RootView(stevedore, navbarDivElement, contentViewDivElement, debugDivElement, mainControlSpanElement, statusBlurbSpanElement);
};


/**
 * Called when the user leaves the browser window.  Save any unsaved changes,
 * and prepare to exit.
 *
 * @scope    global function
 */
window.doOnunloadActions = function() {
  // stevedore.saveChanges();
};

window.doOnfocusActions = function() {
  // window.rootView.displayTextInDebugTextarea("onfocus");
};

window.doOnblurActions = function() {
  // window.rootView.displayTextInDebugTextarea("onblur");
};


// -------------------------------------------------------------------
// Register for window events
// -------------------------------------------------------------------
window.onload = window.doOnloadActions;
window.onunload = window.doOnunloadActions;
window.onerror = Util.handleError;
window.onfocus = window.doOnfocusActions;
window.onblur = window.doOnblurActions;
// window.onresize = window.doOnresizeActions;


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
