from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ChangePasswordView,
    MovieViewSet,
    ProfileView,
    RegisterView,
    WatchlistViewSet,
    health_check,
    home_page,
    storage_check,
)

router = DefaultRouter()
router.register(r'movies', MovieViewSet)
router.register(r'watchlist', WatchlistViewSet, basename='watchlist')
urlpatterns = [
    path('', include(router.urls)),
    path('health/', health_check, name='health-check'),
    path('home/', home_page, name='home-page'),
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/password/', ChangePasswordView.as_view(), name='profile-password'),
    path('storage-check/', storage_check, name='storage-check'),
    path('api/storage-check/', storage_check),
]
