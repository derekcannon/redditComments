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
expandResultsDiv = () => {
  // Remove the listener
  redditCommentsContainer.removeEventListener('click', expandResultsDiv);

  // Add .expanded to redditCommentsContainer
  redditCommentsContainer.className += " expanded";
  resultsBody.className += " expanded";

  if(posts) {
    resultsBody.innerHTML = _.map([posts[0]], (post) => {
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

buildComments = (commentStructure, replyLevel) => {
  // Top-level Object (array of objects)
  //   First Object (post-related)
  //   Second object (the comments):
  //    * data (object)
  //       children (array of objects) <-- All top-level comments
  //         data (object: has author, ups/downs, body (raw text comment), body_html (html-safe body))
  //           replies (object)
  //           * data (object)
  //               children (array of objects) <-- All top-level replies
  //                 data (object: same as above "children") <-- replies is empty string when no more replies
  // * here's where to recurse

  if (typeof(commentStructure) === "string") { return "" }; // No replies

  // This function needs to build the HTML for all comments
  const children = _.get(commentStructure, 'data.children')
  const className = `reddit-comments-individual-comment${replyLevel > 0 ? ' reply' : ''}`

  if (children) {
    return (_.map(children, (comment) => {
      const commentData = comment.data;

      // Convert body_html to actual HTML
      const tempDiv = document.createElement('textarea');
      tempDiv.innerHTML = commentData.body_html;

      const commentDiv = document.createElement("div");
      commentDiv.className = className;
      commentDiv.innerHTML = tempDiv.value !== "undefined" ? tempDiv.value.match(/<p>[\s\S]*<\/p>/).join('') : "<p></p>"

      return (
        `${commentDiv.outerHTML}${buildComments(_.get(commentData, 'replies'), 1)}`
      );
    })).join('');
  };
};

// Query Reddit for a particular comment thread
xhttpForComments.onreadystatechange = () => {
  if (xhttpForComments.readyState == XMLHttpRequest.DONE && xhttpForComments.status == 200) {
    var json = JSON.parse(xhttpForComments.responseText)

    var comments = json[1].data.children
    var commentsWithHTML = ""

    var commentsWithHTML = buildComments(json[1], 0);

    resultsComments.className += " expanded";
    resultsComments.innerHTML = commentsWithHTML;
  }
}

// The close button click listener
resultsClose.addEventListener("click", (e) => {
  e.stopPropagation();

  // Return immediately if results div isn't open
  if(redditCommentsContainer.className.indexOf('expanded') == -1) {
    return;
  };
  // Remove .expanded to redditCommentsContainer
  redditCommentsContainer.className = _.filter(_.compact(redditCommentsContainer.className.split(' ')), (e) => { e != "expanded" }).join(" ");
  resultsBody.className = _.filter(_.compact(resultsBody.className.split(' ')), function(e) { e != "expanded" }).join(" ");

  // Reattach the expand listener
  redditCommentsContainer.addEventListener("click", expandResultsDiv);
});

// Query Reddit to get information about the current URL, then
// update the results div to reflect the posts and comment count.
xhttpForPosts.onreadystatechange = () => {
  if (xhttpForPosts.readyState == XMLHttpRequest.DONE && xhttpForPosts.status == 200) {
    var json = JSON.parse(xhttpForPosts.responseText);
    posts = _.map(json.data.children, (post) => {
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
      (commentNumber = _.sumBy(posts, (post) => { return post.num_comments; })) +
        " " + (commentNumber === 1 ? "comment" : "comments" ) + ".";

    // Attach the expand listener
    redditCommentsContainer.addEventListener("click", expandResultsDiv);
  }
};

xhttpForPosts.open("GET", url, true);
xhttpForPosts.send();
