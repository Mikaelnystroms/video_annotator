"""
Streamlit Video Annotator Component

A custom Streamlit component for annotating videos with drawable regions
and time-range markers.
"""

from .video_annotator import (
    AnnotationData,
    DEFAULT_LABELS,
    ShapeData,
    __version__,
    video_annotator,
)

__all__ = [
    "video_annotator",
    "AnnotationData",
    "ShapeData",
    "DEFAULT_LABELS",
    "__version__",
]
