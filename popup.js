document.addEventListener('DOMContentLoaded', function() {

  var url = "https://www.reddit.com/api/info.json?url=";
  var xhttp = new XMLHttpRequest();

  chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
    url += tabs[0].url;

    xhttp.onreadystatechange = function() {
      if (xhttp.readyState == XMLHttpRequest.DONE && xhttp.status == 200) {
        var json = JSON.parse(xhttp.responseText);
        var posts = _.map(json.data.children, function(post) {
          return {
            id: post.data.id,
            num_comments: post.data.num_comments,
            subreddit: post.data.subreddit,
            title: post.data.title,
            permalink: post.data.permalink,
            full_url: "https://www.reddit.com" + post.data.permalink
          };
        });

        var resultsDiv = document.getElementById("results");
        if(posts.length === 0) {
          resultsDiv.innerHTML = "URL not posted to Reddit.";
          return;
        }

        resultsDiv.innerHTML = _.map(posts, function(post) {
          return (
              "<div style='width:2em; text-align:right; display:inline-block; padding-right:0.25em;'>" +
                post.num_comments +
              "</div>" +
              "<div style='width:10em; text-align:right; display:inline-block; padding-right:1em;'>" +
                post.subreddit +
              "</div>" +
              "<a href=\"" + post.full_url  + "\">" + post.title + "</a><br />");
        }).join('');
      }
    };

    xhttp.open("GET", url, true);
    xhttp.send();
  });

});
