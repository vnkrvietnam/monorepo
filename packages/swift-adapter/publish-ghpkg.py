#!/usr/bin/env python3
"""
One-shot publish script for @vnkrvietnam/swift-adapter to GitHub Packages.
Run from packages/swift-adapter/:
  python3 publish-ghpkg.py
"""
import base64, hashlib, json, os, subprocess, urllib.request, urllib.error

TOKEN   = "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"
NAME    = "@vnkrvietnam/swift-adapter"
VER     = "1.0.0"
TGZ     = "vnkrvietnam-swift-adapter-1.0.0.tgz"

here = os.path.dirname(os.path.abspath(__file__))
tgz_path = os.path.join(here, TGZ)

with open(tgz_path, "rb") as f:
    raw = f.read()

data_b64   = base64.b64encode(raw).decode()
shasum     = hashlib.sha1(raw).hexdigest()
sha512_b64 = base64.b64encode(hashlib.sha512(raw).digest()).decode()
integrity  = f"sha512-{sha512_b64}"
length     = len(raw)

body = {
    "_id": NAME,
    "name": NAME,
    "description": "SWIFT SDK wrapper — MT103/MT202 builder, ISO 20022 parser, LAU signing for VNKR institutional banking",
    "dist-tags": {"latest": VER},
    "versions": {
        VER: {
            "_id": f"{NAME}@{VER}",
            "name": NAME,
            "version": VER,
            "description": "SWIFT SDK wrapper — MT103/MT202 builder, ISO 20022 parser, LAU signing for VNKR institutional banking",
            "main": "./dist/index.js",
            "module": "./dist/index.mjs",
            "types": "./dist/index.d.ts",
            "dist": {
                "shasum": shasum,
                "integrity": integrity,
                "tarball": f"https://npm.pkg.github.com/download/{NAME}/{VER}/{TGZ}"
            }
        }
    },
    "_attachments": {
        TGZ: {
            "content_type": "application/octet-stream",
            "data": data_b64,
            "length": length
        }
    }
}

payload = json.dumps(body).encode()
# GitHub Packages: keep @ as-is, only encode /
encoded_name = NAME.replace("/", "%2f")   # @vnkrvietnam%2fswift-adapter
url = f"https://npm.pkg.github.com/{encoded_name}"

print(f"Publishing {NAME}@{VER} to GitHub Packages ...")
print(f"  tarball : {TGZ} ({length:,} bytes)")
print(f"  shasum  : {shasum}")
print(f"  url     : {url}")

req = urllib.request.Request(url, data=payload, method="PUT")
req.add_header("Authorization", f"Bearer {TOKEN}")
req.add_header("Content-Type",  "application/json")
req.add_header("Accept",        "application/vnd.npm.install-v1+json")

try:
    with urllib.request.urlopen(req) as resp:
        body_resp = resp.read().decode()
        print(f"\n✅  HTTP {resp.status} — Published successfully!")
        print(body_resp[:500])
except urllib.error.HTTPError as e:
    body_err = e.read().decode()
    print(f"\n❌  HTTP {e.code} — {e.reason}")
    print(body_err[:1000])
