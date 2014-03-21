var query_base = 'fetch?url=';
var arkParseBaseURI = 'http://demo.ark.cs.cmu.edu/parse/api/v1/parse?sentence=';
var conceptNetSearchBaseURI = 'http://conceptnet5.media.mit.edu/data/5.1/search?';
var conceptNetAssocBaseURI = 'http://conceptnet5.media.mit.edu/data/5.1/assoc/';
var normalizeWSBaseURI = 'normalize?term=';
var animal = prompt('Pick an animal to start asking questions about ');
var conceptNetlimit = 100;
var similarityThreshold = 0.96;

var stopwordList = ['a','about','above','after','again','against','all','am',
'an','and','any','are','as','at','be','because','been','before','being','below',
'between','both','but','by', 'can', 'cannot','could','did','do','does','doing','down',
'during','each','few','for','from','further','had','has','have','having','he',
'her','here','hers','herself','him','himself','his','how','i','if','in','into',
'is','it','its','itself','me','more','most','my','myself','no','nor','not','of',
'off','on','once','only','or','other','ought','our','ours','ourselves','out',
'over','own','same','she','should','so','some','such','than','that','the',
'their','theirs','them','themselves','then','there','these','they','this',
'those','through','to','too','under','until','up','very','was','we','were',
'what','when','where','which','while','who','whom','why','with','would','you',
'your','yours','yourself','yourselves'];


//=============================================================================
//   queryConceptNet
//
//        query conceptNet with passed assertion
//        if assertion not found, search through concept similar to animal
//=============================================================================
var queryConceptNet = function (assertion) 
{

     var conceptNetQuery = buildConceptNetSearchQuery(animal, assertion);
     console.log(conceptNetQuery);

     $.getJSON(query_base + encodeURIComponent(conceptNetQuery), function(data){
     // console.log(data);  

          var edges = data.edges;
          for( var e in edges )
          {
               var edge = edges[e];
               console.log( edge.start + ", " + edge.rel + ", " + edge.end );
          }

          if( edges.length > 0) 
          {
               console.log("YES!");
          }
          else
          {
               searchSimilarConcepts(assertion);
               console.log("NO!");
          }
    });
};

//=============================================================================
//   searchSimilarConcepts
//
//        Searches for assertion on concept similar to animal
//=============================================================================
var searchSimilarConcepts = function(assertion)
{
     var conceptNetAssocQuery = conceptNetAssocBaseURI + 'c/en/' + animal +
                                             '?limit=' + conceptNetlimit;
          $.getJSON(query_base + encodeURIComponent(conceptNetAssocQuery), function(data)
          {
               var similar = data.similar;
               for( var c in similar)
               {
                    var similarConcept = similar[c][0];
                    var similarWeight = similar[c][1];
                    if(similarWeight > similarityThreshold)
                    {
                         console.log("concept " + similarConcept + ", weight = " +
                                        similarWeight);
                         similarConcept = similarConcept.replace("/c/en/", '');
                         var conceptNetSimilarConceptSearch = buildConceptNetSearchQuery( similarConcept, assertion);
                         $.getJSON(query_base + encodeURIComponent(conceptNetSimilarConceptSearch), function(data)
                         {
                              console.log(data);
                         });

                    }
               }
          }); 
};

//=============================================================================
//   buildConceptNetSearchQuery
//
//        map assertion to webAPI search format
//=============================================================================
var buildConceptNetSearchQuery = function(startConcept, assertion)
{
     var nonStopWordConcept = removeStopWords(assertion.concept);
     var underScoredConcept = nonStopWordConcept.replace(/\s/g, '_');
     var query =    conceptNetSearchBaseURI +
                    'start=/c/en/' + startConcept +
                    '&rel=/r/'     + assertion.relation +
                    '&end=/c/en/' + underScoredConcept;
     //console.log("Query: " + query);
     return query;

};

