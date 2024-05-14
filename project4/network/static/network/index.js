let counter = 1;

document.addEventListener('DOMContentLoaded', function() {
    // by deafult, load all posts
    load_posts();

    // when post is sent   
    document.querySelector('#compose-form').onsubmit = send_post;
    
    // when Following clicked
    document.addEventListener('click', event => {        
        const element = event.target; 
        if (element.id === 'following') {      
            load_following(element.dataset.user);          
        }
      })
      
    document.querySelector('#profile').addEventListener('click', () => {
        const element = document.querySelector('#profile');
        load_profile(element.dataset.user);
    });

    // when 'Edit' clicked
    document.addEventListener('click', event => {
        const element = event.target;   
        if (element.id === 'edit') {      
            edit_post(element.dataset.id, element.dataset.user, element.dataset.body);         
        }
    })

    // when 'Like' clicked
    document.addEventListener('click', event => {
        const element = event.target;   
        if (element.id === 'like') {      
            like_post(element.dataset.id, element.dataset.user);         
        }
    })

    // when 'Unlike' clicked
    document.addEventListener('click', event => {
        const element = event.target;   
        if (element.id === 'unlike') {      
            unlike_post(element.dataset.id, element.dataset.user);         
        }
    })
    
});


function send_post() {    
    const compose_body = document.querySelector('#compose-body').value;

    //use API
    fetch('/posts', {
        method: 'POST',
        body: JSON.stringify({
            body: compose_body
        })
      })
      .then(response => response.json())
      .then(result => {
          // Prompt about result 
          if (result["error"]) {
            alert(result["error"]);            
          }
          else {                      
            alert(result["message"]);
            load_posts();     
          }
      });
      
      // clear out the composition field
      document.querySelector('#compose-body').value = '';      
      return false;
}


function load_posts() {
    // toggle views
    document.querySelector('#posts-view').innerHTML = '';
    document.querySelector('#posts-view').style.display = 'block';
    document.querySelector('#profile-view').innerHTML = '';
    document.querySelector('#profile-view').style.display = 'none';
    document.querySelector('#following-view').innerHTML = '';
    document.querySelector('#following-view').style.display = 'none';
        
    // load posts     
    fetch(`/posts/list?page=${counter}`)
    .then(response => response.json())
    .then(data => {    
        data.posts.forEach(add_post);

        // create and add  Next and Previous buttons
        const b_next = document.createElement('button');
        b_next.id = 'next';
        b_next.className="btn btn-primary";
        b_next.innerHTML = 'Next';
        document.querySelector('#posts-view').append(b_next);

        const b_prev = document.createElement('button');
        b_prev.id = 'prev';
        b_prev.className="btn btn-primary";
        b_prev.innerHTML = 'Previous';
        document.querySelector('#posts-view').append(b_prev);

        // toggle Next and Previous buttons
        if (counter === 1) {
            document.querySelector('#prev').style.display = "none";    
        }
        else {
            document.querySelector('#prev').style.display = "block";    
        }

        if (data.has_next) {
            document.querySelector('#next').style.display = "block"; 
        }
        else {
            document.querySelector('#next').style.display = "none";
        } 
        
        // when Next button clicked
        document.querySelector('#next').addEventListener('click', () => {
            counter++;
            load_posts();
        });  

        // when Previous button clicked
        document.querySelector('#prev').addEventListener('click', () => {
            counter--;
            load_posts();        
        });    
    });   
}


function add_post(content) {    
    // creates and adds a post to DOM    
    const post = document.createElement('div');
    post.className = 'post';    
    post.innerHTML =`<h5><a href="javascript:;" onclick=load_profile(${content["user"]}); style="color : black;">${content["username"]}</a></h5>
                        <div style="font-size: 14px;">
                            <div>
                                <a href="#" id="edit" data-id="${content["id"]}" data-user="${content["user"]}" data-body="${content["body"]}">Edit</a>
                            </div>                        
                            <div id="body">
                                ${content["body"]}
                            </div>
                            <div style="color: grey;">
                                ${content["timestamp"]}
                            </div>
                            <div>
                                <span>&#10084;</span><span id="likes">${content["likes"]}</span><span><a href="#" id="like" data-id="${content["id"]}" data-user="${content["user"]}" style="text-decoration: none;"> &#128077;</a></span><span><a href="#" id="unlike" data-id="${content["id"]}" data-user="${content["user"]}" style="text-decoration: none;"> &#128078;</a></span>
                            </div>
                        </div>`    
    
    post.style.border = "1px solid #D3D3D3";
    post.style.padding = "15px";
    post.style.margin = "5px";
    post.id = content["id"];
    //post.dataset.id = content["id"];
    //post.dataset.user = content["user"];
    //post.dataset.body = content["body"];
    
    
    document.querySelector('#posts-view').append(post); 
}


