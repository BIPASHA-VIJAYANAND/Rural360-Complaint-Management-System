"""Flask application factory."""
from flask import Flask
from flask_cors import CORS
from .config import Config
from .extensions import jwt, bcrypt


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Extensions
    jwt.init_app(app)
    bcrypt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://localhost:5173"]}},
         supports_credentials=True)

    # Blueprints
    from .routes.auth        import auth_bp
    from .routes.complaints  import complaints_bp
    from .routes.assignments import assignments_bp
    from .routes.feedback    import feedback_bp
    from .routes.admin       import admin_bp

    app.register_blueprint(auth_bp,        url_prefix="/api/auth", strict_slashes=False)
    app.register_blueprint(complaints_bp,  url_prefix="/api/complaints", strict_slashes=False)
    app.register_blueprint(assignments_bp, url_prefix="/api/assignments", strict_slashes=False)
    app.register_blueprint(feedback_bp,    url_prefix="/api/feedback", strict_slashes=False)
    app.register_blueprint(admin_bp,       url_prefix="/api/admin", strict_slashes=False)

    return app
