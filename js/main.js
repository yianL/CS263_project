$(function(){
  $('#submit_btn').click(function(){
    //alert($('#q_text').val());
    var query = 'http://jsonp.jit.su/?url=http://demo.ark.cs.cmu.edu/parse/api/v1/parse?sentence=';
    query += encodeURI($('#q_text').val());
    
    $.getJSON(query, function(data){
      //alert('fake AJAX! ' + data);
      console.log(data.sentences);
      var tokens = data.sentences[0].tokens;
      $('#results').html('');
      for(var t in tokens) {
        var li = '<li>' + tokens[t] + '</li>';
        $('#results').append(li);
      }
    });
  });
});