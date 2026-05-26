from django.contrib import admin
from django.db.models import Count
from django.utils.html import format_html

from .models import Genre, HomeCollection, HomeCollectionItem, Movie, Profile, WatchProgress, Watchlist

admin.site.site_header = 'Bingsphere Control Room'
admin.site.site_title = 'Bingsphere Admin'
admin.site.index_title = 'Catalog and platform management'
admin.site.enable_nav_sidebar = False


def render_image_preview(image_field, alt_text):
    if not image_field:
        return 'No image'

    return format_html(
        '<img src="{}" alt="{}" class="admin-media-preview" loading="lazy">',
        image_field.url,
        alt_text,
    )


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ('name', 'movie_total')
    search_fields = ('name',)
    ordering = ('name',)

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(movie_total=Count('movies', distinct=True))

    @admin.display(ordering='movie_total', description='Titles')
    def movie_total(self, obj):
        return obj.movie_total


@admin.register(Watchlist)
class WatchlistAdmin(admin.ModelAdmin):
    list_display = ('user', 'movie', 'added_date')
    list_filter = ('added_date',)
    search_fields = ('user__username', 'user__email', 'movie__title')
    autocomplete_fields = ('user', 'movie')
    ordering = ('-added_date',)


@admin.register(WatchProgress)
class WatchProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'movie', 'progress_seconds', 'duration_seconds', 'updated_at')
    list_filter = ('updated_at',)
    search_fields = ('user__username', 'user__email', 'movie__title', 'episode_label')
    autocomplete_fields = ('user', 'movie')
    ordering = ('-updated_at',)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'avatar_thumbnail')
    search_fields = ('user__username', 'user__email')
    autocomplete_fields = ('user',)
    readonly_fields = ('avatar_preview',)

    @admin.display(description='Avatar')
    def avatar_thumbnail(self, obj):
        return render_image_preview(obj.avatar, f"{obj.user.username}'s avatar")

    @admin.display(description='Avatar preview')
    def avatar_preview(self, obj):
        return render_image_preview(obj.avatar, f"{obj.user.username}'s avatar")


class HomeCollectionItemInline(admin.TabularInline):
    model = HomeCollectionItem
    extra = 0
    autocomplete_fields = ('movie',)
    fields = ('movie', 'position')
    ordering = ('position',)


@admin.register(HomeCollection)
class HomeCollectionAdmin(admin.ModelAdmin):
    list_display = ('title', 'collection_style', 'display_order', 'item_total', 'is_active')
    list_filter = ('display_style', 'is_active')
    search_fields = ('title', 'slug', 'description')
    ordering = ('display_order', 'title')
    inlines = [HomeCollectionItemInline]

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(item_total=Count('items', distinct=True))

    @admin.display(ordering='display_style', description='Style')
    def collection_style(self, obj):
        return format_html(
            '<span class="admin-pill">{}</span>',
            obj.get_display_style_display(),
        )

    @admin.display(ordering='item_total', description='Titles')
    def item_total(self, obj):
        return obj.item_total


@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = (
        'thumbnail_thumbnail',
        'title',
        'content_badge',
        'genre_list',
        'release_date',
        'is_featured',
        'created_at',
    )
    list_filter = ('content_type', 'genres', 'release_date', 'is_featured')
    search_fields = ('title', 'description')
    ordering = ('featured_rank', '-created_at')
    filter_horizontal = ('genres',)
    readonly_fields = ('thumbnail_preview', 'backdrop_preview', 'created_at')
    fieldsets = (
        (
            'Editorial details',
            {
                'fields': (
                    'title',
                    'description',
                    ('content_type', 'maturity_rating'),
                    ('release_date', 'duration_minutes'),
                    ('is_featured', 'featured_rank'),
                    'genres',
                )
            },
        ),
        (
            'Media assets',
            {
                'fields': (
                    'thumbnail',
                    'thumbnail_preview',
                    'backdrop',
                    'backdrop_preview',
                    'video_url',
                )
            },
        ),
        (
            'Metadata',
            {
                'classes': ('collapse',),
                'fields': ('created_at',),
            },
        ),
    )

    @admin.display(description='Poster')
    def thumbnail_thumbnail(self, obj):
        return render_image_preview(obj.thumbnail, f'{obj.title} poster')

    @admin.display(ordering='content_type', description='Type')
    def content_badge(self, obj):
        return format_html(
            '<span class="admin-pill">{}</span>',
            obj.get_content_type_display(),
        )

    @admin.display(description='Genres')
    def genre_list(self, obj):
        return ', '.join(obj.genres.values_list('name', flat=True)) or 'No genres'

    @admin.display(description='Poster preview')
    def thumbnail_preview(self, obj):
        return render_image_preview(obj.thumbnail, f'{obj.title} poster')

    @admin.display(description='Backdrop preview')
    def backdrop_preview(self, obj):
        return render_image_preview(obj.backdrop, f'{obj.title} backdrop')
