#!/usr/bin/env python3
"""Write base64 text copies of the binary assets (.hdr skies, .glb models) for hosts that serve
only web media types. js/core/photo.js tries the raw file first and then <name>.txt.

    python3 tools/assets/encode-binary.py <out-dir>

writes <out-dir>/assets/sky/<id>.hdr.txt and <out-dir>/assets/models/<id>.glb.txt.
"""
import base64
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[2]
out = Path(sys.argv[1] if len(sys.argv) > 1 else root / "dist")
n = 0
for f in sorted(list((root / "assets/sky").glob("*.hdr")) + list((root / "assets/models").glob("*.glb"))):
    dst = out / f.relative_to(root).parent / (f.name + ".txt")
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_bytes(base64.b64encode(f.read_bytes()))
    n += 1
print(f"wrote {n} files under {out}")
