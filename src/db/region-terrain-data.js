// Terrain assignment per region, based on real-world geography.
// Format: { "Country Name": { "Region Name": "type1;type2" } }
// Allowed types: naval, mountainous, terrestrial, desert
// Note: corrected by Claude after the initial AI-generated pass missed naval
// terrain for several large coastal/island countries (see chat for the list).

module.exports = {
  "Albania": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval;mountainous",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial;mountainous",
    "West Region": "terrestrial;naval;mountainous",
    "Central Region": "terrestrial;mountainous"
  },
  "Austria": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;mountainous",
    "South Region": "terrestrial",
    "East Region": "terrestrial;mountainous",
    "West Region": "terrestrial;mountainous",
    "Central Region": "terrestrial;mountainous"
  },
  "Belarus": {
    "Capital": "terrestrial",
    "North Region": "terrestrial",
    "South Region": "terrestrial",
    "East Region": "terrestrial",
    "West Region": "terrestrial",
    "Central Region": "terrestrial"
  },
  "Belgium": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "Bosnia and Herzegovina": {
    "Capital": "terrestrial",
    "North Region": "terrestrial",
    "South Region": "terrestrial",
    "East Region": "terrestrial",
    "West Region": "terrestrial",
    "Central Region": "terrestrial"
  },
  "Bulgaria": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "Croatia": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "Cyprus": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial;naval",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial;naval"
  },
  "Czechia": {
    "Capital": "terrestrial",
    "North Region": "terrestrial",
    "South Region": "terrestrial",
    "East Region": "terrestrial",
    "West Region": "terrestrial",
    "Central Region": "terrestrial"
  },
  "Denmark": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "Estonia": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "Finland": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "France": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "Germany": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "Greece": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval;mountainous",
    "South Region": "terrestrial;naval;desert",
    "East Region": "terrestrial;mountainous",
    "West Region": "terrestrial;naval;mountainous",
    "Central Region": "terrestrial;mountainous"
  },
  "Hungary": {
    "Capital": "terrestrial",
    "North Region": "terrestrial",
    "South Region": "terrestrial",
    "East Region": "terrestrial",
    "West Region": "terrestrial",
    "Central Region": "terrestrial"
  },
  "Iceland": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "Ireland": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "Italy": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval;mountainous",
    "South Region": "terrestrial;naval;desert",
    "East Region": "terrestrial;mountainous",
    "West Region": "terrestrial;naval;mountainous",
    "Central Region": "terrestrial;mountainous"
  },
  "Kosovo": {
    "Capital": "terrestrial",
    "North Region": "terrestrial",
    "South Region": "terrestrial",
    "East Region": "terrestrial",
    "West Region": "terrestrial",
    "Central Region": "terrestrial"
  },
  "Latvia": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "Lithuania": {
    "Capital": "terrestrial",
    "North Region": "terrestrial",
    "South Region": "terrestrial",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "Luxembourg": {
    "Capital": "terrestrial",
    "North Region": "terrestrial",
    "South Region": "terrestrial",
    "East Region": "terrestrial",
    "West Region": "terrestrial",
    "Central Region": "terrestrial"
  },
  "Malta": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial;naval",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial;naval"
  },
  "Moldova": {
    "Capital": "terrestrial",
    "North Region": "terrestrial",
    "South Region": "terrestrial",
    "East Region": "terrestrial",
    "West Region": "terrestrial",
    "Central Region": "terrestrial"
  },
  "Montenegro": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval;mountainous",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial;mountainous",
    "West Region": "terrestrial;naval;mountainous",
    "Central Region": "terrestrial;mountainous"
  },
  "Netherlands": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "North Macedonia": {
    "Capital": "terrestrial",
    "North Region": "terrestrial",
    "South Region": "terrestrial",
    "East Region": "terrestrial",
    "West Region": "terrestrial",
    "Central Region": "terrestrial"
  },
  "Norway": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval;mountainous",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial;mountainous",
    "West Region": "terrestrial;naval;mountainous",
    "Central Region": "terrestrial;mountainous"
  },
  "Poland": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "Portugal": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval;desert",
    "East Region": "terrestrial;desert",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial;desert"
  },
  "Romania": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "Russia": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial;naval",
    "West Region": "terrestrial",
    "Central Region": "terrestrial"
  },
  "Serbia": {
    "Capital": "terrestrial",
    "North Region": "terrestrial",
    "South Region": "terrestrial",
    "East Region": "terrestrial",
    "West Region": "terrestrial",
    "Central Region": "terrestrial"
  },
  "Slovakia": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;mountainous",
    "South Region": "terrestrial",
    "East Region": "terrestrial;mountainous",
    "West Region": "terrestrial;mountainous",
    "Central Region": "terrestrial;mountainous"
  },
  "Slovenia": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval;mountainous",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial;mountainous",
    "West Region": "terrestrial;naval;mountainous",
    "Central Region": "terrestrial;mountainous"
  },
  "Spain": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval;desert",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "Sweden": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "Switzerland": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;mountainous",
    "South Region": "terrestrial",
    "East Region": "terrestrial;mountainous",
    "West Region": "terrestrial;mountainous",
    "Central Region": "terrestrial;mountainous"
  },
  "Ukraine": {
    "Capital": "terrestrial",
    "North Region": "terrestrial",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial",
    "West Region": "terrestrial",
    "Central Region": "terrestrial"
  },
  "United Kingdom": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "China": {
    "Capital": "terrestrial",
    "North Region": "terrestrial",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial;naval",
    "West Region": "terrestrial",
    "Central Region": "terrestrial"
  },
  "India": {
    "Capital": "terrestrial",
    "North Region": "terrestrial",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial;naval",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "Indonesia": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial;naval",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial;naval"
  },
  "Pakistan": {
    "Capital": "terrestrial",
    "North Region": "terrestrial",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial",
    "West Region": "terrestrial",
    "Central Region": "terrestrial"
  },
  "Bangladesh": {
    "Capital": "terrestrial",
    "North Region": "terrestrial",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial",
    "West Region": "terrestrial",
    "Central Region": "terrestrial"
  },
  "Japan": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial;naval",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial;naval"
  },
  "Philippines": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial;naval",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial;naval"
  },
  "Vietnam": {
    "Capital": "terrestrial",
    "North Region": "terrestrial",
    "South Region": "terrestrial",
    "East Region": "terrestrial;naval",
    "West Region": "terrestrial",
    "Central Region": "terrestrial"
  },
  "Iran": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial",
    "West Region": "terrestrial",
    "Central Region": "terrestrial"
  },
  "Turkey": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval;desert",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "United States": {
    "Capital": "terrestrial",
    "North Region": "terrestrial",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial;naval",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "Brazil": {
    "Capital": "terrestrial",
    "North Region": "terrestrial",
    "South Region": "terrestrial",
    "East Region": "terrestrial;naval",
    "West Region": "terrestrial",
    "Central Region": "terrestrial"
  },
  "Mexico": {
    "Capital": "terrestrial",
    "North Region": "terrestrial",
    "South Region": "terrestrial",
    "East Region": "terrestrial;naval",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "Colombia": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "Argentina": {
    "Capital": "terrestrial",
    "North Region": "terrestrial",
    "South Region": "terrestrial",
    "East Region": "terrestrial;naval",
    "West Region": "terrestrial",
    "Central Region": "terrestrial"
  },
  "Canada": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial",
    "East Region": "terrestrial;naval",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "Peru": {
    "Capital": "terrestrial",
    "North Region": "terrestrial",
    "South Region": "terrestrial",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  },
  "Venezuela": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial",
    "East Region": "terrestrial",
    "West Region": "terrestrial",
    "Central Region": "terrestrial"
  },
  "Chile": {
    "Capital": "terrestrial",
    "North Region": "terrestrial;naval",
    "South Region": "terrestrial;naval",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial;naval"
  },
  "Ecuador": {
    "Capital": "terrestrial",
    "North Region": "terrestrial",
    "South Region": "terrestrial",
    "East Region": "terrestrial",
    "West Region": "terrestrial;naval",
    "Central Region": "terrestrial"
  }
};
