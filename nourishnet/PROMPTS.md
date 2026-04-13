# NourishNet — Prompt Engineering Log

All prompts given to the AI assistant during the development of NourishNet, recorded as-is.

---

## Prompt 1 — Initial Project Setup

We're building a small React app for a class challenge called NourishNet. The idea is to help people in Maryland and the DC metro area find food assistance, figure out how to donate, and find volunteer opportunities. Everything has to be open source and deploy as a static site on GitHub Pages—no backend, no AWS services, no paid APIs. Please use Vite with React and TypeScript, React Router for pages, and Tailwind or CSS Modules for styling—your pick, but stick to one. For maps we want Leaflet with react-leaflet, marker clustering when there are a lot of points, and standard OpenStreetMap tiles with the usual attribution. Use npm. All the content will come from one file: public/data/catalog.json. We'll replace it later with real merged data; for now please include a realistic sample with at least eight places (six with latitude/longitude and two without coordinates so we can test edge cases) and six "opportunities" split between donation and volunteering. The JSON should look roughly like this conceptually: a schema version and timestamp at the top, then an array of places (name, address fields, county optional, lat/lng nullable, phone, hours, eligibility and requirements text, tags, and source info), and an array of opportunities that can link to a place by id. Each opportunity is either donation or volunteering, with a title, short summary, contact fields, schedule notes, and optional needs tags. We need three different interfaces, not one page with a toggle: Consumer — People looking for food. ZIP or city search, optional "use my location" with a short honest line about what the browser will do. Map with clustered markers plus a list that stays in sync—filters for things like county and day of week if the data supports it. Tapping or selecting a place should show details: hours, rules, phone as a real tel link, and a directions link built from the address. If something doesn't have coordinates, it should still show in the list and never break the app. Donor — People who want to give food or money. This should feel different from the consumer view: emphasize what's needed and how to help, not just distance. Filter by type of giving and needs when we have tags. Show donation-type opportunities prominently and use a map only for locations that make sense—can be a smaller map than the consumer page. Planner — People who want to volunteer or help coordinate (this is our take on the "volunteer" part of the challenge). Show volunteering opportunities, filters like weekday vs weekend and county, radius from a ZIP if you can do it simply. Use a different marker color than the consumer map so the two modes don't feel identical. List can be grouped by day if schedule text makes that reasonable; if not, distance sorting is fine. Also add a simple home page with three big cards that link to those three areas, and an About page that says data might be incomplete, where it came from in general terms, and that users should double-check hours with the organization. Set things up so GitHub Pages works: Vite base path and React Router basename should follow import.meta.env.BASE_URL, and note in a short README how to run locally and build. Please keep accessibility in mind: don't hide important info only on the map, use proper labels and focus styles, and make sure keyboard users aren't stuck.

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

## Prompt 5 — Switch Map to MapLibre GL

the leaflet map feels slow and outdated, can we switch the map to maplibre gl? use react-map-gl with maplibre and switch the tile source to openfreemap so we don't need any api key. also replace the leaflet marker clustering with supercluster so we have full control over the cluster markers, i want custom styled clusters not the default leaflet ones. make the pins look like actual map pins, small diamond shape, different color for consumer vs donor vs volunteer pages

---

## Prompt 6 — Unify Data & Integrate Donor

we need to unify all the data together in one and remove de duplication as we want to use the whole data in order to integrate it. now, we have the donor data and the frontend as well, now we need to use that data to replace the mock data on the current web-app and actually get it working with the available donor data.

---

## Prompt 7 — Full Donor Integration

now we have the unified data under the data folder, check the readme file which has the guide on how the data is suppossed to be used, make the use of whole donor data and let's get the donor function fully working now!

---

## Prompt 8 — Bake the Coordinates Using Geocoder

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

---

## Prompt 13 — Add Donor AI Chatbot

can we add a chatbot for the donor page? like a floating button at the bottom right, when you click it opens a chat window. the user enters their zip code first, then they can ask questions like which pantry near me accepts donations or where is hunger the highest in my area. it should call a backend api endpoint, use VITE_CHATBOT_API as the env variable so we can point it wherever we want. show some default suggestion chips so users know what to ask

---

## Prompt 14 — Community Platform Features (Emergency Modal + Needs Board + Surplus Board)

