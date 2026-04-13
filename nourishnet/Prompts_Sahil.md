# Volunteer Page

Generate Opportunity records in catalog.json from the volunteer CSVs. Each food bank becomes a volunteering opportunity with its phone, email, and hours. Each pantry with a phone number gets one too.

Files:

build_catalogs.py — generates opportunities[] array in catalog.json

nourishnet/src/pages/Planner.tsx :no changes needed; it already reads opportunities from catalog


## prompt 2

there are lots of duplicates here in the filters for counties and should be normalized.



Also make the design intuitive. This can be done by keeping maps and the side panel right below the search filters, so users (all donors, food seekers, and volunteers) know that by using the search filters, the change will be reflected below.



Also, when each location is selected, the infromation of it should be available in the most readable way possible, such that in a small area maximum information can be shown in a clean structured layout. I dont want it to be either to be directly shown on map when on clciked, or should be displayed below in least space.



The search filters should be applied as soon as they are selected, and in an efficient way. we can use caching to effiecntly apply the filters.


## prompt 3

The map gets updates when a search filter is clicked, but i is not shown in the card list shown on the left, that should be updated as well.



Also after a search filter is clciked, it takes some time to load the filters, so this should be shown clearly to the user, so they dont spam any more filters.



All the infromation should be visible on map when a location is selected.

because anyone would be expecting to see all the details on the map.



Also, 🍱 Surplus Food Available should go below, and maps should be shown directly below search filters.
