// US state + territory abbreviation <-> full name, so we can match a license's
// 2-letter code (e.g. "CO") against a form dropdown that lists full names.
(function () {
  const TJID = (window.TJID = window.TJID || {});
  const MAP = {
    AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
    CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
    FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
    IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
    ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan",
    MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
    NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
    NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
    OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
    RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
    TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
    WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
    PR: "Puerto Rico", GU: "Guam", VI: "Virgin Islands", AS: "American Samoa",
    MP: "Northern Mariana Islands",
  };
  const REV = {};
  Object.entries(MAP).forEach(([a, n]) => (REV[n.toLowerCase()] = a));

  TJID.states = {
    abbrToName: (a) => MAP[(a || "").toUpperCase()] || "",
    nameToAbbr: (n) => REV[(n || "").toLowerCase()] || "",
    MAP,
  };
})();
