from main import app
print('FastAPI app loaded successfully')
print('Routes:')
for r in app.routes:
    if hasattr(r, 'methods'):
        print(f'  {r.methods} {r.path}')