function load_profile(user) {      
    // toggling views
    document.querySelector('#compose-view').innerHTML = '';
    document.querySelector('#compose-view').style.display = 'none';    
    document.querySelector('#posts-view').innerHTML = '';
    document.querySelector('#posts-view').style.display = 'none';
    document.querySelector('#profile-view').innerHTML = '';
    document.querySelector('#profile-view').style.display = 'block';
    document.querySelector('#following-view').innerHTML = '';
    document.querySelector('#following-view').style.display = 'none';    
        
    // get username and load heading
    fetch(`/posts/username/${user}`)
    .then(response => response.json())
    .then(data => {        
        // create and add proper heading        
        const heading = document.createElement('h5');
        heading.innerHTML = `${data["username"]} <span>    </span>`;
        heading.id = "heading";
        document.querySelector('#profile-view').append(heading);
    });         

    // load Follow and Unfollow buttons
    fetch(`/posts/user/${user}`)
    .then(response => response.json())
    .then(data => {        
        // if viewed profile other than authenticated user
        if (!data["same_user"]) {
            // if user follows this profile, create and add Unfollow button
            fetch(`/posts/check_follow/${user}`)
            .then(response => response.json())
            .then(data => {
                if(data["already_following"]) {
                    const button = document.createElement('button');
                    button.className="btn btn-primary";
                    button.innerHTML = `Unfollow`;
                    button.addEventListener("click", function() {
                        unfollow(user);
                      });
                    document.querySelector('#heading').append(button);
                }
                // else create and add Follow button
                else {
                    const button = document.createElement('button');
                    button.className="btn btn-primary";
                    button.innerHTML = `Follow`;
                    button.addEventListener("click", function() {
                        follow(user);
                      });
                    
                    document.querySelector('#heading').append(button);
                }
             });
        }
    });         
    

    // load follow stats
    fetch(`/posts/follow_stats/${user}`)
    .then(response => response.json())
    .then(data => {        
        // create and add follower stats
        const followers = document.createElement('div');
        followers.innerHTML = `<div><i><b>${data["followers"]}</b> followers, <b>${data["following"]}</b> following</i></div>`;
        followers.id = 'followers';
        document.querySelector('#profile-view').append(followers);
    });             

    // load profile posts 
    fetch(`/posts/${user}?page=${counter}`)
    .then(response => response.json())
    .then(data => {        
        data.posts.forEach(add_profile_post);
                
        // create and add  Next and Previous buttons
        const b_next = document.createElement('button');
        b_next.id = 'next';
        b_next.className="btn btn-primary";
        b_next.innerHTML = 'Next';
        document.querySelector('#profile-view').append(b_next);

        const b_prev = document.createElement('button');
        b_prev.id = 'prev';
        b_prev.className="btn btn-primary";
        b_prev.innerHTML = 'Previous';
        document.querySelector('#profile-view').append(b_prev);

        // toggle Next and Previous buttons
        if (counter === 1) {
            document.querySelector('#prev').style.display = "none";    
        }
        else {
            document.querySelector('#prev').style.display = "block";    
        }

        if (data.has_next) {
            document.querySelector('#next').style.display = "block"; 
        }
        else {
            document.querySelector('#next').style.display = "none";
        } 
        
        // when Next button clicked
        document.querySelector('#next').addEventListener('click', () => {
            counter++;
            load_profile(user);
        });  

        // when Previous button clicked
        document.querySelector('#prev').addEventListener('click', () => {
            counter--;
            load_profile(user);       
        });    
        
    });             
}


function add_profile_post(content) {
    // creates and adds a post to DOM
    const post = document.createElement('div');
    post.className = 'post';    
    post.innerHTML =`<h5><a href="javascript:;" onclick=load_profile(${content["user"]}); style="color : black;">${content["username"]}</a></h5>
                        <div style="font-size: 14px;">
                            <div>
                                <a href="#" id="edit" data-id="${content["id"]}" data-user="${content["user"]}" data-body="${content["body"]}">Edit</a>
                            </div>                        
                            <div id="body">
                                ${content["body"]}
                            </div>
                            <div style="color: grey;">
                                ${content["timestamp"]}
                            </div>
                            <div>
                                <span>&#10084;</span><span id="likes">${content["likes"]}</span><span><a href="#" id="like" data-id="${content["id"]}" data-user="${content["user"]}" style="text-decoration: none;"> &#128077;</a></span><span><a href="#" id="unlike" data-id="${content["id"]}" data-user="${content["user"]}" style="text-decoration: none;"> &#128078;</a></span>
                            </div>
                        </div>`      
    
    post.style.border = "1px solid #D3D3D3";
    post.style.padding = "15px";
    post.style.margin = "5px";
    post.id = content["id"];   
    
    document.querySelector('#profile-view').append(post);     
}


