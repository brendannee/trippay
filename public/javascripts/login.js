var match = document.location.hash.match(/access_token=([0-9a-f-]{36})/);
var token = !!match && match[1];

if(token) {
  $.post('/redirect-bmw/', {token: token}, function(data) {
    console.log(data);
  });
}
