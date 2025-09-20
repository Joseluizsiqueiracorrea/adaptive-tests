# Django Template with Adaptive Tests

Django web application template with pre-configured adaptive testing infrastructure for Python development.

## Features

- 🐍 Django 5.0+ with modern patterns
- 📊 PostgreSQL/SQLite database support
- 🔐 Django REST Framework integration
- 🧪 Comprehensive adaptive test suites
- 🚀 Docker configuration included
- 📝 Pre-configured pytest setup

## Quick Start

```bash
# Create new Django project with adaptive tests
git clone https://github.com/anon57396/adaptive-tests.git
cd adaptive-tests/languages/python/templates/django
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Project Structure

```
my-django-app/
├── myproject/
│   ├── settings/          # Environment-specific settings
│   ├── apps/             # Django applications
│   └── wsgi.py           # WSGI configuration
├── tests/                # Traditional tests
├── tests_adaptive/       # Adaptive test suites
├── adaptive_tests.config.py
└── requirements.txt
```

## Adaptive Test Examples

The template includes adaptive tests for:
- Model discovery and validation
- View endpoint testing
- Serializer validation
- Custom management commands
- Middleware discovery

## Running Tests

```bash
# Traditional tests
python manage.py test

# Adaptive tests only
pytest tests_adaptive/

# Full validation suite
python -m adaptive_tests validate
```

## Configuration

Adaptive tests configuration in `adaptive_tests.config.py`:

```python
ADAPTIVE_TESTS_CONFIG = {
    'discovery': {
        'root_path': './myproject',
        'scoring': {
            'allow_loose_name_match': True,
            'loose_name_penalty': -10
        }
    },
    'languages': ['python'],
    'frameworks': ['django']
}
```

## Django Integration

The template includes custom Django test runners and fixtures:

```python
# settings/test.py
INSTALLED_APPS += ['adaptive_tests_py']

TEST_RUNNER = 'adaptive_tests_py.django.AdaptiveTestRunner'

ADAPTIVE_TESTS = {
    'AUTO_DISCOVER_MODELS': True,
    'AUTO_DISCOVER_VIEWS': True,
    'CACHE_DISCOVERY': True
}
```

## Migration from Traditional Tests

Convert existing Django tests to adaptive tests:

```bash
python -m adaptive_tests migrate --input tests/ --output tests_adaptive/ --framework django
```

This automatically converts Django test classes to use adaptive discovery for models, views, and other Django components.