from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
import json
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import HttpResponse, HttpResponseRedirect, render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from django.core.paginator import Paginator
from .models import User, Post, Following


def index(request):
    
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


@csrf_exempt
@login_required
def compose(request):
    """creates new post"""
    # Composing a new post must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
    
    # Getting post's content
    data = json.loads(request.body)
    body = data.get("body")
    
    # Checking if post is empty
    if body == "":
        return JsonResponse({
            "error": "Post cannot be empty."
        }, status=400)
    
    # Creating new post
    post = Post(user=request.user, body=body)
    post.save()

    return JsonResponse({"message": "Post sent successfully."}, status=201)


def posts(request):
    """retrieves paginated list of all posts in reverse chronologial order"""
    page_number = request.GET.get("page", 1)
    posts = Post.objects.all()
    posts = posts.order_by("-timestamp").all()

    paginator = Paginator(posts, 10) 
    page_obj = paginator.get_page(page_number)     
    posts = [post.serialize() for post in page_obj.object_list]
    return JsonResponse({
                        "current": page_obj.number,
                        "has_next": page_obj.has_next(),
                        "posts" : posts}, safe=False)
    


def profile(request, user_id):
    """retrieves all posts for given profile"""
    page_number = request.GET.get("page", 1)
    posts = Post.objects.filter(user=user_id)
    posts = posts.order_by("-timestamp").all()

    paginator = Paginator(posts, 10) 
    page_obj = paginator.get_page(page_number)    
    posts = [post.serialize() for post in page_obj.object_list]

    return JsonResponse({"has_next": page_obj.has_next(),
        "posts" : posts}, safe=False)

def username(request, user_id):
    """retrieves username"""
    user = User.objects.get(pk=user_id)
    return JsonResponse({"username": user.username})
    
def follow_stats(request, user_id):    
    """retrieves follow stats for given profile"""
    followers = Following.objects.filter(following=user_id)
    following = Following.objects.filter(follower=user_id)
            
    return JsonResponse({"followers": followers.count(),
                         "following": following.count()}) 


def check_user(request, user_id):
    """compares profile id with authenticated user id"""
    if request.user.id == user_id:
        return JsonResponse({"same_user" : True})
    else: 
        return JsonResponse({"same_user" : False})
    
def check_follow(request, user_id):
    """checks if user already follows this profile"""
    following = Following.objects.filter(follower=request.user.id)
    for profile in following:
        if profile.following.id == user_id:
            return JsonResponse({"already_following" : True})
    return JsonResponse({"already_following" : False})


def following(request, user_id):    
    """retrieves list of followed posts in reverse chronological order"""    
    # preparing list of following
    following = Following.objects.filter(follower=user_id)    
    following_list = []
    for profile in following:
        following_list.append(profile.following.id)            

    # filtering posts with the list
    filter_query = Q()
    filter_query.add(Q(user__in=following_list), Q.AND)
    posts = Post.objects.filter(filter_query)
    posts = posts.order_by("-timestamp").all()

    # structuring pagination
    page_number = request.GET.get("page", 1)
    paginator = Paginator(posts, 10) 
    page_obj = paginator.get_page(page_number)    
    posts = [post.serialize() for post in page_obj.object_list]

    return JsonResponse({"has_next": page_obj.has_next(),
        "posts" : posts}, safe=False)


def follow(request, user_id):
    """creates Following object for logged user and given profile"""
    following_obj = Following(follower=request.user, following=User.objects.get(pk=user_id))
    following_obj.save()
    return JsonResponse({"message": "Follow registered properly."}, status=201)


def unfollow(request, user_id):
    """removes Following object for logged user and given profile"""
    following_obj = Following.objects.get(follower=request.user, following=User.objects.get(pk=user_id))
    following_obj.delete()
    return JsonResponse({"message": "Unfollow registered properly."}, status=201)

@csrf_exempt
@login_required
def update(request, post_id):
    """updates posts body"""    
    if request.method == "PUT":
        post = Post.objects.get(id=post_id)
        data = json.loads(request.body)
        body = data.get("body")
    
        # Checking if post is empty
        if body == "":
            return JsonResponse({
                "error": "Post cannot be empty."
            }, status=400)

        if data.get("body") is not None:
            post.body = data["body"]        
            post.save()
            return HttpResponse(status=204)
    else:
        return JsonResponse({
            "error": "PUT request required."
        }, status=400)


@csrf_exempt
@login_required
def like(request, post_id):
    """updates count of likes for a post"""
    if request.method == "PUT":
        post = Post.objects.get(id=post_id)   
        data = json.loads(request.body)
        print(data)
        if data.get("likes") is not None:
            post.likes = int(data["likes"])        
            post.save()
            return HttpResponse(status=204)
    else:
        return JsonResponse({
            "error": "PUT request required."
        }, status=400)
    
