# NourishNet — Prompt Engineering Log

All prompts given to the AI assistant during the development of NourishNet, recorded as-is.

---

## Prompt 1 — Initial Project Setup

We're building a small React app for a class challenge called NourishNet. The idea is to help people in Maryland and the DC metro area find food assistance, figure out how to donate, and find volunteer opportunities. Everything has to be open source and deploy as a static site on GitHub Pages—no backend, no AWS services, no paid APIs.Please use Vite with React and TypeScript, React Router for pages, and Tailwind or CSS Modules for styling—your pick, but stick to one. For maps we want Leaflet with react-leaflet, marker clustering when there are a lot of points, and standard OpenStreetMap tiles with the usual attribution. Use npm.All the content will come from one file: public/data/catalog.json. We'll replace it later with real merged data; for now please include a realistic sample with at least eight places (six with latitude/longitude and two without coordinates so we can test edge cases) and six "opportunities" split between donation and volunteering.The JSON should look roughly like this conceptually: a schema version and timestamp at the top, then an array of places (name, address fields, county optional, lat/lng nullable, phone, hours, eligibility and requirements text, tags, and source info), and an array of opportunities that can link to a place by id. Each opportunity is either donation or volunteering, with a title, short summary, contact fields, schedule notes, and optional needs tags.We need three different interfaces, not one page with a toggle:Consumer — People looking for food. ZIP or city search, optional "use my location" with a short honest line about what the browser will do. Map with clustered markers plus a list that stays in sync—filters for things like county and day of week if the data supports it. Tapping or selecting a place should show details: hours, rules, phone as a real tel link, and a directions link built from the address. If something doesn't have coordinates, it should still show in the list and never break the app.Donor — People who want to give food or money. This should feel different from the consumer view: emphasize what's needed and how to help, not just distance. Filter by type of giving and needs when we have tags. Show donation-type opportunities prominently and use a map only for locations that make sense—can be a smaller map than the consumer page.Planner — People who want to volunteer or help coordinate (this is our take on the "volunteer" part of the challenge). Show volunteering opportunities, filters like weekday vs weekend and county, radius from a ZIP if you can do it simply. Use a different marker color than the consumer map so the two modes don't feel identical. List can be grouped by day if schedule text makes that reasonable; if not, distance sorting is fine.Also add a simple home page with three big cards that link to those three areas, and an About page that says data might be incomplete, where it came from in general terms, and that users should double-check hours with the organization.Set things up so GitHub Pages works: Vite base path and React Router basename should follow import.meta.env.BASE_URL, and note in a short README how to run locally and build.Please keep accessibility in mind: don't hide important info only on the map, use proper labels and focus styles, and make sure keyboard users aren't stuck.

---

## Prompt 2 — File Structure Cleanup

keep the file structure as clean as possible and easy to understand and locate, also why did you create .vscode folder?

---

## Prompt 3 — Region Overlay & Free-Text Search

I want to overlay the region as well, for example if I select on college park area there should be a border, it should show me all the options within that location of college park, also currently it only accepts zip code, I should be able to enter my city, state or county or address there in order to search for nearby options

---

## Prompt 4 — Volunteer Interest Form & Visual Upgrade

Also, should we create a submit interest form or something on the volunteers page, so that volunteers can enter their availability or interest in donating their time and supporting at a particular location or within an area? and also make the website more user friendly and attractive, don't keep it basic


---

## Prompt 6 — Unify Data & Integrate Donor

we need to unify all the data together in one and remove de duplication as we want to use the whole data in order to integrate it. now, we have the donor data and the frontend as well, now we need to use that data to replace the mock data on the current web-app and actually get it working with the available donor data.

---

## Prompt 7 — Full Donor Integration

now we have the unified data under the data folder, check the readme file which has the guide on how the data is suppossed to be used, make the use of whole donor data and let's get the donor function fully working now!

## Prompt 8 — Bake the coordinates using geocoder

Donor map is mostly blank. donor_catalog.json shows "lat": null, "lng": null for the majority of donorPlaces — these come from food_pantries_unified.csv which lacks coordinates. The map the donor sees is empty.

---

## Prompt 9 — Food Insecurity Layer on Donor Map

we have county level food insecurity data in countyStats and a md_counties.geojson file. can you add a choropleth overlay on the donor map that colors each county by how many people are food insecure there? use shades of red/orange, don't use white for any bucket. also the county names don't always match between the stats and geojson so normalize them

---

## Prompt 10 — Hunger Map Toggle and Hover Info

the food insecurity layer needs a toggle button but put it on the map itself, top right corner, not in the filter bar. call it "Show Hunger Map" / "Hide Hunger Map" so people actually understand what it does. also when I hover over a county on the map it should show me the county name and how many people are food insecure there. and add a small legend at the bottom left of the map, keep it in one line, dark semi-transparent background so it doesn't look like a white box sitting on the map

---

## Prompt 11 — Mobile Friendly

make the whole website mobile friendly. on phones the map should show first and the list below it, not side by side. map should be about 45% of the screen height on phones. filters and buttons should go full width on small screens. make the pins and clusters a bit bigger on mobile so they're easier to tap. do this for all three pages not just donor

---

## Prompt 12 — Clean Up and Polish

remove that food insecurity map button from the filter bar, it's now on the map itself. also the legend was wrapping into two lines, keep it compact. the "My Impact" button can stay in the filters. clean up any leftover debug code