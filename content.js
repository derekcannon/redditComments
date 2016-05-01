// TODO: Listen for URL change for SPAs

// Create Comments div at bottom of screen
var resultsDiv = document.createElement("div");
resultsDiv.id = "reddit-comments-results";
document.body.appendChild(resultsDiv);

// Build URL to query Reddit for existing submissions of the current URL
var url = "https://www.reddit.com/api/info.json?url=" + document.URL;
resultsDiv.innerHTML = "Checking with Reddit...";
var posts;

var xhttp = new XMLHttpRequest();

xhttp.onreadystatechange = function() {
  if (xhttp.readyState == XMLHttpRequest.DONE && xhttp.status == 200) {
    var json = JSON.parse(xhttp.responseText);
    posts = _.map(json.data.children, function(post) {
      return {
        id: post.data.id,
        num_comments: post.data.num_comments,
        subreddit: post.data.subreddit,
        title: post.data.title,
        permalink: post.data.permalink,
        full_url: "https://www.reddit.com" + post.data.permalink
      };
    });

    // If there are no posts, the URL isn't posted to Reddit
    if(posts.length === 0) {
      resultsDiv.innerHTML = "URL not posted on Reddit.";
      return;
    }

    resultsDiv.innerHTML = "Posted " + posts.length + " " +
      (posts.length === 1 ? "time" : "times") + " with a total of " +
      (commentNumber = _.sumBy(posts, function(post) { return post.num_comments; })) +
        " " + (commentNumber === 1 ? "comment" : "comments" ) + ".";

    // Set up listener for clicking on Comments div
    resultsDiv.addEventListener("click", function expandResultsDiv() {
      resultsDiv.removeEventListener('click', expandResultsDiv);

      // Add .expanded to resultsDiv
      resultsClasses = resultsDiv.className.split(' ');
      resultsClasses.push("expanded");
      resultsDiv.className = resultsClasses.join(' ').trim();

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
    });
  }
};

xhttp.open("GET", url, true);
xhttp.send();
