function setTargetsForExternalLinks() {
	if (!window.document.getElementsByTagName) {
		return;
	}
	var listOfAnchorElements = window.document.getElementsByTagName("a");
	var regExp = new RegExp("\\b" + "external" + "\\b");
	for (var i=0; i<listOfAnchorElements.length; i+=1) {
		var anchor = listOfAnchorElements[i];
		if (anchor.getAttribute("href") && (anchor.getAttribute("rel")) && (anchor.getAttribute("rel").search(regExp) != -1)) {
			anchor.target = "_blank";
		}
	}
};
window.onload = setTargetsForExternalLinks;
