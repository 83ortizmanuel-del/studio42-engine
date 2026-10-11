#!/usr/bin/env python3
"""Valida c/*.json contra schema.json (JSON Schema draft-07). Uso: python3 tests/validar_json.py [carpeta]"""
import glob, json, os, sys
from jsonschema import Draft7Validator

raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
carpeta = sys.argv[1] if len(sys.argv) > 1 else os.path.join(raiz, "c")
schema = json.load(open(os.path.join(raiz, "schema.json"), encoding="utf-8"))
Draft7Validator.check_schema(schema)
v = Draft7Validator(schema)
malos = 0
for f in sorted(glob.glob(os.path.join(carpeta, "*.json"))):
    data = json.load(open(f, encoding="utf-8"))
    errs = sorted(v.iter_errors(data), key=lambda e: list(e.path))
    if errs:
        malos += 1
        print("✗", os.path.basename(f))
        for e in errs[:8]:
            print("   -", "/".join(str(p) for p in e.path) or "(raíz)", ":", e.message[:160])
    else:
        print("✓", os.path.basename(f))
sys.exit(1 if malos else 0)
