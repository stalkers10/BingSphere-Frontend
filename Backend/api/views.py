from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import viewsets, generics, status, filters
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from django.contrib.auth.models import User
from django.core.files.storage import default_storage
from django.db import IntegrityError
from .models import HomeCollection, Movie, Profile, WatchProgress, Watchlist
from .serializers import (
    ChangePasswordSerializer,
    HomeCollectionSerializer,
    MovieSerializer,
    ProfileSerializer,
    WatchProgressSerializer,
    WatchlistSerializer,
)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({'status': 'ok'})


class MovieViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Movie.objects.prefetch_related('genres').order_by('-created_at')
    serializer_class = MovieSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def home_page(request):
    movies = Movie.objects.prefetch_related('genres').order_by('-created_at')
    featured_movie = (
        movies.filter(is_featured=True)
        .order_by('featured_rank', '-release_date', '-created_at')
        .first()
    ) or movies.order_by('-release_date', '-created_at').first()

    collections_qs = HomeCollection.objects.filter(is_active=True).prefetch_related(
        'items__movie__genres'
    )
    collections = HomeCollectionSerializer(
        collections_qs,
        many=True,
        context={'request': request},
    ).data

    if not collections:
        trending_movies = MovieSerializer(
            movies[:10],
            many=True,
            context={'request': request},
        ).data
        latest_movies = MovieSerializer(
            movies.order_by('-release_date', '-created_at')[:12],
            many=True,
            context={'request': request},
        ).data
        collections = [
            {
                'id': 0,
                'title': 'Trending Now',
                'slug': 'trending-now',
                'description': 'Generated from the latest titles in the catalog.',
                'display_style': 'poster',
                'display_order': 0,
                'items': [
                    {'position': index, 'movie': movie}
                    for index, movie in enumerate(trending_movies, start=1)
                ],
            },
            {
                'id': 0,
                'title': 'New Releases',
                'slug': 'new-releases',
                'description': 'Sorted by release date from the Django catalog.',
                'display_style': 'poster',
                'display_order': 1,
                'items': [
                    {'position': index, 'movie': movie}
                    for index, movie in enumerate(latest_movies, start=1)
                ],
            },
        ]

    continue_watching_qs = WatchProgress.objects.filter(user=request.user).select_related(
        'movie'
    ).prefetch_related('movie__genres')[:12]

    return Response(
        {
            'featured': (
                MovieSerializer(featured_movie, context={'request': request}).data
                if featured_movie
                else None
            ),
            'catalog': MovieSerializer(
                movies.order_by('-release_date', '-created_at'),
                many=True,
                context={'request': request},
            ).data,
            'collections': collections,
            'continue_watching': WatchProgressSerializer(
                continue_watching_qs,
                many=True,
                context={'request': request},
            ).data,
        }
    )


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')

        if not username or not password:
            return Response(
                {"error": "Username and password required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Username already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if email and User.objects.filter(email=email).exists():
            return Response(
                {"error": "Email already in use"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(
            username=username, password=password, email=email
        )
        Profile.objects.get_or_create(user=user)
        return Response(
            {"message": "User created successfully"},
            status=status.HTTP_201_CREATED
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_object(self):
        profile = Profile.objects.filter(user=self.request.user).order_by('id').first()
        if profile:
            return profile
        return Profile.objects.create(user=self.request.user)

    def patch(self, request, *args, **kwargs):
        profile = self.get_object()
        remove_avatar = str(request.data.get('remove_avatar', '')).lower() in {'1', 'true', 'yes'}

        if remove_avatar and profile.avatar:
            profile.avatar.delete(save=False)
            profile.avatar = None
            profile.save(update_fields=['avatar'])

        data = request.data.copy()
        if hasattr(data, 'pop'):
            data.pop('remove_avatar', None)

        serializer = self.get_serializer(profile, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            self.get_serializer(profile, context=self.get_serializer_context()).data
        )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'user': request.user},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Password changed successfully.'})


class WatchlistViewSet(viewsets.ModelViewSet):
    serializer_class = WatchlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Watchlist.objects.filter(user=self.request.user)
            .select_related('movie')
            .prefetch_related('movie__genres')
            .order_by('-added_date')
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError:
            return Response(
                {"error": "Movie already in your watchlist"},
                status=status.HTTP_400_BAD_REQUEST
            )


@api_view(['GET'])
@permission_classes([AllowAny])
def storage_check(request):
    from django.conf import settings

    storage_backend = (
        f'{default_storage.__class__.__module__}.{default_storage.__class__.__name__}'
    )
    configured_backend = settings.STORAGES.get('default', {}).get('BACKEND')
    cloudinary_keys = settings.CLOUDINARY_STORAGE

    return Response({
        'active_storage': storage_backend,
        'configured_default_storage': configured_backend,
        'uses_cloudinary': 'cloudinary' in storage_backend.lower(),
        'cloudinary_configured': all(
            bool(cloudinary_keys.get(key))
            for key in ('CLOUD_NAME', 'API_KEY', 'API_SECRET')
        ),
        'has_cloud_name': bool(cloudinary_keys.get('CLOUD_NAME')),
        'has_api_key': bool(cloudinary_keys.get('API_KEY')),
        'has_api_secret': bool(cloudinary_keys.get('API_SECRET')),
    })
