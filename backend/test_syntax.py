import py_compile
import traceback
try:
    py_compile.compile('routes/job_routes.py', doraise=True)
    print("OK")
except Exception as e:
    traceback.print_exc()