we need to add some community features. first, on the find food page add an emergency button "I Need Food Now" that uses geolocation to find the 5 nearest open locations right now and shows them in a modal with call and directions buttons. second, add an anonymous food request board where people can post what they need without any personal info, store it in localstorage. third, add a surplus food board on the donor page where someone can post that they have extra food to give away, it should have a timer and expire after a certain number of hours. all of this should work without a backend, just localstorage

---

## Prompt 15 — Fix Surplus Food and Needs Board Tab Placement

the surplus food board and the needs board are showing up in the wrong tabs, surplus food should only show under the surplus tab and needs requests under the needs tab, they're getting mixed up. fix the tab filtering logic

---

## Prompt 16 — Remove Multi-Language Support

remove the multi language support entirely, just hardcode everything in english. its adding too much complexity and the translations aren't complete anyway so its more confusing than helpful

---

## Prompt 17 — Add Community Board as Its Own Page

the surplus food board, pantry status updates, and community needs should all be combined into one dedicated page called Community Board accessible from the nav. it should have tabs at the top to switch between All Posts, Surplus Food, Pantry Updates, and Food Requests. each post type should have its own form to create a new post. make it 3 columns on desktop and single column on mobile

---

## Prompt 18 — Improve Find Food Filters

the find food filters need some improvements. the type filter chips should be single select not multi select, clicking an already selected one deselects it. add pagination to the list, load 60 at a time with a "show more" button at the bottom, the list is too long to scroll. remove the snap and wic toggle buttons from the filter bar, they take up too much space, that info can just show on the card or popup instead

---

## Prompt 19 — Fix Counties Deduplication and Add Map Legend

on the find food page the county dropdown has duplicate entries, fix that. also there's no legend on the map so users don't know what the different colored pins mean. add a collapsible legend panel in the bottom left of the map showing pantry, food bank, snap store, farmers market with their colors. clicking a legend item should also toggle that filter

---

## Prompt 20 — Redesign Homepage

the homepage looks too basic, redesign it to look like a proper nonprofit/charity website. i want a big hero section with a green background, a large headline "Fight Against Hunger, Donating Food Today", a donate widget on the right side with one-time and monthly toggle and preset amounts $10 $25 $50 and custom. below that a dark stats bar showing total locations, counties covered, volunteer opportunities. then a programs section with 4 cards for find food, donate, community, volunteer. then a testimonials/volunteer section. then upcoming events section with 3 event cards with background images. then a "we reach every corner" section with a dot map visualization showing coverage. then a second cta section with dark background and the donate widget again. bottom partners section. use local images from public/images folder

---

## Prompt 21 — Update About Page

update the about page, make it look more polished and impactful. add a full width header image at the top. then a horizontally scrolling card carousel that auto scrolls showing "what makes us different" — 5 cards covering the problem, our solution, for families, for donors, privacy first. each card should have a different background color, not white. add a disclaimer box at the bottom about data accuracy and dial 211

---

## Prompt 22 — Fix Map Pins and Clustering Performance

the map pins are disappearing when you zoom in and out, and clustering is slow when there are 200+ points. fix the clustering logic and make sure pins always render correctly. also the selected pin should scale up so users can see which one they clicked

---

## Prompt 23 — Remove Redundant Nav Links

remove the volunteer link from the main nav, it's redundant since we already have it in the homepage cards. also remove the find food button from the header of the find food page itself, that's circular

---

## Prompt 24 — Fix Footer

clean up the footer, remove the programs column since those links are already in quick links. fix the github link to point to the actual repo protocorn/NAFSI_Track2

---

## Prompt 25 — Fix Page Jumps and Scroll Issues

when switching between pages the scroll position is jumping around, it should always start at the top when navigating to a new page. fix this

---

## Prompt 26 — Database Connection and Community Food Post

connect the community food post page to a real database so posts persist across sessions and devices, not just localstorage. use supabase for this since it's free and open source

---

## Prompt 27 — Create Full Replication Guide (jiten.md)

Create a jiten.md file, in that You have to mention all the steps to replicate this whole website each and every thing. Like How the homepage would look like what will be the features in the homepage, images links, color grading, structure, and each and everything. then you have to mention about the different sections like, Find food, what is there in it, how to structure this filtering, which data to use, how the look will look like, structure, color grading. Same goes with all the features, The main aim is that if any other AI looks at it, it can replicate the same structure, same functionalities, same backend, same color grading, just like someone had cloned this. All the tech stacks, assumptions, and all. Make a detailed plan and then write all the things into it.

---

## Prompt 28 — Push to GitHub

push this
