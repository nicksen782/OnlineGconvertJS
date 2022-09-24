gc.funcs.quickNav={
    // vars:
   scrollIntoView_options : {
          behavior: "smooth"     // "auto", "instant", or "smooth".         Defaults to "auto".
        // , block   : "center"  // "start", "center", "end", or "nearest". Defaults to "center".
        // , inline  : "nearest" // "start", "center", "end", or "nearest". Defaults to "nearest".
    },

  // * Get list of section divs and current position within them.
   findSectionPositions : function(sectionId){
    // Get list of sectionDivs ids;
    var sectionDivs = document.querySelectorAll(".sectionDivs");
    sectionDivs = Array.prototype.map.call(sectionDivs,
    function(d,i,a){ return d.id; });

    // Find the index of the current section.
    var currentIndex = sectionDivs.indexOf(sectionId) ;

    // Did we find our section id?
    if(currentIndex == -1){
        alert("ERROR! Current section div not found!");
        return;
    }

    // Determine the next/prev section.
    var prevIndex = currentIndex - 1 >=                 0 ? currentIndex-1 : currentIndex;
    var nextIndex = currentIndex + 1 < sectionDivs.length ? currentIndex+1 : currentIndex;

    return {
        currentId : sectionDivs[currentIndex] ,
        prevId    : sectionDivs[prevIndex]    ,
        nextId    : sectionDivs[nextIndex]    ,
    };
    }
// * Event listener: Scroll to the top of the application.
,toTop                : function(){
    document.getElementById( 'bodyHeader' ).scrollIntoView( gc.funcs.quickNav.scrollIntoView_options );
  }
// * Event listener: Scroll up to the previous section.
,stepUp               : function(){
    var sectionId = this.closest('.sectionDivs').id;
    var positions = gc.funcs.quickNav.findSectionPositions(sectionId);
    document.getElementById( positions['prevId'] ).scrollIntoView( gc.funcs.quickNav.scrollIntoView_options );
}
// * Event listener: Scroll down to the previous section.
,stepDown             : function(){
    var sectionId = this.closest('.sectionDivs').id;
    var positions = gc.funcs.quickNav.findSectionPositions(sectionId);
    document.getElementById( positions['nextId'] ).scrollIntoView( gc.funcs.quickNav.scrollIntoView_options );
}
// * Add event listeners for this section.
,addEventListeners    : function(){
    // Quick Nav options:
    var toTop    = document.querySelectorAll(".sectionTitle_toTop"   );
    var stepUp   = document.querySelectorAll(".sectionTitle_stepUp"  );
    var stepDown = document.querySelectorAll(".sectionTitle_stepDown");
    var i;

    // Go through all the sectionTitle_toTop. Add event listener.
    for(i=0; i<toTop.length; i++){
        toTop[i]    .addEventListener('click', gc.funcs.quickNav.toTop, false);
    }

    // Go through all the sectionTitle_stepUp. Add event listener.
    for(i=0; i<stepUp.length; i++){
        stepUp[i]   .addEventListener('click', gc.funcs.quickNav.stepUp, false);
    }
    // Go through all the sectionTitle_stepDown. Add event listener.
    for(i=0; i<stepDown.length; i++){
        stepDown[i] .addEventListener('click', gc.funcs.quickNav.stepDown, false);
    }
}
};