function load_following(user) {
    // toggle views      
    document.querySelector('#compose-view').innerHTML = '';
    document.querySelector('#compose-view').style.display = 'none';    
    document.querySelector('#posts-view').innerHTML = '';
    document.querySelector('#posts-view').style.display = 'none';
    document.querySelector('#profile-view').innerHTML = '';
    document.querySelector('#profile-view').style.display = 'none';
    document.querySelector('#following-view').innerHTML = '';
    document.querySelector('#following-view').style.display = 'block';    

    // load followed posts
    fetch(`/posts/following/${user}?page=${counter}`)
    .then(response => response.json())
    .then(data => {
        data.posts.forEach(add_following);        

        // create and add  Next and Previous buttons
        const b_next = document.createElement('button');
        b_next.id = 'next';
        b_next.className="btn btn-primary";
        b_next.innerHTML = 'Next';
        document.querySelector('#following-view').append(b_next);

        const b_prev = document.createElement('button');
        b_prev.id = 'prev';
        b_prev.className="btn btn-primary";
        b_prev.innerHTML = 'Previous';
        document.querySelector('#following-view').append(b_prev);

        // toggle Next and Previous buttons
        if (counter === 1) {
            document.querySelector('#prev').style.display = "none";    
        }
        else {
            document.querySelector('#prev').style.display = "block";    
        }

        if (data.has_next) {
            document.querySelector('#next').style.display = "block"; 
        }
        else {
            document.querySelector('#next').style.display = "none";
        } 
        
        // when Next button clicked
        document.querySelector('#next').addEventListener('click', () => {
            counter++;
            load_following(user);
        });  

        // when Previous button clicked
        document.querySelector('#prev').addEventListener('click', () => {
            counter--;
            load_following(user);       
        });    

    });   
}


function add_following(content) {
    // creates and adds a post to DOM
    const post = document.createElement('div');
    post.className = 'post';    
    post.innerHTML =`<h5><a href="javascript:;" onclick=load_profile(${content["user"]}); style="color : black;">${content["username"]}</a></h5>
                        <div style="font-size: 14px;">
                            <div>
                                <a href="#" id="edit" data-id="${content["id"]}" data-user="${content["user"]}" data-body="${content["body"]}">Edit</a>
                            </div>                        
                            <div id="body">
                                ${content["body"]}
                            </div>
                            <div style="color: grey;">
                                ${content["timestamp"]}
                            </div>
                            <div>
                                <span>&#10084;</span><span id="likes">${content["likes"]}</span><span><a href="#" id="like" data-id="${content["id"]}" data-user="${content["user"]}" style="text-decoration: none;"> &#128077;</a></span><span><a href="#" id="unlike" data-id="${content["id"]}" data-user="${content["user"]}" style="text-decoration: none;"> &#128078;</a></span>
                            </div>
                        </div>`    
    
    post.style.border = "1px solid #D3D3D3";
    post.style.padding = "15px";
    post.style.margin = "5px";
    post.id = content["id"];
    document.querySelector('#following-view').append(post);     
}


function follow(user) {
    fetch(`/posts/follow/${user}`)
    .then(response => response.json())
    .then(result => {
        // prompt about result                    
        alert(result["message"]);
        load_posts();        
    });   
              
      return false;
}


function unfollow(user) {
    fetch(`/posts/unfollow/${user}`)
    .then(response => response.json())
    .then(result => {
        // prompt about result                    
        alert(result["message"]);
        load_following(user);        
    });   
              
      return false;    
}


function edit_post(id, user, body) {    
    if (document.querySelector("#profile").dataset.user != user) {
        alert("User can edit only own posts");
    }   
    else  {
        // finding the post with clicked 'Edit'
        const post = document.getElementById(id);
        // adding prefilled textarea and 'Save' button
        const body = post.querySelector("#body");
        const content = body.innerHTML;
        body.innerHTML = `<textarea class="form-control" id="compose-body">${content}</textarea><button id="save" class="btn btn-primary">Save</button>`;
        
        document.querySelector('#save').addEventListener('click', () => {
            // accessing updated post body
            const content = body.querySelector('#compose-body').value;            
            // updating post on server
            fetch(`/posts/update/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    body: content
                })
              });
            alert("Changes saved.");
            load_posts();        

        });          
    }
}

function like_post(id, user) {
    if (document.querySelector("#profile").dataset.user == user) {
        alert("You cannot give a like to own post.");
    }
    else {
        // finding the post with clicked 'Like'
        const post = document.getElementById(id);    
        // accessing current number of likes & updating by 1
        var number_of_likes = parseInt(post.querySelector('#likes').innerHTML) + 1;
        // updating likes on server
        fetch(`/posts/like/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                likes: number_of_likes
            })
            });    
        alert("Like registered.");
        load_posts();  
    }
}


function unlike_post(id, user) {
    if (document.querySelector("#profile").dataset.user == user) {
        alert("You cannot unlike own post.");
    }
    else {
        // finding the post with clicked 'Unlike'
        const post = document.getElementById(id);    
        // accessing current number of likes & updating by 1
        var number_of_likes = parseInt(post.querySelector('#likes').innerHTML);
        if (number_of_likes == 0) {
            alert("Number of likes cannot be negative.");
            load_posts();
        }
        else {
            number_of_likes--;
            // updating likes on server
            fetch(`/posts/like/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    likes: number_of_likes
                })
            });    
            alert("Unlike registered.");
            load_posts();
        }          
    }
}

