
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API Routes
    path("posts", views.compose, name="compose"),
    path("posts/list", views.posts, name="posts"),
    path("posts/<int:user_id>", views.profile, name="profile"),
    path("posts/username/<int:user_id>", views.username, name="username"),
    path("posts/follow_stats/<int:user_id>", views.follow_stats, name="follow_stats"),
    path("posts/user/<int:user_id>", views.check_user, name="check_user"),
    path("posts/check_follow/<int:user_id>", views.check_follow, name="check_follow"),
    path("posts/following/<int:user_id>", views.following, name="following"),
    path("posts/follow/<int:user_id>", views.follow, name="follow"),
    path("posts/unfollow/<int:user_id>", views.unfollow, name="unfollow"),
    path("posts/update/<int:post_id>", views.update, name="update"),
    path("posts/like/<int:post_id>", views.like, name="like")
]
