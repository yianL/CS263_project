$(function(){
  $('#submit_btn').click(function(){
    
    var query_base = 'http://jsonp.jit.su/?url=http://demo.ark.cs.cmu.edu/parse/api/v1/parse?sentence=';
    var query = $('#q_text').val();
    var assertion = {};

    query = query.replace(/^\s*is\s+it/i, 'it is');  // Is it -> It is
    if(query.match(/^\s*can\s+it/i) != null) {  // Can it ..?
      assertion.relation = 'CapableOf';
    }

    query = query_base + encodeURI(query);
    
    $.getJSON(query, function(data){
      console.log(data.sentences);
      var tokens = data.sentences[0].tokens;
      var entities = data.sentences[0].entities;
      var frames = data.sentences[0].frames;
      var relations = data.sentences[0].relations;
      
      $('#results').html('');

      var idx = 0;
      var frame_found = false;
      // Find the first Verb 
      for (var e in entities) {
        if(entities[e][1] == 'VB'){ 
          frame_found = true;
          break;
        }
        idx += 1;
      }

      if(frame_found) {
        for(var f in frames) {
          if(frames[f].target.start == idx) {
            // Get the Frame name
            assertion.frame_name = frames[f].target.name;
            assertion.frame_text = frames[f].target.text;


            // Get the Object
            if(frames[f].annotationSets[0].frameElements.length > 1) {  // Object in the frame 
              assertion.object = frames[f].annotationSets[0].frameElements[1].text;
            }
            else {  
              // Look for direct object
              for(var r in relations) {
                if(relations[r][1] == 'dobj') {
                  var term_idx = Number(relations[r][2][1][1].substr(1)) - 1;
                  assertion.object = tokens[term_idx];
                }
              }
            }
          }
        }  
      } else {  // no usable frames
        for(var r in relations) {
          if(relations[r][1] == 'nsubj') {
            var term_idx = Number(relations[r][2][0][1].substr(1)) - 1;
            if(entities[term_idx][1] == 'JJ')
              assertion.relation = 'hasProperty';
            else
              assertion.relation = 'isA';
            assertion.object = tokens[term_idx];
          }
        }
      }

      if(assertion.relation == 'CapableOf') {
        assertion.object = assertion.frame_text + ' ' + assertion.object;
      }

      console.log(assertion);
    });
  });
});