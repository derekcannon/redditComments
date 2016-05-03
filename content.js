// TODO: Listen for URL change for SPAs

// Create Comments div at bottom of screen
var redditCommentsContainer = document.createElement("div");
redditCommentsContainer.id = "reddit-comments-container";

var resultsTitle = document.createElement("div");
resultsTitle.id = "reddit-comments-results-title";

var resultsClose = document.createElement("div");
resultsClose.id = "reddit-comments-results-close";
resultsClose.innerHTML = "(X)"

var resultsBody = document.createElement("div");
resultsBody.id = "reddit-comments-results-body";

var resultsComments = document.createElement("div");
resultsComments.id = "reddit-comments-comments";

redditCommentsContainer.appendChild(resultsTitle);
redditCommentsContainer.appendChild(resultsClose);
redditCommentsContainer.appendChild(resultsBody);
redditCommentsContainer.appendChild(resultsComments);
document.body.appendChild(redditCommentsContainer);

// Build URL to query Reddit for existing submissions of the current URL
var url = "https://www.reddit.com/api/info.json?url=" + document.URL;
resultsTitle.innerHTML = "Checking with Reddit...";
var posts;

// TODO: Use one XMLHttpRequest resource for this
var xhttpForPosts = new XMLHttpRequest();
var xhttpForComments = new XMLHttpRequest();

// Function to expand results div when clicked
expandResultsDiv = function() {
  // Remove the listener
  redditCommentsContainer.removeEventListener('click', expandResultsDiv);

  // Add .expanded to redditCommentsContainer
  redditCommentsContainer.className += " expanded";
  resultsBody.className += " expanded";

  if(posts) {
    resultsBody.innerHTML = _.map([posts[0]], function(post) {
      // Build HTML for comment count, subreddit, and url href
      comments =
        "<div style='width:2em; text-align:right; display:inline-block; padding-right:0.25em;'>" +
          post.num_comments +
        "</div>" +
        "<div style='width:10em; text-align:right; display:inline-block; padding-right:1em;'>" +
          post.subreddit +
        "</div>" +
        "<a href=\"" + post.link  + "\">" + post.title + "</a><br />";

      // TODO: Move this out. We'll add it to on clicks of each href
      xhttpForComments.open("GET", post.comments_url, true);
      xhttpForComments.send();

      return comments;
    }).join('');
  }
}

// Query Reddit for a particular comment thread
xhttpForComments.onreadystatechange = function() {
  if (xhttpForComments.readyState == XMLHttpRequest.DONE && xhttpForComments.status == 200) {
    var json = JSON.parse(xhttpForComments.responseText)
    // information about the post
    //json[0].data.children
    // Top-level comment thread
    //json[1].data.children
    // First comment (example of iteration):
    // json[1].data.children[0].data.body

    var comments = json[1].data.children
    var commentHTML = ""

    var topLevelCommentBodies = _.map(comments, function(comment) {
      // Replies
      //comment.data.replies.data.children[0].data.body

      // Top level comment
      commentHTML += "<div class='reddit-comments-individual-comment'>" + comment.data.body + "</div>";

      // TODO: Recursion!
      if(comment.data.replies !== "" && comment.data.replies !== undefined) {
        _.map(comment.data.replies.data.children, function(reply) {
          commentHTML += "<div class='reddit-comments-individual-comment reply'>" + reply.data.body + "</div>";
        });
      };
    });

    resultsComments.className += " expanded";
    resultsComments.innerHTML = commentHTML;
  }
}

// The close button click listener
resultsClose.addEventListener("click", function(e) {
  e.stopPropagation();

  // Return immediately if results div isn't open
  if(redditCommentsContainer.className.indexOf('expanded') == -1) {
    return;
  };
  // Remove .expanded to redditCommentsContainer
  redditCommentsContainer.className = _.filter(_.compact(redditCommentsContainer.className.split(' ')), function(e) { e != "expanded" }).join(" ");
  resultsBody.className = _.filter(_.compact(resultsBody.className.split(' ')), function(e) { e != "expanded" }).join(" ");

  // Reattach the expand listener
  redditCommentsContainer.addEventListener("click", expandResultsDiv);
});

// Query Reddit to get information about the current URL, then
// update the results div to reflect the posts and comment count.
xhttpForPosts.onreadystatechange = function() {
  if (xhttpForPosts.readyState == XMLHttpRequest.DONE && xhttpForPosts.status == 200) {
    var json = JSON.parse(xhttpForPosts.responseText);
    posts = _.map(json.data.children, function(post) {
      return {
        id: post.data.id,
        num_comments: post.data.num_comments,
        subreddit: post.data.subreddit,
        title: post.data.title,
        permalink: post.data.permalink,
        link: "https://www.reddit.com" + post.data.permalink,
        comments_url: "http://www.reddit.com" + post.data.permalink.substring(0, post.data.permalink.length - 1) + ".json"
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
    redditCommentsContainer.addEventListener("click", expandResultsDiv);
  }
};

xhttpForPosts.open("GET", url, true);
xhttpForPosts.send();
