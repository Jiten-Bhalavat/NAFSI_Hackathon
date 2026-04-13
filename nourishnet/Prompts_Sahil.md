# Volunteer Page

Generate Opportunity records in catalog.json from the volunteer CSVs. Each food bank becomes a volunteering opportunity with its phone, email, and hours. Each pantry with a phone number gets one too.

Files:

build_catalogs.py — generates opportunities[] array in catalog.json

nourishnet/src/pages/Planner.tsx :no changes needed; it already reads opportunities from catalog