var removeStopWords = function(string) 
{
     //console.log("remove stop words: " + string);
     var words = string.split(" ");
     var nonStopWords = [];
     for( var i in words)
     {
          if( stopwordList.indexOf(words[i].toLowerCase()) == -1  )
          {
               nonStopWords.push(words[i]);
          }
     }

     var stringWithoutStopWords = '';
     for( var i in nonStopWords )
     {
          stringWithoutStopWords += nonStopWords[i] + " ";
     }

     //console.log(stringWithoutStopWords);
     return stringWithoutStopWords.trim();

};

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
        assertion.relation = 'HasProperty';
      else
        assertion.relation = 'IsA';
      assertion.concept = arkResult.tokens[term_idx];
    }
  }

  if( assertion.concept == animal)
  {
     alert("YOU GUESSED IT, YOU WIN!");
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

var buildConceptNetTextQuery = function(wordList)
{
     var textList = animal + ',';
     for (var w in wordList)
     {
          if( w < wordList.length - 1 )
          {
               textList += wordList[w] + ",";
          }
          else
          {
               textList += wordList[w];        
          }
     }
     return  conceptNetSearchBaseURI + 'text=' + textList;
}

var findCombinations = function(str)
{
     var fn = function(active, rest, a) {
        if (active.length === 0 && rest.length === 0)
            return;
        if (rest.length === 0) {
            a.push(active);
        } else {
         
            var tmp = active.slice(0);
            tmp.push(rest[0])
            fn(tmp, rest.slice(1), a);
            fn(active, rest.slice(1), a);
           
            
        }
        return a;
    }
    return fn([], str, []);

}

var factorial = function(n)
{
  var product = 1;
  for( var i = 1; i <= n; i++ ) {
    product *= i;
   }
  return product;
};

var numberOfCombinations = function(n, k)
{
    return factorial(n)/ (factorial(k) * factorial(n-k));

};

var computeWeights = function(numberOfWords)
{
     var discretion = 3;
     var denominator = (Math.pow(discretion, numberOfWords) - 1)/(discretion - 1);

     var weights = [];
     for( var i = 0; i < numberOfWords; ++i) {
        weights.push(    Math.pow(discretion, i) / 
                    ( denominator * numberOfCombinations(numberOfWords, i + 1) 
                         ) );
     }
     return weights;
};


var queryConceptNetText = function(listOfWords)
{
  var textCombos =  findCombinations(listOfWords);
  var results = [];
  var localScore;
  var sim;
  var denominator = Math.pow(2, listOfWords.length) - 1;
  var weights = [];
  var sum = 0;

  weights = computeWeights(listOfWords.length);
  console.log("weights: " + weights);

  for( combo in textCombos ){

    var conceptNetQuery = buildConceptNetTextQuery( textCombos[combo] );
    console.log(conceptNetQuery);

    $.ajax({ 
      url: query_base + encodeURI(conceptNetQuery), 
      dataType: 'json', 
      async: false, 
      success: function(data){ 
        // console.log(data);  

        localScore = 0;
 
        for( var e in data.edges ) {
          var edge = data.edges[e];
          var regex = new RegExp('/' + animal + '/i');
          if(edge.start.match(regex) !== '') {
            sim = getSimilarity('/c/en/'+animal, edge.start.match(/(\/[\w]*){3}/g)[0]);
          }
          else if(edge.end.match(regex) !== '') {
            sim = getSimilarity('/c/en/'+animal, edge.end.match(/(\/[\w]*){3}/g)[0]);
          } 

          if(sim > similarityThreshold) {
            console.log(edge);
            results.push(edge);
            localScore++;
          }
        }
      } 
    });

    var localWeight =  weights[textCombos[combo].length - 1];
    var triangularSum = getTriangularSum(localScore);
    console.log("total sum = localWeight * triangularSum");
    console.log( localWeight*triangularSum + " = " + localWeight + " * " + triangularSum );
    sum += localWeight * triangularSum ; 

    }
    console.log("final sum: " + sum);

    // enable submit buttons
    var query = $('#q_text').val();

    $('#submit_btn').html('Submit');
    $('#submit_btn').removeAttr('disabled');
    $('#q_text').val('');

    $('#item-template').clone().removeAttr('id').prependTo('#result-list');
    $('ol#result-list > li:first .q').html(query);
    $('ol#result-list > li:first .a').html(sum);

    var assertionList = $('ol#result-list > li:first ul');
    for(var i in results) {
      var a = results[i].start + ' - ' + results[i].rel + ' - ' + results[i].end;
      assertionList.append('<li>' + a + '</li>');
    }

    $('ol#result-list > li:first').fadeIn();
}

var getTriangularSum = function(n) {
  var denominator = 1;
  var sum = 0;
  for(var i = 0;i<n;i++) {
    denominator += i+2;
    sum += 1 / denominator;
  }
  return sum;
};

//=============================================================================
//  getSimilarity
//
//  concepts should be passed in the form: /c/en/Concept
//=============================================================================
var getSimilarity = function (concept1, concept2) {
  var sim = 0;

  $.ajax({
    url: query_base + conceptNetAssocBaseURI + concept1 + '?filter=' + concept2, 
    dataType: 'json', 
    async: false, 
    success: function(data){ 
      for (var i in data.similar) {
        if(data.similar[i][0] === concept2){
          sim = data.similar[i][1];
          break;
        }
      }
    }
  });

  return sim;
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
  frameInfo.object = '';
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
  frameInfo.frame_text = lemmatize(frameInfo.frame_text);
  frameInfo.object = lemmatize(frameInfo.object);
  return frameInfo;
};

var lemmatize = function(string) 
{
  var lemmatizedString = '';

  $.ajax({ 
      url: normalizeWSBaseURI + encodeURI(string), 
      dataType: 'json', 
      async: false, 
      success: function(json){ 
            //Process data retrieved
            lemmatizedString = json.result;
      } 
  });

  //console.log(lemmatizedString);
  return lemmatizedString;
}


//==============================================================================
//  sumbitButtonHanlder / main
//
//    The animal game player
//==============================================================================
function fake_submit() {
  $('#submit_btn').html('Thinking..');
  $('#submit_btn').attr('disabled', 'disabled');
  console.log('click..');
};

function submit(){
  var query = $('#q_text').val().trim();
  if(query.length == 0) {
    alert('Ask something!');
    return;
  }

  var baseURI = query_base + arkParseBaseURI;
  var assertion;

  // disable the button
  $('#submit_btn').html('Thinking..');
  $('#submit_btn').attr('disabled', 'disabled');

  //query = query.replace(/^\s*is\s+it/i, 'it is');
  
  $.getJSON(baseURI + encodeURI(query), function(data){
    //console.log(data.sentences);

   //Use assertions to query conceptnet

    // if(query.match(/^\s*it\s+is/i) != null) { // Is it?
    //   assertion = handleIsIt(data.sentences[0]);
    // } else if(query.match(/^\s*can\s+it/i) != null) {  // Can it ..?
    //   assertion = handleCanIt(data.sentences[0]);
    // } else if(query.match(/^\s*does\s+it/i) != null) {
    //   assertion = handleDoesIt(data.sentences[0]);
    // }

    //queryConceptNet(assertion);
    //$('#results').html('');

    //Use text to search conceptNet, accepts any relation0
    query = query.replace(/[.?]*$/, '');
    var noStopWordsQuery = removeStopWords(query);
    var lemmatizedString = lemmatize(noStopWordsQuery);
    queryConceptNetText(lemmatizedString.split(' '));

    //console.log(assertion);
  });
};
