
//=============================================================================
//  handleIsIt
//
//    handle all queries that begin with "Is it...?"
//        
//     notes: 
//            determine relation     determine concept
//              jj->HasProperty       nsubj dependency
//              else->IsA
//
//    **warning** doesn't handle "is it larger than..?"
//=============================================================================
var handleIsIt = function(arkResult) {
  var assertion = {};
  
  for(var r in arkResult.relations) {
    if(arkResult.relations[r][1] == 'nsubj') {
      var term_idx = Number(arkResult.relations[r][2][0][1].substr(1)) - 1;
      if(arkResult.entities[term_idx][1] == 'JJ')
        assertion.relation = 'hasProperty';
      else
        assertion.relation = 'isA';
      assertion.object = arkResult.tokens[term_idx];
    }
  }

  return assertion;
};


//=============================================================================
//  handleCanIt
//
//    handle all queries that begin with "Can it...?"
//     notes: 
//            determine relation     determine concept
//              capableOf              first verb + dobj
//=============================================================================
var handleCanIt = function(arkResult) {
  var assertion = {};
  var frameInfo = getFrameInfo(arkResult);

  // populate assertion
  assertion.relation = 'CapableOf';
  assertion.concept = frameInfo.frame_text + ' ' + frameInfo.object;

  return assertion;
};


//=============================================================================
//  handleDoesIt
//
//    handle all queries that begin with "Does it...?"
//     notes: 
//            determine relation     determine concept
//            map from first verb       depends on verb (v+o or o)        
//=============================================================================
var handleDoesIt = function(arkResult) {
  var assertion = {};
  var frameInfo = getFrameInfo(arkResult);

  if( frameInfo.frame_name == 'Residence') {
    assertion.relation = 'AtLocation';
    assertion.concept = frameInfo.object;
  }
  else if( frameInfo.frame_name == 'Possession' ) {
    assertion.relation = 'HasA';
    assertion.concept = frameInfo.object;
  }
  else if( frameInfo.frame_name == 'Ingestion' ) {
    assertion.relation = 'Desires';
    assertion.concept = frameInfo.object;
  }
  else if( frameInfo.frame_name == 'Change_position_on_a_scale' ) {
    assertion.relation = 'HasProperty';
    assertion.concept = frameInfo.frame_text + ' ' + frameInfo.object;
  }
  else {
    assertion.relation = frameInfo.frame_name;
    assertion.concept = frameInfo.frame_text + ' ' + frameInfo.object;
  }

  return assertion;
};

//=============================================================================
//  findFirstVerbIndex
//
//    finds the index of the first verb in the entities JSON object 
//      returned by ARK/Semafor
//=============================================================================
var findFirstVerbIndex = function(entities) {
  var idx = 0;
  for (var e in entities) {
    if(entities[e][1] == 'VB'){ 
      return idx;
    }
    idx += 1;
  }
  return -1;
};

//=============================================================================
// getFrameInfo
//    
//  gets the frame of the first verb and retrieves object from frame or dobj dependency
//=============================================================================
var getFrameInfo = function(arkResult) {
  var frameInfo = {};
  var idx = findFirstVerbIndex(arkResult.entities);

  for(var f in arkResult.frames) {
    if(arkResult.frames[f].target.start == idx) {
      // Get the Frame name
      frameInfo.frame_name = arkResult.frames[f].target.name;
      frameInfo.frame_text = arkResult.frames[f].target.text;

      // Get the Object
      if(arkResult.frames[f].annotationSets[0].frameElements.length > 1) {  // Object in the frame 
        frameInfo.object = arkResult.frames[f].annotationSets[0].frameElements[1].text;
      }
      else {  
        // Look for direct object
        for(var r in arkResult.relations) {
          if(arkResult.relations[r][1] == 'dobj') {
            var term_idx = Number(arkResult.relations[r][2][1][1].substr(1)) - 1;
            frameInfo.object = arkResult.tokens[term_idx];
          }
        }
      }
    }
  }
  return frameInfo;
};


//=============================================================================
//  sumbitButtonHanlder / main
//
//    The animal game player
//=============================================================================
$(function(){
  $('#submit_btn').click(function(){
    
    var query_base = 'http://jsonp.jit.su/?url=http://demo.ark.cs.cmu.edu/parse/api/v1/parse?sentence=';
    var query = $('#q_text').val();
    var assertion;

    query = query.replace(/^\s*is\s+it/i, 'it is');
    
    $.getJSON(query_base + encodeURI(query), function(data){
      //console.log(data.sentences);


      if(query.match(/^\s*it\s+is/i) != null) { // Is it?
        assertion = handleIsIt(data.sentences[0]);
      } else if(query.match(/^\s*can\s+it/i) != null) {  // Can it ..?
        assertion = handleCanIt(data.sentences[0]);
      } else if(query.match(/^\s*does\s+it/i) != null) {
        assertion = handleDoesIt(data.sentences[0]);
      }

      //$('#results').html('');

      console.log(assertion);
    });
  });
});