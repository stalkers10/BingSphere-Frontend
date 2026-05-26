from django import template

register = template.Library()


def _models_for(app):
    if isinstance(app, dict):
        return app.get('models') or []
    return getattr(app, 'models', []) or []


@register.filter
def count_models(app_list):
    if not app_list:
        return 0
    return sum(len(_models_for(app)) for app in app_list)
