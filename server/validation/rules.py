"""
Validation rules for different data types and schemas.
Rules can be combined and reused across different data sources.
"""

# Basic data type rules
NUMERIC_RULES = {
    'type': 'numeric',
    'required': False,
    'min': None,
    'max': None,
    'integer_only': False,
    'decimal_places': None
}

TEXT_RULES = {
    'type': 'string',
    'required': False,
    'min_length': None,
    'max_length': None,
    'pattern': None,
    'no_duplicate_spaces': True,
    'case_sensitive': True,
    'allowed_values': None
}

DATE_RULES = {
    'type': 'date',
    'required': False,
    'min_date': None,
    'max_date': None,
    'format': '%Y-%m-%d'
}

# Common field rules
ID_RULES = {
    **NUMERIC_RULES,
    'required': True,
    'integer_only': True,
    'min': 1,
    'unique': True
}

NAME_RULES = {
    **TEXT_RULES,
    'required': True,
    'min_length': 2,
    'max_length': 100,
    'pattern': r'^[a-zA-Z0-9\s\'".-]+$'
}

EMAIL_RULES = {
    **TEXT_RULES,
    'required': True,
    'pattern': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    'max_length': 255
}

PHONE_RULES = {
    **TEXT_RULES,
    'pattern': r'^\+?1?\d{9,15}$',
    'max_length': 20
}

# Schema templates
EMPLOYEE_SCHEMA = {
    'employee_id': {**ID_RULES},
    'name': {**NAME_RULES},
    'email': {**EMAIL_RULES},
    'phone': {**PHONE_RULES},
    'department': {
        **TEXT_RULES,
        'required': True,
        'min_length': 2,
        'max_length': 50
    },
    'salary': {
        **NUMERIC_RULES,
        'required': True,
        'min': 0,
        'decimal_places': 2
    },
    'hire_date': {
        **DATE_RULES,
        'required': True
    }
}

PRODUCT_SCHEMA = {
    'product_id': {**ID_RULES},
    'name': {
        **NAME_RULES,
        'min_length': 3,
        'max_length': 200
    },
    'category': {
        **TEXT_RULES,
        'required': True,
        'allowed_values': ['electronics', 'clothing', 'food', 'books', 'other'],
        'case_sensitive': False
    },
    'price': {
        **NUMERIC_RULES,
        'required': True,
        'min': 0.01,
        'decimal_places': 2
    },
    'stock': {
        **NUMERIC_RULES,
        'required': True,
        'min': 0,
        'integer_only': True
    }
}

# Database-specific schemas
DATABASE_SCHEMAS = {
    'sqlite': {
        'employees': EMPLOYEE_SCHEMA,
        'products': PRODUCT_SCHEMA
    },
    'postgresql': {
        'employees': EMPLOYEE_SCHEMA,
        'products': PRODUCT_SCHEMA
    }
}
