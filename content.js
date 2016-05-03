// TODO: Listen for URL change for SPAs

// Create Comments div at bottom of screen
var resultsDiv = document.createElement("div");
resultsDiv.id = "reddit-comments-results";

var resultsTitle = document.createElement("div");
resultsTitle.id = "reddit-comments-results-title";

var resultsClose = document.createElement("div");
resultsClose.id = "reddit-comments-results-close";
resultsClose.innerHTML = "(X)"

var resultsBody = document.createElement("div");
resultsBody.id = "reddit-comments-results-body";

resultsDiv.appendChild(resultsTitle);
resultsDiv.appendChild(resultsClose);
resultsDiv.appendChild(resultsBody);
document.body.appendChild(resultsDiv);

// Build URL to query Reddit for existing submissions of the current URL
var url = "https://www.reddit.com/api/info.json?url=" + document.URL;
resultsTitle.innerHTML = "Checking with Reddit...";
var posts;

var xhttp = new XMLHttpRequest();

// Function to expand results div when clicked
expandResultsDiv = function() {
  // Remove the listener
  resultsDiv.removeEventListener('click', expandResultsDiv);

  // Add .expanded to resultsDiv
  resultsDiv.className += " expanded";
  resultsBody.className += " expanded";

  if(posts) {
    resultsBody.innerHTML = _.map(posts, function(post) {
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
}

// The close button click listener
resultsClose.addEventListener("click", function(e) {
  e.stopPropagation();

  // Return immediately if results div isn't open
  if(resultsDiv.className.indexOf('expanded') == -1) {
    return;
  };
  // Remove .expanded to resultsDiv
  resultsDiv.className = _.filter(_.compact(resultsDiv.className.split(' ')), function(e) { e != "expanded" }).join(" ");
  resultsBody.className = _.filter(_.compact(resultsBody.className.split(' ')), function(e) { e != "expanded" }).join(" ");

  // Reattach the expand listener
  resultsDiv.addEventListener("click", expandResultsDiv);
});

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
      resultsTitle.innerHTML = "Page not posted on Reddit.";
      return;
    }

    resultsTitle.innerHTML = "Posted " + posts.length + " " +
      (posts.length === 1 ? "time" : "times") + " with a total of " +
      (commentNumber = _.sumBy(posts, function(post) { return post.num_comments; })) +
        " " + (commentNumber === 1 ? "comment" : "comments" ) + ".";

    // Attach the expand listener
    resultsDiv.addEventListener("click", expandResultsDiv);
  }
};

xhttp.open("GET", url, true);
xhttp.send();
