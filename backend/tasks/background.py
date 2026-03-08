"""Background task execution utilities.

Keeps resume processing off the request thread so uploads return fast.
"""

from concurrent.futures import ThreadPoolExecutor
from typing import Optional

# Worker pool to allow concurrent processing of multiple applications
_executor: Optional[ThreadPoolExecutor] = ThreadPoolExecutor(max_workers=5)


def submit_task(fn, *args, **kwargs):
    """Submit a callable to the shared executor."""
    if _executor is None:
        raise RuntimeError("Background executor not initialized")
    return _executor.submit(fn, *args, **kwargs)


